/**
 * collectors/clarity.ts — wraps data/clarity/latest.json in the L0 contract,
 * and verifies the credential that produces it is still live (PRD §7.4, R5).
 *
 * TWO CHECKS, DELIBERATELY BOTH
 *
 *   1. CONTRACT over the artifact: present, well-formed, ≥1 page row, inside
 *      the 8-day SLA. This is what downstream readers consume.
 *
 *   2. LIVENESS of CLARITY_TOKEN via one real request to the export API.
 *
 * Why (2) as well as (1): a file check alone cannot distinguish "Clarity is
 * healthy" from "Clarity died today and the snapshot has not aged out yet".
 * The credential is the thing that fails; the file is the thing that goes
 * stale a week later. R5 asks for headless verification that Clarity is *live*
 * and *current*, which is exactly those two checks and not one of them.
 *
 * This is the PRD §9 step-4 acceptance drill: blank CLARITY_TOKEN and the
 * nightly must say `healthy: false` with the credential named — not drop the
 * Clarity section, and not report the stale snapshot as if it were fresh.
 *
 * QUOTA: the Clarity export API allows 10 requests/day per project. The Monday
 * pull spends 2. This liveness ping spends 1 and is metered as such, using the
 * cheapest possible shape (1-day window, Device dimension).
 */

import { meterExternal } from '../lib/metered-client.js';
import { readValidated } from '../lib/read-validated.js';
import { clarityLatestOptions, clarityLatestSchema, type ClarityLatest } from '../schemas/index.js';
import {
  ageHours,
  describeError,
  envValue,
  fetchWithTimeout,
  guard,
  httpReason,
  makeHealthy,
  makeUnhealthy,
  runId,
  type CollectorResult,
} from './types.js';

const CLARITY_PATH = 'data/clarity/latest.json';
const API_BASE = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
/**
 * PRD §7.2 table: data/clarity/latest.json — 8 days, ≥1 page row. Schema and SLA
 * both come from scripts/schemas/clarity-latest.ts.
 */
const SLA_HOURS =
  clarityLatestOptions.maxAgeHours === undefined ? 8 * 24 : clarityLatestOptions.maxAgeHours;

export interface ClarityCollected {
  source: string;
  pulledAt: string;
  ageHours: number | null;
  slaHours: number;
  numOfDays: number;
  pageCount: number;
  deviceSplit: Record<string, number>;
  alertCount: number;
  alertsByIssue: Record<string, number>;
  credential: {
    envVar: 'CLARITY_TOKEN';
    present: boolean;
    /** null when the ping was skipped; true/false when it actually ran. */
    live: boolean | null;
    checkedAt: string | null;
    detail: string | null;
  };
}

/** Count alerts per issue kind. Pure — unit-tested. */
export function alertsByIssue(alerts: Array<{ issue: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const alert of alerts) {
    counts[alert.issue] = (counts[alert.issue] === undefined ? 0 : counts[alert.issue]) + 1;
  }
  return counts;
}

/** One cheap authenticated request. Returns null on success, a reason on failure. */
async function pingClarity(token: string): Promise<string | null> {
  const url = new URL(API_BASE);
  url.searchParams.set('numOfDays', '1');
  url.searchParams.set('dimension1', 'Device');

  const response = await fetchWithTimeout(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  meterExternal({
    agent: 'collector-clarity',
    run: runId(),
    purpose: 'liveness-ping',
    service: 'clarity-export-api',
    unit: 'credits',
    amount: 1,
  });

  if (response.ok) return null;

  if (response.status === 401 || response.status === 403) {
    return await httpReason(
      'Clarity export API',
      response,
      'CLARITY_TOKEN is set but rejected — regenerate it in Clarity → Settings → Data Export'
    );
  }
  if (response.status === 402 || response.status === 429) {
    return await httpReason(
      'Clarity export API',
      response,
      'daily request limit reached (10/day/project; the Monday pull spends 2) — credential state is unproven tonight'
    );
  }
  return await httpReason('Clarity export API', response);
}

export async function collect(): Promise<CollectorResult<ClarityCollected>> {
  return guard('clarity', async () => {
    const problems: string[] = [];

    // 1 ─ artifact contract
    let parsed: ClarityLatest | null = null;
    try {
      parsed = readValidated(CLARITY_PATH, clarityLatestSchema, clarityLatestOptions);
    } catch (error) {
      problems.push(
        `${describeError(error)}. data/clarity/latest.json is written by \`npm run agent:clarity-history\` ` +
          `(clarity-history.yml + the Monday workflow).`
      );
    }

    // 2 ─ credential liveness
    const token = envValue('CLARITY_TOKEN');
    let live: boolean | null = null;
    let checkedAt: string | null = null;
    let detail: string | null = null;

    if (token === null) {
      problems.push(
        'CLARITY_TOKEN unset (or empty) — the Microsoft Clarity export credential is missing, so behavioral data ' +
          'cannot be refreshed and the on-disk snapshot cannot be verified as live. Set CLARITY_TOKEN from ' +
          'Clarity → Settings → Data Export (and as a repo secret for the nightly workflow).'
      );
    } else if (parsed !== null && ageHours(parsed.pulledAt) < 24) {
      // A3 (open-issues task list, 2026-08-06): DO NOT SPEND A REQUEST HERE.
      //
      // Clarity allows 10 requests/day/project. The Monday pull spends 2, and this
      // nightly liveness ping spent a 3rd every night purely to re-prove a credential
      // that had just been used successfully. On days when anything else touched the
      // API the ping 429'd, got recorded as a problem, and surfaced as a `regressed`
      // ledger entry — a recurring false alarm manufactured by the check itself.
      //
      // A snapshot pulled in the last 24h IS the liveness evidence: it could not exist
      // unless the token worked. So we read liveness off the artifact instead of buying
      // it again. `checkedAt` reports when the snapshot was pulled, not now, because
      // claiming we verified the credential at this instant would be the same species
      // of lie as `gtagFired: false` meaning "we didn't look".
      live = true;
      checkedAt = parsed.pulledAt;
      detail = `not re-pinged — data/clarity/latest.json was pulled ${ageHours(parsed.pulledAt).toFixed(1)}h ago, ` +
        `which is itself proof the credential was live. Conserves the 10/day quota (A3).`;
    } else {
      checkedAt = new Date().toISOString();
      try {
        const failure = await pingClarity(token);
        live = failure === null;
        detail = failure;
        if (failure !== null) problems.push(failure);
      } catch (error) {
        live = false;
        detail = describeError(error);
        problems.push(`Clarity liveness ping could not complete — ${detail}`);
      }
    }

    const data: ClarityCollected | null =
      parsed === null
        ? null
        : {
            source: CLARITY_PATH,
            pulledAt: parsed.pulledAt,
            ageHours: ageHours(parsed.pulledAt),
            slaHours: SLA_HOURS,
            numOfDays: parsed.numOfDays,
            pageCount: parsed.pages.length,
            deviceSplit: parsed.deviceSplit,
            alertCount: parsed.behavioralAlerts.length,
            alertsByIssue: alertsByIssue(parsed.behavioralAlerts),
            credential: { envVar: 'CLARITY_TOKEN', present: token !== null, live, checkedAt, detail },
          };

    const rowCount = parsed === null ? 0 : parsed.pages.length;

    if (problems.length > 0) {
      return makeUnhealthy<ClarityCollected>(problems.join(' | '), data, rowCount);
    }
    return makeHealthy(data as ClarityCollected, rowCount);
  });
}

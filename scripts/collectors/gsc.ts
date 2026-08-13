/**
 * collectors/gsc.ts — Search Console collector (PRD §7.4, requirement R6).
 *
 * Three things, in increasing order of novelty:
 *
 *   1. CREDENTIAL LIVENESS. `sites.list()` against the real API. This is the
 *      revocation drill from PRD §9: blank the credential, and the nightly says
 *      "GSC_SERVICE_ACCOUNT_JSON unset and credentials/gsc-service-account.json
 *      absent" — not "GSC: 0 rows".
 *
 *   2. CONTRACTS over the artifacts the Monday pipeline writes
 *      (data/gsc/latest.json, data/gsc/analysis.json). Stale or malformed
 *      throws a ContractViolation naming the file and its age; we catch it and
 *      report it as the collector's reason, because a collector may not throw.
 *
 *   3. URL INSPECTION — the only new API surface in step 4, and the whole of
 *      R6 ("catch GSC indexing errors"). Per-page index state straight from
 *      Google: verdict, coverage state, indexing state, robots state, fetch
 *      state, last crawl, and the canonical Google actually chose.
 *
 * WHY PER-PAGE INSPECTION AND NOT THE PERFORMANCE API
 * The performance API can only tell you a page got zero impressions. It cannot
 * distinguish "nobody searched for it" from "Google refuses to index it".
 * Inspection is the only endpoint that answers the second question.
 *
 * QUOTA
 * URL Inspection is limited to 2000 queries/day and ~600/minute per property.
 * We inspect at ~1 req/1.1s, stop on the first 429, and report the partial
 * coverage rather than pretending the un-inspected pages are fine.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * A7 — WHAT "PARTIAL" MEANS NOW, AND WHY THE ANSWER CHANGED
 *
 * It used to inspect all 49 eligible URLs every night: ~6 minutes of a nightly
 * that otherwise finishes in seconds. It now inspects a ROTATING batch of 10
 * (lib/gsc-rotation.ts) and CARRIES FORWARD the observations from the other 39,
 * each stamped with the night it was actually obtained.
 *
 * That makes three different situations that used to look like one, and getting
 * them apart is the whole of this change:
 *
 *   1. THE COLLECTOR COULD NOT SEE. Credential dead, quota exhausted, calls
 *      failing. Unhealthy, named cause. Unchanged.
 *
 *   2. THE ROTATION IS MID-CYCLE. 10 URLs inspected tonight, 39 answered from
 *      observations 1-4 nights old, every one inside the staleness budget,
 *      nothing overdue, the last full cycle recorded in the state file. This is
 *      the system working exactly as designed and it is HEALTHY — but never
 *      silently: `indexInspection.rotation` carries the cycle number, the night
 *      the last cycle CLOSED, the budget it must close within, and the overdue
 *      list, so "coverage completes over a cycle" is a claim the reader checks
 *      rather than takes on trust. `fresh` and `ageDays` on every emitted row
 *      say which nights the answer came from.
 *
 *   3. THE ROTATION IS NOT ROTATING. A URL past the staleness budget, or a
 *      cursor that is absent, malformed or was not written back yesterday.
 *      UNHEALTHY, because the promise in case 2 is exactly the promise being
 *      broken, and the fallback is a full sweep — slow and complete — never a
 *      batch off the front of the list.
 *
 * So `healthy: true` no longer means "we inspected all 49 tonight". It means:
 * EVERY eligible URL has a URL Inspection observation no older than the
 * staleness budget, and the cursor that guarantees that is alive. That is a
 * narrower claim than it looks, and unlike the old one it is checkable from the
 * record without rerunning anything.
 *
 * `unevaluable` (lib/agent-health.ts) is recorded separately, per run: a night
 * that emits zero observations has not found zero index errors, it has found
 * nothing, and `judgeVerdict` refuses to call that clean.
 */

import { google } from 'googleapis';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { recordAgentHealth, verdictRecord } from '../lib/agent-health.js';
import {
  applyResults,
  coveredInCycle,
  isStatePersisting,
  observableRows,
  overdueUrls,
  planRotation,
  readRotationState,
  resolveBatchSize,
  ROTATION_PATH,
  sourceHash,
  STATE_MAX_AGE_HOURS,
  writeRotationState,
  type AttemptOutcome,
  type EligibleUrl,
  type InspectedUrlRow,
  type RotationState,
  type SelectionReason,
} from '../lib/gsc-rotation.js';
import { meterExternal } from '../lib/metered-client.js';
import { readValidated, REPO_ROOT, parseValidated } from '../lib/read-validated.js';
import {
  gscAnalysisOptions,
  gscAnalysisSchema,
  gscLatestOptions,
  gscLatestSchema,
} from '../schemas/index.js';
import { isRedirectSource, loadRedirectMap, withTrailingSlash } from '../redirect-map.js';
import {
  ageHours,
  describeError,
  envValue,
  guard,
  makeHealthy,
  makeUnhealthy,
  runId,
  sleep,
  type CollectorResult,
} from './types.js';

const SITE_URL = 'https://tallchairadvisor.com/';
const ORIGIN = 'https://tallchairadvisor.com';
const CREDENTIALS_PATH = 'credentials/gsc-service-account.json';
const CREDENTIAL_ENV = ['GSC_SERVICE_ACCOUNT_JSON', 'GOOGLE_SERVICE_ACCOUNT_JSON'];

/** GSC's own guidance is ~1 QPS per property on the inspection endpoint. */
const INSPECT_INTERVAL_MS = 1100;
// Freshness SLAs for the pipeline artifacts come from scripts/schemas/
// (gscLatestOptions / gscAnalysisOptions): 8 days, per the PRD §7.2 table.

// ─── Schemas ──────────────────────────────────────────────────────────────────
// The artifact contracts are the authoritative ones from scripts/schemas/ —
// this collector does not get its own, looser opinion about what a valid GSC
// pull looks like. Only the service-account key, which has no data file and so
// no shared schema, is asserted locally.

const ServiceAccountSchema = z
  .object({
    client_email: z.string().min(1),
    private_key: z.string().min(1),
    project_id: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InspectedUrl {
  url: string;
  file: string;
  verdict: string;
  coverageState: string;
  indexingState: string;
  robotsTxtState: string;
  pageFetchState: string;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
  userCanonical: string | null;
  /** Non-null only when THIS url's inspection call failed. Never a fake verdict. */
  error: string | null;
}

/**
 * The rotation's position, verbatim in the record.
 *
 * Every field here exists to answer a question a reader would otherwise have to
 * take on trust from a night that inspected 10 of 49: WHEN did coverage last
 * actually complete (`lastCompletedAt`), WITHIN WHAT does it have to complete
 * (`cycleBudgetNights`), and IS ANYTHING past its budget right now (`overdue`).
 * A partial night with an empty `overdue` and a recent `lastCompletedAt` is a
 * working rotation; the same night with either missing is not, and the health
 * flag follows those fields rather than the ratio 10/49.
 */
export interface RotationReport {
  batchSize: number;
  /** False when the cursor was absent, malformed or not written back yesterday. */
  statePersisting: boolean;
  /** Why not, when not. null when the cursor is alive. */
  stateNote: string | null;
  /** Hours since the cursor was last written. null when there was no cursor. */
  stateAgeHours: number | null;
  /** True when this run swept every eligible URL instead of taking a batch. */
  sweeping: boolean;
  runs: number;
  cycleNumber: number;
  cycleStartedAt: string;
  cycleBudgetNights: number;
  stalenessBudgetDays: number;
  /** The last cycle that CLOSED — the checkable form of "coverage completes over a cycle". */
  lastCompletedCycle: number | null;
  lastCompletedAt: string | null;
  lastCompletedNights: number | null;
  /** Eligible URLs already covered in the open cycle, after this run. */
  coveredInCycle: number;
  /** URLs picked tonight and why: new | changed | due. */
  selected: Array<{ url: string; reason: SelectionReason }>;
  /** Entries dropped because the URL stopped being eligible. */
  dropped: string[];
  /** Past the staleness budget — a rotation FAULT, not a wait. */
  overdue: Array<{ url: string; ageDays: number | null; everInspected: boolean }>;
  /** Oldest observation still being emitted, in whole days. */
  oldestObservationDays: number | null;
}

export interface GscCollected {
  credential: {
    source: string;
    clientEmail: string;
    /** True when sites.list() returned the property — proof the token is live. */
    propertyVerified: boolean;
    permissionLevel: string | null;
  };
  performance: {
    pulledAt: string;
    ageHours: number | null;
    dateRange: unknown;
    totals: unknown;
    pageCount: number;
    queryCount: number;
  } | null;
  analysis: {
    generatedAt: string;
    ageHours: number | null;
    opportunityCount: number;
    ctrLeakCount: number;
    decayAlertCount: number;
  } | null;
  indexInspection: {
    siteUrl: string;
    /** Indexable URLs derived from src/pages, minus noindex and redirect sources. */
    eligible: number;
    /** URLs the rotation picked for THIS run. */
    requested: number;
    /** Fresh, successful inspections in THIS run. */
    inspected: number;
    /** Eligible URLs with a usable observation of any age — the R6 denominator. */
    observed: number;
    failed: number;
    quotaExceeded: boolean;
    /** observed / eligible. The claim `healthy` is made against. */
    coveragePct: number;
    /** inspected / eligible. How much of tonight's answer was obtained tonight. */
    freshPct: number;
    verdicts: Record<string, number>;
    coverageStates: Record<string, number>;
    notIndexed: string[];
    /** One row per URL with a usable observation, each stamped `fresh` + `ageDays`. */
    pages: InspectedUrlRow[];
    rotation: RotationReport;
  } | null;
}

// ─── Indexable URL discovery (pure — unit-tested) ─────────────────────────────

/** src/pages/review/gesture.astro → https://tallchairadvisor.com/review/gesture/ */
export function astroFileToUrl(relPath: string): string {
  let slug = relPath.replace(/^src\/pages\//, '').replace(/\.astro$/, '').replace(/\/index$/, '');
  if (slug === 'index') slug = '';
  return `${ORIGIN}/${slug}${slug === '' ? '' : '/'}`;
}

/** Path component of the URL for a page file, with trailing slash. */
export function astroFileToPath(relPath: string): string {
  return withTrailingSlash(astroFileToUrl(relPath).replace(ORIGIN, '') || '/');
}

/**
 * A page is eligible for inspection when Google is supposed to index it.
 * `noindex` in the source is the site's own declaration that it is not, and
 * inspecting one burns quota to be told something we already know.
 */
export function isIndexableSource(relPath: string, source: string): boolean {
  if (relPath.endsWith('404.astro')) return false;
  if (relPath.includes('[')) return false; // dynamic route — no single URL to inspect
  if (/\bnoindex\b/.test(source)) return false;
  return true;
}

function listPageFiles(root: string): string[] {
  const entries = readdirSync(resolve(root, 'src/pages'), { recursive: true, encoding: 'utf-8' });
  return (entries as string[])
    .filter((f) => f.endsWith('.astro'))
    .map((f) => `src/pages/${f}`)
    .sort();
}

/**
 * Eligible indexable URLs: real pages, not noindex, not 301 sources.
 *
 * Carries a hash of each page's SOURCE, because the rotation needs it: a page
 * whose source changed since its last inspection jumps the queue, and the source
 * is already in hand here. Deliberately not mtime — a CI checkout rewrites every
 * mtime, which would mark all 49 as changed on every run in the only environment
 * that matters.
 */
export function indexableUrls(root: string): EligibleUrl[] {
  const redirects = loadRedirectMap(root);
  const out: EligibleUrl[] = [];
  for (const file of listPageFiles(root)) {
    const source = readFileSync(resolve(root, file), 'utf-8');
    if (!isIndexableSource(file, source)) continue;
    // PRD §7.5: auditing a 301 source as a page produced the C-1 false positive.
    if (isRedirectSource(redirects, astroFileToPath(file))) continue;
    out.push({ url: astroFileToUrl(file), file, hash: sourceHash(source) });
  }
  return out;
}

/** Tally a string field across inspections. Pure — unit-tested. */
export function tally(rows: InspectedUrl[], key: 'verdict' | 'coverageState'): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const value = row[key];
    counts[value] = (counts[value] === undefined ? 0 : counts[value]) + 1;
  }
  return counts;
}

// ─── Health judgement (pure — unit-tested) ────────────────────────────────────

export interface InspectionHealthInput {
  eligible: number;
  /** URLs the rotation picked for this run. */
  requested: number;
  /** Fresh successful inspections this run. */
  inspected: number;
  /** Eligible URLs with a usable observation of any age. */
  observed: number;
  failures: Array<{ url: string; error: string }>;
  quotaExceeded: boolean;
  overdue: Array<{ url: string; ageDays: number | null; everInspected: boolean }>;
  /** Why the rotation cursor is unusable. null when it is alive. */
  stateNote: string | null;
  sweeping: boolean;
  cycleBudgetNights: number;
  stalenessBudgetDays: number;
}

/**
 * THE A7 JUDGEMENT, IN ONE PLACE.
 *
 * The old rule was `inspected < eligible → unhealthy`, and under rotation that
 * rule fires every single night by construction — which would make the health
 * flag a constant, and a constant carries no information. The temptation is to
 * delete it. That would be worse: it would turn a real signal into silence, and
 * the whole PRD exists because silence is how this system fails.
 *
 * So the flag is not deleted, it is re-pointed at a claim that is still worth
 * making and can still be false:
 *
 *     healthy ⟺ every eligible URL has a URL Inspection observation inside the
 *               staleness budget, AND the cursor that guarantees that is alive.
 *
 * Note what is deliberately NOT here: `observed < eligible` on its own. A URL
 * inside its first cycle has no observation yet and is not overdue — it is
 * waiting its turn, by design, and reporting that as a fault would make every
 * night after a deploy look broken and train the reader to ignore the flag.
 * `overdueUrls()` draws that line, and it is the only line drawn.
 *
 * Note also what IS here: an unusable cursor, even on a night that swept
 * everything and therefore has perfect coverage. That night is fine; the
 * ROTATION is not, and tomorrow's night will pay the same six minutes. A
 * mechanism that only works by falling back to the thing it replaced has not
 * shipped, and a green check would be the report saying it had.
 */
export function inspectionProblems(input: InspectionHealthInput): string[] {
  const problems: string[] = [];

  if (input.stateNote !== null) {
    problems.push(
      `URL Inspection rotation cursor is not usable — ${input.stateNote}. ` +
        (input.sweeping
          ? `This run swept all ${input.eligible} eligible URL(s) instead of taking a batch, so tonight's coverage ` +
            `is complete but the full pacing cost stands and tomorrow will pay it again. `
          : `An explicit batch size held this run to ${input.requested} of ${input.eligible}. `) +
        `Rotation only pays for itself once ${ROTATION_PATH} survives between runs — the nightly workflow must ` +
        `stage it alongside data/collectors. Absent is expected exactly once, on the first run ever.`
    );
  }

  if (input.quotaExceeded) {
    problems.push(
      `URL Inspection daily quota exhausted mid-run after ${input.inspected} call(s) — tonight's batch stopped ` +
        `early, and the URLs it did not reach keep whatever observation they already had.`
    );
  }

  if (input.failures.length > 0 && !input.quotaExceeded) {
    const sample = input.failures.slice(0, 3).map((f) => `${f.url} (${f.error})`).join('; ');
    problems.push(
      `${input.failures.length} of ${input.requested} URL Inspection call(s) failed — ${sample}` +
        `${input.failures.length > 3 ? ` and ${input.failures.length - 3} more` : ''}. ` +
        `No verdict was recorded for those URLs: a call that did not come back is not an index state.`
    );
  }

  if (input.overdue.length > 0) {
    const sample = input.overdue
      .slice(0, 5)
      .map((o) => `${o.url} (${o.everInspected ? `${o.ageDays === null ? '?' : o.ageDays}d old` : 'never inspected'})`)
      .join('; ');
    problems.push(
      `${input.overdue.length} eligible URL(s) have no URL Inspection observation inside the ` +
        `${input.stalenessBudgetDays}-day staleness budget — ${sample}${input.overdue.length > 5 ? ' and more' : ''}. ` +
        `A cycle should close every ${input.cycleBudgetNights} night(s), so this is the rotation failing to rotate ` +
        `rather than a URL waiting its turn, and R6 is unsatisfiable for those pages until it is fixed.`
    );
  }

  return problems;
}

// ─── Credential loading ───────────────────────────────────────────────────────

type Credential = { credentials: z.infer<typeof ServiceAccountSchema>; source: string };

function loadCredential(): Credential | { error: string } {
  for (const name of CREDENTIAL_ENV) {
    const raw = envValue(name);
    if (raw === null) continue;
    try {
      return { credentials: parseValidated(raw, ServiceAccountSchema, `$${name}`), source: `$${name}` };
    } catch (error) {
      return {
        error: `${name} is set but is not a usable service-account key — ${describeError(error)}`,
      };
    }
  }

  try {
    return {
      credentials: readValidated(CREDENTIALS_PATH, ServiceAccountSchema, { label: 'GSC service account' }),
      source: CREDENTIALS_PATH,
    };
  } catch (error) {
    return {
      error:
        `${CREDENTIAL_ENV.join(' / ')} unset and ${CREDENTIALS_PATH} unusable — ${describeError(error)}. ` +
        `Set GSC_SERVICE_ACCOUNT_JSON to the full service-account JSON, or restore the credentials file.`,
    };
  }
}

// ─── Collector ────────────────────────────────────────────────────────────────

export async function collect(): Promise<CollectorResult<GscCollected>> {
  return guard('gsc', async () => {
    const problems: string[] = [];

    // 1 ─ credential
    const credential = loadCredential();
    if ('error' in credential) {
      return makeUnhealthy<GscCollected>(credential.error);
    }

    const auth = new google.auth.GoogleAuth({
      credentials: credential.credentials as Record<string, unknown>,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    const webmasters = google.webmasters({ version: 'v3', auth });
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    // 2 ─ liveness: does this credential actually own the property today?
    let propertyVerified = false;
    let permissionLevel: string | null = null;
    try {
      const sites = await webmasters.sites.list({}, { timeout: 20_000 });
      const entries = sites.data.siteEntry;
      const match = Array.isArray(entries)
        ? entries.find((s) => s.siteUrl === SITE_URL || s.siteUrl === SITE_URL.replace(/\/$/, ''))
        : undefined;
      if (match === undefined) {
        const seen = Array.isArray(entries) ? entries.map((s) => s.siteUrl).join(', ') : '(none)';
        return makeUnhealthy<GscCollected>(
          `Search Console credential (${credential.source}, ${credential.credentials.client_email}) is valid but ` +
            `does not own ${SITE_URL}. Properties visible to it: ${seen === '' ? '(none)' : seen}. ` +
            `Add the service-account email as a user on the property in Search Console → Settings → Users and permissions.`
        );
      }
      propertyVerified = true;
      permissionLevel = match.permissionLevel === undefined || match.permissionLevel === null ? null : match.permissionLevel;
    } catch (error) {
      return makeUnhealthy<GscCollected>(
        `Search Console rejected the credential from ${credential.source} (${credential.credentials.client_email}) — ` +
          `${describeError(error)}. Check the key is not revoked and that the Search Console API is enabled for its project.`
      );
    }

    // 3 ─ contracts over the Monday artifacts
    let performance: GscCollected['performance'] = null;
    try {
      const latest = readValidated('data/gsc/latest.json', gscLatestSchema, gscLatestOptions);
      performance = {
        pulledAt: latest.pulledAt,
        ageHours: ageHours(latest.pulledAt),
        dateRange: latest.dateRange,
        totals: latest.totals,
        pageCount: latest.pages.length,
        queryCount: latest.queries.length,
      };
    } catch (error) {
      problems.push(`performance artifact unusable — ${describeError(error)}`);
    }

    let analysis: GscCollected['analysis'] = null;
    try {
      const parsed = readValidated('data/gsc/analysis.json', gscAnalysisSchema, gscAnalysisOptions);
      analysis = {
        generatedAt: parsed.generatedAt,
        ageHours: ageHours(parsed.generatedAt),
        opportunityCount: parsed.opportunities.length,
        ctrLeakCount: parsed.ctrLeaks.length,
        decayAlertCount: parsed.decayAlerts.length,
      };
    } catch (error) {
      problems.push(`analysis artifact unusable — ${describeError(error)}`);
    }

    // 4 ─ URL Inspection (R6), on a rotation — lib/gsc-rotation.ts owns the policy.
    const now = new Date();
    const eligible = indexableUrls(REPO_ROOT);

    // 4a ─ the cursor. Absent, malformed and abandoned are three different things
    // and only one of them (absent, exactly once) is legitimate.
    const rotationRead = readRotationState(REPO_ROOT);
    let priorState: RotationState | null = rotationRead.kind === 'ok' ? rotationRead.state : null;
    const stateAgeHours = priorState === null ? null : ageHours(priorState.updatedAt, now);
    let stateNote: string | null = null;
    if (rotationRead.kind === 'malformed') {
      stateNote = `${ROTATION_PATH} is malformed — ${rotationRead.reason}`;
    } else if (priorState === null) {
      stateNote = `${ROTATION_PATH} is absent, so the rotation has no memory of which URLs it has already seen`;
    } else if (!isStatePersisting(priorState, now)) {
      stateNote =
        `${ROTATION_PATH} was last written ${stateAgeHours === null ? 'at an unreadable time' : `${stateAgeHours}h ago`}, ` +
        `past the ${STATE_MAX_AGE_HOURS}h a daily run allows — nothing is writing it back`;
      // An abandoned cursor is not a cursor. Reopen from scratch rather than
      // inherit a frozen "everything already covered", which would select ZERO
      // URLs a night, forever, at a recorded 100%.
      priorState = null;
    }
    const statePersisting = stateNote === null;

    // 4b ─ batch size. With no usable cursor the fallback is a FULL SWEEP, not a
    // batch: a batch drawn off an empty cursor is the alphabetical prefix slice,
    // which starves the tail permanently while reporting full coverage of what it
    // asked for. Slow and complete beats fast and silently partial. Only an
    // explicit env ask overrides this.
    const batch = resolveBatchSize(process.env, eligible.length);
    if (batch.note !== null) console.log(`[gsc] ${batch.note}`);
    const sweeping = !statePersisting && !batch.explicit;
    const effectiveBatch = sweeping ? Math.max(1, eligible.length) : batch.batchSize;

    const plan = planRotation({ eligible, state: priorState, batchSize: effectiveBatch, now });
    const requested = plan.batch;

    console.log(
      `[gsc] inspecting ${requested.length}/${eligible.length} indexable URL(s) at ~1/${INSPECT_INTERVAL_MS}ms — ` +
        `cycle ${plan.cycle.number}, ${plan.coveredBefore}/${plan.entries.length} covered before this run` +
        (sweeping ? ' — FULL SWEEP: no usable rotation cursor' : '')
    );

    const outcomes: AttemptOutcome[] = [];
    const failures: Array<{ url: string; error: string }> = [];
    let quotaExceeded = false;

    for (let i = 0; i < requested.length; i++) {
      const { url, file, hash } = requested[i];
      try {
        const res = await searchconsole.urlInspection.index.inspect(
          { requestBody: { inspectionUrl: url, siteUrl: SITE_URL } },
          { timeout: 30_000 }
        );
        const status = res.data.inspectionResult?.indexStatusResult;
        outcomes.push({
          url,
          hash,
          result: {
            url,
            file,
            verdict: status?.verdict ?? 'VERDICT_UNSPECIFIED',
            coverageState: status?.coverageState ?? 'unknown',
            indexingState: status?.indexingState ?? 'unknown',
            robotsTxtState: status?.robotsTxtState ?? 'unknown',
            pageFetchState: status?.pageFetchState ?? 'unknown',
            lastCrawlTime: status?.lastCrawlTime ?? null,
            googleCanonical: status?.googleCanonical ?? null,
            userCanonical: status?.userCanonical ?? null,
            error: null,
            // Per-observation, not per-run: a row obtained tonight and a row
            // obtained four nights ago are both real, and this is the only thing
            // that tells them apart once they are emitted side by side.
            inspectedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        const described = describeError(error);
        // result:null — the attempt is recorded, the observation is NOT. A call
        // that did not come back says nothing about the page, and the old
        // `verdict: 'INSPECTION_FAILED'` row said something: gsc-indexed read it
        // as a verdict that is not PASS and reported the page NOT INDEXED.
        outcomes.push({ url, hash, result: null });
        failures.push({ url, error: described });
        // 429 = quota. Continuing would burn the rest of the window for nothing.
        if (/\b429\b|rateLimitExceeded|quotaExceeded|Quota exceeded/i.test(described)) {
          quotaExceeded = true;
          console.error(`[gsc] URL Inspection quota exhausted after ${outcomes.length - 1} URL(s): ${described}`);
          break;
        }
      }
      if (i < requested.length - 1) await sleep(INSPECT_INTERVAL_MS);
    }

    // 4c ─ fold tonight into the cursor and write it back.
    const nextState = applyResults({
      plan,
      previousRuns: priorState === null ? 0 : priorState.runs,
      outcomes,
      now,
    });
    try {
      writeRotationState(REPO_ROOT, nextState);
    } catch (error) {
      problems.push(
        `could not write the URL Inspection rotation cursor to ${ROTATION_PATH} — ${describeError(error)}. ` +
          `Without it every run re-inspects from scratch.`
      );
    }

    const freshUrls = new Set(outcomes.filter((o) => o.result !== null).map((o) => o.url));
    const inspected = freshUrls.size;
    // Rows older than the staleness budget are DROPPED, not emitted with a caveat:
    // downstream, a URL with no record is `unevaluable`, and that is the honest
    // answer. A two-cycle-old row would turn "we cannot say" into "indexed".
    const pages = observableRows(nextState, { freshUrls, maxAgeDays: plan.stalenessBudgetDays, now });
    const overdue = overdueUrls(nextState, plan.stalenessBudgetDays, now);

    // URL Inspection consumes a real daily quota (2000/day/property) — meter it.
    if (inspected > 0) {
      meterExternal({
        agent: 'collector-gsc',
        run: runId(now),
        purpose: 'url-inspection',
        service: 'gsc-url-inspection',
        unit: 'credits',
        amount: inspected,
      });
    }

    const coveragePct = eligible.length === 0 ? 0 : Math.round((pages.length / eligible.length) * 100);
    const freshPct = eligible.length === 0 ? 0 : Math.round((inspected / eligible.length) * 100);
    const notIndexed = pages.filter((p) => p.verdict !== 'PASS').map((p) => p.url);
    const ages = pages.map((p) => p.ageDays);

    const rotation: RotationReport = {
      batchSize: effectiveBatch,
      statePersisting,
      stateNote,
      stateAgeHours,
      sweeping,
      runs: nextState.runs,
      cycleNumber: nextState.cycle.number,
      cycleStartedAt: nextState.cycle.startedAt,
      cycleBudgetNights: plan.cycleBudgetNights,
      stalenessBudgetDays: plan.stalenessBudgetDays,
      lastCompletedCycle: nextState.cycle.lastCompletedNumber,
      lastCompletedAt: nextState.cycle.lastCompletedAt,
      lastCompletedNights: nextState.cycle.lastCompletedNights,
      coveredInCycle: nextState.urls.filter((e) => coveredInCycle(e, nextState.cycle)).length,
      selected: requested.map((r) => ({ url: r.url, reason: r.reason })),
      dropped: plan.dropped,
      overdue,
      oldestObservationDays: ages.length === 0 ? null : Math.max(...ages),
    };

    const indexInspection: GscCollected['indexInspection'] = {
      siteUrl: SITE_URL,
      eligible: eligible.length,
      requested: requested.length,
      inspected,
      observed: pages.length,
      failed: failures.length,
      quotaExceeded,
      coveragePct,
      freshPct,
      verdicts: tally(pages, 'verdict'),
      coverageStates: tally(pages, 'coverageState'),
      notIndexed,
      pages,
      rotation,
    };

    // 4d ─ health. See inspectionProblems(): a deliberately-partial night is not
    // a problem, a rotation that cannot keep its promise is.
    problems.push(
      ...inspectionProblems({
        eligible: eligible.length,
        requested: requested.length,
        inspected,
        observed: pages.length,
        failures,
        quotaExceeded,
        overdue,
        stateNote,
        sweeping,
        cycleBudgetNights: plan.cycleBudgetNights,
        stalenessBudgetDays: plan.stalenessBudgetDays,
      })
    );

    // A night that emits nothing has not found zero index errors — it has found
    // nothing, and judgeVerdict refuses to call that clean (lib/agent-health.ts).
    // `inspected` here is the row count the notIndexed verdict is computed over,
    // which is the denominator that makes the number mean anything.
    recordAgentHealth(
      verdictRecord(
        {
          detector: 'collector-gsc/url-inspection',
          read: 'live',
          claims: 'live',
          inspected: pages.length,
          violations: notIndexed.length,
        },
        { run: runId(now), agent: 'collector-gsc', purpose: 'url-inspection' },
        now
      )
    );

    console.log(
      `[gsc] rotation: cycle ${rotation.cycleNumber}, ${rotation.coveredInCycle}/${eligible.length} covered, ` +
        `${inspected} fresh + ${pages.length - inspected} carried = ${coveragePct}% observed, ` +
        `${overdue.length} overdue, last full cycle ${rotation.lastCompletedAt ?? 'never'}`
    );

    const data: GscCollected = {
      credential: {
        source: credential.source,
        clientEmail: credential.credentials.client_email,
        propertyVerified,
        permissionLevel,
      },
      performance,
      analysis,
      indexInspection,
    };

    if (problems.length > 0) {
      return makeUnhealthy<GscCollected>(problems.join(' | '), data, pages.length);
    }
    // rowCount counts rows EMITTED, not calls made: 10 fresh + 39 carried answers
    // R6 for 49 URLs. `indexInspection.inspected` and `.observed` keep both
    // numbers visible so neither hides behind the other.
    return makeHealthy(data, pages.length);
  });
}

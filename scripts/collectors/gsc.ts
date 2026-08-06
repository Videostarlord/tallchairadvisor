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
 * PARTIAL COVERAGE IS UNHEALTHY. If we inspect 30 of 49 eligible URLs, R6 is
 * 61% satisfied and the record says so. A collector that reported healthy on
 * 61% coverage would be exactly the "degraded-but-plausible value" §6 forbids.
 */

import { google } from 'googleapis';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
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
    requested: number;
    inspected: number;
    failed: number;
    quotaExceeded: boolean;
    coveragePct: number;
    verdicts: Record<string, number>;
    coverageStates: Record<string, number>;
    notIndexed: string[];
    pages: InspectedUrl[];
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

/** Eligible indexable URLs: real pages, not noindex, not 301 sources. */
export function indexableUrls(root: string): Array<{ url: string; file: string }> {
  const redirects = loadRedirectMap(root);
  const out: Array<{ url: string; file: string }> = [];
  for (const file of listPageFiles(root)) {
    const source = readFileSync(resolve(root, file), 'utf-8');
    if (!isIndexableSource(file, source)) continue;
    // PRD §7.5: auditing a 301 source as a page produced the C-1 false positive.
    if (isRedirectSource(redirects, astroFileToPath(file))) continue;
    out.push({ url: astroFileToUrl(file), file });
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

    // 4 ─ URL Inspection (R6)
    const eligible = indexableUrls(REPO_ROOT);
    const limitRaw = envValue('GSC_INSPECT_LIMIT');
    const limit = limitRaw === null ? 0 : Number.parseInt(limitRaw, 10);
    const requested =
      Number.isFinite(limit) && limit > 0 ? eligible.slice(0, limit) : eligible;

    const pages: InspectedUrl[] = [];
    let failed = 0;
    let quotaExceeded = false;

    console.log(`[gsc] inspecting ${requested.length}/${eligible.length} indexable URL(s) at ~1/${INSPECT_INTERVAL_MS}ms`);

    for (let i = 0; i < requested.length; i++) {
      const { url, file } = requested[i];
      try {
        const res = await searchconsole.urlInspection.index.inspect(
          { requestBody: { inspectionUrl: url, siteUrl: SITE_URL } },
          { timeout: 30_000 }
        );
        const status = res.data.inspectionResult?.indexStatusResult;
        pages.push({
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
        });
      } catch (error) {
        const described = describeError(error);
        failed++;
        // 429 = quota. Continuing would burn the rest of the window for nothing.
        if (/\b429\b|rateLimitExceeded|quotaExceeded|Quota exceeded/i.test(described)) {
          quotaExceeded = true;
          console.error(`[gsc] URL Inspection quota exhausted after ${pages.length} URL(s): ${described}`);
          break;
        }
        pages.push({
          url,
          file,
          verdict: 'INSPECTION_FAILED',
          coverageState: 'unknown',
          indexingState: 'unknown',
          robotsTxtState: 'unknown',
          pageFetchState: 'unknown',
          lastCrawlTime: null,
          googleCanonical: null,
          userCanonical: null,
          error: described,
        });
      }
      if (i < requested.length - 1) await sleep(INSPECT_INTERVAL_MS);
    }

    const inspected = pages.filter((p) => p.error === null).length;

    // URL Inspection consumes a real daily quota (2000/day/property) — meter it.
    if (inspected > 0) {
      meterExternal({
        agent: 'collector-gsc',
        run: runId(),
        purpose: 'url-inspection',
        service: 'gsc-url-inspection',
        unit: 'credits',
        amount: inspected,
      });
    }

    const coveragePct = eligible.length === 0 ? 0 : Math.round((inspected / eligible.length) * 100);
    const notIndexed = pages.filter((p) => p.error === null && p.verdict !== 'PASS').map((p) => p.url);

    const indexInspection: GscCollected['indexInspection'] = {
      siteUrl: SITE_URL,
      eligible: eligible.length,
      requested: requested.length,
      inspected,
      failed,
      quotaExceeded,
      coveragePct,
      verdicts: tally(pages.filter((p) => p.error === null), 'verdict'),
      coverageStates: tally(pages.filter((p) => p.error === null), 'coverageState'),
      notIndexed,
      pages,
    };

    if (inspected < eligible.length) {
      const cause = quotaExceeded
        ? 'URL Inspection daily quota exhausted mid-run'
        : requested.length < eligible.length
          ? `GSC_INSPECT_LIMIT=${limitRaw} capped the run`
          : `${failed} inspection call(s) failed`;
      problems.push(
        `URL Inspection covered ${inspected}/${eligible.length} indexable URLs (${coveragePct}%) — ${cause}. ` +
          `R6 index-error detection is incomplete for the remaining ${eligible.length - inspected} URL(s).`
      );
    }

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
      return makeUnhealthy<GscCollected>(problems.join(' | '), data, inspected);
    }
    return makeHealthy(data, inspected);
  });
}

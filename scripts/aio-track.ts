/**
 * aio-track.ts — is this site actually IN the AI Overview? `npm run aio:track`
 *
 * ─── THE HOLE THIS FILLS ─────────────────────────────────────────────────────
 *
 * The site's CTR thesis has run unmeasured since May 2026. `ctr-optimization.md`
 * states that AI Overview suppression causes ~80% of the CTR loss, and the whole
 * GEO capsule programme — the Direct Answer blocks, the citation sentinels, the
 * 49/49 `geo-capsule` predicate rollout — was built on that number. Then nothing
 * ever looked.
 *
 * What exists today is inference, and it says so itself. `gsc-analyze.ts` sets
 * `aioSuspect` on a CTR leak by the SHAPE of the leak: a good position earning
 * far fewer clicks than the position curve predicts. That is a reasonable prior
 * and it is not an observation. It cannot tell an AI Overview from a product
 * carousel, a People-Also-Ask stack, a video block, or a title that simply does
 * not earn its impressions — four very different problems with four different
 * fixes, one of which the site has already spent months building for.
 *
 * The distinguishing fact is cheap and nobody was buying it. DataForSEO returns
 * the `ai_overview` element in the SERP payload, with its `references`, on the
 * same endpoint `competitor-intelligence.ts` already calls. This asks TCA's own
 * money queries the two questions that decide whether the capsule programme
 * worked:
 *
 *   1. Is there an AI Overview on this query at all?
 *   2. When there is, is tallchairadvisor.com cited inside it?
 *
 * ─── WHY IT IS A SEPARATE SCRIPT FROM competitor-intelligence.ts ─────────────
 *
 * That script asks a different question of the same endpoint and its plumbing
 * proves it: `fetchSerp()` FILTERS TCA's own URLs out of the organic results,
 * because its subject is what competitors rank for. Its keyword list is
 * competitor-derived for the same reason.
 *
 * This one is about TCA and nothing else, on TCA's own ranking queries, and its
 * output is a time series rather than a snapshot. Folding it in would mean a
 * function that sometimes removes the subject of the analysis and sometimes is
 * the analysis, which is how a filter ends up applied to the wrong caller.
 *
 * ─── WHAT THIS CAN AND CANNOT PROVE ─────────────────────────────────────────
 *
 * READ THIS BEFORE QUOTING A NUMBER OUT OF IT.
 *
 * One desktop, US, unpersonalised check per query per week. AI Overviews are
 * volatile: they appear and vanish on the same query within a day, vary by
 * device and location, and Google has rolled them back on whole query classes
 * more than once. So a single run answers "was there an AIO on this query at
 * this moment", never "does this query have AIOs".
 *
 * Therefore:
 *   - A single absent AIO is NOT evidence the suppression thesis was wrong.
 *   - A single citation is NOT evidence the capsule on that page earned it.
 *   - The unit of evidence is the TREND across runs, on the same query set,
 *     which is why every run archives itself and why `deltas` compares against
 *     the previous archive rather than reporting today in isolation.
 *
 * This is [[statistical-confidence-policy]] applied before the fact instead of
 * after it. The site has already turned its strategy on a single Amazon export
 * twice and had to turn it back both times.
 *
 * ─── COST ───────────────────────────────────────────────────────────────────
 *
 * DataForSEO live SERP is ~$0.002/query. 20 queries weekly is ~$0.16/month, and
 * the run refuses to start if the estimate exceeds AIO_SPEND_LIMIT (default $1).
 * Every response's actual `cost` is metered to the cost ledger like every other
 * paid call in this repo.
 *
 * Usage:
 *   npm run aio:track              # the real thing
 *   npm run aio:track:dry          # pick the queries, spend nothing, print them
 *   npm run aio:track -- --limit=5
 */

import 'dotenv/config';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { meterExternal } from './lib/metered-client.js';
import { aliasHint } from './lib/env-names.js';
import { readValidated, readValidatedIfExists } from './lib/read-validated.js';
import { aioRunOptions, aioRunSchema, gscAnalysisOptions, gscAnalysisSchema } from './schemas/index.js';
import { siteDomain } from './lib/site.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ANALYSIS_PATH = 'data/gsc/analysis.json';
const LATEST_PATH = 'data/aio/latest.json';
const ARCHIVE_DIR = 'raw/aio';

/** How many queries to buy. 20 is the top of the money set; beyond that is long tail. */
const DEFAULT_LIMIT = 20;
/** DataForSEO's published live-SERP price. Only used for the pre-flight estimate. */
const ESTIMATED_COST_PER_QUERY = 0.002;
const SPEND_LIMIT = Number(process.env.AIO_SPEND_LIMIT ?? 1);

const DOMAIN = siteDomain();

// ─── CLI ──────────────────────────────────────────────────────────────────────

interface Args {
  dryRun: boolean;
  limit: number;
}

export function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, limit: DEFAULT_LIMIT };
  for (const a of argv) {
    if (a === '--dry-run') { args.dryRun = true; continue; }
    const m = /^--limit=(\d+)$/.exec(a);
    if (m !== null) { args.limit = Number.parseInt(m[1], 10); continue; }
    if (a.startsWith('--')) throw new Error(`unknown flag ${a}`);
  }
  if (!Number.isFinite(args.limit) || args.limit < 1) throw new Error('--limit must be a positive integer');
  return args;
}

// ─── Query selection ──────────────────────────────────────────────────────────

/**
 * A query worth paying to observe, and why it was chosen.
 *
 * `reason` is carried through to the output on purpose. A row that cannot say
 * why it was bought is a row nobody can defend when the query set changes and
 * the trend moves with it — and the query set WILL change, because it is derived
 * from GSC each run rather than frozen in a constant.
 */
export interface TrackedQuery {
  query: string;
  impressions: number;
  /** TCA's average GSC position for this query, where the source records one. */
  position: number | null;
  page: string | null;
  reason: 'ctr-leak' | 'buyer-intent' | 'top-cluster';
}

interface AnalysisShape {
  ctrLeaks?: { query?: unknown; page?: unknown; impressions?: unknown; position?: unknown }[];
  affiliateOpportunities?: { page?: unknown; topBuyerQueries?: unknown; buyerIntentImpressions?: unknown }[];
  clusters?: {
    representativeQuery?: unknown;
    totalImpressions?: unknown;
    avgPosition?: unknown;
    pages?: unknown;
  }[];
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);

/**
 * Pick the query set from GSC intelligence.
 *
 * THREE SOURCES, IN PRIORITY ORDER, AND THE ORDER IS THE ARGUMENT.
 *
 *   1. ctrLeaks       — the queries the suppression thesis is ABOUT. If AIOs are
 *                       eating clicks anywhere, it is on a well-ranked query
 *                       earning far under its position curve. These are the
 *                       rows `gsc-analyze.ts` flags `aioSuspect` by inference;
 *                       this is where the inference gets tested.
 *   2. buyer-intent   — the queries that pay. An AIO on a commercial query is
 *                       worth more to know about than one on an informational
 *                       query, regardless of impressions.
 *   3. top-cluster    — the biggest remaining impression blocks, so the series
 *                       has a control group of queries nobody suspects.
 *
 * Deduped by query text; the first (highest-priority) reason wins. Sorted within
 * source by impressions, because a trend built on 30-impression queries is noise
 * with a chart on it.
 *
 * ─── EACH SOURCE GETS A RESERVED SHARE, AND THAT IS THE WHOLE DESIGN ────────
 *
 * Straight priority order was written first and the first dry run killed it: GSC
 * currently reports 21 CTR leaks, so all 20 slots filled with `ctr-leak` and
 * neither the buyer-intent queries nor the control group were ever bought.
 *
 * That failure is worse than it looks, because CTR leaks are SELECTED FOR being
 * suspicious. A series drawn only from them would find a high AIO rate and prove
 * nothing — the queries were picked BECAUSE they underperform their position
 * curve, which is the very symptom an AIO is supposed to explain. Without
 * unsuspected queries alongside them there is no baseline to say the rate is
 * high, and the run would confirm the thesis it was built to test.
 *
 * So the shares are floors, not caps: a source that cannot fill its share hands
 * the remainder back, in priority order, rather than shrinking the run.
 */
const SOURCE_SHARE: Record<TrackedQuery['reason'], number> = {
  'ctr-leak': 0.5,
  'buyer-intent': 0.2,
  'top-cluster': 0.3,
};

export function selectQueries(analysis: unknown, limit: number): TrackedQuery[] {
  const a = (analysis === null || typeof analysis !== 'object' ? {} : analysis) as AnalysisShape;

  /**
   * `?? []` is banned repo-wide (lint:architecture R1) and the ban is right: it
   * turns "this key was missing" into "there was nothing", which is how a broken
   * upstream reads as a quiet week. The caller in main() reads analysis.json
   * through readValidated, so a missing module throws there, with the SLA and the
   * schema attached. This helper stays permissive ONLY so the tests can drive it
   * with hand-built fragments, and it distinguishes the two cases explicitly
   * rather than collapsing them with an operator.
   */
  const rows = <T>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : []);

  const leaks: TrackedQuery[] = [...rows(a.ctrLeaks)]
    .sort((x, y) => (num(y.impressions) ?? 0) - (num(x.impressions) ?? 0))
    .flatMap((leak) => {
      const q = str(leak.query);
      return q === null ? [] : [{ query: q, impressions: num(leak.impressions) ?? 0, position: num(leak.position), page: str(leak.page), reason: 'ctr-leak' as const }];
    });

  const buyer: TrackedQuery[] = [...rows(a.affiliateOpportunities)]
    .sort((x, y) => (num(y.buyerIntentImpressions) ?? 0) - (num(x.buyerIntentImpressions) ?? 0))
    .flatMap((opp) => {
      const queries = Array.isArray(opp.topBuyerQueries) ? opp.topBuyerQueries : [];
      return queries.flatMap((raw) => {
        const q = str(raw);
        return q === null ? [] : [{ query: q, impressions: num(opp.buyerIntentImpressions) ?? 0, position: null, page: str(opp.page), reason: 'buyer-intent' as const }];
      });
    });

  const clusters: TrackedQuery[] = [...rows(a.clusters)]
    .sort((x, y) => (num(y.totalImpressions) ?? 0) - (num(x.totalImpressions) ?? 0))
    .flatMap((cluster) => {
      const q = str(cluster.representativeQuery);
      if (q === null) return [];
      const pages = Array.isArray(cluster.pages) ? cluster.pages : [];
      return [{ query: q, impressions: num(cluster.totalImpressions) ?? 0, position: num(cluster.avgPosition), page: str(pages[0]), reason: 'top-cluster' as const }];
    });

  const picked = new Map<string, TrackedQuery>();

  /** Take up to `n` unseen queries from a pool, never exceeding the run limit. */
  const drain = (pool: TrackedQuery[], n: number): void => {
    let taken = 0;
    for (const q of pool) {
      if (taken >= n || picked.size >= limit) break;
      const key = q.query.toLowerCase();
      if (picked.has(key)) continue;
      picked.set(key, q);
      taken++;
    }
  };

  // Pass 1: every source takes its reserved share, in priority order.
  drain(leaks, Math.round(limit * SOURCE_SHARE['ctr-leak']));
  drain(buyer, Math.round(limit * SOURCE_SHARE['buyer-intent']));
  drain(clusters, Math.round(limit * SOURCE_SHARE['top-cluster']));

  // Pass 2: spare capacity goes to the UNSUSPECTED pools first, and `leaks` is
  // deliberately last.
  //
  // The first version of this backfilled in plain priority order and the test
  // caught what that does: buyer-intent could only supply 2 of its 4 slots, the
  // spare 2 went straight back to leaks, and the split drifted to 12/2/6. Leaks
  // are the one pool selected FOR the symptom under investigation, so letting
  // them absorb every unclaimed slot walks back toward the single-source run
  // this allocation exists to prevent — quietly, and while still looking mixed.
  //
  // Leaks stay in the list rather than being hard-capped: if the other sources
  // are genuinely empty there is no control group to protect, and an under-filled
  // run buys less evidence for the same fixed weekly effort.
  for (const pool of [clusters, buyer, leaks]) {
    if (picked.size >= limit) break;
    drain(pool, limit - picked.size);
  }

  return [...picked.values()].slice(0, limit);
}

// ─── Observation ──────────────────────────────────────────────────────────────

export interface AioObservation {
  query: string;
  impressions: number;
  gscPosition: number | null;
  page: string | null;
  reason: TrackedQuery['reason'];

  /**
   * TRUE/FALSE only when the SERP was actually read. `null` means the request
   * failed and NOTHING is known — never folded into `false`, which would read as
   * "no AI Overview here" and quietly deflate every rate this file computes.
   */
  aioPresent: boolean | null;
  /** null whenever aioPresent is not true. */
  tcaCited: boolean | null;
  /** Hostnames the AIO cited, deduped and in SERP order. [] when there is no AIO. */
  citedDomains: string[];
  /** TCA's organic rank on this SERP, or null when it does not appear in the fetched depth. */
  tcaOrganicPosition: number | null;
  /** Why the observation is null, when it is. */
  error: string | null;
}

export interface AioRun {
  generatedAt: string;
  domain: string;
  /** What was asked, so a later reader can see the query set was not frozen. */
  querySource: string;
  observations: AioObservation[];
  summary: {
    queriesChecked: number;
    observed: number;
    failed: number;
    withAio: number;
    aioRate: number | null;
    citedInAio: number;
    citationRate: number | null;
  };
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

/**
 * Read one SERP payload. Exported and pure so the parsing can be tested without
 * a network or a key — the part that has actually been wrong before in this repo
 * is always the shape-reading, never the fetching.
 */
export function readSerp(task: unknown, domain: string): Pick<AioObservation, 'aioPresent' | 'tcaCited' | 'citedDomains' | 'tcaOrganicPosition'> {
  /**
   * Explicit `Array.isArray` rather than `?? []` throughout this function, and
   * not only to satisfy lint:architecture R1.
   *
   * The concern R1 exists for is real here in a specific way: an absent `items`
   * array and an empty one mean different things — "DataForSEO returned a shape
   * this code does not understand" versus "the SERP had nothing on it". Both
   * currently produce `aioPresent: false`, which is the safe reading, but writing
   * it as `?? []` would make that a side effect of an operator instead of a
   * decision, and the next person to add a field here would inherit the collapse
   * without seeing it.
   */
  const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v as Record<string, unknown>[] : []);

  const result = (task as { result?: unknown } | null)?.result;
  const items = arr(arr(result)[0]?.items);

  const organic = items.filter((i) => i.type === 'organic');
  let tcaOrganicPosition: number | null = null;
  for (const r of organic) {
    const url = typeof r.url === 'string' ? r.url : '';
    if (url.includes(domain)) {
      tcaOrganicPosition = num(r.rank_absolute);
      break;
    }
  }

  const aio = items.find((i) => i.type === 'ai_overview') ?? null;
  if (aio === null || aio === undefined) {
    return { aioPresent: false, tcaCited: null, citedDomains: [], tcaOrganicPosition };
  }

  // Same reference shape competitor-intelligence.ts reads: DataForSEO puts them
  // at the top level, and ALSO inside per-block arrays on some query types. Both
  // are collected because either alone has been observed to miss citations.
  const top = arr(aio.references);
  const nested = arr(aio.items).flatMap((b) => arr(b.references));
  const urls = [...top, ...nested]
    .map((r) => (typeof r.url === 'string' ? r.url : typeof r.link === 'string' ? r.link : ''))
    .filter((u) => u !== '');

  const citedDomains = [...new Set(urls.map(hostOf).filter((h) => h !== ''))];
  return {
    aioPresent: true,
    tcaCited: citedDomains.some((h) => h === domain || h.endsWith(`.${domain}`)),
    citedDomains,
    tcaOrganicPosition,
  };
}

async function observe(q: TrackedQuery, auth: string): Promise<AioObservation> {
  const base: AioObservation = {
    query: q.query,
    impressions: q.impressions,
    gscPosition: q.position,
    page: q.page,
    reason: q.reason,
    aioPresent: null,
    tcaCited: null,
    citedDomains: [],
    tcaOrganicPosition: null,
    error: null,
  };

  try {
    const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        keyword: q.query,
        location_code: 2840, // United States
        language_code: 'en',
        // Desktop, deliberately and with a caveat: 61% of this site's impressions
        // are mobile (deviceIntelligence), and mobile AIOs occupy far more of the
        // viewport. Desktop is chosen only so the series is comparable with the
        // SERP data competitor-intelligence.ts already collects. Read the rate as
        // a LOWER BOUND on the mobile experience, never as the whole picture.
        device: 'desktop',
        depth: 20,
      }]),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) return { ...base, error: `DataForSEO HTTP ${res.status}` };

    const data = await res.json() as { cost?: unknown; tasks?: { status_code?: unknown; status_message?: unknown }[] };
    const cost = num(data.cost);
    if (cost !== null && cost > 0) {
      meterExternal({
        agent: 'aio-track',
        run: new Date().toISOString().slice(0, 10),
        purpose: 'aio-presence',
        service: 'dataforseo',
        unit: 'usd',
        amount: cost,
      });
    }

    const task = data.tasks?.[0];
    if (task === undefined || task.status_code !== 20000) {
      return { ...base, error: `DataForSEO task ${String(task?.status_code)}: ${String(task?.status_message)}` };
    }

    return { ...base, ...readSerp(task, DOMAIN) };
  } catch (error) {
    return { ...base, error: (error as Error).message };
  }
}

// ─── Summary, deltas, output ──────────────────────────────────────────────────

export function summarise(observations: AioObservation[]): AioRun['summary'] {
  const observed = observations.filter((o) => o.aioPresent !== null);
  const withAio = observed.filter((o) => o.aioPresent === true);
  const cited = withAio.filter((o) => o.tcaCited === true);
  return {
    queriesChecked: observations.length,
    observed: observed.length,
    failed: observations.length - observed.length,
    withAio: withAio.length,
    // Rates are over what was OBSERVED, never over what was requested. A run
    // where 15 of 20 requests failed must not report a 25% AIO rate.
    aioRate: observed.length === 0 ? null : Number(((withAio.length / observed.length) * 100).toFixed(1)),
    citedInAio: cited.length,
    citationRate: withAio.length === 0 ? null : Number(((cited.length / withAio.length) * 100).toFixed(1)),
  };
}

/**
 * The most recent archived run before `exclude`, or null on the first ever run.
 *
 * Validated on read, and deliberately NOT wrapped in a try/catch that returns
 * null. A corrupt archive and an absent one are different states: absence means
 * "this is the first run", corruption means the series is broken. Swallowing the
 * second into the first would make `computeDeltas` report "no changes since the
 * previous run" — the same output as a genuinely calm week — which is the exact
 * shape of quiet failure the rest of this pipeline is built to refuse.
 */
export function previousRun(root: string, exclude: string): AioRun | null {
  const dir = resolve(root, ARCHIVE_DIR);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== exclude).sort();
  const last = files.pop();
  if (last === undefined) return null;
  return readValidatedIfExists(resolve(dir, last), aioRunSchema, aioRunOptions) as AioRun | null;
}

export interface Delta {
  query: string;
  was: string;
  now: string;
}

/**
 * What CHANGED since the previous archived run, on queries present in both.
 *
 * Only transitions are reported. A list of every query's current state every
 * week is a wall of unchanged rows that stops being read by the third run, and
 * the entire value of this file is in the handful of rows that moved.
 */
export function computeDeltas(current: AioRun, prev: AioRun | null): Delta[] {
  if (prev === null) return [];
  const before = new Map(prev.observations.map((o) => [o.query.toLowerCase(), o]));
  const state = (o: AioObservation): string =>
    o.aioPresent === null ? 'unknown'
      : o.aioPresent === false ? 'no AIO'
      : o.tcaCited === true ? 'AIO, TCA cited'
      : 'AIO, TCA absent';

  const out: Delta[] = [];
  for (const now of current.observations) {
    const was = before.get(now.query.toLowerCase());
    if (was === undefined) continue;
    // An `unknown` on either side is a gap in sight, not a change in the world.
    if (was.aioPresent === null || now.aioPresent === null) continue;
    const a = state(was);
    const b = state(now);
    if (a !== b) out.push({ query: now.query, was: a, now: b });
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const analysisPath = resolve(ROOT, ANALYSIS_PATH);
  if (!existsSync(analysisPath)) {
    console.error(`[aio-track] ABORT: ${ANALYSIS_PATH} does not exist. Run \`npm run gsc:full\` first — the query set comes from GSC, not from a hardcoded list.`);
    process.exit(1);
  }
  // Through readValidated, which enforces the 8-day freshness SLA as well as the
  // shape. Freshness is not incidental here: the query set IS the experiment, and
  // silently re-observing a month-old set every week would produce a tidy series
  // about queries the site no longer ranks for.
  const analysis = readValidated(analysisPath, gscAnalysisSchema, gscAnalysisOptions);
  const queries = selectQueries(analysis, args.limit);

  if (queries.length === 0) {
    console.error('[aio-track] ABORT: GSC analysis produced no queries. Nothing to observe — exiting rather than writing an empty run that would read as "no AIOs found".');
    process.exit(1);
  }

  const estimate = queries.length * ESTIMATED_COST_PER_QUERY;
  console.log(`[aio-track] ${queries.length} queries selected, est. $${estimate.toFixed(3)} (limit $${SPEND_LIMIT})`);
  for (const q of queries) {
    console.log(`  ${q.reason.padEnd(12)} ${String(q.impressions).padStart(6)} impr  ${q.query}`);
  }

  if (estimate > SPEND_LIMIT) {
    console.error(`[aio-track] ABORT: estimate $${estimate.toFixed(3)} exceeds AIO_SPEND_LIMIT $${SPEND_LIMIT}.`);
    process.exit(1);
  }

  if (args.dryRun) {
    console.log('[aio-track] --dry-run — nothing was fetched and nothing was written.');
    return;
  }

  const user = process.env.DATAFORSEO_USERNAME;
  const pass = process.env.DATAFORSEO_PASSWORD;
  if (user === undefined || pass === undefined || user === '' || pass === '') {
    console.error('[aio-track] ABORT: DATAFORSEO_USERNAME and DATAFORSEO_PASSWORD must be set.');
    const hint = aliasHint('DATAFORSEO_USERNAME');
    if (hint !== null) console.error(`  ${hint}`);
    process.exit(1);
  }
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');

  // Serial, not parallel. 20 requests is not worth a concurrency bug, and
  // DataForSEO rate-limits per account in a way that would turn a burst into a
  // run full of `null` observations — which this file is careful to treat as
  // blindness rather than as absence, so a burst would poison the series.
  const observations: AioObservation[] = [];
  for (const q of queries) {
    const o = await observe(q, auth);
    observations.push(o);
    const state = o.error !== null ? `ERROR ${o.error}`
      : o.aioPresent === false ? 'no AIO'
      : o.tcaCited === true ? `AIO — CITED (${o.citedDomains.length} refs)`
      : `AIO — not cited (${o.citedDomains.length} refs)`;
    console.log(`  ${state.padEnd(34)} ${q.query}`);
  }

  const run: AioRun = {
    generatedAt: new Date().toISOString(),
    domain: DOMAIN,
    querySource: `${ANALYSIS_PATH} (ctrLeaks → affiliateOpportunities → clusters, top ${args.limit} by impressions)`,
    observations,
    summary: summarise(observations),
  };

  const date = run.generatedAt.slice(0, 10);
  const archiveName = `${date}.json`;
  const deltas = computeDeltas(run, previousRun(ROOT, archiveName));

  mkdirSync(resolve(ROOT, ARCHIVE_DIR), { recursive: true });
  writeFileSync(resolve(ROOT, ARCHIVE_DIR, archiveName), `${JSON.stringify(run, null, 2)}\n`);

  // The uniform L1 collector envelope (§7.4), so the nightly can read this the
  // same way it reads GSC and GA4. `healthy` is false when the run could not see
  // — a run where every request failed must not present itself as a clean zero.
  const healthy = run.summary.observed > 0 && run.summary.failed <= run.summary.queriesChecked / 2;
  mkdirSync(resolve(ROOT, dirname(LATEST_PATH)), { recursive: true });
  writeFileSync(resolve(ROOT, LATEST_PATH), `${JSON.stringify({
    data: { ...run, deltas },
    meta: {
      collectedAt: run.generatedAt,
      rowCount: observations.length,
      healthy,
      reason: healthy ? null : `${run.summary.failed}/${run.summary.queriesChecked} queries could not be observed`,
    },
  }, null, 2)}\n`);

  const s = run.summary;
  console.log('');
  console.log(`[aio-track] ${s.observed}/${s.queriesChecked} observed, ${s.failed} failed`);
  console.log(`[aio-track] AIO present on ${s.withAio}/${s.observed}${s.aioRate === null ? '' : ` (${s.aioRate}%)`}`);
  console.log(`[aio-track] ${DOMAIN} cited in ${s.citedInAio}/${s.withAio}${s.citationRate === null ? '' : ` (${s.citationRate}%)`}`);
  if (deltas.length === 0) {
    console.log('[aio-track] no changes vs the previous run (or this is the first run)');
  } else {
    console.log(`[aio-track] ${deltas.length} change(s) since the previous run:`);
    for (const d of deltas) console.log(`  ${d.was} → ${d.now}  "${d.query}"`);
  }
  console.log('');
  console.log('[aio-track] ONE observation per query, desktop, US, unpersonalised. AI Overviews');
  console.log('[aio-track] are volatile — read the TREND across runs, never a single run.');
}

// Importable for tests without executing. Same guard style as the other scripts here.
const invokedDirectly = process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(`[aio-track] ${(error as Error).message}`);
    process.exit(1);
  });
}

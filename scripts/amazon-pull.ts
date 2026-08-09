/**
 * amazon-pull.ts — P3. The last manual step in the pipeline.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY PLAYWRIGHT AND NOT AN API
 *
 * Amazon Associates has no reporting API for individual associates. There is
 * nothing to authenticate against and nothing to fetch, which is why
 * collectors/amazon.ts can only measure how STALE the newest hand-downloaded
 * export is, and why the affiliate nag is the one irreducible human dependency
 * in an otherwise autonomous pipeline (PRD §10.2).
 *
 * This replays a session Jackson captured once, by hand, and downloads the same
 * CSVs he would have downloaded.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * SETUP — DONE ONCE, BY JACKSON, NEVER BY AN AGENT
 *
 *   npx playwright codegen --save-storage=amazon-state.json https://affiliate-program.amazon.com/home/reports
 *   # log in in the window that opens, reach the reports page, then close it
 *   gh secret set AMAZON_STORAGE_STATE < amazon-state.json
 *   rm amazon-state.json          # it is a live credential; do not leave it on disk
 *
 * An agent must never handle the Amazon login itself. The stored state is a
 * bearer credential for a real financial account; capturing it is a human act.
 *
 * Until that secret exists this script exits 0 with a notice and changes
 * nothing. collectors/amazon.ts keeps nagging at 7 days in the meantime, so the
 * gap stays visible rather than silently unmonitored.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE DESIGN DETAIL THAT MAKES IT TRUSTWORTHY
 *
 * When the session expires this script files `amazon-session-expired` and writes
 * NO report. It must never report $0.
 *
 * A zero that came from a failed login is indistinguishable, downstream, from a
 * month that genuinely earned nothing — and the kill-list gate that decides
 * whether this site continues is measured in months above $100. A fabricated
 * zero could retire a site that was earning fine. Expiry is detected positively
 * (a sign-in URL, a challenge page, an HTML body where a CSV should be), never
 * by trusting a parsed zero.
 *
 * Usage:
 *   npx tsx scripts/amazon-pull.ts [--days 30] [--dry-run] [--state <path>]
 */

import 'dotenv/config';
import { chromium, type Browser, type BrowserContext } from 'playwright';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  classifySession,
  rollingWindow,
  describeWindow,
  type ExportWindow,
} from './lib/amazon-session.js';
import {
  writeSnapshot,
  LATEST_PATH,
  HISTORY_PATH,
  type AffiliateSnapshot,
} from './lib/affiliate-store.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The reporting UI. `/home/reports` redirects here; using the real path avoids a
 * redirect hop and is what the harvested `referer` header must match.
 */
const REPORTS_URL = 'https://affiliate-program.amazon.com/p/reporting/earnings';

/** The JSON endpoint the SPA itself calls. Discovered by watching its network traffic. */
const TABLE_ENDPOINT = 'https://affiliate-program.amazon.com/reporting/table';

const TRACKING_ID = 'tallchairadvi-20';

/**
 * Columns for the daily overview report. Verified 2026-08-09: summing these over
 * 2026-07-11 -> 2026-08-09 reproduced the 2026-08-04 archive export exactly —
 * $3,337.74 ordered revenue, $98.90 earnings, 7 ordered items.
 */
const OVERVIEW_COLUMNS = [
  'day', 'clicks', 'total_ordered_items', 'conversion_rate',
  'total_ordered_revenue', 'shipped_items', 'returned_items',
  'total_revenue', 'total_earnings',
].join(',');

/**
 * `daily` refreshes the live layer only. `weekly` does that AND writes the dated
 * archive snapshot. See lib/affiliate-store.ts for why the two clocks differ.
 */
type Mode = 'daily' | 'weekly';

interface Args { days: number; dryRun: boolean; statePath: string | null; mode: Mode }

function parseArgs(argv: string[]): Args {
  const a: Args = { days: 30, dryRun: false, statePath: null, mode: 'weekly' };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${flag} requires a value`);
      return v;
    };
    switch (flag) {
      case '--days': a.days = Number.parseInt(next(), 10); break;
      case '--dry-run': a.dryRun = true; break;
      case '--state': a.statePath = next(); break;
      case '--mode': {
        const m = next();
        if (m !== 'daily' && m !== 'weekly') throw new Error(`--mode must be 'daily' or 'weekly', got '${m}'`);
        a.mode = m;
        break;
      }
      default: if (flag.startsWith('--')) throw new Error(`unknown flag ${flag}`);
    }
  }
  if (!Number.isFinite(a.days) || a.days < 1) throw new Error('--days must be a positive number');
  return a;
}

/**
 * Where a local capture lands by default.
 *
 * `playwright codegen --save-storage=amazon-state.json` writes here, and the
 * documented setup flow tests the capture BEFORE uploading it as a secret — so at
 * that moment the env var does not exist yet and only this file does. Looking for
 * it is what makes "verify locally, then upload" actually work.
 *
 * Gitignored. It is a live bearer credential for a financial account.
 */
const LOCAL_STATE_PATH = resolve(ROOT, 'amazon-state.json');

/**
 * The stored session. Returns null when genuinely unconfigured, which is a NOTICE
 * and not a failure — see the header.
 *
 * Resolution order, most explicit first:
 *   1. --state <path>            an operator naming a file outright
 *   2. AMAZON_STORAGE_STATE      how CI supplies it
 *   3. ./amazon-state.json       a local capture not yet uploaded
 *
 * The chosen source is always logged. Two of these can be present at once with
 * different contents — a stale local file next to a fresh secret — and silently
 * picking one would mean testing a credential you are not about to deploy.
 */
function loadStorageState(statePath: string | null): { state: unknown; source: string } | null {
  if (statePath !== null) {
    if (!existsSync(statePath)) throw new Error(`--state ${statePath} does not exist`);
    // lint-architecture-allow R4 -- an unparseable state file must throw here and stop the run; a malformed credential is never something to continue past
    return { state: JSON.parse(readFileSync(statePath, 'utf-8')), source: `--state ${statePath}` };
  }

  const raw = process.env.AMAZON_STORAGE_STATE;
  if (raw !== undefined && raw.trim() !== '') {
    try {
      // lint-architecture-allow R4 -- same as above; validated by Playwright when the context is created
      return { state: JSON.parse(raw), source: 'AMAZON_STORAGE_STATE' };
    } catch (error) {
      throw new Error(
        `AMAZON_STORAGE_STATE is set but is not valid JSON (${(error as Error).message}). ` +
        'Re-capture it with `npx playwright codegen --save-storage=...`.',
      );
    }
  }

  if (existsSync(LOCAL_STATE_PATH)) {
    // lint-architecture-allow R4 -- a corrupt capture must stop the run rather than be worked around
    const state = JSON.parse(readFileSync(LOCAL_STATE_PATH, 'utf-8'));
    return { state, source: 'amazon-state.json (local capture — not yet uploaded as a secret)' };
  }

  return null;
}

/** Filed when the session is dead. Deliberately shaped like a probe finding. */
function sessionExpiredFinding(reason: string): Record<string, unknown> {
  return {
    page: '/affiliate/amazon-associates/',
    issueClass: 'amazon-session-expired',
    severity: 'high',
    summary:
      `The stored Amazon Associates session is no longer valid: ${reason}. ` +
      'Re-capture it with `npx playwright codegen --save-storage=amazon-state.json ' +
      'https://affiliate-program.amazon.com/home/reports`, then `gh secret set AMAZON_STORAGE_STATE`. ' +
      'NO revenue figure was recorded for this run — a zero here would be indistinguishable ' +
      'from a genuinely zero month, and the kill-list gate reads that number.',
    closurePredicate: { kind: 'collector-healthy', collector: 'amazon' },
  };
}

function writeSessionExpired(reason: string): void {
  const dir = resolve(ROOT, 'data/collectors');
  mkdirSync(dir, { recursive: true });
  const finding = sessionExpiredFinding(reason);
  writeFileSync(
    resolve(dir, 'amazon-session.json'),
    `${JSON.stringify({
      meta: {
        healthy: false,
        collector: 'amazon-session',
        observedAt: new Date().toISOString(),
        // Said explicitly so no downstream reader has to infer it.
        note: 'session invalid — NO revenue was measured this run. Absence of a figure is not a figure.',
      },
      finding,
    }, null, 2)}\n`,
  );
  console.error(`[amazon-pull] SESSION EXPIRED — ${reason}`);
  console.error('[amazon-pull] wrote data/collectors/amazon-session.json; no report written, no revenue claimed.');
}

/** One day's row from the overview report. Every value arrives as a string. */
export interface DayRow {
  day: string;
  clicks: string;
  total_ordered_items: string;
  total_ordered_revenue: string;
  shipped_items: string;
  returned_items: string;
  total_revenue: string;
  total_earnings: string;
}

export interface ReportResult {
  rows: DayRow[];
  totals: Record<string, number>;
}

const num = (v: unknown): number => {
  const n = Number.parseFloat(String(v ?? '').replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** Sum the money and count columns across the window. */
export function totalsFor(rows: DayRow[]): Record<string, number> {
  const keys = ['clicks', 'total_ordered_items', 'total_ordered_revenue', 'shipped_items', 'returned_items', 'total_revenue', 'total_earnings'] as const;
  const out: Record<string, number> = {};
  for (const k of keys) out[k] = rows.reduce((a, r) => a + num((r as unknown as Record<string, unknown>)[k]), 0);
  return out;
}

/**
 * Fetch the daily overview for the window.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY HEADERS ARE HARVESTED RATHER THAN CONSTRUCTED
 *
 * Associates Central is an SPA with no CSV download URL — the first version of
 * this script guessed one and got the SPA's own 249KB JSON payload back. The real
 * data comes from `/reporting/table`, and that endpoint returns **401** to a
 * plain cookie-authenticated request: it also requires a per-page-load
 * `authorization: Bearer` JWT and an `x-csrf-token`, both minted by the app.
 *
 * Those cannot be stored in `storageState` because they are not cookies and they
 * rotate every page load. So the page is opened, its OWN first request to
 * `/reporting/table` is intercepted, its headers are captured, and the same
 * headers are replayed with the date range this run wants.
 *
 * That is why this is resilient: it never guesses an auth scheme. It borrows the
 * one the application just used.
 */
async function fetchOverview(context: BrowserContext, window: ExportWindow): Promise<ReportResult> {
  const page = await context.newPage();

  let harvested: Record<string, string> | null = null;
  page.on('request', (req) => {
    if (harvested !== null || !req.url().includes('/reporting/table')) return;
    void req.allHeaders().then((all) => {
      if (harvested !== null) return;
      const h: Record<string, string> = {};
      // HTTP/2 pseudo-headers (:method, :path, ...) cannot be re-sent.
      for (const [k, v] of Object.entries(all)) if (!k.startsWith(':')) h[k] = v;
      harvested = h;
    }).catch(() => { /* another request will serve */ });
  });

  await page.goto(REPORTS_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => { /* checked by classifySession next */ });

  // Positive identification BEFORE anything is read off the page.
  const state = classifySession(page.url(), await page.innerText('body').catch(() => ''));
  if (state.kind !== 'report') {
    throw Object.assign(new Error(state.reason), { sessionInvalid: true });
  }

  for (let i = 0; i < 30 && harvested === null; i++) await page.waitForTimeout(500);
  if (harvested === null) {
    // The page loaded and identified as the reporting UI but never called its own
    // data endpoint. That is a changed app, not a dead session — say which.
    throw new Error(
      'the reporting page loaded but never issued a /reporting/table request, so no auth headers could be harvested. ' +
      "Amazon's reporting UI has probably changed; scripts/amazon-pull.ts needs updating.",
    );
  }

  const q = new URLSearchParams({
    'query[type]': 'overview',
    'query[start_date]': window.start,
    'query[end_date]': window.end,
    'query[tag_id]': 'all',
    'query[order]': 'desc',
    'query[device_type]': 'all',
    'query[last_accessed_row_index]': '0',
    'query[group_by]': 'day',
    'query[columns]': OVERVIEW_COLUMNS,
    'query[tag_value]': '',
    'query[storeId]': TRACKING_ID,
    'query[locale]': 'US',
    'query[skip]': '0',
    'query[next_token]': '',
    'query[sort]': 'day',
    // Generous: the window is at most ~90 days and one row is one day.
    'query[limit]': '400',
    store_id: TRACKING_ID,
  });

  const response = await page.request.get(`${TABLE_ENDPOINT}?${q.toString()}`, { headers: harvested, timeout: 60_000 });
  const body = await response.text();

  if (response.status() === 401 || response.status() === 403) {
    throw Object.assign(
      new Error(`the reporting API returned ${response.status()} — the harvested credentials were rejected, so the session is not usable`),
      { sessionInvalid: true },
    );
  }
  if (response.status() === 429) {
    // Explicitly NOT a session problem and explicitly not zero earnings.
    throw new Error('the reporting API returned 429 (rate limited). No data was read; try again later.');
  }
  if (!response.ok()) {
    throw new Error(`the reporting API returned HTTP ${response.status()}: ${body.slice(0, 200)}`);
  }

  let parsed: { records?: unknown };
  try {
    // lint-architecture-allow R4 -- shape-checked immediately below; a malformed body throws and fails the run rather than yielding a fabricated total
    parsed = JSON.parse(body) as { records?: unknown };
  } catch {
    throw new Error(`the reporting API returned a non-JSON body (${body.slice(0, 120)})`);
  }
  if (!Array.isArray(parsed.records)) {
    throw new Error('the reporting API response has no `records` array — the endpoint contract has changed');
  }

  await page.close().catch(() => { /* the run is over */ });

  const rows = parsed.records as DayRow[];
  return { rows, totals: totalsFor(rows) };
}

function writeExport(result: ReportResult, window: ExportWindow): string {
  const date = new Date().toISOString().slice(0, 10);
  const dataDir = resolve(ROOT, 'raw/affiliate', `${date}-amazon-json`);
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    resolve(dataDir, 'overview-daily.json'),
    `${JSON.stringify({ window, fetchedAt: new Date().toISOString(), rows: result.rows }, null, 2)}\n`,
  );

  const t = result.totals;
  const money = (n: number): string => `$${n.toFixed(2)}`;
  const daysWithClicks = result.rows.filter((r) => num(r.clicks) > 0).length;

  const reportPath = resolve(ROOT, 'raw/affiliate', `${date}-amazon-associates-report.md`);
  const lines = [
    `# Amazon Associates Report — snapshot dated ${date}`,
    '',
    `**Source:** Associates Central reporting API, pulled automatically by \`scripts/amazon-pull.ts\`.`,
    `Raw daily rows: \`raw/affiliate/${date}-amazon-json/overview-daily.json\`.`,
    '',
    `**Window: ${describeWindow(window).toUpperCase()} — set by this script, not inferred.**`,
    '',
    'The window is stated because it is not recoverable from the data itself. Month-to-date',
    'and rolling-30-day exports are indistinguishable once downloaded, and one export in this',
    'archive was already misread that way (see the 2026-08-04 note). Because this run chose',
    'the range explicitly, that ambiguity does not apply to it.',
    '',
    '## Totals for the window',
    '',
    '| Metric | Value |',
    '|---|---|',
    `| Clicks | ${t.clicks} |`,
    `| Items ordered | ${t.total_ordered_items} |`,
    `| Ordered revenue | ${money(t.total_ordered_revenue)} |`,
    `| Items shipped | ${t.shipped_items} |`,
    `| Items returned | ${t.returned_items} |`,
    `| Shipped revenue | ${money(t.total_revenue)} |`,
    `| **Shipped earnings (before returns clawback)** | **${money(t.total_earnings)}** |`,
    '',
    `Covering **${result.rows.length} day(s)** in range, of which ${daysWithClicks} had at least one click.`,
    '',
    '> **`total_earnings` is SHIPPED earnings, not net.** Verified against the 2026-08-04',
    `> archive export: this column returned $100.40 where that report's headline net was`,
    '> **$98.90**, the difference being a $1.50 returned-item clawback. The clawback amount',
    '> is not in this column set — only the returned-item *count* is. So do not copy the',
    '> figure above into the monthly log in [[affiliate-performance]] as net earnings; it is',
    '> an upper bound, and the gap is the clawback.',
    '',
    '## Days with activity',
    '',
    '| Day | Clicks | Ordered | Ordered rev | Earnings |',
    '|---|---|---|---|---|',
    ...result.rows
      .filter((r) => num(r.clicks) > 0 || num(r.total_earnings) !== 0)
      .map((r) => `| ${r.day} | ${r.clicks} | ${r.total_ordered_items} | ${money(num(r.total_ordered_revenue))} | ${money(num(r.total_earnings))} |`),
    '',
    '## Scope of this pull',
    '',
    'This is the **daily overview** report only. The ASIN-level breakdown (linked products,',
    'category, top sellers) uses different `query[type]` values on the same endpoint, and the',
    'correct parameters for those were not established — probing for them started returning',
    'HTTP 429, so it was stopped rather than risk the account. Those tables are still',
    'available by hand in Associates Central.',
    '',
    '**Consequence worth stating:** click-to-ASIN attribution — the "0 chair orders on N chair',
    'clicks" pattern tracked in [[affiliate-performance]] — is NOT in this pull and still needs',
    'a manual export to update.',
    '',
  ];
  writeFileSync(reportPath, `${lines.join('\n')}\n`);
  return reportPath;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const loaded = loadStorageState(args.statePath);
  if (loaded === null) {
    console.log('[amazon-pull] No session found — nothing to replay, exiting without changes.');
    console.log('[amazon-pull] Looked for: --state <path>, then $AMAZON_STORAGE_STATE, then ./amazon-state.json');
    console.log('[amazon-pull] Setup (Jackson, once, locally — never an agent):');
    console.log('[amazon-pull]   npx playwright codegen --save-storage=amazon-state.json https://affiliate-program.amazon.com/home/reports');
    console.log('[amazon-pull]   npm run amazon:pull:dry          # verify BEFORE uploading');
    console.log('[amazon-pull]   gh secret set AMAZON_STORAGE_STATE < amazon-state.json && rm amazon-state.json');
    console.log('[amazon-pull] collectors/amazon.ts keeps nagging at 7 days until then, so this gap stays visible.');
    return;
  }
  const state = loaded.state;
  console.log(`[amazon-pull] session source: ${loaded.source}`);

  const window = rollingWindow(args.days);
  console.log(`[amazon-pull] window: ${describeWindow(window)}${args.dryRun ? '  (DRY RUN — nothing will be written)' : ''}`);

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const context = await browser.newContext({ storageState: state as never });
    const result = await fetchOverview(context, window);

    const t = result.totals;
    console.log(
      `[amazon-pull] ${result.rows.length} day(s): ${t.clicks} clicks · ${t.total_ordered_items} ordered · ` +
      `$${t.total_ordered_revenue.toFixed(2)} ordered revenue · $${t.total_earnings.toFixed(2)} earnings`,
    );

    // Zero ROWS is a failure to read, not a month without sales.
    //
    // The report omits days with no activity entirely — a 30-day window returned 25
    // rows on 2026-08-09 — so a sparse result is normal and NOT suspicious. But a
    // completely empty array over a multi-week window means the query did not match
    // the report, and recording that as $0 is precisely the lie this script exists
    // to prevent. Zero earnings across rows that DID come back is a real fact and
    // is reported normally.
    if (result.rows.length === 0) {
      throw new Error(
        `the reporting API returned zero rows for ${describeWindow(window)}. Days without activity are omitted from ` +
        'this report, so a sparse result is normal — but a completely empty one over the whole window indicates a query ' +
        'or contract failure, not a period without sales. Refusing to record it as $0.',
      );
    }

    if (args.dryRun) {
      console.log('[amazon-pull] --dry-run: verified the session and the data; wrote nothing.');
      return;
    }

    // The live layer, on every run. `fetchedAt` is the authoritative freshness
    // signal — written into the file precisely so no consumer has to stat it.
    writeSnapshot(ROOT, {
      fetchedAt: new Date().toISOString(),
      window: { start: window.start, end: window.end, kind: window.kind },
      totals: result.totals,
      rows: result.rows as unknown as AffiliateSnapshot['rows'],
      mode: args.mode,
    });
    console.log(`[amazon-pull] wrote ${LATEST_PATH} (+ appended ${HISTORY_PATH})`);

    // The dated archive snapshot, weekly only. Writing it daily would put ~30
    // near-identical reports a month into raw/, which is an archive of evidence
    // and decisions rather than a log.
    if (args.mode === 'weekly') {
      const reportPath = writeExport(result, window);
      console.log(`[amazon-pull] wrote ${reportPath}`);
    } else {
      console.log('[amazon-pull] daily mode — no raw/ archive snapshot written (weekly does that).');
    }
  } catch (error) {
    if ((error as { sessionInvalid?: boolean }).sessionInvalid === true) {
      writeSessionExpired((error as Error).message);
      process.exitCode = 1;
      return;
    }
    // Any other failure is also a failure to MEASURE, so it must not be quiet.
    console.error(`[amazon-pull] FAILED: ${(error as Error).message}`);
    console.error('[amazon-pull] No report written. This run measured nothing; it did not measure zero.');
    process.exitCode = 1;
  } finally {
    if (browser !== null) await browser.close().catch(() => { /* nothing left to protect */ });
  }
}

main();

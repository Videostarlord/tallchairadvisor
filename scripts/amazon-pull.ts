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
  classifyCsv,
  rollingWindow,
  describeWindow,
  type CsvVerdict,
  type ExportWindow,
} from './lib/amazon-session.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS_URL = 'https://affiliate-program.amazon.com/home/reports';

/** The four exports the archive has always carried, and the header each must show. */
const REPORTS = [
  { slug: 'tracking-id', label: 'Tracking-Id', headerFragment: 'tracking' },
  { slug: 'linked-product', label: 'Linked-Product', headerFragment: 'asin' },
  { slug: 'category', label: 'Category', headerFragment: 'category' },
  { slug: 'top-sellers', label: 'Top-Sellers', headerFragment: 'asin' },
] as const;

interface Args { days: number; dryRun: boolean; statePath: string | null }

function parseArgs(argv: string[]): Args {
  const a: Args = { days: 30, dryRun: false, statePath: null };
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
      default: if (flag.startsWith('--')) throw new Error(`unknown flag ${flag}`);
    }
  }
  if (!Number.isFinite(a.days) || a.days < 1) throw new Error('--days must be a positive number');
  return a;
}

/**
 * The stored session, from a file or the secret. Returns null when unconfigured,
 * which is a NOTICE and not a failure — see the header.
 */
function loadStorageState(statePath: string | null): unknown | null {
  if (statePath !== null) {
    if (!existsSync(statePath)) throw new Error(`--state ${statePath} does not exist`);
    // lint-architecture-allow R4 -- an unparseable state file must throw here and stop the run; a malformed credential is never something to continue past
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  }
  const raw = process.env.AMAZON_STORAGE_STATE;
  if (raw === undefined || raw.trim() === '') return null;
  try {
    // lint-architecture-allow R4 -- same as above; validated by Playwright when the context is created
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `AMAZON_STORAGE_STATE is set but is not valid JSON (${(error as Error).message}). ` +
      'Re-capture it with `npx playwright codegen --save-storage=...`.',
    );
  }
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

async function downloadReports(
  context: BrowserContext,
  window: ExportWindow,
): Promise<{ slug: string; label: string; text: string; verdict: CsvVerdict }[]> {
  const page = await context.newPage();
  const out: { slug: string; label: string; text: string; verdict: CsvVerdict }[] = [];

  await page.goto(REPORTS_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => { /* checked by classifySession next */ });

  // Positive identification BEFORE anything is read off the page.
  const state = classifySession(page.url(), await page.innerText('body').catch(() => ''));
  if (state.kind !== 'report') {
    throw Object.assign(new Error(state.kind === 'signin' ? state.reason : state.reason), { sessionInvalid: true });
  }

  for (const report of REPORTS) {
    // ────────────────────────────────────────────────────────────────────────
    // SELECTOR LAYER — THE ONE PART THAT COULD NOT BE TESTED WITHOUT THE SECRET.
    //
    // Associates Central is a logged-in SPA, so these selectors were written
    // from its documented report URLs rather than verified against a live DOM.
    // The FIRST run must be watched (`--dry-run` prints without writing).
    //
    // This is safe to get wrong: a bad selector yields HTML or an empty body,
    // classifyCsv returns `invalid`, and the run fails loudly with no report
    // written. The failure mode is "no data", never "zero dollars".
    // ────────────────────────────────────────────────────────────────────────
    const url =
      `${REPORTS_URL}?reportType=${encodeURIComponent(report.label)}` +
      `&startDate=${window.start}&endDate=${window.end}&format=csv`;

    let text = '';
    try {
      const response = await page.request.get(url, { timeout: 60_000 });
      text = await response.text();
    } catch (error) {
      text = `__FETCH_FAILED__ ${(error as Error).message}`;
    }

    const verdict = classifyCsv(text, report.headerFragment);
    out.push({ slug: report.slug, label: report.label, text, verdict });
    console.log(`[amazon-pull] ${report.label}: ${verdict.kind}${verdict.kind === 'data' ? ` (${verdict.rows} rows)` : ` — ${verdict.reason}`}`);
  }

  await page.close().catch(() => { /* the run is over */ });
  return out;
}

function writeExport(
  results: { slug: string; label: string; text: string; verdict: CsvVerdict }[],
  window: ExportWindow,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const csvDir = resolve(ROOT, 'raw/affiliate', `${date}-amazon-csv`);
  mkdirSync(csvDir, { recursive: true });
  for (const r of results) writeFileSync(resolve(csvDir, `${r.slug}.csv`), r.text);

  const reportPath = resolve(ROOT, 'raw/affiliate', `${date}-amazon-associates-report.md`);
  const lines = [
    `# Amazon Associates Report — snapshot dated ${date}`,
    '',
    `**Source:** ${results.length} CSV exports, downloaded automatically by \`scripts/amazon-pull.ts\`.`,
    `Raw CSVs: \`raw/affiliate/${date}-amazon-csv/\`.`,
    '',
    `**Window: ${describeWindow(window).toUpperCase()} — set by this script, not inferred.**`,
    '',
    'The window is stated here because it is NOT recoverable from the CSVs themselves.',
    'Month-to-date and rolling-30-day exports are indistinguishable once downloaded, and',
    'one export in this archive was already misread that way (see the 2026-08-04 note).',
    'Because this run chose the range explicitly, that ambiguity does not apply to it.',
    '',
    '## Export integrity',
    '',
    '| Report | Result | Detail |',
    '|---|---|---|',
    ...results.map((r) => `| ${r.label} | ${r.verdict.kind} | ${r.verdict.kind === 'data' ? `${r.verdict.rows} data rows` : r.verdict.reason} |`),
    '',
    '**An `empty` result is not $0.** Top-Sellers populates only on direct-link purchases and',
    'is legitimately empty most weeks. No earnings figure is derived from an empty table.',
    '',
    '## Read',
    '',
    'Figures above are integrity counts, not analysis. The numbers live in the CSVs; the',
    'weekly agent reads them from there.',
    '',
  ];
  writeFileSync(reportPath, `${lines.join('\n')}\n`);
  return reportPath;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const state = loadStorageState(args.statePath);
  if (state === null) {
    console.log('[amazon-pull] AMAZON_STORAGE_STATE is not set — nothing to replay, exiting without changes.');
    console.log('[amazon-pull] Setup (Jackson, once, locally — never an agent):');
    console.log('[amazon-pull]   npx playwright codegen --save-storage=amazon-state.json https://affiliate-program.amazon.com/home/reports');
    console.log('[amazon-pull]   gh secret set AMAZON_STORAGE_STATE < amazon-state.json && rm amazon-state.json');
    console.log('[amazon-pull] collectors/amazon.ts keeps nagging at 7 days until then, so this gap stays visible.');
    return;
  }

  const window = rollingWindow(args.days);
  console.log(`[amazon-pull] window: ${describeWindow(window)}${args.dryRun ? '  (DRY RUN — nothing will be written)' : ''}`);

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const context = await browser.newContext({ storageState: state as never });
    const results = await downloadReports(context, window);

    // Every report failing to parse is the signature of a dead session that got
    // far enough to look alive. Treated as expiry, never as "no sales".
    if (results.every((r) => r.verdict.kind === 'invalid')) {
      writeSessionExpired(
        `all ${results.length} downloads were unreadable (first: ${results[0]?.verdict.kind === 'invalid' ? results[0].verdict.reason : 'unknown'})`,
      );
      process.exitCode = 1;
      return;
    }

    if (args.dryRun) {
      console.log('[amazon-pull] --dry-run: verified the session and the downloads; wrote nothing.');
      return;
    }

    const reportPath = writeExport(results, window);
    console.log(`[amazon-pull] wrote ${reportPath}`);
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

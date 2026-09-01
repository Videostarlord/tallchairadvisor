/**
 * gsc-pull.ts
 * Pulls page-level GSC data and writes to data/gsc/latest.json
 *
 * Usage: npm run gsc:pull
 * Optional flags:
 *   --days=90      number of days to pull (default: 90)
 *   --days=16m     special value for 16 months (~490 days)
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { archiveJsonToRaw, appendWikiLog, readWikiPage, writeWikiPage, today } from './agents/wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- Config ---
const SITE_URL = 'https://tallchairadvisor.com/';
const CREDENTIALS_PATH = resolve(ROOT, 'credentials/gsc-service-account.json');
const OUTPUT_PATH = resolve(ROOT, 'data/gsc/latest.json');

// --- Parse --days flag ---
const daysArg = process.argv.find(a => a.startsWith('--days='));
let days = 90;
if (daysArg) {
  const val = daysArg.split('=')[1];
  if (val === '16m') days = 490;
  else days = parseInt(val, 10);
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

const endDate = new Date();
const startDate = new Date();
startDate.setDate(endDate.getDate() - days);

async function main() {
  // Auth
  const keyFile = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const webmasters = google.webmasters({ version: 'v3', auth });

  // Skip if latest.json was pulled within the last 72 hours (prevents redundant API calls)
  // Override with --force flag when a fresh pull is needed despite recency
  // Always pull on CI — checkout resets mtime so the age check is meaningless there
  const forceFlag = process.argv.includes('--force') || !!process.env.CI;
  if (!forceFlag && existsSync(OUTPUT_PATH)) {
    const stat = statSync(OUTPUT_PATH);
    const ageHours = (Date.now() - stat.mtimeMs) / 3600000;
    if (ageHours < 72) {
      console.log(`[gsc-pull] latest.json is ${ageHours.toFixed(1)}h old — skipping redundant pull (use --force to override)`);
      process.exit(0);
    }
  }

  console.log(`Pulling GSC data: ${toDateStr(startDate)} → ${toDateStr(endDate)} (${days} days)`);

  // Page-level performance
  const pageRes = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: toDateStr(startDate),
      endDate: toDateStr(endDate),
      dimensions: ['page'],
      rowLimit: 500,
    },
  });

  // Query-level performance (top 200 queries)
  const queryRes = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: toDateStr(startDate),
      endDate: toDateStr(endDate),
      dimensions: ['query'],
      rowLimit: 200,
    },
  });

  // Page + query combined (top 500 rows — useful for CTR analysis per query/page)
  const pageQueryRes = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: toDateStr(startDate),
      endDate: toDateStr(endDate),
      dimensions: ['page', 'query'],
      rowLimit: 500,
    },
  });

  // Device split by page (mobile vs desktop CTR divergence)
  const deviceRes = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: toDateStr(startDate),
      endDate: toDateStr(endDate),
      dimensions: ['device', 'page'],
      rowLimit: 500,
    },
  });

  // Daily trend (enables week-over-week velocity computation)
  const trendRes = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: toDateStr(startDate),
      endDate: toDateStr(endDate),
      dimensions: ['date'],
      rowLimit: 500,
    },
  });

  // Totals (site-wide)
  const totalsRes = await webmasters.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: toDateStr(startDate),
      endDate: toDateStr(endDate),
      dimensions: [],
      rowLimit: 1,
    },
  });

  const pages = (pageRes.data.rows ?? []).map(r => ({
    page: r.keys![0].replace('https://tallchairadvisor.com', ''),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr ? parseFloat((r.ctr * 100).toFixed(2)) : 0,
    position: r.position ? parseFloat(r.position.toFixed(1)) : null,
  }));

  const queries = (queryRes.data.rows ?? []).map(r => ({
    query: r.keys![0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr ? parseFloat((r.ctr * 100).toFixed(2)) : 0,
    position: r.position ? parseFloat(r.position.toFixed(1)) : null,
  }));

  const pageQueries = (pageQueryRes.data.rows ?? []).map(r => ({
    page: r.keys![0].replace('https://tallchairadvisor.com', ''),
    query: r.keys![1],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr ? parseFloat((r.ctr * 100).toFixed(2)) : 0,
    position: r.position ? parseFloat(r.position.toFixed(1)) : null,
  }));

  const deviceSplit = (deviceRes.data.rows ?? []).map(r => ({
    device: r.keys![0],
    page: r.keys![1].replace('https://tallchairadvisor.com', ''),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr ? parseFloat((r.ctr * 100).toFixed(2)) : 0,
    position: r.position ? parseFloat(r.position.toFixed(1)) : null,
  }));

  const dailyTrend = (trendRes.data.rows ?? []).map(r => ({
    date: r.keys![0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr ? parseFloat((r.ctr * 100).toFixed(2)) : 0,
    position: r.position ? parseFloat(r.position.toFixed(1)) : null,
  }));

  // ── Per-page query attribution (added 2026-08-28) ───────────────────────────
  //
  // WHY THIS EXISTS. `pageQueries` above is a GLOBAL top-500 sample, so a page
  // whose queries are individually tiny contributes zero rows to it and reads
  // downstream as "this page has no queries" — indistinguishable from a page
  // nobody searches for. /knee-pain-seat-depth/ is the case that exposed it:
  // 39,186 impressions, and `topQueries: []`.
  //
  // Asking GSC for that page's queries directly returns 133 rows summing to
  // 1,635 impressions — **4.2% of the page's total**. The other 95.8% carry no
  // query, no country and no device, and the queries that ARE named are
  // machine-shaped ("cornell ergonomics office chair seat pan depth 2 inches
  // behind knees", "seat depth 2-3 fingers behind knees ergonomics source", and
  // literal prompt fragments like "context: location: united kingdom"). They sit
  // at position 1.5-2.5 and take zero clicks across hundreds of impressions.
  //
  // That is retrieval by machines, not demand by humans, and it must not be
  // scored as an opportunity — see scoreOpportunities() in gsc-analyze.ts, where
  // raw impressions made this page the site's #1 recommendation every week.
  //
  // Cost: one extra API call per page, top 20 pages only. Cheap on a weekly job.
  const topPagesForAttribution = [...pages]
    .sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))
    .slice(0, 20);

  const pageAttribution: {
    page: string;
    totalImpressions: number;
    attributableImpressions: number;
    attributionRatio: number;
    namedQueryCount: number;
  }[] = [];

  for (const p of topPagesForAttribution) {
    const res = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: toDateStr(startDate),
        endDate: toDateStr(endDate),
        dimensions: ['query'],
        rowLimit: 25000,
        dimensionFilterGroups: [
          { filters: [{ dimension: 'page', operator: 'equals', expression: `https://tallchairadvisor.com${p.page}` }] },
        ],
      },
    });
    // NO `?? []` HERE, and the reason is the whole point of this record.
    //
    // An absent `rows` means the probe did not answer. Defaulting it to an empty
    // array would compute attributionRatio = 0 and hand gsc-analyze.ts a page
    // that looks 100% machine-retrieval — which DELETES it from the opportunity
    // list with a confident explanation. A failed probe would silently retire a
    // good page. Unknown is recorded as absence, never as zero.
    const rows = res.data.rows;
    if (rows === undefined) {
      console.warn(`[gsc-pull] attribution probe returned no rows object for ${p.page} — recording NOTHING for it rather than 0% attribution`);
      continue;
    }
    const attributable = rows.reduce((sum, r) => sum + (r.impressions ?? 0), 0);
    const total = p.impressions ?? 0;
    pageAttribution.push({
      page: p.page,
      totalImpressions: total,
      attributableImpressions: attributable,
      // Guard the divide: a page with 0 impressions cannot be in this list, but
      // a 0 here would read as "fully unattributable" rather than "unknown".
      attributionRatio: total > 0 ? parseFloat((attributable / total).toFixed(4)) : 1,
      namedQueryCount: rows.length,
    });
  }

  const totalsRow = totalsRes.data.rows?.[0];
  const totals = totalsRow
    ? {
        clicks: totalsRow.clicks,
        impressions: totalsRow.impressions,
        ctr: totalsRow.ctr ? parseFloat((totalsRow.ctr * 100).toFixed(2)) : 0,
        avgPosition: totalsRow.position ? parseFloat(totalsRow.position.toFixed(1)) : null,
      }
    : null;

  const output = {
    pulledAt: new Date().toISOString(),
    dateRange: { start: toDateStr(startDate), end: toDateStr(endDate), days },
    totals,
    pages,
    queries,
    pageQueries,
    pageAttribution,
    deviceSplit,
    dailyTrend,
  };

  mkdirSync(resolve(ROOT, 'data/gsc'), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  // Archive to wiki raw layer
  archiveJsonToRaw(ROOT, 'gsc', `gsc-${today()}.json`, output);
  appendWikiLog(ROOT, `## [${today()}] gsc-pull | GSC Data Pull\n\n- Period: ${toDateStr(startDate)} → ${toDateStr(endDate)} (${days} days)\n- Pages: ${pages.length} | Queries: ${queries.length} | PageQuery pairs: ${pageQueries.length}\n- Device rows: ${deviceSplit.length} | Daily trend rows: ${dailyTrend.length}\n- Clicks: ${totals?.clicks} | Impressions: ${totals?.impressions} | Avg pos: ${totals?.avgPosition}\n`);

  // Update wiki gsc-performance.md
  // Guard: skip if audit.ts already ran today — audit is more authoritative (has live meta + Claude analysis)
  const existingGscPage = readWikiPage(ROOT, 'pages/concepts/gsc-performance.md') || '';
  const alreadyUpdatedToday = existingGscPage.includes(`last_updated: ${today()}`);

  if (alreadyUpdatedToday) {
    console.log('  Wiki gsc-performance already updated today (audit ran) — skipping');
  } else {
    // Preserve existing "Latest Snapshot" as a historical entry (same logic as audit.ts)
    const latestMatch = existingGscPage.match(/## Latest Snapshot[^\n]*\n([\s\S]*?)(?=\n## |\n---\s*$|$)/);
    const oldSnapshotContent = latestMatch?.[1]?.trim() ?? '';
    const prevDate = existingGscPage.match(/## Latest Snapshot \(([^)]+)\)/)?.[1] ?? 'previous';
    const historyMatch = existingGscPage.match(/## Historical Snapshots\n([\s\S]*?)(?=\n## |\n---\s*$|$)/);
    const existingHistory = historyMatch?.[1]?.trim() ?? '';
    const historyBlocks = existingHistory.split(/\n(?=### )/).map((b: string) => b.trim()).filter((b: string) => b.length > 0);
    const trimmedHistory = historyBlocks.slice(0, 7);
    const newHistoryEntry = oldSnapshotContent ? `### ${prevDate}\n\n${oldSnapshotContent}` : '';
    const historicalSection = [newHistoryEntry, ...trimmedHistory].filter((b: string) => b.length > 0).join('\n\n');

    const topPagesTable = pages
      .filter((p: any) => p.impressions >= 10)
      .sort((a: any, b: any) => b.impressions - a.impressions)
      .slice(0, 10)
      .map((p: any) => `| ${p.page} | ${p.impressions} impr | pos ${p.position} | ${p.ctr}% CTR | ${p.clicks} clicks |`)
      .join('\n');

    const gscWikiUpdate = `---
type: concept
last_updated: ${today()}
sources: [raw/gsc/gsc-${today()}.json]
tags: [gsc, performance, metrics, tracking]
---

# GSC Performance Tracking

## Latest Snapshot (${today()})

| Metric | Value |
|--------|-------|
| Total impressions | ${totals?.impressions} |
| Total clicks | ${totals?.clicks} |
| Avg CTR | ${totals?.ctr}% |
| Avg position | ${totals?.avgPosition} |

## Top Pages

${topPagesTable}

*Raw pull — full audit with meta/schema analysis pending (Tuesday)*

## Historical Snapshots

${historicalSection}
`;
    writeWikiPage(ROOT, 'pages/concepts/gsc-performance.md', gscWikiUpdate);
    console.log('  Wiki updated → wiki/pages/concepts/gsc-performance.md');
  }

  console.log(`\nDone. Written to data/gsc/latest.json`);
  console.log(`  Pages: ${pages.length}`);
  console.log(`  Queries: ${queries.length}`);
  console.log(`  Page+Query rows: ${pageQueries.length}`);
  console.log(`  Attribution probed: ${pageAttribution.length} pages`);
  console.log(`  Device rows: ${deviceSplit.length}`);
  console.log(`  Daily trend rows: ${dailyTrend.length}`);
  if (totals) {
    console.log(`  Total clicks: ${totals.clicks} | Impressions: ${totals.impressions} | Avg pos: ${totals.avgPosition}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});

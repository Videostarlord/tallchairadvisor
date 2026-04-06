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
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { archiveJsonToRaw, appendWikiLog, today } from './agents/wiki-utils.js';

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
  };

  mkdirSync(resolve(ROOT, 'data/gsc'), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  // Archive to wiki raw layer
  archiveJsonToRaw(ROOT, 'gsc', `gsc-${today()}.json`, output);
  appendWikiLog(ROOT, `## [${today()}] gsc-pull | GSC Data Pull\n\n- Period: ${toDateStr(startDate)} → ${toDateStr(endDate)} (${days} days)\n- Pages: ${pages.length} | Queries: ${queries.length}\n- Clicks: ${totals?.clicks} | Impressions: ${totals?.impressions} | Avg pos: ${totals?.avgPosition}\n`);

  console.log(`\nDone. Written to data/gsc/latest.json`);
  console.log(`  Pages: ${pages.length}`);
  console.log(`  Queries: ${queries.length}`);
  console.log(`  Page+Query rows: ${pageQueries.length}`);
  if (totals) {
    console.log(`  Total clicks: ${totals.clicks} | Impressions: ${totals.impressions} | Avg pos: ${totals.avgPosition}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});

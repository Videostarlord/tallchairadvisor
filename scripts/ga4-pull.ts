/**
 * ga4-pull.ts
 * Pulls sessions, pageviews, traffic sources, and affiliate click events from GA4.
 *
 * Usage: npm run ga4:pull
 * Optional flags:
 *   --days=28      lookback window in days (default: 28)
 *   --force        bypass the 72-hour freshness guard
 *
 * Requirements:
 *   GA4_PROPERTY_ID=123456789   (numeric property ID — not G-XXXXXXXX)
 *   credentials/gsc-service-account.json must have GA4 read access.
 *   Enable "Google Analytics Data API" in Google Cloud Console.
 *   Add the service account email to GA4 property → Admin → Property Access Management (Viewer role).
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { archiveToRaw, appendWikiLog, readWikiPage, writeWikiPage, today } from './agents/wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CREDENTIALS_PATH = resolve(ROOT, 'credentials/gsc-service-account.json');
const OUTPUT_PATH = resolve(ROOT, 'data/ga4/latest.json');

// --- Args ---
const daysArg = process.argv.find(a => a.startsWith('--days='));
const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 28;
const forceFlag = process.argv.includes('--force') || !!process.env.CI;

const PROPERTY_ID = process.env.GA4_PROPERTY_ID?.trim();

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

const endDate = new Date();
const startDate = new Date();
startDate.setDate(endDate.getDate() - days);

const START = toDateStr(startDate);
const END = toDateStr(endDate);
const PROPERTY = `properties/${PROPERTY_ID}`;

// --- Types ---
interface PageRow {
  page: string;
  sessions: number;
  activeUsers: number;
  pageViews: number;
  engagementRate: number;
  avgSessionDuration: number;
  bounceRate: number;
}

interface ChannelRow {
  channel: string;
  sessions: number;
  pct: number;
}

interface SourceRow {
  source: string;
  medium: string;
  sessions: number;
}

interface AffiliateRow {
  page: string;
  eventCount: number;
}

interface DayRow {
  date: string;
  sessions: number;
  activeUsers: number;
  pageViews: number;
}

interface GA4Output {
  pulledAt: string;
  propertyId: string;
  dateRange: { start: string; end: string; days: number };
  totals: {
    sessions: number;
    activeUsers: number;
    pageViews: number;
    engagementRate: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  pages: PageRow[];
  channelGroups: ChannelRow[];
  trafficSources: SourceRow[];
  affiliateClicks: AffiliateRow[];
  dailyTrend: DayRow[];
}

function getMetric(row: any, index: number): number {
  return parseFloat(row.metricValues?.[index]?.value ?? '0') || 0;
}

function getDimension(row: any, index: number): string {
  return row.dimensionValues?.[index]?.value ?? '';
}

async function main() {
  if (!PROPERTY_ID) {
    console.error('[ga4-pull] GA4_PROPERTY_ID not set in environment — skipping');
    console.error('  Add GA4_PROPERTY_ID=<numeric-id> to your .env file.');
    console.error('  Find it in GA4 Admin → Property Settings → Property ID.');
    process.exit(0);
  }

  // Freshness guard — skip if pulled within 72h (override with --force or CI)
  if (!forceFlag && existsSync(OUTPUT_PATH)) {
    const ageHours = (Date.now() - statSync(OUTPUT_PATH).mtimeMs) / 3_600_000;
    if (ageHours < 72) {
      console.log(`[ga4-pull] latest.json is ${ageHours.toFixed(1)}h old — skipping (--force to override)`);
      process.exit(0);
    }
  }

  // Auth — same service account as GSC, different scope
  const keyFile = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });

  console.log(`[ga4-pull] Pulling GA4 data: ${START} → ${END} (${days} days)`);
  console.log(`[ga4-pull] Property: ${PROPERTY}`);

  const dateRanges = [{ startDate: START, endDate: END }];

  // Run all reports in parallel
  const [totalsRes, pagesRes, channelsRes, sourcesRes, affiliateRes, trendRes] = await Promise.all([
    // 1. Site-wide totals
    analyticsdata.properties.runReport({
      property: PROPERTY,
      requestBody: {
        dateRanges,
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
      },
    }),

    // 2. Per-page performance
    analyticsdata.properties.runReport({
      property: PROPERTY,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: '100',
      },
    }),

    // 3. Traffic channel breakdown
    analyticsdata.properties.runReport({
      property: PROPERTY,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      },
    }),

    // 4. Source/medium detail (top 30 — catches chatgpt.com and other referrers)
    analyticsdata.properties.runReport({
      property: PROPERTY,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: '30',
      },
    }),

    // 5. Affiliate click events per page
    analyticsdata.properties.runReport({
      property: PROPERTY,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { matchType: 'EXACT', value: 'affiliate_click' },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      },
    }),

    // 6. Daily trend
    analyticsdata.properties.runReport({
      property: PROPERTY,
      requestBody: {
        dateRanges,
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      },
    }),
  ]);

  // --- Parse totals ---
  const totalsRow = totalsRes.data.rows?.[0];
  const totals = {
    sessions: totalsRow ? getMetric(totalsRow, 0) : 0,
    activeUsers: totalsRow ? getMetric(totalsRow, 1) : 0,
    pageViews: totalsRow ? getMetric(totalsRow, 2) : 0,
    engagementRate: totalsRow ? parseFloat(getMetric(totalsRow, 3).toFixed(3)) : 0,
    avgSessionDuration: totalsRow ? parseFloat(getMetric(totalsRow, 4).toFixed(1)) : 0,
    bounceRate: totalsRow ? parseFloat(getMetric(totalsRow, 5).toFixed(3)) : 0,
  };

  // --- Parse pages ---
  const pages: PageRow[] = (pagesRes.data.rows ?? []).map(row => ({
    page: getDimension(row, 0),
    sessions: getMetric(row, 0),
    activeUsers: getMetric(row, 1),
    pageViews: getMetric(row, 2),
    engagementRate: parseFloat(getMetric(row, 3).toFixed(3)),
    avgSessionDuration: parseFloat(getMetric(row, 4).toFixed(1)),
    bounceRate: parseFloat(getMetric(row, 5).toFixed(3)),
  }));

  // --- Parse channel groups ---
  const totalSessions = totals.sessions || 1;
  const channelGroups: ChannelRow[] = (channelsRes.data.rows ?? []).map(row => {
    const sessions = getMetric(row, 0);
    return {
      channel: getDimension(row, 0),
      sessions,
      pct: parseFloat((sessions / totalSessions).toFixed(3)),
    };
  });

  // --- Parse traffic sources ---
  const trafficSources: SourceRow[] = (sourcesRes.data.rows ?? []).map(row => ({
    source: getDimension(row, 0),
    medium: getDimension(row, 1),
    sessions: getMetric(row, 0),
  }));

  // --- Parse affiliate clicks ---
  const affiliateClicks: AffiliateRow[] = (affiliateRes.data.rows ?? []).map(row => ({
    page: getDimension(row, 0),
    eventCount: getMetric(row, 0),
  }));

  // --- Parse daily trend ---
  const dailyTrend: DayRow[] = (trendRes.data.rows ?? []).map(row => {
    const raw = getDimension(row, 0); // "20260614"
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    return {
      date,
      sessions: getMetric(row, 0),
      activeUsers: getMetric(row, 1),
      pageViews: getMetric(row, 2),
    };
  });

  const output: GA4Output = {
    pulledAt: new Date().toISOString(),
    propertyId: PROPERTY_ID,
    dateRange: { start: START, end: END, days },
    totals,
    pages,
    channelGroups,
    trafficSources,
    affiliateClicks,
    dailyTrend,
  };

  // Write output
  mkdirSync(resolve(ROOT, 'data/ga4'), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

  // Archive to raw layer
  archiveToRaw(ROOT, 'ga4', `${today()}-ga4.json`, JSON.stringify(output, null, 2));

  // --- Wiki update ---
  const topPages = [...pages]
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10)
    .map(p => `| ${p.page} | ${p.sessions} | ${p.pageViews} | ${(p.engagementRate * 100).toFixed(0)}% | ${p.avgSessionDuration.toFixed(0)}s | ${(p.bounceRate * 100).toFixed(0)}% |`)
    .join('\n');

  const channelTable = channelGroups
    .map(c => `| ${c.channel} | ${c.sessions} | ${(c.pct * 100).toFixed(1)}% |`)
    .join('\n');

  const affiliateTotal = affiliateClicks.reduce((s, r) => s + r.eventCount, 0);
  const affiliateTable = affiliateClicks.length > 0
    ? affiliateClicks.map(r => `| ${r.page} | ${r.eventCount} |`).join('\n')
    : '| — | 0 |';

  const chatgptSessions = trafficSources
    .filter(s => s.source.includes('chatgpt'))
    .reduce((s, r) => s + r.sessions, 0);

  const existingPage = readWikiPage(ROOT, 'pages/concepts/ga4-performance.md') ?? '';
  const prevSnapshotMatch = existingPage.match(/## Latest Snapshot[^\n]*\n([\s\S]*?)(?=\n## |\n---\s*$|$)/);
  const prevDate = existingPage.match(/## Latest Snapshot \(([^)]+)\)/)?.[1] ?? 'previous';
  const oldContent = prevSnapshotMatch?.[1]?.trim() ?? '';
  const histMatch = existingPage.match(/## Historical Snapshots\n([\s\S]*?)(?=\n## |\n---\s*$|$)/);
  const existingHistory = histMatch?.[1]?.trim() ?? '';
  const histBlocks = existingHistory.split(/\n(?=### )/).map((b: string) => b.trim()).filter(Boolean).slice(0, 7);
  const newHistEntry = oldContent ? `### ${prevDate}\n\n${oldContent}` : '';
  const historicalSection = [newHistEntry, ...histBlocks].filter(Boolean).join('\n\n');

  const wikiContent = `---
type: concept
last_updated: ${today()}
sources: [data/ga4/latest.json]
tags: [ga4, analytics, sessions, conversions]
---

# GA4 Performance Tracking

**Auto-generated by ga4-pull.ts** | ${days}-day window ending ${END}

---

## Latest Snapshot (${today()})

| Metric | Value |
|--------|-------|
| Sessions | ${totals.sessions} |
| Active Users | ${totals.activeUsers} |
| Page Views | ${totals.pageViews} |
| Engagement Rate | ${(totals.engagementRate * 100).toFixed(1)}% |
| Avg Session Duration | ${totals.avgSessionDuration.toFixed(0)}s |
| Bounce Rate | ${(totals.bounceRate * 100).toFixed(1)}% |
| Affiliate Clicks | ${affiliateTotal} |
| ChatGPT Sessions | ${chatgptSessions} |

## Top Pages (by sessions)

| Page | Sessions | Views | Engaged | Avg Duration | Bounce |
|------|----------|-------|---------|-------------|--------|
${topPages}

## Traffic Channels

| Channel | Sessions | Share |
|---------|----------|-------|
${channelTable}

## Affiliate Clicks (event: affiliate_click)

| Page | Clicks |
|------|--------|
${affiliateTable}

## Historical Snapshots

${historicalSection}
`;

  writeWikiPage(ROOT, 'pages/concepts/ga4-performance.md', wikiContent);

  appendWikiLog(ROOT,
    `## [${today()}] ga4-pull | GA4 Data Pull\n\n` +
    `- Period: ${START} → ${END} (${days} days)\n` +
    `- Sessions: ${totals.sessions} | Users: ${totals.activeUsers} | Views: ${totals.pageViews}\n` +
    `- Engagement rate: ${(totals.engagementRate * 100).toFixed(1)}% | Avg duration: ${totals.avgSessionDuration.toFixed(0)}s\n` +
    `- Affiliate clicks: ${affiliateTotal} | ChatGPT sessions: ${chatgptSessions}\n` +
    `- Pages: ${pages.length} | Channels: ${channelGroups.length}\n`
  );

  console.log(`\n[ga4-pull] Done → data/ga4/latest.json`);
  console.log(`  Sessions: ${totals.sessions} | Users: ${totals.activeUsers} | Views: ${totals.pageViews}`);
  console.log(`  Engagement: ${(totals.engagementRate * 100).toFixed(1)}% | Avg duration: ${totals.avgSessionDuration.toFixed(0)}s`);
  console.log(`  Affiliate clicks: ${affiliateTotal}`);
  console.log(`  ChatGPT sessions: ${chatgptSessions}`);
  console.log(`  Pages tracked: ${pages.length}`);
}

main().catch(err => {
  console.error('[ga4-pull]', err.message ?? err);
  if (err.message?.includes('PERMISSION_DENIED') || err.message?.includes('403')) {
    console.error('  → Service account lacks GA4 access. Add it in GA4 Admin → Property Access Management.');
  } else if (err.message?.includes('INVALID_ARGUMENT') || err.message?.includes('400')) {
    console.error('  → Check GA4_PROPERTY_ID (should be numeric, not G-XXXXXXXX).');
  }
  process.exit(1);
});

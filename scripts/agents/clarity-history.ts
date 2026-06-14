/**
 * clarity-history.ts
 *
 * Pulls Clarity behavioral data and maintains a permanent append-only historical log.
 * Run from two places:
 *   1. clarity-history.yml  — every other day at 10:00 UTC (long-term trend data)
 *   2. monday.yml           — replaces clarity-pull.ts (keeps latest.json fresh for strategy.ts)
 *
 * ─── APPEND-ONLY GUARANTEE ────────────────────────────────────────────────────
 * data/clarity/history.jsonl is NEVER overwritten or truncated.
 * The only write operation is appendFileSync — one record per line.
 * Dedup: the script reads existing windowEnd dates before writing and exits
 * immediately if today's date is already recorded. This means running it twice
 * on the same calendar day (e.g., monday.yml + clarity-history.yml both fire) is
 * safe — the second run is a clean no-op.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Output files:
 *   data/clarity/history.jsonl   ← append-only historical log (one JSON per line)
 *   data/clarity/latest.json     ← current snapshot for strategy.ts (overwritten each run)
 *   raw/clarity/YYYY-MM-DD.json  ← immutable raw API response archive
 *
 * history.jsonl schema — two record types, one JSON object per line:
 *
 *   Page record (type = "page"):
 *   {
 *     "type": "page",
 *     "windowEnd": "2026-05-29",     // UTC date of this pull — dedup key
 *     "windowDays": 2,               // numOfDays used in the API call
 *     "url": "/review/gesture/",
 *     "sessions": 245,
 *     "scrollDepthAvg": 0.72,        // 0.0–1.0; null if not returned
 *     "rageClicks": 3,
 *     "deadClicks": 7,
 *     "excessiveScroll": 1,
 *     "engagementTimeSec": 145,
 *     "raw": { ...all numeric fields from API response... }
 *                                    // raw is the safety net — if field-name
 *                                    // parsing is wrong, the actual API values
 *                                    // are preserved here for re-analysis later
 *   }
 *
 *   Site record (type = "site"):
 *   {
 *     "type": "site",
 *     "windowEnd": "2026-05-29",
 *     "windowDays": 2,
 *     "totalSessions": 1240,
 *     "deviceSplit": { "mobile": 0.54, "desktop": 0.42, "tablet": 0.04 }
 *   }
 *
 * Querying trends later (examples):
 *   All data for one page, CSV:
 *     grep '"url":"/review/gesture/"' data/clarity/history.jsonl \
 *       | jq -r '[.windowEnd, .sessions, .scrollDepthAvg, .rageClicks, .deadClicks] | @csv'
 *
 *   Rage click trend across all pages:
 *     cat data/clarity/history.jsonl | jq -r 'select(.type=="page") |
 *       [.windowEnd, .url, .rageClicks] | @csv'
 *
 *   Device split over time:
 *     cat data/clarity/history.jsonl | jq -r 'select(.type=="site") |
 *       [.windowEnd, .deviceSplit.mobile, .deviceSplit.desktop] | @csv'
 */

import 'dotenv/config';
import {
  writeFileSync,
  appendFileSync,
  readFileSync,
  mkdirSync,
  existsSync,
} from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { archiveToRaw, appendWikiLog, today } from './wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const CLARITY_TOKEN = process.env.CLARITY_TOKEN;
const API_BASE = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';

// Each run covers 2 days. With every-other-day pulls this means no overlap and no
// gaps (assuming the cron is reliable). numOfDays=3 would create overlap; numOfDays=1
// would create gaps. 2 is the exact right value for a 48h cadence.
const NUM_OF_DAYS = 2;

// Behavioral alert thresholds — used only for latest.json, not stored in history
const THRESHOLDS = {
  rageClicks: 5,
  deadClicks: 8,
  scrollDepthLow: 0.40,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClarityRow {
  [key: string]: string | number;
}

interface ClarityMetric {
  metricName: string;
  information: ClarityRow[];
}

// The canonical shape of one page record in history.jsonl
interface PageRecord {
  type: 'page';
  windowEnd: string;
  windowDays: number;
  url: string;
  sessions: number | null;
  scrollDepthAvg: number | null;
  rageClicks: number | null;
  deadClicks: number | null;
  excessiveScroll: number | null;
  engagementTimeSec: number | null;
  raw: Record<string, number>; // all numeric values from API — safety net
}

interface SiteRecord {
  type: 'site';
  windowEnd: string;
  windowDays: number;
  totalSessions: number | null;
  deviceSplit: Record<string, number>;
}

type HistoryRecord = PageRecord | SiteRecord;

// ─── API fetch ────────────────────────────────────────────────────────────────

async function fetchMetrics(params: Record<string, string>): Promise<ClarityMetric[]> {
  const url = new URL(API_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${CLARITY_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Clarity API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<ClarityMetric[]>;
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

function extractNumericFields(row: ClarityRow, dimensionKey: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === dimensionKey) continue;
    const n = Number(v);
    if (!isNaN(n)) result[k] = n;
  }
  return result;
}

// Case-insensitive keyword search across all numeric field names.
// Returns the first field whose name contains ALL provided keywords.
function findByKeywords(fields: Record<string, number>, ...keywords: string[]): number | null {
  for (const key of Object.keys(fields)) {
    const lower = key.toLowerCase();
    if (keywords.every(kw => lower.includes(kw.toLowerCase()))) {
      return fields[key];
    }
  }
  return null;
}

// ─── Page metric parsing ──────────────────────────────────────────────────────

function parsePageRecords(rawMetrics: ClarityMetric[], windowEnd: string): PageRecord[] {
  // Merge all metric types into a per-URL map.
  // Key: url  Value: merged numeric fields from all metric types, prefixed by metricName
  // to avoid collisions, but also stored flat so findByKeywords can scan them.
  const urlMap = new Map<string, Record<string, number>>();

  for (const metric of rawMetrics) {
    const prefix = metric.metricName.replace(/\s+/g, '_');
    for (const row of metric.information) {
      const urlVal = String(row['URL'] ?? row['url'] ?? '').trim();
      if (!urlVal) continue;

      if (!urlMap.has(urlVal)) urlMap.set(urlVal, {});
      const merged = urlMap.get(urlVal)!;
      const nums = extractNumericFields(row, 'URL');

      for (const [k, v] of Object.entries(nums)) {
        // Store with prefix (avoids cross-metric collisions in raw output)
        merged[`${prefix}.${k}`] = v;
        // Store flat too (findByKeywords needs un-prefixed names for common fields)
        if (!(k in merged)) merged[k] = v;
      }
    }
  }

  return Array.from(urlMap.entries()).map(([url, fields]) => ({
    type: 'page' as const,
    windowEnd,
    windowDays: NUM_OF_DAYS,
    url,
    sessions: findByKeywords(fields, 'session'),
    scrollDepthAvg: findByKeywords(fields, 'scroll', 'depth') ?? findByKeywords(fields, 'scrolldepth'),
    rageClicks: findByKeywords(fields, 'rage') ?? findByKeywords(fields, 'rageclick'),
    deadClicks: findByKeywords(fields, 'dead') ?? findByKeywords(fields, 'deadclick'),
    excessiveScroll: findByKeywords(fields, 'excessive'),
    engagementTimeSec: findByKeywords(fields, 'engagement', 'time') ?? findByKeywords(fields, 'engagementtime'),
    raw: fields,
  }));
}

// ─── Device/site parsing ──────────────────────────────────────────────────────

function parseSiteRecord(rawMetrics: ClarityMetric[], windowEnd: string): SiteRecord {
  const split: Record<string, number> = {};
  let total = 0;

  for (const metric of rawMetrics) {
    if (!metric.metricName.toLowerCase().includes('traffic')) continue;
    for (const row of metric.information) {
      const device = String(row['Device'] ?? row['device'] ?? '').toLowerCase().trim();
      if (!device) continue;
      const sessions = Number(row['totalSessionCount'] ?? 0);
      split[device] = (split[device] ?? 0) + sessions;
      total += sessions;
    }
  }

  // Convert to proportions (0.0–1.0, rounded to 3dp)
  if (total > 0) {
    for (const k of Object.keys(split)) {
      split[k] = Math.round((split[k] / total) * 1000) / 1000;
    }
  }

  return {
    type: 'site',
    windowEnd,
    windowDays: NUM_OF_DAYS,
    totalSessions: total > 0 ? total : null,
    deviceSplit: split,
  };
}

// ─── Dedup: read existing windowEnd dates from history.jsonl ─────────────────

function loadRecordedDates(historyPath: string): Set<string> {
  if (!existsSync(historyPath)) return new Set();
  const dates = new Set<string>();
  const lines = readFileSync(historyPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const record = JSON.parse(trimmed) as { windowEnd?: string };
      if (record.windowEnd) dates.add(record.windowEnd);
    } catch {
      // malformed line — skip, do not corrupt the rest of the file
    }
  }
  return dates;
}

// ─── Append records to history.jsonl ─────────────────────────────────────────
// NEVER call writeFileSync on this path. appendFileSync only.

function appendRecords(historyPath: string, records: HistoryRecord[]): void {
  const lines = records.map(r => JSON.stringify(r)).join('\n') + '\n';
  appendFileSync(historyPath, lines, 'utf-8');
}

// ─── latest.json builder (for strategy.ts) ───────────────────────────────────

interface BehavioralAlert {
  url: string;
  issue: 'high-rage-clicks' | 'high-dead-clicks' | 'low-scroll-depth';
  value: number;
  note: string;
}

function buildAlerts(pages: PageRecord[]): BehavioralAlert[] {
  const alerts: BehavioralAlert[] = [];
  for (const p of pages) {
    if (p.rageClicks !== null && p.rageClicks >= THRESHOLDS.rageClicks) {
      alerts.push({
        url: p.url, issue: 'high-rage-clicks', value: p.rageClicks,
        note: `${p.rageClicks} rage clicks — likely broken element or misleading CTA`,
      });
    }
    if (p.deadClicks !== null && p.deadClicks >= THRESHOLDS.deadClicks) {
      alerts.push({
        url: p.url, issue: 'high-dead-clicks', value: p.deadClicks,
        note: `${p.deadClicks} dead clicks — users clicking non-interactive elements`,
      });
    }
    if (p.scrollDepthAvg !== null && p.scrollDepthAvg < THRESHOLDS.scrollDepthLow) {
      alerts.push({
        url: p.url, issue: 'low-scroll-depth', value: p.scrollDepthAvg,
        note: `${Math.round(p.scrollDepthAvg * 100)}% avg scroll depth — content below fold not seen`,
      });
    }
  }
  return alerts.sort((a, b) => {
    // Sort rage/dead by count desc, scroll-depth by value asc
    if (a.issue === 'low-scroll-depth' && b.issue !== 'low-scroll-depth') return 1;
    if (b.issue === 'low-scroll-depth' && a.issue !== 'low-scroll-depth') return -1;
    return b.value - a.value;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!CLARITY_TOKEN) {
    console.log('[clarity-history] CLARITY_TOKEN not set — skipping');
    process.exit(0);
  }

  const windowEnd = today(); // YYYY-MM-DD UTC
  const historyPath = resolve(ROOT, 'data/clarity/history.jsonl');

  // ── Dedup check ────────────────────────────────────────────────────────────
  const recorded = loadRecordedDates(historyPath);
  if (recorded.has(windowEnd)) {
    console.log(`[clarity-history] ${windowEnd} already in history.jsonl — skipping (dedup)`);
    process.exit(0);
  }

  console.log(`[clarity-history] Fetching data for window ending ${windowEnd} (${NUM_OF_DAYS} days)...`);

  // ── API calls (2 of 10 daily budget) ──────────────────────────────────────
  const pageRaw = await fetchMetrics({ numOfDays: String(NUM_OF_DAYS), dimension1: 'URL' });
  const deviceRaw = await fetchMetrics({ numOfDays: String(NUM_OF_DAYS), dimension1: 'Device' });

  // ── Parse ──────────────────────────────────────────────────────────────────
  const pageRecords = parsePageRecords(pageRaw, windowEnd)
    .sort((a, b) => (b.sessions ?? 0) - (a.sessions ?? 0));
  const siteRecord = parseSiteRecord(deviceRaw, windowEnd);

  const allRecords: HistoryRecord[] = [...pageRecords, siteRecord];

  // ── Append to history.jsonl (APPEND ONLY — never overwrite) ───────────────
  mkdirSync(resolve(ROOT, 'data/clarity'), { recursive: true });
  appendRecords(historyPath, allRecords);
  console.log(`[clarity-history] Appended ${pageRecords.length} page records + 1 site record to history.jsonl`);

  // ── Write latest.json for strategy.ts ─────────────────────────────────────
  const alerts = buildAlerts(pageRecords);
  const latestPayload = {
    pulledAt: new Date().toISOString(),
    windowEnd,
    numOfDays: NUM_OF_DAYS,
    pages: pageRecords.map(({ type: _t, windowEnd: _w, windowDays: _d, raw: _r, ...rest }) => rest),
    deviceSplit: siteRecord.deviceSplit,
    behavioralAlerts: alerts,
  };
  writeFileSync(resolve(ROOT, 'data/clarity/latest.json'), JSON.stringify(latestPayload, null, 2));

  // ── Archive raw API response (immutable record) ───────────────────────────
  archiveToRaw(ROOT, 'clarity', `${windowEnd}-raw.json`, JSON.stringify({ pageRaw, deviceRaw }, null, 2));

  // ── Wiki log ───────────────────────────────────────────────────────────────
  const alertSummary = alerts.length > 0
    ? alerts.slice(0, 5).map(a => `  - [${a.issue}] ${a.url}: ${a.note}`).join('\n')
    : '  (none above threshold)';

  appendWikiLog(ROOT,
    `## [${windowEnd}] clarity-history | Behavioral Data\n\n` +
    `- Window: ${NUM_OF_DAYS} days ending ${windowEnd}\n` +
    `- Pages recorded: ${pageRecords.length}\n` +
    `- Device split: ${JSON.stringify(siteRecord.deviceSplit)}\n` +
    `- Behavioral alerts: ${alerts.length}\n${alertSummary}\n` +
    `- history.jsonl total dates: ${recorded.size + 1}\n`
  );

  console.log(`[clarity-history] Done — ${pageRecords.length} pages, ${alerts.length} alert(s)`);
  if (alerts.length > 0) {
    console.log('Alerts:');
    for (const a of alerts) console.log(`  ${a.url}: ${a.note}`);
  }
}

main().catch(err => {
  console.error('[clarity-history]', err.message);
  process.exit(1);
});

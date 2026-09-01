/**
 * clarity-pull.ts — Monday agent
 * Pulls page-level behavioral metrics from the Clarity Data Export API.
 * Budget: 2 requests per run (API limit: 10/day).
 *   Request 1: dimension1=URL  → per-page behavioral metrics
 *   Request 2: dimension1=Device → site-wide device split
 * Writes data/clarity/latest.json + archives to raw/clarity/YYYY-MM-DD.json.
 */

import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { archiveToRaw, appendWikiLog, today } from './wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const CLARITY_TOKEN = process.env.CLARITY_TOKEN;
const API_BASE = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
const NUM_OF_DAYS = 3; // max window — most stable signal

// ─── Behavioral alert thresholds ─────────────────────────────────────────────
const THRESHOLDS = {
  rageClicks: 5,       // rage clicks on a single page = frustrated users
  deadClicks: 8,       // dead clicks = users clicking non-interactive elements
  scrollDepthLow: 0.4, // < 40% scroll = content below fold is invisible
};

interface ClarityRow {
  [key: string]: string | number;
}

interface ClarityMetric {
  metricName: string;
  information: ClarityRow[];
}

interface PageMetrics {
  url: string;
  sessions: number | null;
  scrollDepthAvg: number | null;
  engagementTimeSec: number | null;
  rageClicks: number | null;
  deadClicks: number | null;
  excessiveScroll: number | null;
  rawFields: Record<string, number>;
}

interface BehavioralAlert {
  url: string;
  issue: 'high-rage-clicks' | 'high-dead-clicks' | 'low-scroll-depth';
  value: number;
  note: string;
}

interface ClarityOutput {
  pulledAt: string;
  /**
   * REQUIRED by clarityLatestSchema — do not drop it again.
   *
   * `data/clarity/latest.json` has TWO writers: this script and
   * scripts/agents/clarity-history.ts (the one clarity-history.yml actually
   * runs). Until 2026-08-28 only the history writer emitted `windowEnd`, so any
   * manual `npm run agent:clarity` silently replaced a valid file with one that
   * FAILS ITS OWN CONTRACT — and strategy.ts reads this path through
   * clarityLatestSchema, so the next strategy run would have died on it.
   *
   * Found by running this script during a performance review. Two writers, one
   * contract, and only one of them satisfied it.
   */
  windowEnd: string;
  numOfDays: number;
  pages: PageMetrics[];
  deviceSplit: Record<string, number>;
  behavioralAlerts: BehavioralAlert[];
}

async function fetchMetrics(params: Record<string, string>): Promise<ClarityMetric[]> {
  const url = new URL(API_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${CLARITY_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Clarity API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<ClarityMetric[]>;
}

// Flatten a metric's information rows into a map of url → numeric values.
// Field name matching is case-insensitive and keyword-based since Clarity
// doesn't fully document all field names in the response.
function extractNumeric(row: ClarityRow, excludeKey: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === excludeKey) continue;
    const n = Number(v);
    if (!isNaN(n)) result[k] = n;
  }
  return result;
}

function findField(fields: Record<string, number>, ...keywords: string[]): number | null {
  for (const key of Object.keys(fields)) {
    const lower = key.toLowerCase();
    if (keywords.every(kw => lower.includes(kw.toLowerCase()))) {
      return fields[key];
    }
  }
  return null;
}

function parsePageMetrics(rawMetrics: ClarityMetric[]): PageMetrics[] {
  // Build a map: url → merged numeric fields from all metric types
  const pageMap = new Map<string, Record<string, number>>();

  for (const metric of rawMetrics) {
    for (const row of metric.information) {
      const urlValue = String(row['URL'] ?? row['url'] ?? row['Url'] ?? '').trim();
      if (!urlValue) continue;

      if (!pageMap.has(urlValue)) pageMap.set(urlValue, {});
      const merged = pageMap.get(urlValue)!;
      const nums = extractNumeric(row, 'Url');
      // Prefix with metricName to avoid key collisions across metric types
      const prefix = metric.metricName.replace(/\s+/g, '_');
      for (const [k, v] of Object.entries(nums)) {
        merged[`${prefix}.${k}`] = v;
        // Also store without prefix for easy keyword matching
        if (!(k in merged)) merged[k] = v;
      }
    }
  }

  return Array.from(pageMap.entries()).map(([url, fields]) => ({
    url,
    sessions: findField(fields, 'total', 'session') ?? findField(fields, 'session'),
    // API returns 0–100 percentage; normalize to 0.0–1.0
    scrollDepthAvg: (() => { const v = findField(fields, 'scroll', 'depth'); return v !== null ? Math.round(v) / 100 : null; })(),
    engagementTimeSec: findField(fields, 'engagement', 'activetime'),
    rageClicks: findField(fields, 'rage', 'subtotal'),
    deadClicks: findField(fields, 'dead', 'subtotal'),
    excessiveScroll: findField(fields, 'excessive', 'subtotal'),
    rawFields: fields,
  }));
}

function parseDeviceSplit(rawMetrics: ClarityMetric[]): Record<string, number> {
  const split: Record<string, number> = {};
  let total = 0;

  for (const metric of rawMetrics) {
    if (!metric.metricName.toLowerCase().includes('traffic')) continue;
    for (const row of metric.information) {
      const device = String(row['Device'] ?? row['device'] ?? '').toLowerCase();
      if (!device) continue;
      const sessions = Number(row['totalSessionCount'] ?? 0);
      split[device] = (split[device] ?? 0) + sessions;
      total += sessions;
    }
  }

  if (total > 0) {
    for (const k of Object.keys(split)) {
      split[k] = Math.round((split[k] / total) * 1000) / 1000;
    }
  }

  return split;
}

function buildAlerts(pages: PageMetrics[]): BehavioralAlert[] {
  const alerts: BehavioralAlert[] = [];
  for (const p of pages) {
    if (p.rageClicks !== null && p.rageClicks >= THRESHOLDS.rageClicks) {
      alerts.push({
        url: p.url,
        issue: 'high-rage-clicks',
        value: p.rageClicks,
        note: `${p.rageClicks} rage clicks — users repeatedly clicking; likely broken element or misleading CTA`,
      });
    }
    if (p.deadClicks !== null && p.deadClicks >= THRESHOLDS.deadClicks) {
      alerts.push({
        url: p.url,
        issue: 'high-dead-clicks',
        value: p.deadClicks,
        note: `${p.deadClicks} dead clicks — users clicking non-interactive elements; check CTA visibility`,
      });
    }
    if (p.scrollDepthAvg !== null && p.scrollDepthAvg < THRESHOLDS.scrollDepthLow) {
      alerts.push({
        url: p.url,
        issue: 'low-scroll-depth',
        value: p.scrollDepthAvg,
        note: `${Math.round(p.scrollDepthAvg * 100)}% avg scroll depth — most content below fold not seen`,
      });
    }
  }
  return alerts.sort((a, b) => b.value - a.value);
}

async function main() {
  if (!CLARITY_TOKEN) {
    console.error('[clarity-pull] CLARITY_TOKEN not set — skipping');
    process.exit(0);
  }

  console.log('[clarity-pull] Fetching page-level metrics (URL dimension)...');
  const pageRaw = await fetchMetrics({
    numOfDays: String(NUM_OF_DAYS),
    dimension1: 'URL',
  });

  console.log('[clarity-pull] Fetching device split...');
  const deviceRaw = await fetchMetrics({
    numOfDays: String(NUM_OF_DAYS),
    dimension1: 'Device',
  });

  const pages = parsePageMetrics(pageRaw);
  const deviceSplit = parseDeviceSplit(deviceRaw);
  const behavioralAlerts = buildAlerts(pages);

  const output: ClarityOutput = {
    pulledAt: new Date().toISOString(),
    // Same definition clarity-history.ts uses: the UTC date the window ends on.
    windowEnd: new Date().toISOString().slice(0, 10),
    numOfDays: NUM_OF_DAYS,
    pages: pages.sort((a, b) => (b.sessions ?? 0) - (a.sessions ?? 0)),
    deviceSplit,
    behavioralAlerts,
  };

  mkdirSync(resolve(ROOT, 'data/clarity'), { recursive: true });
  writeFileSync(resolve(ROOT, 'data/clarity/latest.json'), JSON.stringify(output, null, 2));

  archiveToRaw(ROOT, 'clarity', `${today()}-clarity.json`, JSON.stringify(output, null, 2));

  const alertSummary = behavioralAlerts.length > 0
    ? behavioralAlerts.map(a => `  - [${a.issue}] ${a.url}: ${a.note}`).join('\n')
    : '  (none)';

  appendWikiLog(ROOT,
    `## [${today()}] clarity-pull | Behavioral Data Pulled\n\n` +
    `- Pages with data: ${pages.length}\n` +
    `- Device split: ${JSON.stringify(deviceSplit)}\n` +
    `- Behavioral alerts: ${behavioralAlerts.length}\n${alertSummary}\n`
  );

  console.log(`[clarity-pull] Done — ${pages.length} pages, ${behavioralAlerts.length} alert(s)`);
  if (behavioralAlerts.length > 0) {
    console.log('Alerts:');
    for (const a of behavioralAlerts) console.log(`  ${a.url}: ${a.note}`);
  }
}

main().catch(err => {
  console.error('[clarity-pull]', err.message);
  process.exit(1);
});

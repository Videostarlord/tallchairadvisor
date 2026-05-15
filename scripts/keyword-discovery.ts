/**
 * keyword-discovery.ts
 * Phase 6 Keyword Discovery — Safety-first foundation script.
 *
 * Reads:  data/gsc/latest.json          (GSC seeds: impressions >= 20, position > 10)
 *         data/competitors/intelligence.json (competitor seeds via competitorKeywords field)
 * Calls:  DataForSEO Labs keyword_overview/live (sandbox by default)
 * Writes: wiki/log.md (run log only — opportunities.json written in Phase 7)
 *
 * Usage:
 *   DATAFORSEO_USERNAME=user DATAFORSEO_PASSWORD=pass npx tsx scripts/keyword-discovery.ts
 *   Set DATAFORSEO_SANDBOX=false to hit production API (costs money).
 */

import 'dotenv/config';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { appendWikiLog, today } from './agents/wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');  // scripts/ → tall-chair-advisor/ (one level up)

// ─── 1. Credential validation ─────────────────────────────────────────────────

const DATAFORSEO_USERNAME = process.env.DATAFORSEO_USERNAME;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

if (!DATAFORSEO_USERNAME || !DATAFORSEO_PASSWORD) {
  console.error('[keyword-discovery] ABORT: DATAFORSEO_USERNAME and DATAFORSEO_PASSWORD must be set in .env');
  process.exit(1);
}

// ─── 2. Sandbox/production toggle (default: sandbox) ─────────────────────────

const DATAFORSEO_BASE = process.env.DATAFORSEO_SANDBOX !== 'false'
  ? 'https://sandbox.dataforseo.com/v3'
  : 'https://api.dataforseo.com/v3';
const ENDPOINT = `${DATAFORSEO_BASE}/dataforseo_labs/google/keyword_overview/live`;

console.log(`[keyword-discovery] Mode: ${process.env.DATAFORSEO_SANDBOX !== 'false' ? 'SANDBOX' : 'PRODUCTION'}`);

// ─── 3. Cost constants ────────────────────────────────────────────────────────

const COST_PER_TASK = 0.0201;
const MAX_KEYWORDS_PER_TASK = 700;
const SPEND_LIMIT = 5.0;

// ─── 4. Types ─────────────────────────────────────────────────────────────────

interface QueryRow {
  query: string;
  impressions: number;
  position: number;
  clicks: number;
  ctr: number;
}

interface GscData {
  queries: QueryRow[];
  [key: string]: unknown;
}

interface DataForSEOResponse {
  status_code: number;
  result: Array<{
    keyword: string;
    keyword_data: {
      keyword_info: {
        search_volume: number;
        cpc: number;
        keyword_difficulty: number;
      };
      search_intent_info: {
        main_intent: string;
      };
    };
  }>;
}

// ─── 5. Normalization function ────────────────────────────────────────────────

function normalizeKeyword(kw: string): string {
  return kw.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// ─── 6. GSC seed extraction ───────────────────────────────────────────────────

const gscPath = resolve(ROOT, 'data/gsc/latest.json');
let gscSeeds: string[] = [];

if (existsSync(gscPath)) {
  const gscData = JSON.parse(readFileSync(gscPath, 'utf-8')) as GscData;
  gscSeeds = (gscData.queries ?? [])
    .filter((q) => q.impressions >= 20 && q.position > 10)
    .map((q) => normalizeKeyword(q.query))
    .filter(Boolean);
} else {
  console.warn('[keyword-discovery] WARNING: data/gsc/latest.json not found — no GSC seeds');
}

console.log(`[keyword-discovery] GSC seeds: ${gscSeeds.length}`);

// ─── 7. Competitor seed extraction (graceful degradation) ─────────────────────

const intelPath = resolve(ROOT, 'data/competitors/intelligence.json');
let competitorSeeds: string[] = [];

if (existsSync(intelPath)) {
  const intel = JSON.parse(readFileSync(intelPath, 'utf-8'));
  const rawCompetitorKeywords: Array<{ query: string }> = (intel as any).competitorKeywords ?? [];

  if (rawCompetitorKeywords.length === 0) {
    console.log('[keyword-discovery] WARNING: intelligence.json competitorKeywords is empty — using GSC-only seeds');
  } else {
    competitorSeeds = rawCompetitorKeywords
      .map((ck) => normalizeKeyword(ck.query))
      .filter(Boolean);
  }
} else {
  console.warn('[keyword-discovery] WARNING: data/competitors/intelligence.json not found — using GSC-only seeds');
}

console.log(`[keyword-discovery] Competitor seeds: ${competitorSeeds.length}`);

// ─── 8. Union dedup ───────────────────────────────────────────────────────────

const seeds = [...new Set([...gscSeeds, ...competitorSeeds])];
console.log(`[keyword-discovery] Deduped seed count: ${seeds.length}`);

// ─── 9. Pre-flight cost estimation (KWORD-08) ─────────────────────────────────

function estimateCost(count: number): number {
  return Math.ceil(count / MAX_KEYWORDS_PER_TASK) * COST_PER_TASK;
}

const estimated = estimateCost(seeds.length);
const taskCount = Math.ceil(seeds.length / MAX_KEYWORDS_PER_TASK);
console.log(`[keyword-discovery] Seeds: ${seeds.length} | Tasks: ${taskCount} | Estimated cost: $${estimated.toFixed(4)}`);

if (estimated > SPEND_LIMIT) {
  console.error(`[keyword-discovery] ABORT: estimated spend $${estimated.toFixed(4)} exceeds $${SPEND_LIMIT} limit`);
  process.exit(1);
}

// ─── 10. DataForSEO API call (INFRA-02) ───────────────────────────────────────

const authHeader = `Basic ${Buffer.from(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`).toString('base64')}`;

// Build task batches of max 700 keywords
const batches: string[][] = [];
for (let i = 0; i < seeds.length; i += MAX_KEYWORDS_PER_TASK) {
  batches.push(seeds.slice(i, i + MAX_KEYWORDS_PER_TASK));
}

console.log(`[keyword-discovery] Sending ${batches.length} batch(es) to DataForSEO...`);

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(
    batches.map((batch) => ({
      keywords: batch,
      language_name: 'English',
      location_name: 'United States',
    }))
  ),
});

if (!res.ok) {
  console.error(`[keyword-discovery] ABORT: DataForSEO API returned HTTP ${res.status} ${res.statusText}`);
  process.exit(1);
}

const json = (await res.json()) as unknown[];

// ─── 11. Structural validation ────────────────────────────────────────────────

function validateResponse(data: unknown[]): boolean {
  if (!Array.isArray(data)) return false;
  for (const task of data) {
    const t = task as any;
    if (typeof t.status_code !== 'number') return false;
    if (!Array.isArray(t.result)) return false;
    for (const item of t.result) {
      if (typeof item.keyword !== 'string') return false;
      if (!item.keyword_data?.keyword_info) return false;
    }
  }
  return true;
}

if (!validateResponse(json)) {
  console.error('[keyword-discovery] ABORT: DataForSEO response failed structural validation');
  process.exit(1);
}

const keywordsReturned = json.reduce((acc, t: any) => acc + (t.result?.length ?? 0), 0);
console.log('[keyword-discovery] Structural validation passed — sandbox returning valid dummy data');
console.log(`[keyword-discovery] Keywords returned: ${keywordsReturned}`);

// ─── 12. Wiki log entry ───────────────────────────────────────────────────────

appendWikiLog(ROOT, [
  `### ${today()} — keyword-discovery.ts run`,
  `- Seeds: GSC=${gscSeeds.length}, Competitor=${competitorSeeds.length}, Deduped=${seeds.length}`,
  `- Estimated cost: $${estimated.toFixed(4)} (${taskCount} task${taskCount !== 1 ? 's' : ''})`,
  `- Keywords returned from DataForSEO: ${keywordsReturned}`,
  `- Mode: ${process.env.DATAFORSEO_SANDBOX !== 'false' ? 'sandbox' : 'production'}`,
].join('\n'));

console.log('[keyword-discovery] Done — wiki log updated. Phase 7 will add filter/score/output pipeline.');

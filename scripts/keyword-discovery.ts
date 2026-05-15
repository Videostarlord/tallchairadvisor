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

// DataForSEO Labs keyword_overview/live — verified field paths (Phase 7)
// CRITICAL: keyword_difficulty is in keyword_properties, NOT keyword_info
// CRITICAL: intent is in search_intent_info, NOT keyword_info
interface DataForSEOItem {
  keyword: string;
  keyword_info: {
    search_volume: number | null;
    cpc: number | null;
  };
  keyword_properties: {
    keyword_difficulty: number | null;  // 0-100 scale
  };
  search_intent_info: {
    main_intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | null;
  };
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

const body = (await res.json()) as any;
const json: unknown[] = Array.isArray(body) ? body : (body?.tasks ?? []);

// ─── 11. Structural validation ────────────────────────────────────────────────

function validateResponse(data: unknown[]): boolean {
  if (!Array.isArray(data) || data.length === 0) return false;
  for (const task of data) {
    const t = task as any;
    if (typeof t.status_code !== 'number') return false;
    if (!Array.isArray(t.result)) return false;
    for (const resultRow of t.result) {
      if (!Array.isArray(resultRow.items)) return false;
      for (const item of resultRow.items) {
        if (typeof item.keyword !== 'string') return false;
        if (!item.keyword_info) return false;
      }
    }
  }
  return true;
}

if (!validateResponse(json)) {
  console.error('[keyword-discovery] ABORT: DataForSEO response failed structural validation');
  process.exit(1);
}

const keywordsReturned = json.reduce((acc, t: any) =>
  acc + (t.result ?? []).reduce((a: number, r: any) => a + (r.items?.length ?? 0), 0), 0);
console.log('[keyword-discovery] Structural validation passed — sandbox returning valid dummy data');
console.log(`[keyword-discovery] Keywords returned: ${keywordsReturned}`);

// ─── 12. Flatten response items ───────────────────────────────────────────────

const allItems: DataForSEOItem[] = [];
for (const task of json as any[]) {
  for (const resultRow of (task.result ?? [])) {
    for (const item of (resultRow.items ?? [])) {
      allItems.push(item as DataForSEOItem);
    }
  }
}
console.log(`[keyword-discovery] Total enriched keywords: ${allItems.length}`);

// Warn if KD or intent fields are null (sandbox may return incomplete dummy data)
const nullKdCount = allItems.filter((i) => i.keyword_properties?.keyword_difficulty == null).length;
const nullIntentCount = allItems.filter((i) => i.search_intent_info?.main_intent == null).length;
if (nullKdCount > 0) console.warn(`[keyword-discovery] WARNING: ${nullKdCount} items have null keyword_difficulty — treated as KD=0`);
if (nullIntentCount > 0) console.warn(`[keyword-discovery] WARNING: ${nullIntentCount} items have null main_intent — treated as non-navigational`);

// ─── 13. Filter (KWORD-04) ────────────────────────────────────────────────────

const filtered = allItems.filter((item) => {
  const kd = item.keyword_properties?.keyword_difficulty ?? 0;
  const vol = item.keyword_info?.search_volume ?? 0;
  const intent = item.search_intent_info?.main_intent;
  if (kd > 35) return false;
  if (vol < 50) return false;
  if (intent === 'navigational') return false;
  return true;
});
console.log(`[keyword-discovery] After filter: ${filtered.length} of ${allItems.length} keywords pass (KD ≤ 35, vol ≥ 50, non-navigational)`);

// ─── 14. Score (KWORD-04) ─────────────────────────────────────────────────────

// Height/size modifiers — checked against original keyword (pre-normalization preserves apostrophes)
const HEIGHT_MODIFIERS = ['tall', "6'", 'big and tall', 'large frame'];

interface ScoredItem {
  item: DataForSEOItem;
  score: number;
}

function scoreKeyword(item: DataForSEOItem): number {
  const intent = item.search_intent_info?.main_intent;
  const kd = item.keyword_properties?.keyword_difficulty ?? 0;
  const vol = item.keyword_info?.search_volume ?? 0;

  // Intent match (35%) — commercial/transactional=1.0, informational=0.5, other=0.0
  const intentScore = (intent === 'commercial' || intent === 'transactional') ? 1.0
    : intent === 'informational' ? 0.5
    : 0.0;

  // Feasibility (25%) — inverse KD on 0-35 scale
  const feasScore = (35 - kd) / 35;

  // Volume (25%) — log scale, capped at vol=10000 → score=1.0
  const volScore = Math.min(Math.log10(Math.max(vol, 1)) / Math.log10(10000), 1.0);

  // Audience qualifier (15%) — height/size modifier present in original keyword
  const kwOrig = item.keyword.toLowerCase();
  const qualScore = HEIGHT_MODIFIERS.some((m) => kwOrig.includes(m)) ? 1.0 : 0.0;

  return (intentScore * 0.35) + (feasScore * 0.25) + (volScore * 0.25) + (qualScore * 0.15);
}

const scored: ScoredItem[] = filtered
  .map((item) => ({ item, score: scoreKeyword(item) }))
  .sort((a, b) => b.score - a.score);

const top20 = scored.slice(0, 20);
console.log(`[keyword-discovery] Scored ${filtered.length} keywords — top ${top20.length} selected`);
if (top20.length > 0) {
  console.log(`[keyword-discovery] Top score: ${top20[0].score.toFixed(3)}, bottom of top-20: ${top20[top20.length - 1]?.score.toFixed(3)}`);
}

// ─── 15. Wiki log entry ───────────────────────────────────────────────────────

appendWikiLog(ROOT, [
  `### ${today()} — keyword-discovery.ts run`,
  `- Seeds: GSC=${gscSeeds.length}, Competitor=${competitorSeeds.length}, Deduped=${seeds.length}`,
  `- Estimated cost: $${estimated.toFixed(4)} (${taskCount} task${taskCount !== 1 ? 's' : ''})`,
  `- Keywords returned from DataForSEO: ${keywordsReturned}`,
  `- After filter: ${filtered.length} keywords pass (KD ≤ 35, vol ≥ 50, non-navigational)`,
  `- Top-20 selected from ${scored.length} scored keywords`,
  `- Mode: ${process.env.DATAFORSEO_SANDBOX !== 'false' ? 'sandbox' : 'production'}`,
].join('\n'));

console.log('[keyword-discovery] Done — filter/score pipeline complete. Plan 02 will add classification and output.');

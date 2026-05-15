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
import { appendWikiLog, writeWikiPage, readWikiPage, today } from './agents/wiki-utils.js';

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
  pageQueries: Array<{ query: string; page: string; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
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

// ─── 15. Load reference data for tca_status classification (KWORD-05) ──────

const gscLatest = JSON.parse(
  readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8')
) as GscData;

// Build normalized lookup sets from GSC queries array
const gscQuerySet = new Set(
  (gscLatest.queries ?? []).map((q) => normalizeKeyword(q.query))
);

// Build query → page mapping from pageQueries for target_slug on ranking keywords
const pageQueryMap = new Map<string, string>();
for (const pq of (gscLatest.pageQueries ?? [])) {
  pageQueryMap.set(normalizeKeyword(pq.query), pq.page);
}

// Build normalized keyword → slug mapping from content-roadmap.json
interface RoadmapEntry {
  keyword: string;
  slug: string;
  [key: string]: unknown;
}
const roadmap = JSON.parse(
  readFileSync(resolve(ROOT, 'data/content-roadmap.json'), 'utf-8')
) as RoadmapEntry[];

const roadmapKeywordMap = new Map<string, string>();
for (const entry of roadmap) {
  roadmapKeywordMap.set(normalizeKeyword(entry.keyword), entry.slug);
}

console.log(`[keyword-discovery] Reference data loaded — GSC queries: ${gscQuerySet.size}, roadmap entries: ${roadmap.length}`);

// ─── 16. Classify tca_status and build opportunities (KWORD-05, KWORD-06) ──

function classifyStatus(kw: string): { tca_status: 'ranking' | 'targeting' | 'gap'; target_slug: string } {
  const normalized = normalizeKeyword(kw);
  if (gscQuerySet.has(normalized)) {
    return {
      tca_status: 'ranking',
      target_slug: pageQueryMap.get(normalized) ?? '/unknown/',
    };
  }
  if (roadmapKeywordMap.has(normalized)) {
    return {
      tca_status: 'targeting',
      target_slug: roadmapKeywordMap.get(normalized)!,
    };
  }
  // Gap — derive suggested slug from normalized keyword
  const slug = '/' + normalized.replace(/\s+/g, '-') + '/';
  return { tca_status: 'gap', target_slug: slug };
}

function buildReason(item: DataForSEOItem, _score: number, status: string): string {
  const intent = item.search_intent_info?.main_intent ?? 'unknown';
  const kd = item.keyword_properties?.keyword_difficulty ?? 0;
  const vol = item.keyword_info?.search_volume ?? 0;
  const kwOrig = item.keyword.toLowerCase();
  const hasQ = HEIGHT_MODIFIERS.some((m) => kwOrig.includes(m));
  return [
    `${intent} intent, KD ${kd}, ${vol}/mo volume`,
    hasQ ? 'height modifier present (+15%)' : null,
    status === 'gap' ? 'no TCA page exists'
      : status === 'targeting' ? 'in content roadmap'
      : 'TCA currently ranking',
  ].filter(Boolean).join('; ');
}

interface KeywordOpportunity {
  keyword: string;
  search_volume: number;
  keyword_difficulty: number;
  cpc: number;
  intent: string;
  tca_status: 'gap' | 'targeting' | 'ranking';
  target_slug: string;
  reason: string;
  score: number;
  approved: false;
}

const opportunities: KeywordOpportunity[] = top20.map(({ item, score }) => {
  const { tca_status, target_slug } = classifyStatus(item.keyword);
  return {
    keyword: item.keyword,
    search_volume: item.keyword_info?.search_volume ?? 0,
    keyword_difficulty: item.keyword_properties?.keyword_difficulty ?? 0,
    cpc: item.keyword_info?.cpc ?? 0,
    intent: item.search_intent_info?.main_intent ?? 'unknown',
    tca_status,
    target_slug,
    reason: buildReason(item, score, tca_status),
    score: Math.round(score * 1000) / 1000,
    approved: false,
  };
});

const statusCounts = {
  gap: opportunities.filter((o) => o.tca_status === 'gap').length,
  targeting: opportunities.filter((o) => o.tca_status === 'targeting').length,
  ranking: opportunities.filter((o) => o.tca_status === 'ranking').length,
};
console.log(`[keyword-discovery] Classification: gap=${statusCounts.gap}, targeting=${statusCounts.targeting}, ranking=${statusCounts.ranking}`);

// ─── 17. Write opportunities.json (KWORD-06) ─────────────────────────────────

const outputDir = resolve(ROOT, 'data/keywords');
mkdirSync(outputDir, { recursive: true });

writeFileSync(
  resolve(outputDir, 'opportunities.json'),
  JSON.stringify(opportunities, null, 2),
);
console.log(`[keyword-discovery] Wrote ${opportunities.length} opportunities to data/keywords/opportunities.json`);

// ─── 18. Write wiki report and update wiki index (KWORD-07) ──────────────────

const wikiReport = `---
type: concept
last_updated: ${today()}
sources: [data/keywords/opportunities.json]
tags: [keywords, discovery, opportunities, monthly]
---

# Keyword Opportunities

**Last run:** ${today()}
**Opportunities surfaced:** ${opportunities.length}

## Top ${opportunities.length} Opportunities

| # | Keyword | Volume | KD | CPC | Intent | Status | Score |
|---|---------|--------|-----|-----|--------|--------|-------|
${opportunities.map((o, i) =>
  `| ${i + 1} | ${o.keyword} | ${o.search_volume} | ${o.keyword_difficulty} | $${o.cpc.toFixed(2)} | ${o.intent} | ${o.tca_status} | ${o.score.toFixed(3)} |`
).join('\n')}

## Summary

- **Gaps** (no TCA page): ${statusCounts.gap}
- **Targeting** (in roadmap): ${statusCounts.targeting}
- **Ranking** (in GSC): ${statusCounts.ranking}

Review \`data/keywords/opportunities.json\` and set \`"approved": true\` for entries to push to content roadmap.
Run \`npm run keywords:push\` after approving.
`;

writeWikiPage(ROOT, 'pages/concepts/keyword-opportunities.md', wikiReport);
console.log('[keyword-discovery] Wrote wiki/pages/concepts/keyword-opportunities.md');

// Update wiki/index.md — add [[keyword-opportunities]] to Concept Pages table if not present
const currentIndex = readWikiPage(ROOT, 'index.md');
if (currentIndex && !currentIndex.includes('[[keyword-opportunities]]')) {
  // Insert row into Concept Pages table after the [[gsc-performance]] row
  const newRow = `| [[keyword-opportunities]] | Monthly keyword discovery results. Top-20 scored gaps for Jackson to review and approve. |`;
  const updatedIndex = currentIndex.replace(
    /(\|\s*\[\[gsc-performance\]\].*\|)/,
    `$1\n${newRow}`
  );
  if (updatedIndex !== currentIndex) {
    writeWikiPage(ROOT, 'index.md', updatedIndex);
    console.log('[keyword-discovery] Updated wiki/index.md with [[keyword-opportunities]] entry');
  } else {
    // Fallback: log warning and append after last concept row
    console.warn('[keyword-discovery] WARNING: Could not find gsc-performance anchor in wiki/index.md — appending keyword-opportunities row manually');
    writeWikiPage(ROOT, 'index.md', currentIndex + `\n${newRow}\n`);
  }
} else if (currentIndex && currentIndex.includes('[[keyword-opportunities]]')) {
  console.log('[keyword-discovery] wiki/index.md already contains [[keyword-opportunities]] — no update needed');
}

// ─── 19. Wiki log entry ───────────────────────────────────────────────────────

appendWikiLog(ROOT, [
  `### ${today()} — keyword-discovery.ts run`,
  `- Seeds: GSC=${gscSeeds.length}, Competitor=${competitorSeeds.length}, Deduped=${seeds.length}`,
  `- Estimated cost: $${estimated.toFixed(4)} (${taskCount} task${taskCount !== 1 ? 's' : ''})`,
  `- Keywords returned from DataForSEO: ${keywordsReturned}`,
  `- After filter: ${filtered.length} keywords pass (KD ≤ 35, vol ≥ 50, non-navigational)`,
  `- Opportunities written: ${opportunities.length} (gap=${statusCounts.gap}, targeting=${statusCounts.targeting}, ranking=${statusCounts.ranking})`,
  `- Mode: ${process.env.DATAFORSEO_SANDBOX !== 'false' ? 'sandbox' : 'production'}`,
].join('\n'));

console.log('[keyword-discovery] Complete — opportunities.json and wiki report written.');

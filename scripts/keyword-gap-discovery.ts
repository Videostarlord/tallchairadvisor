/**
 * keyword-gap-discovery.ts
 *
 * Monthly competitor keyword-gap discovery.
 *
 * Reads:
 * - data/competitors/intelligence.json
 * - data/gsc/latest.json
 *
 * Calls:
 * - DataForSEO Labs ranked_keywords/live against competitor page URLs surfaced by
 *   the Monday SERP + Firecrawl workflow.
 *
 * Writes:
 * - data/keywords/raw/YYYY-MM-DDTHH-MM-SS-competitor-ranked-keywords.json
 * - data/keywords/true-gaps.json
 *
 * Notes:
 * - This is a sibling workflow to keyword-discovery.ts.
 * - It does not replace keyword-discovery.ts.
 * - It uses competitor page URLs, not competitor domains, to avoid pulling
 *   sitewide keywords from broad publishers like Forbes.
 * - It defaults to production mode because ranked_keywords/live page-target
 *   responses in DataForSEO sandbox are not reliable enough for monthly gap analysis.
 */

import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_LIMIT_PER_TARGET,
  DEFAULT_MAX_COMPETITOR_RANK,
  DEFAULT_MAX_TARGETS,
  buildGscRankingSet,
  buildRankedKeywordsTasks,
  buildTrueKeywordGaps,
  canonicalizeCompetitorUrl,
  extractCompetitorTargets,
  flattenRankedKeywordResponse,
} from './keyword-gap-discovery-logic.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DATAFORSEO_USERNAME = process.env.DATAFORSEO_USERNAME;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

if (!DATAFORSEO_USERNAME || !DATAFORSEO_PASSWORD) {
  console.error('[keyword-gap-discovery] ABORT: DATAFORSEO_USERNAME and DATAFORSEO_PASSWORD must be set in .env');
  process.exit(1);
}

const SANDBOX = process.env.DATAFORSEO_SANDBOX === 'true';
const DATAFORSEO_BASE = SANDBOX
  ? 'https://sandbox.dataforseo.com/v3'
  : 'https://api.dataforseo.com/v3';
const ENDPOINT = `${DATAFORSEO_BASE}/dataforseo_labs/google/ranked_keywords/live`;

const MAX_TARGETS = Number(process.env.DATAFORSEO_GAP_MAX_TARGETS ?? DEFAULT_MAX_TARGETS);
const LIMIT_PER_TARGET = Number(process.env.DATAFORSEO_GAP_LIMIT ?? DEFAULT_LIMIT_PER_TARGET);
const MAX_COMPETITOR_RANK = Number(process.env.DATAFORSEO_GAP_MAX_RANK ?? DEFAULT_MAX_COMPETITOR_RANK);
const ESTIMATED_COST_PER_TASK = Number(process.env.DATAFORSEO_GAP_ESTIMATED_COST_PER_TASK ?? 0.02);
const SPEND_LIMIT = Number(process.env.DATAFORSEO_GAP_SPEND_LIMIT ?? 5);

const intelligencePath = resolve(ROOT, 'data/competitors/intelligence.json');
const gscPath = resolve(ROOT, 'data/gsc/latest.json');

if (!existsSync(intelligencePath)) {
  console.error('[keyword-gap-discovery] ABORT: data/competitors/intelligence.json not found');
  process.exit(1);
}

if (!existsSync(gscPath)) {
  console.error('[keyword-gap-discovery] ABORT: data/gsc/latest.json not found');
  process.exit(1);
}

const intelligence = JSON.parse(readFileSync(intelligencePath, 'utf-8'));
const gscLatest = JSON.parse(readFileSync(gscPath, 'utf-8'));

const competitorTargets = extractCompetitorTargets(intelligence, MAX_TARGETS);
if (competitorTargets.length === 0) {
  console.error('[keyword-gap-discovery] ABORT: no competitor page targets found in intelligence.json');
  process.exit(1);
}

const estimatedSpend = competitorTargets.length * ESTIMATED_COST_PER_TASK;
console.log(`[keyword-gap-discovery] Mode: ${SANDBOX ? 'SANDBOX' : 'PRODUCTION'}`);
console.log(`[keyword-gap-discovery] Competitor targets: ${competitorTargets.length}`);
console.log(`[keyword-gap-discovery] Estimated spend: $${estimatedSpend.toFixed(4)}`);

if (estimatedSpend > SPEND_LIMIT) {
  console.error(
    `[keyword-gap-discovery] ABORT: estimated spend $${estimatedSpend.toFixed(4)} exceeds $${SPEND_LIMIT.toFixed(2)} limit`,
  );
  process.exit(1);
}

const tasks = buildRankedKeywordsTasks(
  competitorTargets,
  LIMIT_PER_TARGET,
  MAX_COMPETITOR_RANK,
);

const authHeader = `Basic ${Buffer.from(`${DATAFORSEO_USERNAME}:${DATAFORSEO_PASSWORD}`).toString('base64')}`;
const responses: any[] = [];
for (const task of tasks) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([task]),
  });

  if (!response.ok) {
    console.error(`[keyword-gap-discovery] ABORT: DataForSEO API returned HTTP ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const body = await response.json() as any;
  if (body?.status_code !== 20000) {
    console.error(`[keyword-gap-discovery] ABORT: DataForSEO top-level status ${body?.status_code} ${body?.status_message}`);
    process.exit(1);
  }

  responses.push(body);
}

const body = {
  generatedAt: new Date().toISOString(),
  endpoint: 'dataforseo_labs/google/ranked_keywords/live',
  responses_count: responses.length,
  tasks: responses.flatMap((response) => response?.tasks ?? []),
};

const rawDir = resolve(ROOT, 'data/keywords/raw');
mkdirSync(rawDir, { recursive: true });
const rawFilename = `${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}-competitor-ranked-keywords.json`;
const rawPath = resolve(rawDir, rawFilename);
writeFileSync(rawPath, JSON.stringify(body, null, 2));
console.log(`[keyword-gap-discovery] Saved raw response to data/keywords/raw/${rawFilename}`);

const allTasks = ((body?.tasks ?? []) as any[]);
const failedTasks = allTasks.filter((task) => task?.status_code !== 20000);
const successfulTasks = allTasks.filter((task) => task?.status_code === 20000);

if (failedTasks.length > 0) {
  const preview = failedTasks.slice(0, 3).map((task) =>
    `${task?.data?.target ?? 'unknown target'} → ${task?.status_code} ${task?.status_message}`,
  ).join(' | ');
  console.warn(`[keyword-gap-discovery] WARNING: ${failedTasks.length} task(s) failed. ${preview}`);
  if (SANDBOX) {
    console.warn('[keyword-gap-discovery] Sandbox is structural-only here. Use production mode for meaningful monthly runs.');
  }
}

if (successfulTasks.length === 0) {
  console.error('[keyword-gap-discovery] ABORT: DataForSEO returned zero successful tasks');
  process.exit(1);
}

const successfulBody = {
  ...body,
  tasks: successfulTasks,
};

const targetsByCanonicalUrl = new Map(
  competitorTargets.map((target) => [canonicalizeCompetitorUrl(target.target) ?? target.target, target]),
);

const rankedRows = flattenRankedKeywordResponse(successfulBody, targetsByCanonicalUrl);
const gscRankingSet = buildGscRankingSet(gscLatest);
const { gaps, stats } = buildTrueKeywordGaps(rankedRows, gscRankingSet);

const output = {
  generatedAt: new Date().toISOString(),
  mode: SANDBOX ? 'sandbox' : 'production',
  source: {
    intelligence_path: 'data/competitors/intelligence.json',
    gsc_path: 'data/gsc/latest.json',
    raw_dataforseo_path: `data/keywords/raw/${rawFilename}`,
    endpoint: 'dataforseo_labs/google/ranked_keywords/live',
  },
  settings: {
    max_targets: MAX_TARGETS,
    limit_per_target: LIMIT_PER_TARGET,
    max_competitor_rank: MAX_COMPETITOR_RANK,
  },
  summary: {
    competitor_targets_analyzed: competitorTargets.length,
    successful_tasks: successfulTasks.length,
    failed_tasks: failedTasks.length,
    gsc_queries_loaded: gscRankingSet.size,
    ranked_keyword_rows: stats.total_rows,
    filtered_already_ranking: stats.filtered_already_ranking,
    filtered_navigational: stats.filtered_navigational,
    filtered_zero_volume: stats.filtered_zero_volume,
    true_gap_keywords: stats.grouped_gap_count,
  },
  competitor_targets: competitorTargets,
  gaps,
};

const outputDir = resolve(ROOT, 'data/keywords');
mkdirSync(outputDir, { recursive: true });
const outputPath = resolve(outputDir, 'true-gaps.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`[keyword-gap-discovery] Ranked rows: ${stats.total_rows}`);
console.log(`[keyword-gap-discovery] Filtered already ranking: ${stats.filtered_already_ranking}`);
console.log(`[keyword-gap-discovery] True gaps: ${stats.grouped_gap_count}`);
console.log('[keyword-gap-discovery] Wrote data/keywords/true-gaps.json');

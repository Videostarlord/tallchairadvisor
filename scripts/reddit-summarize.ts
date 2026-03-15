/**
 * reddit-summarize.ts
 *
 * Reads normalized Reddit evidence for each chair, sends it to Claude,
 * validates the structured JSON output, and writes publishable insight files.
 *
 * Usage:
 *   npm run reddit:summarize [chairId|all]
 *
 * Examples:
 *   npm run reddit:summarize steelcase-gesture
 *   npm run reddit:summarize all
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { CHAIR_REGISTRY } from './chair-registry.js';
import type {
  ChairRedditInsights,
  ChairRegistryEntry,
  NormalizedRedditEvidence,
} from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MIN_ITEMS_THRESHOLD = 5;

function buildPrompt(chair: ChairRegistryEntry, evidence: NormalizedRedditEvidence): string {
  const topItems = evidence.items.slice(0, 60);

  const corpus = topItems
    .map((item, i) => {
      const prefix = item.type === 'post' ? `[POST ${i + 1}]` : `[COMMENT ${i + 1}]`;
      const ownerTag = item.ownerSignal ? ' [OWNER]' : '';
      const tallTag = item.tallUserSignal ? ' [TALL]' : '';
      const titleLine = item.title ? `Title: ${item.title}\n` : '';
      return [
        `${prefix}${ownerTag}${tallTag} r/${item.subreddit} score:${item.score}`,
        titleLine + `Body: ${item.body.slice(0, 500)}`,
        `Permalink: ${item.permalink}`,
      ].join('\n');
    })
    .join('\n\n---\n\n');

  return `You are a research analyst synthesizing Reddit owner reports about the ${chair.brand} ${chair.model} ergonomic chair, focused on tall users (6'0"+).

Below are ${topItems.length} Reddit posts and comments collected from ergonomics and office chair subreddits.
[OWNER] = first-hand ownership language detected.
[TALL] = height or tall-user fit signals detected.

CORPUS:
${corpus}

Produce a JSON object with EXACTLY this structure (raw JSON only — no markdown fences, no explanation):

{
  "corpusSummary": "<2-3 sentence overview of what the corpus covers and how representative it is>",
  "ownerReportCounts": {
    "confirmed": <integer: items with clear first-hand ownership language>,
    "likely": <integer: items with probable ownership but less explicit>
  },
  "topPositiveThemes": ["<theme 1>", "<theme 2>", "<theme 3>"],
  "topNegativeThemes": ["<theme 1>", "<theme 2>", "<theme 3>"],
  "tallUserFindings": [
    "<specific finding for tall users — reference dimensions where possible>",
    "<finding 2>",
    "<finding 3>"
  ],
  "comparisonPatterns": [
    "<how owners compare this chair to alternatives>",
    "<pattern 2>"
  ],
  "durabilityPatterns": [
    "<long-term ownership observation>",
    "<pattern 2>"
  ],
  "quoteCandidates": [
    {
      "text": "<exact or near-exact quote from corpus, max 150 chars>",
      "permalink": "<Reddit URL from corpus — must appear verbatim in the corpus above>",
      "author": "<author from corpus>",
      "score": <integer score from corpus>,
      "subreddit": "<subreddit name without r/ prefix>"
    }
  ],
  "faqAngles": ["<question real users ask, 1>", "<question 2>", "<question 3>"],
  "editorialWarnings": ["<anything flagged — astroturfing, extreme outlier, thin data, etc.>"],
  "pageSnippets": {
    "whatRedditOwnersLike": "<1-2 sentences suitable for publishing, framed as Reddit owner reports, no marketing language>",
    "commonComplaints": "<1-2 sentences suitable for publishing, framed as Reddit owner reports>",
    "tallUserNotes": "<1-2 sentences suitable for publishing, specific to tall users, reference seat dimensions if available>"
  }
}

Rules:
- quoteCandidates permalinks MUST appear verbatim in the corpus above — do not fabricate URLs
- tallUserFindings must reference specific dimensions (seat depth, back height, seat height) wherever the corpus supports it
- pageSnippets must be factual summaries of what Reddit owners report — not marketing copy
- If the corpus is too thin to support a field reliably, use an empty array [] or the string "Insufficient data"
- Return ONLY the raw JSON object, no other text`;
}

function validateInsights(
  data: unknown,
): data is Omit<ChairRedditInsights, 'chairId' | 'generatedAt'> {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d['corpusSummary'] === 'string' &&
    typeof d['ownerReportCounts'] === 'object' &&
    d['ownerReportCounts'] !== null &&
    Array.isArray(d['topPositiveThemes']) &&
    Array.isArray(d['topNegativeThemes']) &&
    Array.isArray(d['tallUserFindings']) &&
    Array.isArray(d['comparisonPatterns']) &&
    Array.isArray(d['durabilityPatterns']) &&
    Array.isArray(d['quoteCandidates']) &&
    Array.isArray(d['faqAngles']) &&
    Array.isArray(d['editorialWarnings']) &&
    typeof d['pageSnippets'] === 'object' &&
    d['pageSnippets'] !== null
  );
}

async function summarizeChair(
  chair: ChairRegistryEntry,
  anthropic: Anthropic,
  normalizedDir: string,
  llmDir: string,
  publishedDir: string,
): Promise<void> {
  console.log(`Summarizing ${chair.brand} ${chair.model}...`);

  const normalizedPath = path.join(normalizedDir, `${chair.chairId}.json`);
  if (!fs.existsSync(normalizedPath)) {
    console.warn(`  No normalized data at ${normalizedPath} — run reddit:normalize first`);
    return;
  }

  const evidence: NormalizedRedditEvidence = JSON.parse(
    fs.readFileSync(normalizedPath, 'utf8'),
  ) as NormalizedRedditEvidence;

  if (evidence.items.length < MIN_ITEMS_THRESHOLD) {
    console.warn(`  Only ${evidence.items.length} items — corpus too thin, skipping`);
    return;
  }

  console.log(`  Sending ${Math.min(evidence.items.length, 60)} items to Claude...`);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: buildPrompt(chair, evidence) }],
  });

  const rawText =
    message.content[0].type === 'text' ? message.content[0].text.trim() : '';

  fs.writeFileSync(
    path.join(llmDir, `${chair.chairId}.json`),
    JSON.stringify({ chairId: chair.chairId, generatedAt: new Date().toISOString(), rawText }, null, 2),
  );

  // Strip accidental markdown fences
  const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error(`  JSON parse failed for ${chair.chairId}:`, err);
    console.error(`  Check data/reddit/llm/${chair.chairId}.json for raw output`);
    return;
  }

  if (!validateInsights(parsed)) {
    console.error(
      `  Schema validation failed for ${chair.chairId} — check data/reddit/llm/${chair.chairId}.json`,
    );
    return;
  }

  const insights: ChairRedditInsights = {
    chairId: chair.chairId,
    generatedAt: new Date().toISOString(),
    ...parsed,
  };

  fs.writeFileSync(
    path.join(publishedDir, `${chair.chairId}.json`),
    JSON.stringify(insights, null, 2),
  );

  console.log(`  Saved → data/reddit/published/${chair.chairId}.json`);
  console.log(`  Positive: ${insights.topPositiveThemes.join(' | ')}`);
  console.log(`  Negative: ${insights.topNegativeThemes.join(' | ')}`);
  console.log(
    `  Quotes: ${insights.quoteCandidates.length} candidates, ${insights.tallUserFindings.length} tall-user findings`,
  );
}

async function main() {
  const chairIdArg = process.argv[2] ?? 'all';

  const chairs =
    chairIdArg === 'all'
      ? CHAIR_REGISTRY
      : CHAIR_REGISTRY.filter((c) => c.chairId === chairIdArg);

  if (chairs.length === 0) {
    console.error(`Unknown chairId: ${chairIdArg}`);
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey });

  const normalizedDir = path.join(ROOT, 'data', 'reddit', 'normalized');
  const llmDir = path.join(ROOT, 'data', 'reddit', 'llm');
  const publishedDir = path.join(ROOT, 'data', 'reddit', 'published');
  fs.mkdirSync(llmDir, { recursive: true });
  fs.mkdirSync(publishedDir, { recursive: true });

  for (const chair of chairs) {
    await summarizeChair(chair, anthropic, normalizedDir, llmDir, publishedDir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

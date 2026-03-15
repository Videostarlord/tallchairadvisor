/**
 * reddit-normalize.ts
 *
 * Reads all raw run datasets for a chair (or all chairs), filters low-signal
 * items, deduplicates, scores, and writes a normalized evidence file.
 *
 * Usage:
 *   npm run reddit:normalize [chairId|all]
 *
 * Examples:
 *   npm run reddit:normalize steelcase-gesture
 *   npm run reddit:normalize all
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAIR_REGISTRY } from './chair-registry.js';
import type { ChairRegistryEntry, NormalizedPost, NormalizedRedditEvidence } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TALL_SIGNALS =
  /\b(6'|6 foot|6ft|6-foot|tall|inseam|long leg|long thigh|femur|seat depth|lumbar|armrest|recline|shoulder|torso|height)\b/i;

const OWNER_SIGNALS =
  /\b(i (have|own|bought|use|sit|had|ordered|got|received)|my (chair|gesture|aeron|leap)|i've (been|had|used)|i (sit in|work in|use it|purchased)|been using|after (weeks|months|years) (of use|with))\b/i;

// Only accept results from chair-relevant subreddits
const ALLOWED_SUBREDDITS = new Set([
  'officechairs',
  'ergonomics',
  'homeoffice',
  'workfromhome',
  'buildapc',
  'pcmasterrace',
  'battlestations',
  'sysadmin',
  'cscareerquestions',
  'frugal',
  'buyitforlife',
  'personalfinance',
  'malelivingspace',
  'femalelivingspace',
  'interiordesign',
  'gaming',
  'mechanicalkeyboards',
]);

function textOf(item: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof item['title'] === 'string') parts.push(item['title']);
  if (typeof item['body'] === 'string') parts.push(item['body']);
  if (typeof item['text'] === 'string') parts.push(item['text']);
  if (typeof item['selftext'] === 'string') parts.push(item['selftext']);
  return parts.join(' ').trim();
}

function scoreRelevance(item: Record<string, unknown>, aliases: string[]): number {
  const text = textOf(item).toLowerCase();
  let score = 0;

  for (const alias of aliases) {
    const escaped = alias.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`).test(text)) score += 10;
  }

  if (TALL_SIGNALS.test(text)) score += 5;
  if (OWNER_SIGNALS.test(text)) score += 8;

  const redditScore = Number(item['score'] ?? 0);
  if (redditScore > 0) score += Math.min(Math.log10(redditScore + 1) * 3, 10);

  return score;
}

function normalizeItem(
  item: Record<string, unknown>,
  chair: ChairRegistryEntry,
): NormalizedPost | null {
  const text = textOf(item);
  if (!text || text.length < 30) return null;

  const dataType = String(item['dataType'] ?? item['kind'] ?? '');
  const isComment = dataType === 'comment' || dataType === 't1';

  const rawPermalink = String(item['permalink'] ?? item['url'] ?? '');
  if (!rawPermalink) return null;

  const permalink = rawPermalink.startsWith('http')
    ? rawPermalink
    : `https://www.reddit.com${rawPermalink}`;

  const relevanceScore = scoreRelevance(item, chair.aliases);
  if (relevanceScore < 5) return null;

  const subreddit = String(
    item['communityName'] ?? item['parsedCommunityName'] ?? item['community'] ?? item['subreddit'] ?? '',
  ).replace(/^r\//, '').toLowerCase();

  // Hard filter 1: subreddit must be in the allowlist
  if (!ALLOWED_SUBREDDITS.has(subreddit)) return null;

  // Hard filter 2: at least one multi-word alias must appear in the text
  const textLower = text.toLowerCase();
  const hasAliasMatch = chair.aliases.some((alias) => {
    const escaped = alias.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`).test(textLower);
  });
  if (!hasAliasMatch) return null;

  return {
    id: String(item['id'] ?? rawPermalink),
    type: isComment ? 'comment' : 'post',
    title: !isComment ? (item['title'] as string | undefined) : undefined,
    body: text.slice(0, 2000),
    permalink,
    subreddit,
    author: String(item['username'] ?? item['author'] ?? '[deleted]'),
    score: Number(item['score'] ?? 0),
    createdAt: String(item['parsedCreatedAt'] ?? item['createdAt'] ?? item['created_utc'] ?? ''),
    relevanceScore,
    ownerSignal: OWNER_SIGNALS.test(text),
    tallUserSignal: TALL_SIGNALS.test(text),
    chairId: chair.chairId,
  };
}

function dedupeByPermalink(items: NormalizedPost[]): NormalizedPost[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.permalink)) return false;
    seen.add(item.permalink);
    return true;
  });
}

function loadRawDatasets(chairId: string): Record<string, unknown>[] {
  const rawDir = path.join(ROOT, 'data', 'reddit', 'raw', chairId);
  if (!fs.existsSync(rawDir)) return [];

  const runs = fs
    .readdirSync(rawDir)
    .filter((d) => fs.statSync(path.join(rawDir, d)).isDirectory());

  const allItems: Record<string, unknown>[] = [];
  for (const run of runs) {
    const datasetPath = path.join(rawDir, run, 'dataset.json');
    if (!fs.existsSync(datasetPath)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(datasetPath, 'utf8')) as unknown;
      if (Array.isArray(parsed)) {
        allItems.push(...(parsed as Record<string, unknown>[]));
      }
    } catch {
      console.warn(`  Could not parse ${datasetPath}`);
    }
  }

  return allItems;
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

  const normalizedDir = path.join(ROOT, 'data', 'reddit', 'normalized');
  fs.mkdirSync(normalizedDir, { recursive: true });

  for (const chair of chairs) {
    console.log(`Normalizing ${chair.brand} ${chair.model}...`);

    const rawItems = loadRawDatasets(chair.chairId);
    console.log(`  Loaded ${rawItems.length} raw items across all runs`);

    const normalized = rawItems
      .map((item) => normalizeItem(item, chair))
      .filter((item): item is NormalizedPost => item !== null);

    const deduped = dedupeByPermalink(normalized);
    const sorted = deduped.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const evidence: NormalizedRedditEvidence = {
      chairId: chair.chairId,
      normalizedAt: new Date().toISOString(),
      postCount: sorted.filter((i) => i.type === 'post').length,
      commentCount: sorted.filter((i) => i.type === 'comment').length,
      items: sorted,
    };

    const outPath = path.join(normalizedDir, `${chair.chairId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2));
    console.log(
      `  Saved ${sorted.length} items (${evidence.postCount} posts, ${evidence.commentCount} comments) → data/reddit/normalized/${chair.chairId}.json`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

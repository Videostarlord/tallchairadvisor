/**
 * reddit-fetch.ts
 *
 * Calls the Apify trudax/reddit-scraper-lite actor and saves raw results locally.
 *
 * Usage:
 *   npm run reddit:fetch <chairId> [search|thread-expansion] [url1,url2,...]
 *
 * Examples:
 *   npm run reddit:fetch steelcase-gesture
 *   npm run reddit:fetch steelcase-gesture search
 *   npm run reddit:fetch steelcase-gesture thread-expansion https://reddit.com/r/officechairs/comments/abc123/...
 *   npm run reddit:fetch all
 */

import { ApifyClient } from 'apify-client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { CHAIR_REGISTRY } from './chair-registry.js';
import type { ApifyRedditLiteInput, ChairRegistryEntry, RunManifest } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// trudax/reddit-scraper-lite actor ID
const ACTOR_ID = 'trudax/reddit-scraper-lite';

const SHARED_DEFAULTS: Partial<ApifyRedditLiteInput> = {
  includeNSFW: false,
  debugMode: false,
  maxCommunitiesCount: 0,
  maxUserCount: 0,
  scrollTimeout: 40,
  proxy: { useApifyProxy: true },
};

function buildSearchInput(chair: ChairRegistryEntry, community?: string): ApifyRedditLiteInput {
  return {
    ...SHARED_DEFAULTS,
    searches: [...chair.searches, ...chair.comparisonSearches],
    ...(community ? { searchCommunityName: community } : {}),
    searchPosts: true,
    searchComments: false,
    searchCommunities: false,
    searchUsers: false,
    skipComments: true,
    skipUserPosts: true,
    skipCommunity: true,
    sort: 'relevance',
    time: 'all',
    postDateLimit: chair.postDateLimitDefault,
    maxItems: 100,
    maxPostCount: 100,
    maxComments: 0,
  };
}

// Subreddits most likely to have high-quality chair owner discussions
const CHAIR_COMMUNITIES = ['officechairs', 'Ergonomics', 'homeoffice', 'WorkFromHome'];

function buildThreadExpansionInput(
  startUrls: string[],
  chair: ChairRegistryEntry,
): ApifyRedditLiteInput {
  return {
    ...SHARED_DEFAULTS,
    startUrls: startUrls.map((url) => ({ url })),
    ignoreStartUrls: false,
    skipComments: false,
    skipUserPosts: true,
    skipCommunity: true,
    searchPosts: false,
    searchComments: false,
    searchCommunities: false,
    searchUsers: false,
    commentDateLimit: chair.commentDateLimitDefault,
    maxItems: 500,
    maxPostCount: 0,
    maxComments: 50,
  };
}

async function fetchForChair(
  chair: ChairRegistryEntry,
  runType: 'search' | 'thread-expansion',
  startUrls: string[],
  client: ApifyClient,
  community?: string,
): Promise<void> {
  const input =
    runType === 'thread-expansion'
      ? buildThreadExpansionInput(startUrls, chair)
      : buildSearchInput(chair, community);

  const runStamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(ROOT, 'data', 'reddit', 'raw', chair.chairId, runStamp);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, 'input.json'), JSON.stringify(input, null, 2));
  console.log(`[${chair.chairId}] Saved input → data/reddit/raw/${chair.chairId}/${runStamp}/input.json`);
  console.log(`[${chair.chairId}] Starting Apify ${runType} run...`);

  const startedAt = new Date().toISOString();
  const apifyRun = await client.actor(ACTOR_ID).call(input as Record<string, unknown>, {
    memory: 512,
    timeout: 300,
  });
  const finishedAt = new Date().toISOString();

  console.log(`[${chair.chairId}] Run ${apifyRun.id} finished — status: ${apifyRun.status}`);

  const datasetResult = await client
    .dataset(apifyRun.defaultDatasetId)
    .listItems({ limit: 1000 });
  const items = datasetResult.items;

  fs.writeFileSync(path.join(outDir, 'dataset.json'), JSON.stringify(items, null, 2));

  const manifest: RunManifest = {
    runId: `${chair.chairId}-${runStamp}`,
    chairId: chair.chairId,
    runType,
    runStamp,
    apifyRunId: apifyRun.id,
    defaultDatasetId: apifyRun.defaultDatasetId,
    itemCount: items.length,
    inputSummary: {
      searches: (input as ApifyRedditLiteInput).searches,
      startUrls: (input as ApifyRedditLiteInput).startUrls?.map((u) => u.url),
      sort: (input as ApifyRedditLiteInput).sort,
      time: (input as ApifyRedditLiteInput).time,
    },
    startedAt,
    finishedAt,
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(
    `[${chair.chairId}] Saved ${items.length} items → data/reddit/raw/${chair.chairId}/${runStamp}/`,
  );
}

async function main() {
  const chairIdArg = process.argv[2];
  const runType = (process.argv[3] ?? 'search') as 'search' | 'thread-expansion';
  const startUrlsArg = process.argv[4];

  if (!chairIdArg) {
    console.error(
      'Usage: npm run reddit:fetch <chairId|all> [search|thread-expansion] [url1,url2,...]',
    );
    console.error(`Valid chairIds: ${CHAIR_REGISTRY.map((c) => c.chairId).join(', ')}`);
    process.exit(1);
  }

  const chairs =
    chairIdArg === 'all'
      ? CHAIR_REGISTRY
      : CHAIR_REGISTRY.filter((c) => c.chairId === chairIdArg);

  if (chairs.length === 0) {
    console.error(
      `Unknown chairId: ${chairIdArg}. Valid IDs: ${CHAIR_REGISTRY.map((c) => c.chairId).join(', ')}`,
    );
    process.exit(1);
  }

  if (runType === 'thread-expansion' && !startUrlsArg) {
    console.error('thread-expansion requires comma-separated URLs as the third argument');
    process.exit(1);
  }

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.error('APIFY_TOKEN environment variable is required');
    process.exit(1);
  }

  const startUrls = startUrlsArg ? startUrlsArg.split(',').map((u) => u.trim()) : [];
  const client = new ApifyClient({ token });

  for (const chair of chairs) {
    if (runType === 'thread-expansion') {
      await fetchForChair(chair, runType, startUrls, client);
    } else {
      // Run one scoped search per community for better signal quality
      for (const community of CHAIR_COMMUNITIES) {
        console.log(`\n[${chair.chairId}] Fetching r/${community}...`);
        await fetchForChair(chair, runType, startUrls, client, community);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * roadmap-sync.ts — auto-populate content-roadmap.json from keyword gaps
 * Reads data/keywords/true-gaps.json (competitor keyword gaps), groups by topic cluster,
 * and promotes top-N new page opportunities into data/content-roadmap.json.
 * Never overwrites existing roadmap items (deduplication by slug).
 * Run after keyword discovery: npm run roadmap:sync
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface GapKeyword {
  keyword: string;
  search_volume: number;
  keyword_difficulty: number;
  intent: string;
  tca_status: string;
  best_competitor_rank: number;
  score: number;
  competitors: Array<{ domain: string; page_url: string; page_title: string }>;
}

interface RoadmapItem {
  title: string;
  keyword: string;
  slug: string;
  priority: number;
  status: string;
  notes: string;
  addedDate: string;
  source: string;
}

function getExistingSlugs(root: string): Set<string> {
  const pagesDir = resolve(root, 'src/pages');
  const slugs = new Set<string>();

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.astro')) {
        const rel = full.slice(pagesDir.length + 1).replace(/\.astro$/, '').replace(/\/index$/, '');
        slugs.add('/' + rel + '/');
      }
    }
  }

  walk(pagesDir);
  return slugs;
}

function topicCluster(keyword: string): string {
  const k = keyword.toLowerCase();
  if (k.includes('big and tall') || k.includes('big & tall')) return 'big-and-tall';
  if (k.includes('heavy') || k.includes('bariatric')) return 'heavy-duty';
  if (k.includes('lumbar') || k.includes('back pain') || k.includes('lower back')) return 'back-pain';
  if (k.includes('neck') || k.includes('headrest')) return 'neck-headrest';
  if (k.includes('armrest') || k.includes('wrist') || k.includes('elbow')) return 'armrest-wrist';
  if (k.includes('standing desk') || k.includes('stand up desk')) return 'standing-desk';
  if (k.includes('gaming') || k.includes('game')) return 'gaming-chair';
  if (k.includes('budget') || k.includes('under $') || k.includes('cheap') || k.includes('affordable')) return 'budget';
  if (k.includes('wide') || k.includes('seat width')) return 'wide-seat';
  if (k.includes('sihoo') || k.includes('doro')) return 'sihoo';
  if (k.includes('haworth') || k.includes('fern')) return 'haworth';
  if (k.includes('humanscale') || k.includes('freedom')) return 'humanscale';
  return 'general-tall';
}

const CLUSTER_PAGES: Record<string, { title: string; slug: string; notes: string }> = {
  'big-and-tall': {
    title: 'Best Big and Tall Office Chairs (Tall People Guide)',
    slug: '/best-big-and-tall-office-chairs/',
    notes: 'Research-voice. Targets 3,600+ searches/mo for "big and tall" chair variants. Separate from tall-only — addresses weight capacity + wide seat + height dimensions as three distinct requirements. TCA differentiation: height-specific fit analysis that big-and-tall retailers skip. Amazon affiliate links required.',
  },
  'back-pain': {
    title: 'Best Office Chair for Lower Back Pain (Tall People)',
    slug: '/office-chair-lower-back-pain-tall-people/',
    notes: 'Research + Jackson personal experience (constant lower back aches before Gesture). Targets high-intent pain queries. Lumbar height + seat height interaction is the tall-user-specific angle. Gesture first-person voice allowed for personal pain narrative.',
  },
  'armrest-wrist': {
    title: 'Wrist Pain from Office Chair — Armrest Height Guide (Tall People)',
    slug: '/wrist-pain-armrest-height/',
    notes: 'Research-voice for all chair specs. Tall users suffer wrist pain when armrests sit too low relative to desk height. Cover armrest-to-desk height relationship, 90-degree elbow rule with height-specific measurements, and which chairs (Gesture 360 armrests, Leap Plus, Aeron) have the adjustability range to serve 6\'2\"+ users. Jackson ME background supports biomechanics framing.',
  },
  'standing-desk': {
    title: 'Standing Desk Height for Tall People',
    slug: '/standing-desk-height-tall-people/',
    notes: 'Zero competition per keyword analysis. Workstation Setup pillar. ME background useful for desk ergonomics. Cover ideal monitor height, keyboard tray height, anti-fatigue mat thickness for 6\'+. No personal testing claim needed for desk hardware.',
  },
  'budget': {
    title: 'Best Office Chairs Under $500 for Tall People',
    slug: '/best-office-chairs-under-500/',
    notes: 'Budget segment. Research-voice only — no personal testing claim needed. Target: people who can\'t afford Gesture/Aeron but are 6\'+. Must be honest about limitations. Sihoo Doro S300 is the main recommendation.',
  },
  'sihoo': {
    title: 'Sihoo Doro S300 Review for Tall People',
    slug: '/review/sihoo-doro-s300/',
    notes: 'Rising in AI citations. Research-based voice only — Jackson has NOT personally tested this chair. Spec-first analysis: seat height range, back height, lumbar position. Rising popularity among tall users on r/ergonomics.',
  },
  'wide-seat': {
    title: 'Wide Seat Office Chairs for Tall People',
    slug: '/wide-seat-office-chairs-tall-people/',
    notes: 'Research-voice. Targets users who are both tall and broad-shouldered. Seat width + seat depth interaction. Covers which chairs have 20\"+ seat width with tall-user seat height range.',
  },
};

function today(): string {
  return new Date().toISOString().split('T')[0];
}

async function main() {
  const trueGapsPath = resolve(ROOT, 'data/keywords/true-gaps.json');
  const roadmapPath = resolve(ROOT, 'data/content-roadmap.json');

  if (!existsSync(trueGapsPath)) {
    console.log('[roadmap-sync] No true-gaps.json found — run keyword:gaps first. Exiting.');
    process.exit(0);
  }

  const trueGaps = JSON.parse(readFileSync(trueGapsPath, 'utf-8'));
  const gaps: GapKeyword[] = trueGaps.gaps ?? [];

  if (gaps.length === 0) {
    console.log('[roadmap-sync] No keyword gaps found. Exiting.');
    process.exit(0);
  }

  // Load existing roadmap
  const existingRoadmap: RoadmapItem[] = existsSync(roadmapPath)
    ? JSON.parse(readFileSync(roadmapPath, 'utf-8'))
    : [];
  const existingRoadmapSlugs = new Set(existingRoadmap.map(r => r.slug));

  // Load existing page slugs
  const existingPageSlugs = getExistingSlugs(ROOT);

  // Load failed content slugs
  const failedPath = resolve(ROOT, 'data/content-failed.json');
  const failedSlugs: Set<string> = existsSync(failedPath)
    ? new Set(Object.keys(JSON.parse(readFileSync(failedPath, 'utf-8'))))
    : new Set();

  // Group gaps by cluster
  const clusterCounts = new Map<string, number>();
  for (const gap of gaps) {
    const cluster = topicCluster(gap.keyword);
    clusterCounts.set(cluster, (clusterCounts.get(cluster) ?? 0) + gap.search_volume);
  }

  // Sort clusters by total search volume
  const sortedClusters = [...clusterCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cluster]) => cluster);

  let nextPriority = Math.max(0, ...existingRoadmap.map(r => r.priority)) + 1;
  const injected: string[] = [];

  for (const cluster of sortedClusters) {
    const pageSpec = CLUSTER_PAGES[cluster];
    if (!pageSpec) continue;
    if (existingRoadmapSlugs.has(pageSpec.slug)) continue;
    if (existingPageSlugs.has(pageSpec.slug)) continue;
    if (failedSlugs.has(pageSpec.slug)) continue;

    // Find the best keyword for this cluster
    const clusterGaps = gaps
      .filter(g => topicCluster(g.keyword) === cluster)
      .sort((a, b) => b.score - a.score);
    if (clusterGaps.length === 0) continue;

    const bestKeyword = clusterGaps[0];

    existingRoadmap.push({
      title: pageSpec.title,
      keyword: bestKeyword.keyword,
      slug: pageSpec.slug,
      priority: nextPriority++,
      status: 'pending',
      notes: pageSpec.notes,
      addedDate: today(),
      source: `roadmap-sync:${today()} — ${clusterGaps.length} gap keywords, top: ${bestKeyword.keyword} (${bestKeyword.search_volume}/mo, score ${bestKeyword.score.toFixed(3)})`,
    });

    injected.push(pageSpec.slug);
    console.log(`[roadmap-sync] Added: ${pageSpec.slug} (cluster: ${cluster}, volume: ${clusterGaps.reduce((s, g) => s + g.search_volume, 0)}/mo)`);
  }

  if (injected.length === 0) {
    console.log('[roadmap-sync] No new items to add — roadmap is already up to date.');
  } else {
    writeFileSync(roadmapPath, JSON.stringify(existingRoadmap, null, 2));
    console.log(`[roadmap-sync] Wrote ${injected.length} new items to content-roadmap.json`);
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });

// scripts/keywords-push.ts
// Usage: npx tsx scripts/keywords-push.ts (or npm run keywords:push)
//
// Reads data/keywords/opportunities.json, flushes entries marked approved: true
// (and lacking pushed_at) into data/content-roadmap.json via atomic write,
// deduplicates on target_slug + keyword, stamps pushed_at on flushed entries,
// and logs each step.

import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { appendWikiLog, today } from './agents/wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Opportunity {
  keyword: string;
  search_volume: number;
  keyword_difficulty: number;
  cpc: number;
  intent: string;
  tca_status: 'gap' | 'targeting' | 'ranking';
  target_slug: string;
  reason: string;
  score: number;
  approved: boolean;
  pushed_at?: string;
}

interface RoadmapEntry {
  title: string;
  keyword: string;
  slug: string;
  priority: number;
  status: string;
  notes: string;
  addedDate: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTitleCase(s: string): string {
  return s.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── 1. Load opportunities.json ───────────────────────────────────────────────

const oppPath = resolve(ROOT, 'data/keywords/opportunities.json');

if (!existsSync(oppPath)) {
  console.error('[keywords-push] ABORT: data/keywords/opportunities.json not found');
  process.exit(1);
}

const opportunities: Opportunity[] = JSON.parse(readFileSync(oppPath, 'utf-8'));

// ─── 2. Find approved, not-yet-pushed entries ─────────────────────────────────

const toProcess = opportunities.filter((o) => o.approved === true && !o.pushed_at);

console.log(
  `[keywords-push] opportunities.json: ${opportunities.length} total, ${toProcess.length} approved+unpushed`
);

if (toProcess.length === 0) {
  console.log('[keywords-push] Nothing to push. Set "approved": true in data/keywords/opportunities.json and re-run.');
  console.log('[keywords-push] Tip: if you already set approved: true but see 0 here, check that the field is a boolean true, not the string "true".');
  process.exit(0);
}

// ─── 3. Load content-roadmap.json ─────────────────────────────────────────────

const roadmapPath = resolve(ROOT, 'data/content-roadmap.json');
const roadmap: RoadmapEntry[] = existsSync(roadmapPath)
  ? JSON.parse(readFileSync(roadmapPath, 'utf-8'))
  : [];

// ─── 4. Dedup: composite key slug::keyword ────────────────────────────────────
// Note: opportunities.json uses target_slug; content-roadmap.json uses slug —
// the field names differ but represent the same value; map explicitly.

const existingKeys = new Set(roadmap.map((e) => `${e.slug}::${e.keyword}`));
const newEntries = toProcess.filter(
  (o) => !existingKeys.has(`${o.target_slug}::${o.keyword}`)
);

const skippedCount = toProcess.length - newEntries.length;
console.log(
  `[keywords-push] After dedup: ${newEntries.length} new entries (${skippedCount} already in roadmap)`
);

if (newEntries.length === 0) {
  console.log('[keywords-push] All approved entries are already in the roadmap. Nothing to push.');
  process.exit(0);
}

// ─── 5. Build new roadmap entries ─────────────────────────────────────────────

const maxPriority =
  roadmap.length > 0 ? Math.max(...roadmap.map((e) => e.priority)) : 0;

const pushedAt = new Date().toISOString();
const pushedKeywords = new Set<string>();

const built: RoadmapEntry[] = newEntries.map((opp, i) => {
  pushedKeywords.add(opp.keyword);
  return {
    title: toTitleCase(opp.keyword),
    keyword: opp.keyword,
    slug: opp.target_slug,
    priority: maxPriority + i + 1,
    status: 'pending',
    notes: opp.reason,
    addedDate: today(),
  };
});

// ─── 6. Atomic write: content-roadmap.json ────────────────────────────────────
// Write to .tmp in same directory (guarantees same filesystem — renameSync is POSIX atomic).
// NEVER write tmp to /tmp/ — renameSync across filesystems throws EXDEV.

const merged = [...roadmap, ...built];
const roadmapTmp = roadmapPath + '.tmp';
writeFileSync(roadmapTmp, JSON.stringify(merged, null, 2));
renameSync(roadmapTmp, roadmapPath);

console.log(
  `[keywords-push] Wrote ${merged.length} entries to content-roadmap.json (${built.length} new)`
);

// ─── 7. Stamp pushed_at on opportunities.json ─────────────────────────────────
// Re-map original array — only entries in pushedKeywords get the stamp.
// Preserves existing pushed_at values on entries from prior push runs.

const updatedOpps = opportunities.map((opp) => {
  if (opp.approved === true && !opp.pushed_at && pushedKeywords.has(opp.keyword)) {
    return { ...opp, pushed_at: pushedAt };
  }
  return opp;
});

const oppTmp = oppPath + '.tmp';
writeFileSync(oppTmp, JSON.stringify(updatedOpps, null, 2));
renameSync(oppTmp, oppPath);

console.log(
  `[keywords-push] Stamped pushed_at on ${pushedKeywords.size} entries in opportunities.json`
);

// ─── 8. Wiki log ──────────────────────────────────────────────────────────────

appendWikiLog(
  ROOT,
  [
    `### ${today()} — keywords-push run`,
    `- Approved+unpushed: ${toProcess.length}, deduplicated out: ${skippedCount}`,
    `- Pushed to content-roadmap.json: ${built.length}`,
    `- Keywords pushed: ${[...pushedKeywords].join(', ') || 'none'}`,
  ].join('\n')
);

console.log('[keywords-push] Complete.');

/**
 * wiki-utils.ts — Shared utilities for wiki read/write operations
 *
 * The wiki lives at wiki/ inside the repo root (tall-chair-advisor/wiki/).
 * The raw archive lives at raw/ inside the repo root (tall-chair-advisor/raw/).
 * All .astro source files stay in src/pages/ — this module never touches those paths.
 * Astro only builds from src/ so wiki/ and raw/ don't interfere with the site build.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, appendFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';

// tall-chair-advisor/ repo root
export function getRepoRoot(metaUrl: string): string {
  const __dirname = dirname(new URL(metaUrl).pathname);
  return resolve(__dirname, '../..');
}

export function getWikiRoot(repoRoot: string): string {
  return resolve(repoRoot, 'wiki');
}

export function getRawRoot(repoRoot: string): string {
  return resolve(repoRoot, 'raw');
}

/** Read a wiki page by relative path (e.g. 'pages/concepts/gsc-performance.md') */
export function readWikiPage(repoRoot: string, relativePath: string): string | null {
  const fullPath = resolve(getWikiRoot(repoRoot), relativePath);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, 'utf-8');
}

/** Read the wiki index to find relevant pages */
export function readWikiIndex(repoRoot: string): string | null {
  return readWikiPage(repoRoot, 'index.md');
}

/** Read multiple wiki pages, returning a map of path → content */
export function readWikiPages(repoRoot: string, relativePaths: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const p of relativePaths) {
    const content = readWikiPage(repoRoot, p);
    if (content) result[p] = content;
  }
  return result;
}

/** Write/overwrite a wiki page */
export function writeWikiPage(repoRoot: string, relativePath: string, content: string): void {
  const fullPath = resolve(getWikiRoot(repoRoot), relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

/** Append an entry to wiki/log.md */
export function appendWikiLog(repoRoot: string, entry: string): void {
  const logPath = resolve(getWikiRoot(repoRoot), 'log.md');
  if (!existsSync(logPath)) {
    writeFileSync(logPath, `---\ntype: log\n---\n\n# Wiki Log\n\n---\n\n${entry}\n`);
    return;
  }
  const current = readFileSync(logPath, 'utf-8');
  // Insert after the "---" separator line (after the header)
  const marker = '\n---\n';
  const lastMarkerIdx = current.indexOf(marker);
  if (lastMarkerIdx >= 0) {
    const before = current.slice(0, lastMarkerIdx + marker.length);
    const after = current.slice(lastMarkerIdx + marker.length);
    writeFileSync(logPath, `${before}\n${entry}\n${after}`);
  } else {
    writeFileSync(logPath, `${current}\n\n${entry}\n`);
  }
}

/** Archive a file to raw/ (copies it, doesn't move) */
export function archiveToRaw(repoRoot: string, subDir: string, fileName: string, content: string): void {
  const rawDir = resolve(getRawRoot(repoRoot), subDir);
  mkdirSync(rawDir, { recursive: true });
  writeFileSync(resolve(rawDir, fileName), content);
}

/** Archive a JSON file to raw/ */
export function archiveJsonToRaw(repoRoot: string, subDir: string, fileName: string, data: unknown): void {
  archiveToRaw(repoRoot, subDir, fileName, JSON.stringify(data, null, 2));
}

/** Get today's date as YYYY-MM-DD */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** Get current ISO week number as YYYY-WNN */
export function currentWeek(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/** Read all synthesis pages for agent context */
export function readSynthesisContext(repoRoot: string): string {
  const pages = readWikiPages(repoRoot, [
    'synthesis/what-works.md',
    'synthesis/what-failed.md',
    'synthesis/thesis.md',
    'synthesis/decisions-log.md',
  ]);
  return Object.entries(pages)
    .map(([path, content]) => `--- ${path} ---\n${content.slice(0, 1500)}`)
    .join('\n\n');
}

/** Read key concept pages for agent context */
export function readConceptContext(repoRoot: string, concepts: string[]): string {
  const paths = concepts.map(c => `pages/concepts/${c}.md`);
  const pages = readWikiPages(repoRoot, paths);
  return Object.entries(pages)
    .map(([path, content]) => `--- ${path} ---\n${content.slice(0, 1000)}`)
    .join('\n\n');
}

/** Append a token-usage entry to data/token-log.jsonl */
export function logCacheUsage(
  agent: string,
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number | null | undefined;
    cache_read_input_tokens: number | null | undefined;
  },
  root: string
): void {
  const dir = resolve(root, 'data');
  mkdirSync(dir, { recursive: true });
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    agent,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cache_creation: usage.cache_creation_input_tokens ?? 0,
    cache_read: usage.cache_read_input_tokens ?? 0,
  });
  appendFileSync(resolve(dir, 'token-log.jsonl'), entry + '\n');
}

// ─── Attribution logging ──────────────────────────────────────────────────────

export type FixType = 'meta' | 'title' | 'meta+title' | 'complex' | 'rewrite';

export interface InterventionEntry {
  interventionType: FixType;
  page: string;          // e.g. "src/pages/review/gesture.astro"
  slug: string;          // e.g. "/review/gesture/"
  appliedDate: string;   // ISO date "2026-05-15"
  targetMetric: 'ctr' | 'position' | 'impressions';
  beforeMetric: number;
  afterMetric: number | null;
  deltaPercent: number | null;
  confidenceLevel: 'none' | 'low' | 'medium' | 'high';
  description: string;
  reconciledAt: string | null;
}

/** Append one intervention entry to data/interventions.jsonl (append-only, never overwritten) */
export function appendIntervention(
  repoRoot: string,
  entry: Omit<InterventionEntry, 'afterMetric' | 'deltaPercent' | 'confidenceLevel' | 'reconciledAt'>
): void {
  const dir = resolve(repoRoot, 'data');
  mkdirSync(dir, { recursive: true });
  const full: InterventionEntry = {
    ...entry,
    afterMetric: null,
    deltaPercent: null,
    confidenceLevel: 'none',
    reconciledAt: null,
  };
  appendFileSync(resolve(dir, 'interventions.jsonl'), JSON.stringify(full) + '\n');
}

// ─── Reconciliation & outcome loading ────────────────────────────────────────

/** Deterministic confidence scorer — no LLM, pure arithmetic */
function assignConfidence(
  daysSinceApplied: number,
  deltaPercent: number | null,
  beforeMetric: number
): InterventionEntry['confidenceLevel'] {
  if (daysSinceApplied < 14) return 'none';
  if (daysSinceApplied < 28) return 'low';
  if (beforeMetric === 0) return 'low';
  const absDelta = Math.abs(deltaPercent ?? 0);
  if (absDelta < 5) return 'low';
  if (absDelta >= 20) return 'high';
  return 'medium';
}

/**
 * Reconcile unresolved intervention entries against GSC history snapshots.
 * Reads data/interventions.jsonl, enriches entries older than 14 days that
 * have reconciledAt=null, and rewrites the file.
 * IMMUTABILITY: entries where reconciledAt !== null are NEVER modified.
 */
export function reconcileInterventions(repoRoot: string): void {
  const filePath = resolve(repoRoot, 'data/interventions.jsonl');
  if (!existsSync(filePath)) return;

  const historyDir = resolve(repoRoot, 'data/gsc/history');
  const historyFiles = existsSync(historyDir)
    ? readdirSync(historyDir).filter(f => f.endsWith('.json')).sort()
    : [];

  const lines = readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
  const updated = lines.map(line => {
    const entry: InterventionEntry = JSON.parse(line);
    // IMMUTABILITY: already reconciled entries are NEVER touched
    if (entry.reconciledAt !== null) return line;

    const daysSince = Math.floor(
      (Date.now() - new Date(entry.appliedDate).getTime()) / 86400000
    );
    if (daysSince < 14) return line;  // too early

    // Find the history snapshot closest to (appliedDate + 14 days)
    const targetDate = new Date(new Date(entry.appliedDate).getTime() + 14 * 86400000)
      .toISOString().split('T')[0];
    const candidate = historyFiles.find(f => f.replace('.json', '') >= targetDate)
      ?? historyFiles[historyFiles.length - 1];
    if (!candidate) return line;

    let snapshot: Map<string, { ctr: number; position: number; impressions: number }>;
    try {
      const raw = JSON.parse(readFileSync(resolve(historyDir, candidate), 'utf-8'));
      snapshot = new Map((raw.pages ?? []).map((p: any) => [
        p.page,
        { ctr: p.ctr ?? 0, position: p.position ?? 99, impressions: p.impressions ?? 0 }
      ]));
    } catch {
      return line;
    }

    // Dual-key lookup: try slug, then full URL
    const fullUrl = 'https://tallchairadvisor.com' + entry.slug;
    const snap = snapshot.get(entry.slug) ?? snapshot.get(fullUrl);
    if (!snap) return line;

    const afterMetric =
      entry.targetMetric === 'ctr' ? snap.ctr :
      entry.targetMetric === 'impressions' ? snap.impressions :
      snap.position;

    const deltaPercent = entry.beforeMetric === 0
      ? null
      : Math.round(((afterMetric - entry.beforeMetric) / Math.abs(entry.beforeMetric)) * 1000) / 10;

    const enriched: InterventionEntry = {
      ...entry,
      afterMetric,
      deltaPercent,
      confidenceLevel: assignConfidence(daysSince, deltaPercent, entry.beforeMetric),
      reconciledAt: today(),
    };
    return JSON.stringify(enriched);
  });

  writeFileSync(filePath, updated.join('\n') + '\n');
}

/**
 * Load intervention entries applied within the last `lookbackDays` days.
 * Returns [] if interventions.jsonl does not exist (no throw).
 */
export function loadRecentOutcomes(repoRoot: string, lookbackDays = 90): InterventionEntry[] {
  const filePath = resolve(repoRoot, 'data/interventions.jsonl');
  if (!existsSync(filePath)) return [];
  const cutoff = Date.now() - lookbackDays * 86400000;
  return readFileSync(filePath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(l => JSON.parse(l) as InterventionEntry)
    .filter(e => new Date(e.appliedDate).getTime() >= cutoff);
}

/**
 * Format reconciled intervention entries as a structured table for LLM prompts.
 * Sign convention: negative deltaPercent on position = improvement (lower is better).
 */
export function formatOutcomesForPrompt(entries: InterventionEntry[]): string {
  if (entries.length === 0) return '(no outcome data yet)';
  return entries.map(e => {
    const delta = e.deltaPercent !== null
      ? `${e.deltaPercent > 0 ? '+' : ''}${e.deltaPercent}%`
      : 'pending';
    const after = e.afterMetric !== null ? e.afterMetric : '?';
    return `${e.appliedDate} | ${e.interventionType} | ${e.slug} | ${e.targetMetric}: ${e.beforeMetric} → ${after} (${delta}) | confidence: ${e.confidenceLevel}`;
  }).join('\n');
}

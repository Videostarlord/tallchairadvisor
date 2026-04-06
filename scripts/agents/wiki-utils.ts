/**
 * wiki-utils.ts — Shared utilities for wiki read/write operations
 *
 * The wiki lives at wiki/ inside the repo root (tall-chair-advisor/wiki/).
 * The raw archive lives at raw/ inside the repo root (tall-chair-advisor/raw/).
 * All .astro source files stay in src/pages/ — this module never touches those paths.
 * Astro only builds from src/ so wiki/ and raw/ don't interfere with the site build.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
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

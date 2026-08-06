/**
 * probes/inventory.ts — which URLs are pages, and which are not.
 *
 * PRD §7.5.1: "Exclude redirect sources via isRedirectSource() — auditing a 301
 * source as a page is the exact bug that produced the C-1 false positive."
 * On 2026-08-05 the audit agent fetched /best-office-chairs/ with a redirect-following
 * fetch(), compared /office-chairs-for-tall-people/ to itself, and reported a CRITICAL
 * duplicate-content crisis. Everything downstream believed it.
 *
 * Two exclusion classes, kept distinct because they mean different things:
 *   - `redirect-source`  — not a page at all. Never browsed.
 *   - `noindex`          — a real page Google is told to ignore: astro.config.mjs's
 *                          `sitemapExcludedPaths`, or a live `<meta name="robots">`
 *                          carrying noindex. Not audited as an indexable page.
 *
 * Source of truth for the indexable set is the LIVE sitemap, because that is the file
 * the sitemap `filter()` in astro.config.mjs actually produced — reading the config
 * would be re-deriving what the deploy already decided. Filesystem enumeration is the
 * fallback for when the sitemap cannot be fetched, and it applies `sitemapExcludedPaths`
 * parsed textually from the config (textually, so this file never imports astro).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { globSync } from 'glob';
import { withTrailingSlash } from '../redirect-map.js';

export const PRODUCTION_ORIGIN = 'https://tallchairadvisor.com';

/** '/review/gesture' | 'https://host/review/gesture/?x=1' → '/review/gesture/'. */
export function normalizePath(url: string): string {
  const stripped = url.trim().replace(/^https?:\/\/[^/]+/i, '');
  const path = (stripped === '' ? '/' : stripped).split(/[?#]/)[0];
  if (path === '/') return '/';
  return withTrailingSlash(path.startsWith('/') ? path : `/${path}`);
}

/** Parse `sitemapExcludedPaths` out of astro.config.mjs without importing astro. */
export function parseSitemapExcludedPaths(configSource: string): Set<string> {
  const block = configSource.match(/sitemapExcludedPaths\s*=\s*new Set\(\s*\[([\s\S]*?)\]\s*\)/);
  if (block === null) return new Set();
  const out = new Set<string>();
  for (const m of block[1].matchAll(/['"`]([^'"`]+)['"`]/g)) out.add(normalizePath(m[1]));
  return out;
}

/** Extract <loc> paths from a urlset or sitemapindex document. */
export function parseSitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
}

/** src/pages/**\/*.astro → route paths. Mirrors Astro's file-based routing. */
export function routeFromPageFile(relPath: string): string | null {
  const withoutExt = relPath.replace(/\.astro$/i, '');
  if (withoutExt === '404') return null;                    // never in the sitemap
  if (/(^|\/)_/.test(withoutExt)) return null;              // _private routes
  if (/\[/.test(withoutExt)) return null;                   // dynamic routes need params
  const route = withoutExt.replace(/(^|\/)index$/, '$1');
  return normalizePath(`/${route}`);
}

export interface Inventory {
  /** Indexable page paths, sorted, trailing-slashed. */
  urls: string[];
  /** How the list was obtained — printed in the run summary so it is never a mystery. */
  source: 'sitemap' | 'filesystem';
  /** Non-fatal notes (e.g. sitemap fetch failed and why). */
  notes: string[];
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TCA-godseye-probe/1.0)' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * Fetch sitemap-index.xml, follow child sitemaps, return paths.
 * Paths only — a preview deploy's sitemap still carries production origins, and the
 * probe must be able to run the same inventory against `--base <preview>`.
 */
export async function fetchSitemapUrls(baseOrigin: string, timeoutMs = 20_000): Promise<string[]> {
  const index = await fetchText(`${baseOrigin.replace(/\/$/, '')}/sitemap-index.xml`, timeoutMs);
  const locs = parseSitemapLocs(index);
  const children = locs.filter((l) => /sitemap[^/]*\.xml$/i.test(l));
  const pages: string[] = [];

  if (children.length === 0) {
    pages.push(...locs);
  } else {
    for (const child of children) {
      // Re-host onto the base being probed so a preview deploy is read from itself.
      const childUrl = `${baseOrigin.replace(/\/$/, '')}${normalizePath(child).replace(/\/$/, '')}`;
      const xml = await fetchText(childUrl.endsWith('.xml') ? childUrl : child, timeoutMs);
      pages.push(...parseSitemapLocs(xml));
    }
  }
  return [...new Set(pages.map(normalizePath))].sort();
}

export function filesystemUrls(repoRoot: string): { urls: string[]; excluded: Set<string> } {
  const files = globSync('**/*.astro', { cwd: resolve(repoRoot, 'src/pages') }).sort();
  let excluded = new Set<string>();
  try {
    excluded = parseSitemapExcludedPaths(readFileSync(resolve(repoRoot, 'astro.config.mjs'), 'utf-8'));
  } catch {
    // Config unreadable: fall through with an empty exclusion set. The caller records
    // this as a note; the live `<meta name="robots">` check still catches noindex pages.
  }
  const urls = files
    .map(routeFromPageFile)
    .filter((r): r is string => r !== null)
    .filter((r) => !excluded.has(r));
  return { urls: [...new Set(urls)].sort(), excluded };
}

export async function buildInventory(repoRoot: string, baseOrigin: string): Promise<Inventory> {
  const notes: string[] = [];
  try {
    const urls = await fetchSitemapUrls(baseOrigin);
    if (urls.length === 0) throw new Error('sitemap contained zero <loc> entries');
    return { urls, source: 'sitemap', notes };
  } catch (error) {
    notes.push(`sitemap inventory unavailable (${(error as Error).message}) — fell back to src/pages enumeration`);
    const { urls, excluded } = filesystemUrls(repoRoot);
    if (excluded.size === 0) notes.push('astro.config.mjs sitemapExcludedPaths could not be parsed — noindex pages are filtered only by live <meta name="robots">');
    return { urls, source: 'filesystem', notes };
  }
}

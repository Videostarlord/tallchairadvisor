/**
 * redirect-map.ts — shared parser for public/_redirects
 *
 * WHY THIS IS SHARED: on 2026-08-05 the Tuesday audit agent reported a
 * "CRITICAL canonical/duplicate content crisis" between /best-office-chairs/
 * and /office-chairs-for-tall-people/. The first is not a page — it is a 301
 * redirect to the second. The audit fetched it with default `fetch()`, which
 * follows redirects silently, so it compared the destination page to itself
 * and found "identical" titles and canonicals. The Wednesday strategy agent
 * then planned a NEW page at the redirect source, which would have collided
 * with the redirect rule and undone the 2026-07-04 consolidation. The Friday
 * agent would have executed it.
 *
 * Any agent that reasons about a URL must know whether that URL is a redirect
 * source. Logic previously duplicated in gsc-analyze.ts lives here now.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

export function withTrailingSlash(path: string): string {
  return /\.[a-z]{2,4}$/.test(path) ? path : path.endsWith('/') ? path : path + '/';
}

/**
 * Parse public/_redirects into source → target. Only simple path→path rules;
 * domain-level, splat and placeholder rules are skipped, as are trailing-slash
 * normalizers (source === target after normalization).
 */
export function loadRedirectMap(root: string): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const raw = readFileSync(resolve(root, 'public/_redirects'), 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [source, target] = trimmed.split(/\s+/);
      if (!source || !target) continue;
      if (/[*:]/.test(source) || /[*:]/.test(target)) continue;
      if (/^https?:/i.test(source) || /^https?:/i.test(target)) continue;
      if (!source.startsWith('/') || !target.startsWith('/')) continue;
      const s = withTrailingSlash(source);
      const t = withTrailingSlash(target);
      if (s === t) continue;
      map.set(s, t);
    }
  } catch {
    // No _redirects file (or unreadable) — empty map, callers degrade gracefully
  }
  return map;
}

/** Follow a redirect chain to its final live target (loop-guarded). */
export function resolveRedirect(map: Map<string, string>, path: string): string {
  let current = path;
  const seen = new Set<string>();
  while (map.has(current) && !seen.has(current)) {
    seen.add(current);
    current = map.get(current)!;
  }
  return current;
}

/**
 * True if `path` is the SOURCE of a redirect — i.e. not a real page.
 * Never audit one for meta/duplicate issues, and never plan new content at one.
 * Accepts with or without a trailing slash.
 */
export function isRedirectSource(map: Map<string, string>, path: string): boolean {
  return map.has(withTrailingSlash(path));
}

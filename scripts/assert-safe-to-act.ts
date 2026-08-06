/**
 * assert-safe-to-act.ts — deterministic preflight for every write to src/pages/
 *
 * WHY THIS EXISTS
 * Three incidents shipped bad content to a live money site, all the same shape:
 * an agent asserted a fact it could have computed.
 *
 *   2026-07-04  8 invented ASINs reached production
 *   2026-07-20  2 more invented ASINs on /aeron-size-c-vs-leap-plus/, undetected 2 weeks
 *   2026-08-05  a NEW page was planned at /best-office-chairs/ — a 301 redirect source —
 *               which would have undone the 2026-07-04 consolidation
 *
 * WHY AT THE EXECUTOR, NOT UPSTREAM
 * Upstream gates can always be routed around by a path added later. Proven twice:
 * strategy.ts's `injectMandatoryRoadmapItems` appends tasks AFTER
 * `enforcePlanConstraints` runs, and execute-content.ts's roadmap fallback
 * (~:671) bypasses strategy entirely — and fires precisely when strategy dropped
 * every NEW task. Guarding upstream is an optimization; this file is the guarantee.
 *
 * CONTRACT
 * Pure, deterministic, offline. No network (Amazon bot-blocks CI), no LLM.
 * Never throws — returns a verdict so callers keep the log-and-continue pattern
 * both executors already use.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { loadRedirectMap, isRedirectSource, resolveRedirect, withTrailingSlash } from './redirect-map.js';

export type Action =
  | { kind: 'create'; slug: string; content?: string }
  | { kind: 'edit'; filePath: string; content?: string };

export interface Verdict {
  safe: boolean;
  /** Human-readable rejection reason, suitable for a task summary line. */
  reason?: string;
}

const ASIN_LINK_PATTERN = /\/dp\/([A-Z0-9]{10})/g;

/** src/pages/review/gesture.astro -> /review/gesture/ */
export function filePathToSlug(filePath: string): string {
  const stripped = filePath.replace(/^src\/pages\//, '').replace(/\.astro$/, '').replace(/\/index$/, '');
  return stripped === 'index' || stripped === '' ? '/' : `/${stripped}/`;
}

/** /review/gesture/ -> src/pages/review/gesture.astro (mirrors execute-content.ts:643-644) */
export function slugToFilePath(slug: string): string {
  const parts = slug.replace(/^\/|\/$/g, '').split('/');
  return `src/pages/${parts.join('/')}.astro`;
}

interface AsinRegistry {
  asins: Record<string, unknown>;
  known_dead: Record<string, string>;
}

function loadAsinRegistry(root: string): AsinRegistry | null {
  try {
    return JSON.parse(readFileSync(resolve(root, 'data/verified-asins.json'), 'utf-8')) as AsinRegistry;
  } catch {
    return null;
  }
}

/**
 * Check every /dp/<ASIN> link in generated content against data/verified-asins.json.
 *
 * lint-content.mjs already enforces this, but only at the Saturday deploy gate —
 * two days after the write, and it fails the WHOLE deploy rather than the one
 * bad task. Checking here rejects just the offending page, on the day it is written.
 */
function checkAsins(root: string, content: string): Verdict {
  const registry = loadAsinRegistry(root);
  if (!registry) {
    // Registry unreadable: do not silently allow unverified ASINs through.
    return content.includes('/dp/')
      ? { safe: false, reason: 'ASIN registry data/verified-asins.json is unreadable and the content contains /dp/ links — refusing to write unverifiable affiliate links' }
      : { safe: true };
  }

  const verified = new Set(Object.keys(registry.asins ?? {}));
  const dead = registry.known_dead ?? {};
  const seen = new Set<string>();

  ASIN_LINK_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ASIN_LINK_PATTERN.exec(content)) !== null) {
    const asin = match[1];
    if (seen.has(asin)) continue;
    seen.add(asin);

    if (dead[asin]) {
      return { safe: false, reason: `DEAD ASIN ${asin}: ${dead[asin]}` };
    }
    if (!verified.has(asin)) {
      return {
        safe: false,
        reason: `UNVERIFIED ASIN ${asin} — not in data/verified-asins.json. Open https://www.amazon.com/dp/${asin}, confirm the listing loads and the title matches, then register it. Never register an ASIN nobody has opened.`,
      };
    }
  }
  return { safe: true };
}

/**
 * The single gate. Call immediately before any write to src/pages/, after the
 * target path is known and before any mkdir (so a rejection leaves no artifacts).
 */
export function assertSafeToAct(root: string, action: Action): Verdict {
  const redirectMap = loadRedirectMap(root);

  if (action.kind === 'create') {
    const slug = withTrailingSlash(action.slug);

    if (isRedirectSource(redirectMap, slug)) {
      return {
        safe: false,
        reason: `BLOCKED: ${slug} is a 301 redirect source (-> ${resolveRedirect(redirectMap, slug)}). Creating a page here would collide with public/_redirects and undo a deliberate consolidation.`,
      };
    }

    const filePath = slugToFilePath(slug);
    if (existsSync(resolve(root, filePath))) {
      return {
        safe: false,
        reason: `SKIPPED: ${filePath} already exists — use REWRITE in the plan to update existing pages, not NEW CONTENT.`,
      };
    }
  } else {
    if (!existsSync(resolve(root, action.filePath))) {
      return { safe: false, reason: `File not found: ${action.filePath}` };
    }

    // An edit target whose URL 301s away is a dead page — editing it is wasted
    // work and pollutes the intervention log with a slug that serves no traffic.
    const slug = filePathToSlug(action.filePath);
    if (isRedirectSource(redirectMap, slug)) {
      return {
        safe: false,
        reason: `BLOCKED: ${action.filePath} maps to ${slug}, which 301s to ${resolveRedirect(redirectMap, slug)}. Editing a redirected page has no effect on live traffic.`,
      };
    }
  }

  if (action.content) {
    const asinVerdict = checkAsins(root, action.content);
    if (!asinVerdict.safe) return asinVerdict;
  }

  return { safe: true };
}

/**
 * predicates/http.ts — direct `<head>` truth, for the night the probes are missing.
 *
 * Playwright probes (§7.5) are the real source for this data. They do not exist yet,
 * and a predicate layer that can only say "unevaluable" until step 6 lands proves
 * nothing today. So the five predicates whose evidence lives entirely in the served
 * HTML — meta-length, canonical-self, schema-valid, geo-capsule, asin-registered —
 * fall back to one `fetch` of the page.
 *
 * `redirect: 'manual'`. CLAUDE.md and redirect-map.ts both exist because default
 * `fetch()` follows 301s silently: that is how the Tuesday audit compared
 * /best-office-chairs/ to its own redirect target and reported a CRITICAL duplicate
 * content crisis on a page that is not a page. A 3xx here is never a page result.
 *
 * The two predicates that assert BEHAVIOUR rather than markup — no-console-errors
 * and tag-fires — have no fallback and must say so. You cannot see a tag fire from
 * a string of HTML.
 */

import { z } from 'zod';
import { ContractViolation, parseValidated } from '../read-validated.js';
import { isRedirectSource, withTrailingSlash } from '../../redirect-map.js';
import { unevaluable, type EvalContext, type PageFetch, type PredicateVerdict, type ProbeRecord } from './types.js';

const FETCH_TIMEOUT_MS = 20_000;
const USER_AGENT = 'Mozilla/5.0 (compatible; TCA-godseye-ledger/1.0)';

/** '/review/gesture' | 'https://…/review/gesture/' → '/review/gesture/'. */
export function normalizePath(url: string): string {
  const stripped = url.replace(/^https?:\/\/[^/]+/, '');
  const path = stripped === '' ? '/' : stripped.split(/[?#]/)[0];
  return path === '/' ? '/' : withTrailingSlash(path.startsWith('/') ? path : `/${path}`);
}

export function absoluteUrl(url: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl.replace(/\/$/, '')}${normalizePath(url)}`;
}

/**
 * Fetch a page once per run. Returns a PageFetch whose `html` is null with a stated
 * `reason` for every non-200 outcome — never an empty string standing in for a body.
 */
export async function fetchPage(url: string, ctx: EvalContext): Promise<PageFetch> {
  const target = absoluteUrl(url, ctx.baseUrl);
  const cached = ctx.pageCache.get(target);
  if (cached !== undefined) return cached;

  const fetchedAt = new Date().toISOString();
  let result: PageFetch;

  if (!ctx.allowNetwork) {
    result = { url: target, status: 0, html: null, reason: 'network disabled (--no-network)', fetchedAt };
    ctx.pageCache.set(target, result);
    return result;
  }

  try {
    const response = await fetch(target, {
      redirect: 'manual',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      result = {
        url: target,
        status: response.status,
        html: null,
        reason: `HTTP ${response.status} redirect to ${location ?? '(no Location header)'} — a redirect source is not a page`,
        fetchedAt,
      };
    } else if (!response.ok) {
      result = { url: target, status: response.status, html: null, reason: `HTTP ${response.status}`, fetchedAt };
    } else {
      result = { url: target, status: response.status, html: await response.text(), reason: null, fetchedAt };
    }
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    result = { url: target, status: 0, html: null, reason: `fetch failed — ${message}`, fetchedAt };
  }

  ctx.pageCache.set(target, result);
  return result;
}

/**
 * True when this path is the SOURCE of a 301 in public/_redirects. Predicates must
 * refuse to evaluate one as a page rather than reporting on its destination.
 */
export function isRedirectSourcePath(url: string, ctx: EvalContext): boolean {
  return isRedirectSource(ctx.redirects, normalizePath(url));
}

/**
 * The USABLE probe record for this URL.
 *
 * Three ways a probe record exists and still tells you nothing, all of them null here:
 * `healthy: false` (scripts/probes/types.ts — "the probe itself could not complete,
 * the record proves nothing"), `skipped: 'redirect-source'`, and `skipped: 'noindex'`.
 * Reading fields off any of those would be reading a record that disclaims itself.
 */
export function probeFor(url: string, ctx: EvalContext): ProbeRecord | null {
  if (ctx.probes === null) return null;
  const record = ctx.probes.get(normalizePath(url));
  if (record === undefined) return null;
  if (record.healthy === false) return null;
  if (typeof record.skipped === 'string' && record.skipped !== '') return null;
  return record;
}

/**
 * Why there is no usable probe record — precise enough that the nightly's coverage
 * section names the blindness instead of shrugging. Only meaningful when probeFor()
 * returned null.
 */
export function probeGap(url: string, ctx: EvalContext): string {
  const path = normalizePath(url);
  const source = ctx.probeSource === null ? 'probe run' : ctx.probeSource;
  if (ctx.probes === null) {
    return `no probe data — ${ctx.probeReason === null ? 'no reason recorded' : ctx.probeReason}`;
  }
  const record = ctx.probes.get(path);
  if (record === undefined) return `${source} did not cover ${path}`;
  if (record.healthy === false) return `${source} record for ${path} is marked unhealthy — it proves nothing`;
  if (typeof record.skipped === 'string' && record.skipped !== '') {
    return `${source} skipped ${path} (${record.skipped})`;
  }
  return `${source} record for ${path} is present but carries no usable field`;
}

/**
 * Shared preamble for every markup-reading predicate: refuse redirect sources,
 * refuse a body we could not obtain, and hand back the HTML otherwise.
 *
 * Returns EITHER `{ html, page }` OR a terminal verdict — never both, and never a
 * usable-looking empty body.
 */
export async function pageHtml(
  url: string,
  ctx: EvalContext,
): Promise<{ html: string; page: PageFetch } | PredicateVerdict> {
  if (isRedirectSourcePath(url, ctx)) {
    return unevaluable(
      `${normalizePath(url)} is a 301 source in public/_redirects — a redirect source is not a page and must never be evaluated as one`,
    );
  }
  const page = await fetchPage(url, ctx);
  if (page.html === null) {
    return unevaluable(`could not read ${page.url} — ${page.reason ?? 'no body and no reason recorded'}`);
  }
  return { html: page.html, page };
}

export function isVerdict(value: unknown): value is PredicateVerdict {
  return value !== null && typeof value === 'object' && 'result' in (value as Record<string, unknown>);
}

// ─── `<head>` extraction ───────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
};

/**
 * Decode the entities the Astro build emits into attribute values. Live meta
 * descriptions on this site contain `&#34;` for the inch marks in 6'4" — measuring
 * the raw attribute would over-count every such description by 5 characters each.
 */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&[a-z]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity);
}

/**
 * CLAUDE.md: the standard meta-description regex breaks on apostrophes in content
 * like 6'4". Anchor on the double-quoted content attribute, and accept either
 * attribute order.
 */
export function extractMetaDescription(html: string): string | null {
  const forward = /<meta\s+name=["']description["']\s+content="(.*?)"/i.exec(html);
  if (forward !== null) return decodeEntities(forward[1]);
  const reverse = /<meta\s+content="(.*?)"\s+name=["']description["']/i.exec(html);
  if (reverse !== null) return decodeEntities(reverse[1]);
  return null;
}

export function extractCanonical(html: string): string | null {
  const forward = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i.exec(html);
  if (forward !== null) return decodeEntities(forward[1]);
  const reverse = /<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i.exec(html);
  if (reverse !== null) return decodeEntities(reverse[1]);
  return null;
}

/** Raw contents of every <script type="application/ld+json"> block. */
export function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = pattern.exec(html);
  while (match !== null) {
    blocks.push(match[1].trim());
    match = pattern.exec(html);
  }
  return blocks;
}

/**
 * Parse one JSON-LD block. JSON.parse is confined to read-validated.ts repo-wide,
 * so this routes through parseValidated and converts a ContractViolation into a
 * null return — a malformed block is a predicate FAIL, not a crash.
 */
export function parseJsonLd(block: string, label: string): unknown | null {
  try {
    return parseValidated(block, z.unknown(), label);
  } catch (error) {
    if (error instanceof ContractViolation) return null;
    throw error;
  }
}

/** Flatten @graph containers and arrays into a single node list. */
export function jsonLdNodes(parsed: unknown): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (node === null || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    out.push(record);
    if ('@graph' in record) visit(record['@graph']);
  };
  visit(parsed);
  return out;
}

export function nodeTypes(node: Record<string, unknown>): string[] {
  const raw = node['@type'];
  if (typeof raw === 'string') return [raw];
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === 'string');
  return [];
}

/** Every distinct ASIN linked as /dp/<ASIN> on the page, in document order. */
export function extractAsins(html: string): string[] {
  const seen = new Set<string>();
  const pattern = /\/dp\/([A-Z0-9]{10})\b/g;
  let match = pattern.exec(html);
  while (match !== null) {
    seen.add(match[1]);
    match = pattern.exec(html);
  }
  return [...seen];
}

/**
 * gsc-indexed — the GSC URL Inspection API reports the URL indexed (R6).
 *
 * Only the Inspection API can answer this; sitemap presence and impression counts
 * are proxies, and a proxy that says "it has impressions so it must be indexed"
 * is the degraded-but-plausible value §6 forbids. Collector absent → unevaluable.
 */

import { z } from 'zod';
import { normalizePath } from './http.js';
import { fail, pass, unevaluable, type ClosurePredicate, type EvalContext, type PredicateVerdict } from './types.js';

export const schema = z.object({
  kind: z.literal('gsc-indexed'),
  url: z.string().min(1),
});

const INDEXED_VERDICTS = new Set(['pass', 'indexed', 'submitted and indexed', 'url is on google']);

/**
 * Locate the inspection record for `path`.
 *
 * scripts/collectors/gsc.ts nests them at `data.indexInspection.pages[]`; the search
 * also accepts the flatter shapes, because this predicate must keep working if the
 * collector's internal layout moves. What it will NOT do is infer index state from
 * anything other than an Inspection record.
 */
export function findInspection(data: unknown, path: string): Record<string, unknown> | null {
  if (data === null || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  for (const nest of ['indexInspection', 'urlInspection', 'inspection']) {
    const child = root[nest];
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      const hit = searchContainer(child as Record<string, unknown>, path);
      if (hit !== null) return hit;
    }
  }
  return searchContainer(root, path);
}

function searchContainer(container: Record<string, unknown>, path: string): Record<string, unknown> | null {
  for (const key of ['pages', 'urlInspection', 'inspection', 'inspections', 'indexStatus']) {
    const value = container[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === null || typeof item !== 'object') continue;
        const row = item as Record<string, unknown>;
        const url = typeof row.url === 'string' ? row.url : typeof row.page === 'string' ? row.page : null;
        if (url !== null && normalizePath(url) === path) return row;
      }
    } else if (value !== null && typeof value === 'object') {
      const map = value as Record<string, unknown>;
      for (const url of Object.keys(map)) {
        if (normalizePath(url) !== path) continue;
        const row = map[url];
        if (row !== null && typeof row === 'object') return row as Record<string, unknown>;
        if (typeof row === 'boolean') return { indexed: row };
        if (typeof row === 'string') return { coverageState: row };
      }
    }
  }
  return null;
}

function readIndexed(row: Record<string, unknown>): { indexed: boolean; field: string; raw: unknown } | null {
  if (typeof row.indexed === 'boolean') return { indexed: row.indexed, field: 'indexed', raw: row.indexed };
  for (const key of ['verdict', 'indexStatusVerdict', 'coverageState']) {
    const value = row[key];
    if (typeof value === 'string') {
      return { indexed: INDEXED_VERDICTS.has(value.toLowerCase()), field: key, raw: value };
    }
  }
  return null;
}

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'gsc-indexed' }>;
  const path = normalizePath(p.url);

  const collector = ctx.collectors.get('gsc');
  if (collector === undefined) {
    return unevaluable('data/collectors/gsc.json is absent — URL Inspection state has no other source (PRD §7.4 R6)');
  }
  // An unhealthy collector is NOT an automatic unevaluable. collectors/types.ts
  // guarantees partial data is never fabricated, and the live gsc collector reports
  // unhealthy precisely because GSC_INSPECT_LIMIT capped it at 2 of 49 URLs — the two
  // it did inspect are real answers. Missing rows are the blindness, not the health flag.
  const row = findInspection(collector.data, path);
  if (row === null) {
    const why = collector.meta.healthy
      ? `gsc collector carries no URL Inspection record for ${path}`
      : `gsc collector carries no URL Inspection record for ${path} — ${collector.meta.reason ?? 'no reason recorded'}`;
    return unevaluable(why);
  }
  const state = readIndexed(row);
  if (state === null) {
    return unevaluable(`URL Inspection record for ${path} carries no verdict/coverageState field`);
  }

  const evidence = {
    source: 'collector:gsc',
    observedAt: collector.meta.collectedAt,
    detail: { url: path, field: state.field, value: state.raw, record: row },
  };
  return state.indexed
    ? pass(`URL Inspection reports indexed (${state.field}=${String(state.raw)})`, evidence)
    : fail(`URL Inspection reports NOT indexed (${state.field}=${String(state.raw)})`, evidence);
}

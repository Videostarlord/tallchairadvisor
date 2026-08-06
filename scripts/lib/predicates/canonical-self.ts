/**
 * canonical-self — rel=canonical resolves to the URL itself.
 *
 * Compared on normalised path + origin, so a trailing-slash difference is not a
 * failure but pointing at a different page is.
 */

import { z } from 'zod';
import {
  absoluteUrl,
  extractCanonical,
  isVerdict,
  normalizePath,
  pageHtml,
  probeFor,
} from './http.js';
import { fail, pass, type ClosurePredicate, type EvalContext, type PredicateVerdict } from './types.js';

export const schema = z.object({
  kind: z.literal('canonical-self'),
  url: z.string().min(1),
});

function canonicalFromProbe(record: Record<string, unknown>): string | null {
  const head = record.head;
  const containers: Array<Record<string, unknown>> = [record];
  if (head !== null && typeof head === 'object') containers.push(head as Record<string, unknown>);
  for (const container of containers) {
    for (const key of ['canonical', 'canonicalUrl', 'canonical_url']) {
      const value = container[key];
      if (typeof value === 'string') return value;
    }
  }
  return null;
}

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'canonical-self' }>;
  const expected = absoluteUrl(p.url, ctx.baseUrl);

  const probe = probeFor(p.url, ctx);
  if (probe !== null) {
    const canonical = canonicalFromProbe(probe);
    if (canonical !== null) {
      const observedAt = typeof probe.observedAt === 'string' ? probe.observedAt : ctx.now.toISOString();
      return judge(canonical, expected, ctx, ctx.probeSource ?? 'probe', observedAt);
    }
  }

  const loaded = await pageHtml(p.url, ctx);
  if (isVerdict(loaded)) return loaded;

  const canonical = extractCanonical(loaded.html);
  if (canonical === null) {
    return fail('no <link rel="canonical"> in the served HTML', {
      source: `fetch:${loaded.page.url}`,
      observedAt: loaded.page.fetchedAt,
      detail: { url: expected, canonical: null },
    });
  }
  return judge(canonical, expected, ctx, `fetch:${loaded.page.url}`, loaded.page.fetchedAt);
}

function judge(
  canonical: string,
  expected: string,
  ctx: EvalContext,
  source: string,
  observedAt: string,
): PredicateVerdict {
  const canonicalAbs = absoluteUrl(canonical, ctx.baseUrl);
  const samePath = normalizePath(canonicalAbs) === normalizePath(expected);
  const sameOrigin = originOf(canonicalAbs) === originOf(expected);
  const evidence = {
    source,
    observedAt,
    detail: { expected, canonical, canonicalResolved: canonicalAbs, samePath, sameOrigin },
  };
  if (samePath && sameOrigin) return pass(`canonical is self (${canonicalAbs})`, evidence);
  return fail(`canonical points to ${canonicalAbs}, expected ${expected}`, evidence);
}

function originOf(url: string): string {
  const match = /^https?:\/\/[^/]+/i.exec(url);
  return match === null ? '' : match[0].toLowerCase();
}

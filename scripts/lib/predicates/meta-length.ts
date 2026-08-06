/**
 * meta-length — the meta description sits within [min, max] characters.
 *
 * Probe first (§7.5 reads the real rendered `<head>`), direct fetch second.
 * WebFetch is not an option at any point: CLAUDE.md documents that it converts
 * HTML to markdown and silently drops every `<head>` element, which produces
 * false "missing meta description" findings — precisely the class of phantom
 * finding this ledger exists to stop.
 */

import { z } from 'zod';
import { extractMetaDescription, isVerdict, pageHtml, probeFor } from './http.js';
import { fail, pass, unevaluable, type ClosurePredicate, type EvalContext, type PredicateVerdict } from './types.js';

export const schema = z.object({
  kind: z.literal('meta-length'),
  url: z.string().min(1),
  min: z.number().int().nonnegative(),
  max: z.number().int().positive(),
});

/** Read a meta description off a probe record, tolerating the field names §7.5 may use. */
function metaFromProbe(record: Record<string, unknown>): string | null {
  const head = record.head;
  const containers: Array<Record<string, unknown>> = [record];
  if (head !== null && typeof head === 'object') containers.push(head as Record<string, unknown>);
  for (const container of containers) {
    for (const key of ['metaDescription', 'description', 'meta_description']) {
      const value = container[key];
      if (typeof value === 'string') return value;
    }
  }
  return null;
}

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'meta-length' }>;
  if (p.min > p.max) {
    return unevaluable(`predicate is unsatisfiable: min ${p.min} > max ${p.max}`);
  }

  const probe = probeFor(p.url, ctx);
  if (probe !== null) {
    const description = metaFromProbe(probe);
    if (description !== null) {
      const observedAt = typeof probe.observedAt === 'string' ? probe.observedAt : ctx.now.toISOString();
      return judge(description, p.min, p.max, ctx.probeSource ?? 'probe', probe.url, observedAt);
    }
    // Probe covered the URL but carries no meta field — say so rather than guessing.
  }

  const loaded = await pageHtml(p.url, ctx);
  if (isVerdict(loaded)) return loaded;

  const description = extractMetaDescription(loaded.html);
  if (description === null) {
    return fail('no <meta name="description"> in the served HTML', {
      source: `fetch:${loaded.page.url}`,
      observedAt: loaded.page.fetchedAt,
      detail: { status: loaded.page.status, metaDescription: null, min: p.min, max: p.max },
    });
  }
  return judge(description, p.min, p.max, `fetch:${loaded.page.url}`, loaded.page.url, loaded.page.fetchedAt);
}

function judge(
  description: string,
  min: number,
  max: number,
  source: string,
  url: string,
  observedAt: string,
): PredicateVerdict {
  const length = [...description].length;
  const evidence = { source, observedAt, detail: { url, metaDescription: description, length, min, max } };
  if (length >= min && length <= max) {
    return pass(`meta description is ${length} chars, within [${min}, ${max}]`, evidence);
  }
  return fail(`meta description is ${length} chars, outside [${min}, ${max}]`, evidence);
}

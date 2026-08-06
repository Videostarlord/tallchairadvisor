/**
 * tag-fires — a network assertion confirms the named tag actually fired.
 *
 * PRD §7.5: "no API can tell you whether a tag actually fires." This is the single
 * predicate that most directly encodes the June 16 GA4 CSP incident — the script tag
 * was present in the HTML for a month while the collect request was blocked by CSP.
 * A markup check would have passed every day of that month.
 *
 * So: probe or nothing. No fetch fallback exists, and adding one would be a
 * regression, not a feature.
 */

import { z } from 'zod';
import { probeFor, probeGap } from './http.js';
import { fail, pass, unevaluable, type ClosurePredicate, type EvalContext, type PredicateVerdict } from './types.js';

export const schema = z.object({
  kind: z.literal('tag-fires'),
  url: z.string().min(1),
  tag: z.string().min(1),
});

/** Pull a boolean fired-state for `tag` out of whatever shape the probe used. */
export function tagFired(record: Record<string, unknown>, tag: string): boolean | null {
  const wanted = tag.toLowerCase();
  const containers: Array<Record<string, unknown>> = [record];
  for (const key of ['tags', 'network', 'tagsFired']) {
    const value = record[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      containers.push(value as Record<string, unknown>);
    }
    if (Array.isArray(value)) {
      // ['gtag', 'clarity'] — presence in the list means it fired.
      if (value.every((v) => typeof v === 'string')) {
        return (value as string[]).some((v) => v.toLowerCase() === wanted);
      }
      // [{ tag: 'gtag', fired: true }, …]
      for (const item of value) {
        if (item === null || typeof item !== 'object') continue;
        const row = item as Record<string, unknown>;
        const name = typeof row.tag === 'string' ? row.tag : typeof row.name === 'string' ? row.name : null;
        if (name !== null && name.toLowerCase() === wanted && typeof row.fired === 'boolean') return row.fired;
      }
    }
  }
  for (const container of containers) {
    for (const key of Object.keys(container)) {
      if (key.toLowerCase() !== wanted) continue;
      const value = container[key];
      if (typeof value === 'boolean') return value;
      if (value !== null && typeof value === 'object' && typeof (value as Record<string, unknown>).fired === 'boolean') {
        return (value as Record<string, unknown>).fired as boolean;
      }
    }
  }
  return null;
}

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'tag-fires' }>;

  if (ctx.probes === null) {
    return unevaluable(
      `no probe data — whether ${p.tag} fires is a network event that cannot be read from served HTML (${ctx.probeReason ?? 'no reason recorded'})`,
    );
  }
  const probe = probeFor(p.url, ctx);
  if (probe === null) {
    return unevaluable(probeGap(p.url, ctx));
  }
  const fired = tagFired(probe, p.tag);
  if (fired === null) {
    return unevaluable(`${ctx.probeSource ?? 'probe'} record for ${p.url} carries no fired-state for tag '${p.tag}'`);
  }

  const observedAt = typeof probe.observedAt === 'string' ? probe.observedAt : ctx.now.toISOString();
  const evidence = {
    source: ctx.probeSource ?? 'probe',
    observedAt,
    detail: { url: p.url, tag: p.tag, fired },
  };
  return fired
    ? pass(`network assertion confirms ${p.tag} fired`, evidence)
    : fail(`${p.tag} did not fire on ${p.url}`, evidence);
}

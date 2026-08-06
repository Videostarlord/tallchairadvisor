/**
 * no-console-errors — the probe recorded zero console errors and zero unhandled
 * rejections for this URL.
 *
 * THERE IS NO FALLBACK, AND THERE MUST NOT BE ONE. A console error is a runtime
 * event; no amount of reading served HTML can observe it. Without a Playwright
 * probe (§7.5) this predicate returns `unevaluable` — never pass. The June 16 CSP
 * incident blocked GA4 for a month behind dashboards that all looked healthy; a
 * predicate that says "no probe, therefore fine" rebuilds exactly that failure.
 */

import { z } from 'zod';
import { probeFor, probeGap } from './http.js';
import { fail, pass, unevaluable, type ClosurePredicate, type EvalContext, type PredicateVerdict } from './types.js';

export const schema = z.object({
  kind: z.literal('no-console-errors'),
  url: z.string().min(1),
});

/** Accept either a count or the captured list, under any of the plausible field names. */
export function consoleErrorCount(record: Record<string, unknown>): { count: number; field: string } | null {
  const console_ = record.console;
  const containers: Array<Record<string, unknown>> = [record];
  if (console_ !== null && typeof console_ === 'object') containers.push(console_ as Record<string, unknown>);
  for (const container of containers) {
    for (const key of ['consoleErrors', 'errors', 'consoleErrorCount', 'console_errors']) {
      const value = container[key];
      if (typeof value === 'number') return { count: value, field: key };
      if (Array.isArray(value)) return { count: value.length, field: key };
    }
  }
  return null;
}

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'no-console-errors' }>;

  if (ctx.probes === null) {
    return unevaluable(
      `no probe data — console errors are runtime events and cannot be read from served HTML (${ctx.probeReason ?? 'no reason recorded'})`,
    );
  }
  const probe = probeFor(p.url, ctx);
  if (probe === null) {
    return unevaluable(probeGap(p.url, ctx));
  }
  const found = consoleErrorCount(probe);
  if (found === null) {
    return unevaluable(`${ctx.probeSource ?? 'probe'} record for ${p.url} carries no console-error field`);
  }

  const rejections = typeof probe.unhandledRejections === 'number' ? probe.unhandledRejections : 0;
  const observedAt = typeof probe.observedAt === 'string' ? probe.observedAt : ctx.now.toISOString();
  const evidence = {
    source: ctx.probeSource ?? 'probe',
    observedAt,
    detail: { url: p.url, consoleErrors: found.count, field: found.field, unhandledRejections: rejections },
  };

  if (found.count === 0 && rejections === 0) return pass('probe recorded zero console errors', evidence);
  return fail(`probe recorded ${found.count} console error(s) and ${rejections} unhandled rejection(s)`, evidence);
}

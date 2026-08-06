/**
 * gsc-position — average position satisfies `op value`, but only once `afterDays`
 * have actually elapsed since the record was filed.
 *
 * The waiting period is load-bearing. Ranking moves take weeks; evaluating the
 * night after an intervention would fail three nights running and escalate a fix
 * that simply has not had time to work. Before the window closes the verdict is
 * `unevaluable` — which by construction cannot increment the escalation counter.
 */

import { z } from 'zod';
import { normalizePath } from './http.js';
import {
  fail,
  pass,
  unevaluable,
  type ClosurePredicate,
  type ComparisonOp,
  type EvalContext,
  type PredicateVerdict,
} from './types.js';

export const schema = z.object({
  kind: z.literal('gsc-position'),
  url: z.string().min(1),
  op: z.enum(['<', '<=', '>', '>=', '==']),
  value: z.number(),
  afterDays: z.number().int().nonnegative(),
});

export function compare(actual: number, op: ComparisonOp, expected: number): boolean {
  switch (op) {
    case '<':
      return actual < expected;
    case '<=':
      return actual <= expected;
    case '>':
      return actual > expected;
    case '>=':
      return actual >= expected;
    case '==':
      return Math.abs(actual - expected) < 1e-9;
  }
}

const MS_PER_DAY = 86_400_000;

export function daysElapsed(fromIso: string, now: Date): number | null {
  const parsed = Date.parse(fromIso);
  if (Number.isNaN(parsed)) return null;
  return Math.floor((now.getTime() - parsed) / MS_PER_DAY);
}

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'gsc-position' }>;
  const path = normalizePath(p.url);

  if (p.afterDays > 0) {
    if (ctx.subject === null) {
      return unevaluable(`afterDays=${p.afterDays} requires the filing date, and no ledger record was supplied`);
    }
    const elapsed = daysElapsed(ctx.subject.firstSeen, ctx.now);
    if (elapsed === null) {
      return unevaluable(`record firstSeen '${ctx.subject.firstSeen}' is not a parsable date`);
    }
    if (elapsed < p.afterDays) {
      return unevaluable(`only ${elapsed} of ${p.afterDays} day(s) elapsed since ${ctx.subject.firstSeen} — too early to judge a ranking move`);
    }
  }

  if (ctx.gscPageMetrics === null) {
    return unevaluable(`no GSC page metrics available — ${ctx.gscReason ?? 'no reason recorded'}`);
  }
  const metrics = ctx.gscPageMetrics.get(path);
  if (metrics === undefined) {
    return unevaluable(`${ctx.gscSource ?? 'GSC source'} carries no row for ${path} (page has no impressions in range, or was never queried)`);
  }

  const ok = compare(metrics.position, p.op, p.value);
  const evidence = {
    source: ctx.gscSource ?? 'gsc',
    observedAt: ctx.now.toISOString(),
    detail: {
      url: path,
      position: metrics.position,
      impressions: metrics.impressions,
      ctr: metrics.ctr,
      op: p.op,
      threshold: p.value,
      afterDays: p.afterDays,
    },
  };
  return ok
    ? pass(`position ${metrics.position} ${p.op} ${p.value}`, evidence)
    : fail(`position ${metrics.position} does not satisfy ${p.op} ${p.value}`, evidence);
}

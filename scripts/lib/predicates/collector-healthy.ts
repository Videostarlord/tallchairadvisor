/**
 * collector-healthy — data/collectors/<name>.json reports meta.healthy === true.
 *
 * PRD §7.4: "A failed collector is a finding in the ledger, not a skipped section in
 * the report." This is the predicate that lets such a finding close itself the night
 * the credential is fixed, rather than sitting open until someone notices.
 *
 * Note the deliberate asymmetry: an UNHEALTHY collector is a `fail` (the site's
 * problem, escalate it), while an ABSENT collector file is `unevaluable` (the
 * system's blindness, do not escalate). Collapsing those two would escalate every
 * collector that has not been built yet.
 */

import { z } from 'zod';
import { fail, pass, unevaluable, type ClosurePredicate, type EvalContext, type PredicateVerdict } from './types.js';

export const schema = z.object({
  kind: z.literal('collector-healthy'),
  collector: z.string().min(1),
});

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'collector-healthy' }>;

  const envelope = ctx.collectors.get(p.collector);
  if (envelope === undefined) {
    return unevaluable(`data/collectors/${p.collector}.json does not exist or does not satisfy the §7.4 envelope`);
  }

  const evidence = {
    source: `collector:${p.collector}`,
    observedAt: envelope.meta.collectedAt,
    detail: {
      collector: p.collector,
      healthy: envelope.meta.healthy,
      rowCount: envelope.meta.rowCount,
      reason: envelope.meta.reason,
    },
  };

  if (envelope.meta.healthy) {
    return pass(`collector ${p.collector} healthy, ${envelope.meta.rowCount} row(s) at ${envelope.meta.collectedAt}`, evidence);
  }
  return fail(`collector ${p.collector} unhealthy — ${envelope.meta.reason ?? 'no reason recorded'}`, evidence);
}

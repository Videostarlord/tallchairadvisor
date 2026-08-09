/**
 * visual-diff — the page renders within `maxPct` of its stored baseline at a
 * given viewport.
 *
 * NO FETCH FALLBACK, AND THERE MUST NOT BE ONE. Rendering is not a property of
 * served HTML. You cannot read a stylesheet and know whether a spec table
 * overflows at 375px; you have to draw it. Without a Playwright probe carrying a
 * `visual` section this returns `unevaluable` — never pass.
 *
 * THE THREE-WAY DISTINCTION THAT MATTERS
 *
 *   diffPct <  maxPct  -> pass. The page renders as it did.
 *   diffPct >= maxPct  -> fail. Something moved.
 *   diffPct === null   -> UNEVALUABLE, never pass.
 *
 * That last case is the whole reason this file is careful. `diffPct: null` means
 * no comparison happened: no baseline existed yet, the screenshot failed, or the
 * image dimensions changed so pixelmatch could not run. Every one of those is the
 * system failing to LOOK. Scoring them as "no difference detected" would close a
 * visual claim on a page nobody rendered — the same lie `healthy:false` and the
 * gate's `unevaluable` guard exist to prevent.
 *
 * A newly created baseline is the sharpest version: the file on disk is by
 * definition identical to what was just captured, so a naive comparison scores a
 * perfect pass while proving nothing at all.
 */

import { z } from 'zod';
import { probeFor, probeGap } from './http.js';
import { fail, pass, unevaluable, type ClosurePredicate, type EvalContext, type PredicateVerdict } from './types.js';

export const schema = z.object({
  kind: z.literal('visual-diff'),
  url: z.string().min(1),
  viewport: z.enum(['desktop', 'mobile']),
  /** Percentage of changed pixels at or above which the page counts as regressed. */
  maxPct: z.number().positive(),
});

interface ViewportRecord {
  diffPct: number | null;
  note: string | null;
  baselineCreated: boolean;
}

/** Reads one viewport's comparison out of a probe record, or null if absent/malformed. */
export function viewportRecord(
  probe: Record<string, unknown>,
  viewport: 'desktop' | 'mobile',
): ViewportRecord | null {
  const visual = probe.visual;
  if (visual === null || visual === undefined || typeof visual !== 'object') return null;
  const entry = (visual as Record<string, unknown>)[viewport];
  if (entry === null || entry === undefined || typeof entry !== 'object') return null;

  const e = entry as Record<string, unknown>;
  const diffPct = e.diffPct;
  if (diffPct !== null && typeof diffPct !== 'number') return null;

  return {
    diffPct: diffPct ?? null,
    note: typeof e.note === 'string' ? e.note : null,
    baselineCreated: e.baselineCreated === true,
  };
}

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'visual-diff' }>;

  if (ctx.probes === null) {
    return unevaluable(
      `no probe data — rendering cannot be read from served HTML (${ctx.probeReason ?? 'no reason recorded'})`,
    );
  }
  const probe = probeFor(p.url, ctx);
  if (probe === null) return unevaluable(probeGap(p.url, ctx));

  const record = viewportRecord(probe, p.viewport);
  if (record === null) {
    return unevaluable(
      `${ctx.probeSource ?? 'probe'} record for ${p.url} carries no readable visual.${p.viewport} section — ` +
        'the run was probably made without --visual',
    );
  }

  const observedAt = typeof probe.observedAt === 'string' ? probe.observedAt : ctx.now.toISOString();
  const evidence = {
    source: ctx.probeSource ?? 'probe',
    observedAt,
    detail: { url: p.url, viewport: p.viewport, diffPct: record.diffPct, maxPct: p.maxPct, note: record.note },
  };

  if (record.baselineCreated) {
    return unevaluable(
      `a ${p.viewport} baseline was created on this run, so the comparison is against itself — proves nothing`,
    );
  }

  if (record.diffPct === null) {
    return unevaluable(
      `no ${p.viewport} comparison was made for ${p.url}: ${record.note ?? 'no reason recorded'}`,
    );
  }

  if (record.diffPct < p.maxPct) {
    return pass(`${p.viewport} render differs from baseline by ${record.diffPct}% (under ${p.maxPct}%)`, evidence);
  }
  return fail(`${p.viewport} render differs from baseline by ${record.diffPct}% (threshold ${p.maxPct}%)`, evidence);
}

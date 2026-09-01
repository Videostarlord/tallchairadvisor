/**
 * visual-diff — the page renders within `maxPct` of its stored baseline at a
 * given viewport.
 *
 * NO FETCH FALLBACK, AND THERE MUST NOT BE ONE. Rendering is not a property of
 * served HTML. You cannot read a stylesheet and know whether a spec table
 * overflows at 375px; you have to draw it. Without a Playwright probe carrying a
 * `visual` section this returns `unevaluable` — never pass.
 *
 * THE FOUR-WAY DISTINCTION THAT MATTERS
 *
 *   diffPct <  maxPct     -> pass. The page renders as it did.
 *   diffPct >= maxPct     -> fail. Something moved.
 *   diffPct === null      -> UNEVALUABLE, never pass.
 *   comparable === false  -> UNEVALUABLE, never FAIL. Added 2026-09-01.
 *
 * The fourth case is the mirror image of the third and was learned the expensive
 * way. `comparable: false` means a number exists but a known constant offset is
 * inside it, so it cannot be scored against a threshold. Scoring it `fail` blames
 * the site for the system's own instrumentation — three pages sat `escalated` for
 * 18-22 nights on macOS-vs-Linux font rasterisation, each night incrementing a
 * counter that is supposed to mean "this real problem is being ignored".
 *
 * The third case is the whole reason this file is careful. `diffPct: null` means
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
  /** false = the number carries a known constant offset and cannot be scored. */
  comparable: boolean;
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
    // `!== false`, not `=== true`. Artifacts written before 2026-09-01 have no
    // such field, and defaulting those to incomparable would turn the entire
    // stored probe history unevaluable the moment this shipped.
    comparable: e.comparable !== false,
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

  // A number that cannot be scored. The comparison ran and the pixels really do
  // differ, but a known constant offset is inside the figure — a baseline captured
  // on a platform other than the one comparing it — so the diff is measuring the
  // runner rather than the site.
  //
  // This must be `unevaluable` and not `fail`, and the cost of getting it wrong is
  // already on record: /review/gesture/, /best-big-and-tall-office-chairs/ and
  // /wide-seat-office-chairs-tall-people/ reached 18-22 escalated attempts each on
  // font rasterisation between 2026-08-09 and 2026-08-31. Under `unevaluable` the
  // attempt counter is untouched, exactly as types.ts requires: escalating on the
  // system's own blindness is the failure this layer exists to prevent.
  //
  // The fix is a re-baseline on the runner that does the comparison
  // (`gh workflow run nightly.yml -f rebaseline_visual=true`). Until then this
  // says "I cannot see", which is true, instead of "the page is broken", which is not.
  if (!record.comparable) {
    return unevaluable(
      `${p.viewport} diff for ${p.url} is ${record.diffPct}% but is NOT comparable: ${record.note ?? 'no reason recorded'}`,
    );
  }

  if (record.diffPct < p.maxPct) {
    return pass(`${p.viewport} render differs from baseline by ${record.diffPct}% (under ${p.maxPct}%)`, evidence);
  }
  return fail(`${p.viewport} render differs from baseline by ${record.diffPct}% (threshold ${p.maxPct}%)`, evidence);
}

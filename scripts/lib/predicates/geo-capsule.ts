/**
 * geo-capsule — the page carries a Direct Answer block AND a citation capsule.
 *
 * Both markers are the site's own conventions, not guesses:
 *   - "Direct Answer" is the label rendered above the answer-first paragraph
 *     (src/pages/review/gesture.astro:180).
 *   - `<!-- tca-aio-capsule -->` is the sentinel competitor-intelligence.ts writes
 *     and re-reads to decide whether a capsule is already applied
 *     (scripts/competitor-intelligence.ts:683). It survives the Astro build — it is
 *     present in the live HTML of /review/gesture/.
 *
 * An aio-suppression finding closes only when BOTH are live, which is why a
 * capsule committed to source but not deployed does not count.
 */

import { z } from 'zod';
import { isVerdict, pageHtml, probeFor } from './http.js';
import { fail, pass, type ClosurePredicate, type EvalContext, type PredicateVerdict } from './types.js';

export const schema = z.object({
  kind: z.literal('geo-capsule'),
  url: z.string().min(1),
});

export const CAPSULE_SENTINEL = '<!-- tca-aio-capsule -->';
export const DIRECT_ANSWER_MARKER = 'Direct Answer';

function firstBoolean(container: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (typeof container[key] === 'boolean') return container[key];
  }
  return undefined;
}

function geoFromProbe(record: Record<string, unknown>): { directAnswer: boolean; capsule: boolean } | null {
  const geo = record.geo;
  const container = geo !== null && typeof geo === 'object' ? (geo as Record<string, unknown>) : record;
  // scripts/probes/types.ts ProbeGeo names these directAnswerPresent /
  // citationCapsulePresent; the older names are accepted too.
  const directAnswer = firstBoolean(container, ['directAnswerPresent', 'directAnswer', 'hasDirectAnswer']);
  const capsule = firstBoolean(container, ['citationCapsulePresent', 'citationCapsule', 'hasCapsule', 'capsule']);
  if (typeof directAnswer === 'boolean' && typeof capsule === 'boolean') return { directAnswer, capsule };
  return null;
}

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'geo-capsule' }>;

  const probe = probeFor(p.url, ctx);
  if (probe !== null) {
    const geo = geoFromProbe(probe);
    if (geo !== null) {
      const observedAt = typeof probe.observedAt === 'string' ? probe.observedAt : ctx.now.toISOString();
      const evidence = { source: ctx.probeSource ?? 'probe', observedAt, detail: { url: p.url, ...geo } };
      return geo.directAnswer && geo.capsule
        ? pass('Direct Answer block and citation capsule both present', evidence)
        : fail(
            `missing ${[!geo.directAnswer ? 'Direct Answer block' : null, !geo.capsule ? 'citation capsule' : null]
              .filter((x) => x !== null)
              .join(' and ')}`,
            evidence,
          );
    }
  }

  const loaded = await pageHtml(p.url, ctx);
  if (isVerdict(loaded)) return loaded;

  const directAnswer = loaded.html.includes(DIRECT_ANSWER_MARKER);
  const capsule = loaded.html.includes(CAPSULE_SENTINEL);
  const evidence = {
    source: `fetch:${loaded.page.url}`,
    observedAt: loaded.page.fetchedAt,
    detail: { url: loaded.page.url, directAnswer, capsule, capsuleSentinel: CAPSULE_SENTINEL },
  };

  if (directAnswer && capsule) {
    return pass('Direct Answer block and tca-aio-capsule sentinel both present in live HTML', evidence);
  }
  const missing = [
    directAnswer ? null : `"${DIRECT_ANSWER_MARKER}" block`,
    capsule ? null : `${CAPSULE_SENTINEL} sentinel`,
  ].filter((item): item is string => item !== null);
  return fail(`live HTML is missing ${missing.join(' and ')}`, evidence);
}

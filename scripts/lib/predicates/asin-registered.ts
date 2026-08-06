/**
 * asin-registered — every /dp/<ASIN> on the live page is in data/verified-asins.json
 * and is not on the known-dead list.
 *
 * Three separate incidents shipped hallucinated ASINs to live money pages (see the
 * _WHY block in verified-asins.json). lint-content.mjs blocks them at build time
 * from SOURCE; this predicate is the same assertion against what is actually served,
 * which is the only version a reader's click goes through.
 *
 * `minLinks` (default 1) exists because a page with zero affiliate links passes the
 * "every ASIN is registered" test vacuously. That would auto-close an
 * `affiliate-missing` finding on a page that still earns nothing — a close on an
 * empty set is the same lie as a close on no evidence. Set `minLinks: 0` explicitly
 * when the page genuinely should carry no affiliate links.
 */

import { z } from 'zod';
import { extractAsins, isVerdict, pageHtml } from './http.js';
import { fail, pass, unevaluable, type ClosurePredicate, type EvalContext, type PredicateVerdict } from './types.js';

export const schema = z.object({
  kind: z.literal('asin-registered'),
  url: z.string().min(1),
  minLinks: z.number().int().nonnegative().optional(),
});

export async function evaluate(predicate: ClosurePredicate, ctx: EvalContext): Promise<PredicateVerdict> {
  const p = predicate as Extract<ClosurePredicate, { kind: 'asin-registered' }>;

  if (ctx.verifiedAsins === null) {
    return unevaluable('data/verified-asins.json could not be read — the allowlist is the only source of truth for this predicate');
  }

  const loaded = await pageHtml(p.url, ctx);
  if (isVerdict(loaded)) return loaded;

  const asins = extractAsins(loaded.html);
  const minLinks = p.minLinks === undefined ? 1 : p.minLinks;
  const unregistered = asins.filter((asin) => !ctx.verifiedAsins!.has(asin));
  const dead = asins.filter((asin) => ctx.knownDeadAsins.has(asin));

  const evidence = {
    source: `fetch:${loaded.page.url}`,
    observedAt: loaded.page.fetchedAt,
    detail: {
      url: loaded.page.url,
      asinsFound: asins,
      unregistered,
      knownDead: dead,
      minLinks,
      registrySize: ctx.verifiedAsins.size,
    },
  };

  if (asins.length < minLinks) {
    return fail(`page carries ${asins.length} /dp/ link(s), predicate requires ≥${minLinks}`, evidence);
  }
  if (unregistered.length > 0) {
    return fail(`${unregistered.length} ASIN(s) not in verified-asins.json: ${unregistered.join(', ')}`, evidence);
  }
  if (dead.length > 0) {
    return fail(`${dead.length} ASIN(s) on the known-dead list: ${dead.join(', ')}`, evidence);
  }
  return pass(`all ${asins.length} ASIN(s) registered and none known-dead`, evidence);
}

/**
 * chair-specs.json.ts — the machine-readable half of /chair-specs/.
 *
 * ─── WHY A DATA ENDPOINT ON AN AFFILIATE SITE ───────────────────────────────
 *
 * The site's stuck problem is distribution, not writing: ~8.1 average position
 * and 0.24% CTR, and `ctr-optimization.md` already priced the orthodox remedy —
 * "quality links cost $100-400 each, need 10-20 = $1,000-8,000 minimum" — and
 * correctly declined it.
 *
 * This is the version of that spend that costs nothing, because the asset already
 * exists. `data/chair-specs.json` was built as a build-time LINTER input: every
 * figure traced to a manufacturer specification PDF, with the edition and the
 * date it was checked, created after a fabricated Leap Plus range shipped across
 * 33 pages. Nobody outside the repo can see it.
 *
 * A citable, structured, primary-sourced dimension table is the one artifact in
 * this niche that other people have a reason to link to and that an LLM can quote
 * exactly. Retailers publish specs without sources; review sites publish figures
 * without editions. This publishes the figure, the document it came from, the
 * edition of that document, and the date a human last opened it.
 *
 * ─── WHY IT IS SEPARATE FROM THE PAGE ───────────────────────────────────────
 *
 * A `Dataset` schema block whose `contentUrl` points at an HTML page is a claim
 * without a payload. This is the payload: one fetch, no parsing, no scraping, and
 * a stable shape that does not change when the page's layout does.
 *
 * ─── THE `guarded` KEY IS NOT AN IMPLEMENTATION DETAIL ──────────────────────
 *
 * It is the most valuable field here and it is deliberately exported. It says
 * WHICH FIGURES ARE TRUE BUT MISLEADING ALONE — the Leap Plus reaching 22.5" only
 * with an optional cylinder that also RAISES its floor to 17.5". That is the
 * exact error this site published and then had to correct, and it is the error
 * every other source in the niche still carries. A consumer that copies the
 * numbers and drops the qualifiers reproduces the bug; one that reads this key
 * does not.
 */

import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface SpecRegistry {
  chairs: Record<string, unknown>;
  guarded: unknown[];
}

const registry = JSON.parse(
  readFileSync(resolve(process.cwd(), 'data/chair-specs.json'), 'utf-8'),
) as SpecRegistry & Record<string, unknown>;

export const GET: APIRoute = () => {
  const body = {
    name: 'Tall Chair Advisor — Office Chair Dimensions for Tall Users',
    description:
      'Primary-sourced seat height, seat depth, back height and weight capacity for office chairs evaluated for users 6\'0" and above. Every figure carries the manufacturer document it was read from and the date it was verified.',
    url: 'https://tallchairadvisor.com/chair-specs/',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Tall Chair Advisor — https://tallchairadvisor.com',
    version: '1.0.0',
    // Not `new Date()`. A build-time timestamp would change on every deploy and
    // tell a consumer the data moved when only the site did.
    lastVerified: '2026-08-06',
    unitOfMeasure: 'inches (dimensions), pounds (capacity)',

    /**
     * Read this before using `chairs`. Stated in the payload rather than only on
     * the page, because the payload is the half that gets consumed.
     */
    readme: {
      coverage:
        'Four chairs. This is the set whose every figure has been read from a manufacturer specification document, not the set of chairs the site covers. A chair is absent because nobody has opened its spec PDF yet, never because it lacks dimensions.',
      sourcing:
        'Manufacturer specification guides only. Retailer listings and review-site figures are not accepted as sources, because both are where the errors in this niche originate.',
      guarded:
        'A guarded value is TRUE but MISLEADING ALONE: it requires an option selected at order time. Copying such a figure without its qualifier reproduces the error this registry was built to stop.',
      hands_on:
        'Dimensional figures are documentary, not experiential. The only chair the author has used is the Steelcase Gesture; no figure here depends on having sat in anything.',
    },

    chairs: registry.chairs,
    guarded: registry.guarded,
  };

  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Deliberately permissive. A dataset that cannot be fetched from another
      // origin is a dataset nobody can build on, which defeats the point.
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

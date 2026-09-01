/**
 * aio-run.ts — contract for `raw/aio/<date>.json` and `data/aio/latest.json`.
 *
 * WHY AN ARCHIVE NEEDS A SCHEMA AT ALL. `aio-track.ts` compares tonight's run
 * against the previous archived one to report what MOVED — a query that gained or
 * lost its AI Overview, or gained or lost a TCA citation. That comparison is the
 * entire output; the single-run numbers are close to meaningless on their own,
 * because AI Overviews are volatile enough that one observation says nothing.
 *
 * So a malformed or truncated archive does not degrade this instrument, it
 * silently empties it: `computeDeltas` would find no matching queries and report
 * "no changes since the previous run", which is indistinguishable from a calm
 * week. Validating on read makes that failure loud instead.
 *
 * NO `maxAgeHours`. Unlike every other contract in this directory, a stale
 * archive is CORRECT here — the previous run is supposed to be a week old, and
 * the comparison is worth more the longer the series gets.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

/**
 * `aioPresent: null` is load-bearing, which is why the field is nullable rather
 * than boolean. It means the request failed and nothing is known. Folding it into
 * `false` would read as "no AI Overview on this query" and quietly deflate the
 * rate the whole file exists to measure — in exactly the weeks the collector was
 * broken, which is when a wrong number is least likely to be questioned.
 */
export const aioObservationSchema = z.object({
  query: z.string().min(1),
  impressions: z.number(),
  gscPosition: z.number().nullable(),
  page: z.string().nullable(),
  reason: z.enum(['ctr-leak', 'buyer-intent', 'top-cluster']),
  aioPresent: z.boolean().nullable(),
  tcaCited: z.boolean().nullable(),
  citedDomains: z.array(z.string()),
  tcaOrganicPosition: z.number().nullable(),
  error: z.string().nullable(),
});

export const aioRunSchema = z.object({
  generatedAt: z.string().min(1),
  domain: z.string().min(1),
  querySource: z.string().min(1),
  observations: z.array(aioObservationSchema),
  summary: z.object({
    queriesChecked: z.number(),
    observed: z.number(),
    failed: z.number(),
    withAio: z.number(),
    // Nullable for the same reason as `aioPresent`: a run that observed nothing
    // has no rate, and 0 is a very plausible-looking lie.
    aioRate: z.number().nullable(),
    citedInAio: z.number(),
    citationRate: z.number().nullable(),
  }),
});

export type AioRunRecord = z.infer<typeof aioRunSchema>;

export const aioRunOptions: ReadOptions = {
  timestampKey: 'generatedAt',
  label: 'AI Overview run',
};

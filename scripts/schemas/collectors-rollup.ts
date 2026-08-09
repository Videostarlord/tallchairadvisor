/**
 * collectors-rollup.ts — contract for `data/collectors/latest.json` (A13).
 *
 * `nightly-report.ts` previously read this file behind
 * `z.object({ collectedAt: z.string() }).passthrough()` — enough to prove the
 * file was a JSON object with a timestamp, and nothing more. That was fine
 * while the nightly only PASSED the rollup through to the narrative. It stopped
 * being fine the moment the nightly had to hold an OPINION about it: "did any
 * collector go blind tonight" is a question a loose envelope cannot answer, and
 * a question answered from an unvalidated shape is exactly the unearned claim
 * the report's `unverified` rule exists to stop.
 *
 * Modelled from `collectors/types.ts#CollectorMeta` and the rollup written by
 * `collect-all.ts`. Still `.passthrough()` throughout: each collector owns its
 * own `data` shape and this layer must not fossilise seven of them.
 *
 * `rowCount` is load-bearing and the reason this file exists. A collector can
 * report `healthy: true` with `rowCount: 0` — the credential worked, the
 * request succeeded, and it came back with nothing. That is not a healthy
 * observation, it is an empty one, and in a summary table it currently looks
 * identical to a collector that returned 200 rows.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

/** Mirrors `CollectorMeta` in scripts/collectors/types.ts. */
export const collectorMetaSchema = z
  .object({
    collectedAt: z.string(),
    rowCount: z.number(),
    healthy: z.boolean(),
    reason: z.string().nullable(),
  })
  .passthrough();

export const collectorEntrySchema = z
  .object({
    /** Each collector owns this shape. Deliberately unmodelled here. */
    data: z.unknown(),
    meta: collectorMetaSchema,
  })
  .passthrough();

export const collectorsRollupSchema = z
  .object({
    collectedAt: z.string(),
    healthy: z.boolean(),
    healthyCount: z.number(),
    total: z.number(),
    coveragePct: z.number(),
    unhealthy: z.array(z.object({ name: z.string(), reason: z.string() }).passthrough()),
    collectors: z.record(collectorEntrySchema),
  })
  .passthrough();

export type CollectorsRollup = z.infer<typeof collectorsRollupSchema>;

/**
 * The quota slice of `collectors.quotas.data`, parsed separately and leniently.
 * A quota reading is `null` when the vendor exposes no endpoint — never 0, for
 * the same reason nothing else here is 0-as-unknown.
 */
export const quotasDataSchema = z
  .object({
    services: z.array(
      z
        .object({
          service: z.string(),
          configured: z.boolean(),
          unit: z.string(),
          remaining: z.number().nullable(),
          limit: z.number().nullable(),
          pctRemaining: z.number().nullable(),
          error: z.string().nullable(),
        })
        .passthrough()
    ),
  })
  .passthrough();

export type QuotasData = z.infer<typeof quotasDataSchema>;

/**
 * 8-day SLA, matching every other live-data file in schemas/index.ts. The
 * nightly writes this daily, so 8 days only trips if collection has been dead
 * over a week — which is worth a loud read failure.
 */
export const collectorsRollupOptions: ReadOptions = {
  maxAgeHours: 8 * 24,
  timestampKey: 'collectedAt',
  label: 'collectors rollup',
};

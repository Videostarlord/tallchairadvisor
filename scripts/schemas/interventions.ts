/**
 * interventions.ts — contract for `data/interventions.jsonl` (PRD §7.2: no
 * freshness SLA, ≥0 rows).
 *
 * One record per fix applied to a page, appended by `appendIntervention`, later
 * enriched in place by `reconcileInterventions`. This is the file the central
 * bug quietly rewrote byte-identically every week.
 *
 * NO FRESHNESS SLA: an append-only attribution log is allowed to be quiet. What
 * is NOT allowed is for it to look reconciled when nothing reconciled — which is
 * a predicate question (§7.3), not a freshness one.
 *
 * TWO PAGE KEYS, AND THEY ARE NOT INTERCHANGEABLE:
 *   `page`  — source file, `src/pages/review/gesture.astro`
 *   `slug`  — live URL path, `/review/gesture/`
 * GSC snapshots key on the URL path, so any join to snapshot data uses `slug`
 * (through `normalizePageKey`). Joining on `page` returns nothing, forever,
 * silently. Verified on disk: all 8 records carry both, in exactly these forms.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

/** Mirrors `FixType` in scripts/agents/wiki-utils.ts. */
export const fixTypeSchema = z.enum(['meta', 'title', 'meta+title', 'complex', 'rewrite']);

/** Mirrors `IntentType` in scripts/agents/wiki-utils.ts. */
export const intentTypeSchema = z.enum(['buyer', 'brand', 'spec', 'informational']);

export const interventionSchema = z
  .object({
    interventionType: fixTypeSchema,
    /** Source file path, e.g. 'src/pages/review/gesture.astro'. NOT a join key. */
    page: z.string(),
    /** Live URL path, e.g. '/review/gesture/'. THIS is the join key. */
    slug: z.string(),
    appliedDate: z.string(),
    targetMetric: z.enum(['ctr', 'position', 'impressions']),
    beforeMetric: z.number(),
    /** null until reconciled. Immutability latch, paired with reconciledAt. */
    afterMetric: z.number().nullable(),
    deltaPercent: z.number().nullable(),
    confidenceLevel: z.enum(['none', 'low', 'medium', 'high']),
    description: z.string(),
    /** null = unreconciled. Non-null records are NEVER modified again. */
    reconciledAt: z.string().nullable(),
    /** Written since the intent-weighting change; older records lack it. */
    intentType: intentTypeSchema.optional(),
  })
  .passthrough();

export type Intervention = z.infer<typeof interventionSchema>;

export const interventionsOptions: ReadOptions = {
  minRows: 0,
  label: 'interventions',
};

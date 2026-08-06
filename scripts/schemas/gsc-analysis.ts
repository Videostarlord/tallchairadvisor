/**
 * gsc-analysis.ts — contract for `data/gsc/analysis.json` (PRD §7.2: 8-day SLA,
 * ≥1 page row).
 *
 * `gsc-analyze.ts` writes the SAME object to two places: `data/gsc/analysis.json`
 * and `data/gsc/history/<today>.json` (lines 1367 and 1373). So this schema is
 * the history snapshot schema plus the two modules that are always emitted by
 * the current writer but are missing from the three May 10–12 archives.
 *
 * The difference in strictness is deliberate and load-bearing: an ARCHIVE may
 * legitimately predate a module, but the LIVE analysis file is produced by
 * today's code and must contain everything today's code writes. If `contentGap`
 * ever goes missing from analysis.json, Module 6 silently stopped running — and
 * that is exactly the class of failure this layer exists to make loud.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';
import { contentGapSchema, decayAlertSchema, gscHistorySchema } from './gsc-history.js';

export const gscAnalysisSchema = gscHistorySchema.extend({
  /** Module 6. Always written by the current gsc-analyze.ts. */
  contentGap: z.array(contentGapSchema),
  /** Module 7. Always written (often as []) by the current gsc-analyze.ts. */
  decayAlerts: z.array(decayAlertSchema),
});

export type GscAnalysis = z.infer<typeof gscAnalysisSchema>;

/**
 * 8 days: the pipeline refreshes this weekly (Monday `gsc:full`), so anything
 * older than 8 days means a run was skipped or failed silently.
 *
 * The PRD's "≥1 page row" floor is enforced by `opportunities.min(1)` inside
 * gscHistorySchema, not by `minRows` — `minRows` on a top-level OBJECT counts
 * its keys, which would pass on an analysis file containing zero page rows.
 */
export const gscAnalysisOptions: ReadOptions = {
  maxAgeHours: 8 * 24,
  minRows: 1,
  timestampKey: 'generatedAt',
  label: 'GSC analysis',
};

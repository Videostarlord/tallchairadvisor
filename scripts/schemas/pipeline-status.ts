/**
 * pipeline-status.ts — contract for `data/pipeline-status.json` (PRD §7.2:
 * 8-day SLA).
 *
 * The pipeline's own claim about whether it is alive. It is therefore the file
 * whose staleness matters most and is hardest to notice: a green `status:
 * "success"` from three weeks ago reads exactly like a green status from this
 * morning unless something checks the clock. `maxAgeHours` is that something,
 * and it is why the dead-man's switch (§7.7) has to live outside this repo —
 * a file cannot report that it stopped being written.
 *
 * `reason` is "" on success and populated on failure. Modelled as a plain
 * string: empty-string-means-fine is the writer's existing convention, and
 * rewriting that convention is out of scope for the contracts layer.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

export const pipelineStatusSchema = z
  .object({
    status: z.string(),
    /** GitHub Actions run id, as a string. */
    runId: z.string(),
    /** '' when successful. */
    reason: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export type PipelineStatus = z.infer<typeof pipelineStatusSchema>;

export const pipelineStatusOptions: ReadOptions = {
  maxAgeHours: 8 * 24,
  timestampKey: 'updatedAt',
  label: 'pipeline status',
};

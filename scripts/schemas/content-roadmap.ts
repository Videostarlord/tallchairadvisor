/**
 * content-roadmap.ts — contract for `data/content-roadmap.json` (PRD §7.2: no
 * freshness SLA, ≥0 rows).
 *
 * A bare JSON ARRAY, not an object — the top level has no timestamp to hang a
 * freshness SLA on even if we wanted one, and a roadmap nobody edited this week
 * is not stale. ≥0 because an empty roadmap ("everything planned is published")
 * is a real and desirable state.
 *
 * Shape verified against all 8 entries on disk. `source` appears on 4 of 8 —
 * the keyword-discovery pipeline adds it, hand-added rows do not, so it is
 * optional and NOT defaulted.
 *
 * `status` is deliberately NOT an enum: only 'published' exists on disk today,
 * so any enum would be a guess at the other members, and guessing here would
 * throw on the first legitimately-new status. Where the real closed set is
 * known (issueClass, severity) this repo does use enums.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

export const roadmapEntrySchema = z
  .object({
    title: z.string(),
    keyword: z.string(),
    /** URL path, e.g. '/shoulder-pain-tall-people/'. */
    slug: z.string(),
    priority: z.number(),
    status: z.string(),
    notes: z.string(),
    addedDate: z.string(),
    publishedDate: z.string().nullable(),
    /** Present only on rows added by keyword discovery (4 of 8 on disk). */
    source: z.string().optional(),
  })
  .passthrough();

export type RoadmapEntry = z.infer<typeof roadmapEntrySchema>;

export const contentRoadmapSchema = z.array(roadmapEntrySchema);

export type ContentRoadmap = z.infer<typeof contentRoadmapSchema>;

export const contentRoadmapOptions: ReadOptions = {
  minRows: 0,
  label: 'content roadmap',
};

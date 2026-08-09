/**
 * content-failed.ts — contract for `data/content-failed.json`.
 *
 * Slug → why the Friday content agent gave up on it. Written by
 * `markSlugFailed` in `execute-content.ts`; read by `strategy.ts`,
 * `execute-content.ts`'s roadmap fallback, and `roadmap-sync.ts`, all of which
 * use it for the same purpose: SUPPRESSION. A slug in this file is excluded
 * from planning and from the roadmap fallback.
 *
 * WHY THE SHAPE MATTERS MORE THAN IT LOOKS
 * Every reader does `new Set(Object.keys(parse(...)))` inside a `catch { }` that
 * leaves the set empty. An empty suppression set does not fail safe — it means a
 * slug that has already failed generation twice gets retried, burning an LLM
 * call and re-writing a page that was rejected for cause. Under this contract a
 * malformed file throws instead of quietly re-enabling every failed slug.
 *
 * `{}` IS VALID AND IS THE CURRENT STATE ON DISK. "Nothing has failed" is the
 * desirable reading of this file, so there is no non-empty floor and no
 * freshness SLA: a suppression list nobody had to append to this month is
 * correct, not stale.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

export const contentFailureSchema = z
  .object({
    /** Free text: the validation error or generation failure that caused the give-up. */
    reason: z.string(),
    /** ISO date (YYYY-MM-DD) the slug was marked failed. */
    date: z.string(),
  })
  .passthrough();

/** Slug (e.g. '/shoulder-pain-tall-people/') → failure record. */
export const contentFailedSchema = z.record(contentFailureSchema);

export type ContentFailed = z.infer<typeof contentFailedSchema>;

export const contentFailedOptions: ReadOptions = {
  minRows: 0,
  label: 'failed content slugs',
};

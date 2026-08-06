/**
 * gsc-latest.ts — contract for `data/gsc/latest.json`, the raw Search Console
 * pull that `gsc-analyze.ts` consumes.
 *
 * Not in the PRD §7.2 table, but it is the INPUT to the file that is. An
 * analysis built from a stale or truncated pull is wrong in a way no downstream
 * contract can detect, so the pull gets the same 8-day SLA as the analysis.
 *
 * Shape verified against the file on disk: 44 pages, 200 queries, 500
 * page-query pairs, 63 device rows, 89 daily rows — every field present on
 * every row of every array.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';
import { dateRangeSchema } from './gsc-history.js';

export const gscPageRowSchema = z
  .object({
    page: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
  })
  .passthrough();

export const gscQueryRowSchema = z
  .object({
    query: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
  })
  .passthrough();

export const gscPageQueryRowSchema = z
  .object({
    page: z.string(),
    query: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
  })
  .passthrough();

export const gscDeviceRowSchema = z
  .object({
    device: z.string(),
    page: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
  })
  .passthrough();

export const gscDailyRowSchema = z
  .object({
    date: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
  })
  .passthrough();

export const gscLatestSchema = z
  .object({
    pulledAt: z.string(),
    dateRange: dateRangeSchema,
    totals: z
      .object({
        clicks: z.number(),
        impressions: z.number(),
        ctr: z.number(),
        avgPosition: z.number(),
      })
      .passthrough(),
    /** Non-empty: a pull that returned no pages is a failed pull, not a quiet week. */
    pages: z.array(gscPageRowSchema).min(1),
    queries: z.array(gscQueryRowSchema).min(1),
    pageQueries: z.array(gscPageQueryRowSchema).min(1),
    deviceSplit: z.array(gscDeviceRowSchema),
    dailyTrend: z.array(gscDailyRowSchema),
  })
  .passthrough();

export type GscLatest = z.infer<typeof gscLatestSchema>;

export const gscLatestOptions: ReadOptions = {
  maxAgeHours: 8 * 24,
  minRows: 1,
  timestampKey: 'pulledAt',
  label: 'GSC latest pull',
};

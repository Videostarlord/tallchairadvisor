/**
 * clarity-latest.ts — contract for `data/clarity/latest.json` (PRD §7.2: 8-day
 * SLA, ≥1 page row).
 *
 * NOTE THE KEY NAME: Clarity rows are keyed on `url` and carry a FULL absolute
 * URL (`https://tallchairadvisor.com/knee-pain-seat-depth/`), while GSC rows are
 * keyed on `page` and carry a path. Any join between the two must run both sides
 * through `normalizePageKey` from ./gsc-history.js. This mismatch is the same
 * silent-empty-join hazard as the `raw.pages` bug, one layer over.
 *
 * Shape verified against the file on disk: 31 pages, 14 behavioural alerts;
 * all fields present on all rows.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

/**
 * Behavioural metrics are `null` when Clarity measured nothing for the page.
 * Verified across all 641 page rows on disk (31 in latest.json, 610 in
 * history.jsonl): 9 and 136 rows respectively carry nulls, and every one of
 * them has `sessions: 0`.
 *
 * These are NOT corruption and NOT a reason to loosen `sessions`, which is
 * never null. null here means "not measured"; 0 would mean "measured, and it
 * was zero" — collapsing the two is how a dead page starts looking like a page
 * with perfect zero rage-clicks.
 */
const clarityMetric = z.number().nullable();

export const clarityPageRowSchema = z
  .object({
    /** Absolute URL, not a path. Normalise before joining to GSC data. */
    url: z.string(),
    /** Never null on any row on disk. */
    sessions: z.number(),
    scrollDepthAvg: clarityMetric,
    rageClicks: clarityMetric,
    deadClicks: clarityMetric,
    excessiveScroll: clarityMetric,
    engagementTimeSec: clarityMetric,
  })
  .passthrough()
  /**
   * A TIGHTENING, not a loosening. `sessions === 0` ⇒ every metric is null,
   * with zero counterexamples in 641 rows. If Clarity ever reports zero
   * sessions alongside a real engagement time, that row is fabricated and this
   * throws instead of feeding a lie into the behavioural alerts.
   *
   * The converse is deliberately NOT asserted: 2 rows on disk have real
   * sessions and a null `scrollDepthAvg` (Clarity returned no scroll metric),
   * so "sessions > 0 ⇒ metrics present" is not true and must not be claimed.
   */
  .refine(
    (row) =>
      row.sessions !== 0 ||
      (row.scrollDepthAvg === null &&
        row.rageClicks === null &&
        row.deadClicks === null &&
        row.excessiveScroll === null &&
        row.engagementTimeSec === null),
    {
      message:
        'row reports sessions === 0 but carries non-null behavioural metrics; a page with no sessions cannot have measurements',
    },
  );

export const clarityAlertSchema = z
  .object({
    url: z.string(),
    issue: z.string(),
    value: z.number(),
    note: z.string(),
  })
  .passthrough();

export const clarityLatestSchema = z
  .object({
    pulledAt: z.string(),
    windowEnd: z.string(),
    numOfDays: z.number(),
    /** PRD's "≥1 page row". */
    pages: z.array(clarityPageRowSchema).min(1),
    deviceSplit: z
      .object({
        mobile: z.number(),
        pc: z.number(),
        other: z.number(),
      })
      .passthrough(),
    /** Legitimately empty when nothing is wrong. */
    behavioralAlerts: z.array(clarityAlertSchema),
  })
  .passthrough();

export type ClarityLatest = z.infer<typeof clarityLatestSchema>;

export const clarityLatestOptions: ReadOptions = {
  maxAgeHours: 8 * 24,
  minRows: 1,
  timestampKey: 'pulledAt',
  label: 'Clarity latest',
};

/**
 * `data/clarity/history.jsonl` — appended by `agents/clarity-history.ts`. NOT
 * `latest.json`-shaped: it is a discriminated union on `type`, one `site` record
 * plus one `page` record per URL, per run. Verified across all 640 lines on
 * disk (610 `page`, 30 `site`).
 *
 * Append-only, so no freshness SLA on the file as a whole — the SLA belongs on
 * `latest.json`, which is what "is Clarity still collecting?" actually asks.
 */
export const clarityHistoryPageSchema = z
  .object({
    type: z.literal('page'),
    windowEnd: z.string(),
    windowDays: z.number(),
    url: z.string(),
    sessions: z.number(),
    /** Same "null means not measured" contract as clarityPageRowSchema. */
    scrollDepthAvg: clarityMetric,
    rageClicks: clarityMetric,
    deadClicks: clarityMetric,
    excessiveScroll: clarityMetric,
    engagementTimeSec: clarityMetric,
    /** Verbatim Clarity API metric bag — deliberately unmodelled. */
    raw: z.record(z.unknown()),
  })
  .passthrough();

export const clarityHistorySiteSchema = z
  .object({
    type: z.literal('site'),
    windowEnd: z.string(),
    windowDays: z.number(),
    totalSessions: z.number(),
    deviceSplit: z.record(z.number()),
  })
  .passthrough();

export const clarityHistoryLineSchema = z.discriminatedUnion('type', [
  clarityHistoryPageSchema,
  clarityHistorySiteSchema,
]);

export type ClarityHistoryLine = z.infer<typeof clarityHistoryLineSchema>;

export const clarityHistoryOptions: ReadOptions = {
  minRows: 0,
  label: 'Clarity history',
};

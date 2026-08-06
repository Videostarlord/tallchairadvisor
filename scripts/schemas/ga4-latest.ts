/**
 * ga4-latest.ts — contract for `data/ga4/latest.json` (PRD §7.2: 8-day SLA,
 * ≥1 session row).
 *
 * WHY THE FLOOR MATTERS HERE MORE THAN ANYWHERE ELSE: the June 16 CSP incident
 * blocked GA4 collection for a month while every dashboard looked healthy,
 * because "zero sessions" and "no data arrived" are indistinguishable once a
 * reader is willing to accept an empty array. Under this contract they are not
 * the same thing — an empty `pages` array throws.
 *
 * Shape verified against the file on disk: 39 pages, 6 channel groups, 12
 * traffic sources, 11 affiliate-click rows, 23 daily rows; all fields present
 * on all rows.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';
import { dateRangeSchema } from './gsc-history.js';

export const ga4PageRowSchema = z
  .object({
    page: z.string(),
    sessions: z.number(),
    activeUsers: z.number(),
    pageViews: z.number(),
    engagementRate: z.number(),
    avgSessionDuration: z.number(),
    bounceRate: z.number(),
  })
  .passthrough();

export const ga4ChannelGroupSchema = z
  .object({
    channel: z.string(),
    sessions: z.number(),
    pct: z.number(),
  })
  .passthrough();

export const ga4TrafficSourceSchema = z
  .object({
    source: z.string(),
    medium: z.string(),
    sessions: z.number(),
  })
  .passthrough();

export const ga4AffiliateClickSchema = z
  .object({
    page: z.string(),
    eventCount: z.number(),
  })
  .passthrough();

export const ga4DailyRowSchema = z
  .object({
    date: z.string(),
    sessions: z.number(),
    activeUsers: z.number(),
    pageViews: z.number(),
  })
  .passthrough();

export const ga4LatestSchema = z
  .object({
    pulledAt: z.string(),
    propertyId: z.string(),
    dateRange: dateRangeSchema,
    totals: z
      .object({
        sessions: z.number(),
        activeUsers: z.number(),
        pageViews: z.number(),
        engagementRate: z.number(),
        avgSessionDuration: z.number(),
        bounceRate: z.number(),
      })
      .passthrough(),
    /** PRD's "≥1 session row". Empty here means collection broke, not silence. */
    pages: z.array(ga4PageRowSchema).min(1),
    channelGroups: z.array(ga4ChannelGroupSchema),
    trafficSources: z.array(ga4TrafficSourceSchema),
    /** May legitimately be empty — a week with no affiliate clicks is real. */
    affiliateClicks: z.array(ga4AffiliateClickSchema),
    dailyTrend: z.array(ga4DailyRowSchema),
  })
  .passthrough();

export type Ga4Latest = z.infer<typeof ga4LatestSchema>;

export const ga4LatestOptions: ReadOptions = {
  maxAgeHours: 8 * 24,
  minRows: 1,
  timestampKey: 'pulledAt',
  label: 'GA4 latest',
};

/**
 * gsc-history.ts — contract for `data/gsc/history/*.json`.
 *
 * THIS IS THE FILE THE CENTRAL BUG WAS ABOUT.
 *
 * `reconcileInterventions` read `raw.pages` from these snapshots. They have no
 * `pages` key and never have. `?? []` turned the missing key into an empty Map,
 * so every intervention came back unenriched and the file was rewritten
 * byte-identical — green checkmarks weekly, zero reconciliations, for months.
 *
 * Verified against all 16 snapshots on disk (2026-05-10 → 2026-08-03). The real
 * top-level keys are:
 *
 *   generatedAt, dateRange, siteTrend, deviceIntelligence, ctrLeaks,
 *   opportunities, clusters, cannibalization, affiliateOpportunities,
 *   executiveSummary, queryEntropy, impressionGravity, intentTransitions,
 *   aioRecommendations, pageVelocity, contentGap, decayAlerts
 *
 * Per-page metrics live in `opportunities` (page/impressions/position/clicks/
 * ctr/…) and, for position/impression deltas only, in `pageVelocity`. Use
 * `pageMetricsFrom()` — never reach for a `pages` key that does not exist.
 *
 * A snapshot is an ARCHIVE, so it carries NO freshness SLA: a May file being
 * three months old is correct, not stale. `opportunities` is required and
 * non-empty, because a snapshot with no per-page rows is the exact condition
 * the old code silently produced.
 *
 * Optionality below is measured, not guessed:
 *   - `pageVelocity` is absent from 2026-05-10.json (the first snapshot — it has
 *     no previous week to diff against).
 *   - `contentGap` / `decayAlerts` are absent from the three May 10–12 snapshots,
 *     which predate gsc-analyze.ts Modules 6 and 7.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';
import { withTrailingSlash } from '../redirect-map.js';

// ─── Page-key normalisation ────────────────────────────────────────────────────

/**
 * Snapshot rows, intervention slugs and audit findings must all agree on what
 * "the same page" means, or a join silently returns nothing — which is the same
 * failure mode as the `?? []` bug wearing a different hat.
 *
 * Same normalisation as `audit-findings.ts:makeFindingId`: strip the origin,
 * then apply `withTrailingSlash` from redirect-map.ts (which leaves file-like
 * paths, e.g. `/sitemap.xml`, alone).
 */
export function normalizePageKey(page: string): string {
  const path = page.replace(/^https?:\/\/[^/]+/, '');
  if (path === '' || path === '/') return '/';
  return withTrailingSlash(path.startsWith('/') ? path : `/${path}`);
}

// ─── Row schemas (each verified against every snapshot on disk) ────────────────

/** 274 rows across 16 snapshots; every field present on every row. */
export const ctrLeakSchema = z
  .object({
    page: z.string(),
    query: z.string(),
    impressions: z.number(),
    position: z.number(),
    actualCTR: z.number(),
    expectedCTR: z.number(),
    ctrGap: z.number(),
    lostClicksPerWeek: z.number(),
    leakScore: z.number(),
    aioSuspect: z.boolean(),
    intentType: z.string(),
  })
  .passthrough();

/**
 * THE per-page metric row. 553 rows across 16 snapshots; every field present on
 * every row. This is what a reader asking for "pages" actually wants.
 */
export const opportunitySchema = z
  .object({
    page: z.string(),
    impressions: z.number(),
    position: z.number(),
    clicks: z.number(),
    ctr: z.number(),
    opportunityScore: z.number(),
    opportunityType: z.string(),
    topQueries: z.array(z.string()),
    buyerIntentImpressions: z.number(),
    recommendation: z.string(),
  })
  .passthrough();

export const clusterSchema = z
  .object({
    fingerprint: z.string(),
    representativeQuery: z.string(),
    queries: z.array(z.string()),
    pages: z.array(z.string()),
    totalImpressions: z.number(),
    totalClicks: z.number(),
    avgPosition: z.number(),
    clusterCTR: z.number(),
    intentType: z.string(),
    cannibalized: z.boolean(),
    opportunityScore: z.number(),
  })
  .passthrough();

export const cannibalizationSchema = z
  .object({
    query: z.string(),
    pages: z.array(z.string()),
    positions: z.array(z.number()),
    impressions: z.number(),
    risk: z.string(),
  })
  .passthrough();

export const affiliateOpportunitySchema = z
  .object({
    page: z.string(),
    buyerIntentImpressions: z.number(),
    topBuyerQueries: z.array(z.string()),
    affiliateUrgency: z.string(),
  })
  .passthrough();

export const queryEntropySchema = z
  .object({
    page: z.string(),
    entropy: z.number(),
    queryCount: z.number(),
    regime: z.string(),
  })
  .passthrough();

export const impressionGravitySchema = z
  .object({
    page: z.string(),
    clusterCount: z.number(),
    totalImpressions: z.number(),
    gravityScore: z.number(),
    hubCandidate: z.boolean(),
  })
  .passthrough();

export const intentTransitionSchema = z
  .object({
    page: z.string(),
    infoImpressions: z.number(),
    commercialImpressions: z.number(),
    transitionOpportunity: z.boolean(),
    recommendation: z.string(),
  })
  .passthrough();

export const aioRecommendationSchema = z
  .object({
    page: z.string(),
    query: z.string(),
    impressions: z.number(),
    position: z.number(),
    recommendedStructure: z.array(z.string()),
    priority: z.string(),
  })
  .passthrough();

/** 510 rows across 15 snapshots. Carries position + impressions, but NO ctr. */
export const pageVelocitySchema = z
  .object({
    page: z.string(),
    currentPosition: z.number(),
    previousPosition: z.number(),
    positionDelta: z.number(),
    currentImpressions: z.number(),
    previousImpressions: z.number(),
    impressionDelta: z.number(),
    trend: z.string(),
  })
  .passthrough();

export const contentGapSchema = z
  .object({
    query: z.string(),
    tcaPage: z.string(),
    tcaPosition: z.number(),
    competitorDomain: z.string(),
    competitorPosition: z.number(),
    impressions: z.number(),
    gapSeverity: z.string(),
  })
  .passthrough();

/**
 * `decayAlerts` is [] in all 16 snapshots (detectDecayingPages needs 9+ history
 * files and only started qualifying recently), so the shape is taken from the
 * `DecayAlert` interface in gsc-analyze.ts rather than from data.
 */
export const decayAlertSchema = z
  .object({
    page: z.string(),
    consecutiveWeeksDeclined: z.number(),
    positionAtStart: z.number(),
    positionNow: z.number(),
    totalPositionLoss: z.number(),
    impressions: z.number(),
    cooldownBypass: z.boolean(),
  })
  .passthrough();

export const dateRangeSchema = z
  .object({
    start: z.string(),
    end: z.string(),
    days: z.number(),
  })
  .passthrough();

export const siteTrendSchema = z
  .object({
    currentWeekImpressions: z.number(),
    previousWeekImpressions: z.number(),
    impressionVelocity: z.number(),
    currentWeekClicks: z.number(),
    previousWeekClicks: z.number(),
    clickVelocity: z.number(),
    positionTrend: z.string(),
    currentAvgPosition: z.number(),
    previousAvgPosition: z.number(),
    positionDelta: z.number(),
    summaryLine: z.string(),
  })
  .passthrough();

export const deviceIntelligenceSchema = z
  .object({
    mobileImpressions: z.number(),
    desktopImpressions: z.number(),
    tabletImpressions: z.number(),
    mobileShare: z.number(),
    mobileCTR: z.number(),
    desktopCTR: z.number(),
    ctrGap: z.number(),
    mobileUnderperformingPages: z.array(z.unknown()),
    summaryLine: z.string(),
  })
  .passthrough();

export const executiveSummarySchema = z
  .object({
    weeklyMomentum: z.string(),
    topOpportunity: z.string(),
    biggestLeak: z.string(),
    affiliateAlert: z.string(),
    // null in 4 of 16 snapshots — "no cannibalization this week" is a real state.
    cannibalizationAlert: z.string().nullable(),
    aioSuspects: z.number(),
  })
  .passthrough();

// ─── The snapshot ──────────────────────────────────────────────────────────────

export const gscHistorySchema = z
  .object({
    generatedAt: z.string(),
    dateRange: dateRangeSchema,
    siteTrend: siteTrendSchema,
    deviceIntelligence: deviceIntelligenceSchema,
    ctrLeaks: z.array(ctrLeakSchema),
    /**
     * REQUIRED AND NON-EMPTY. This is the whole point of the file. A snapshot
     * without per-page rows is not a snapshot, and pretending otherwise is the
     * bug this module exists to make unrepresentable.
     */
    opportunities: z.array(opportunitySchema).min(1),
    clusters: z.array(clusterSchema),
    cannibalization: z.array(cannibalizationSchema),
    affiliateOpportunities: z.array(affiliateOpportunitySchema),
    executiveSummary: executiveSummarySchema,
    queryEntropy: z.array(queryEntropySchema),
    impressionGravity: z.array(impressionGravitySchema),
    intentTransitions: z.array(intentTransitionSchema),
    aioRecommendations: z.array(aioRecommendationSchema),
    /**
     * `null` in 2026-05-10.json — the first snapshot has no prior week to diff
     * against, and gsc-analyze.ts wrote a null rather than omitting the key.
     * Modelled as nullable AND optional because both states exist on disk, and
     * `pageMetricsFrom` branches on it explicitly rather than `?? []`-ing it.
     */
    pageVelocity: z.array(pageVelocitySchema).nullable().optional(),
    /** Absent from the 2026-05-10..12 snapshots (predate Module 6). */
    contentGap: z.array(contentGapSchema).optional(),
    /** Absent from the 2026-05-10..12 snapshots (predate Module 7). */
    decayAlerts: z.array(decayAlertSchema).optional(),
  })
  .passthrough();

export type GscHistorySnapshot = z.infer<typeof gscHistorySchema>;

/**
 * NO `maxAgeHours`. History snapshots are immutable archives; age is the point
 * of keeping them. `minRows: 1` guards the top-level object, and the real
 * non-empty floor is `opportunities.min(1)` inside the schema.
 */
export const gscHistoryOptions: ReadOptions = {
  minRows: 1,
  label: 'GSC history snapshot',
};

// ─── Per-page metrics ──────────────────────────────────────────────────────────

export interface PageMetrics {
  /**
   * null ONLY when the page appears in `pageVelocity` but not `opportunities` —
   * pageVelocity carries no clicks and no CTR, and there is no honest way to
   * derive one. Callers must branch on null rather than receive a fabricated 0,
   * which is precisely the degraded-but-plausible value the contract layer bans.
   * (Measured: zero such pages in the 2026-08-03 snapshot. Defensive, not dead.)
   */
  ctr: number | null;
  position: number;
  impressions: number;
  /** Which array the row came from. Present so callers can explain a null ctr. */
  source: 'opportunities' | 'pageVelocity';
}

/**
 * Per-page metrics keyed by normalised path (`/review/gesture/`).
 *
 * Built from `opportunities` — the array that actually holds page/ctr/position/
 * impressions — and topped up from `pageVelocity` for pages that appear there
 * and nowhere else. `opportunities` always wins on conflict: it carries the full
 * metric set, pageVelocity only position and impressions.
 */
export function pageMetricsFrom(snapshot: GscHistorySnapshot): Map<string, PageMetrics> {
  const metrics = new Map<string, PageMetrics>();

  for (const row of snapshot.opportunities) {
    metrics.set(normalizePageKey(row.page), {
      ctr: row.ctr,
      position: row.position,
      impressions: row.impressions,
      source: 'opportunities',
    });
  }

  // Deliberately NOT `snapshot.pageVelocity ?? []`. Absence here is a state the
  // schema declares (the first snapshot has no prior week), so it is branched on
  // explicitly — the ban on `?? []` over parsed input is a ban on the shape of
  // the reasoning, not just on the operator.
  const velocity = snapshot.pageVelocity;
  if (velocity !== undefined && velocity !== null) {
    for (const row of velocity) {
      const key = normalizePageKey(row.page);
      if (metrics.has(key)) continue;
      metrics.set(key, {
        ctr: null,
        position: row.currentPosition,
        impressions: row.currentImpressions,
        source: 'pageVelocity',
      });
    }
  }

  return metrics;
}

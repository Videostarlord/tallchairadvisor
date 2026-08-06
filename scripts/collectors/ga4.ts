/**
 * collectors/ga4.ts — wraps data/ga4/latest.json in the L0 contract (PRD §7.4).
 *
 * WHY THIS IS A FILE COLLECTOR AND NOT AN API CALL
 * scripts/ga4-pull.ts already owns the Data API call and runs on Monday. This
 * collector's job is the question that pull cannot answer about itself: is the
 * artifact it produced still current, still shaped the way readers assume, and
 * still describing a site that is actually being measured?
 *
 * THE JUNE 16 INCIDENT IS THE SPEC
 * A CSP rule blocked GA4 collection for a month while every dashboard looked
 * healthy — because "0 sessions" and "no data" render identically once a
 * `?? 0` has been applied. So this collector treats a well-formed file
 * reporting zero sessions as UNHEALTHY, with a reason that names the incident.
 * Zero traffic on a live site is not a measurement; it is a measurement
 * failure until proven otherwise, and Playwright (§7.5) proves it either way.
 */

import { readValidated } from '../lib/read-validated.js';
import { ga4LatestOptions, ga4LatestSchema, type Ga4Latest } from '../schemas/index.js';
import {
  ageHours,
  describeError,
  envValue,
  guard,
  makeHealthy,
  makeUnhealthy,
  type CollectorResult,
} from './types.js';

const GA4_PATH = 'data/ga4/latest.json';
/**
 * PRD §7.2 table: data/ga4/latest.json — 8 days, ≥1 session row. The schema and
 * the SLA both come from scripts/schemas/ga4-latest.ts; this collector does not
 * keep a second, looser opinion about what a valid GA4 pull looks like.
 */
const SLA_HOURS = ga4LatestOptions.maxAgeHours === undefined ? 8 * 24 : ga4LatestOptions.maxAgeHours;

export interface Ga4Collected {
  source: string;
  propertyId: string;
  propertyIdEnvMatches: boolean | null;
  pulledAt: string;
  ageHours: number | null;
  slaHours: number;
  dateRange: unknown;
  totals: Ga4Latest['totals'];
  pageCount: number;
  channelGroups: Ga4Latest['channelGroups'];
  affiliateClickTotal: number;
  /** Days inside the window that recorded zero sessions — the CSP tell. */
  zeroSessionDays: string[];
  aiReferralSessions: number;
}

/** Days with no sessions at all. Pure — unit-tested. */
export function zeroSessionDays(trend: Array<{ date: string; sessions: number }>): string[] {
  return trend.filter((d) => d.sessions === 0).map((d) => d.date);
}

export async function collect(): Promise<CollectorResult<Ga4Collected>> {
  return guard('ga4', async () => {
    let parsed: Ga4Latest;
    try {
      parsed = readValidated(GA4_PATH, ga4LatestSchema, ga4LatestOptions);
    } catch (error) {
      return makeUnhealthy<Ga4Collected>(
        `${describeError(error)}. data/ga4/latest.json is written by \`npm run ga4:pull\` in the Monday workflow — ` +
          `check that job and GA4_PROPERTY_ID / the service account's Viewer role on the property.`
      );
    }

    const envProperty = envValue('GA4_PROPERTY_ID');
    const affiliateClickTotal = parsed.affiliateClicks.reduce((sum, row) => sum + row.eventCount, 0);
    const aiReferralSessions = parsed.trafficSources
      .filter((s) => /chatgpt|perplexity|claude|copilot|gemini/i.test(s.source))
      .reduce((sum, s) => sum + s.sessions, 0);

    const data: Ga4Collected = {
      source: GA4_PATH,
      propertyId: parsed.propertyId,
      propertyIdEnvMatches: envProperty === null ? null : envProperty === parsed.propertyId,
      pulledAt: parsed.pulledAt,
      ageHours: ageHours(parsed.pulledAt),
      slaHours: SLA_HOURS,
      dateRange: parsed.dateRange,
      totals: parsed.totals,
      pageCount: parsed.pages.length,
      channelGroups: parsed.channelGroups,
      affiliateClickTotal,
      zeroSessionDays: zeroSessionDays(parsed.dailyTrend),
      aiReferralSessions,
    };

    const problems: string[] = [];

    if (parsed.totals.sessions === 0) {
      problems.push(
        `GA4 reports 0 sessions across ${parsed.dateRange.days} days on a live site. Treat as a measurement failure, ` +
          `not as traffic: this is the signature of the 2026-06-16 CSP incident, which blocked collection for a month ` +
          `while every dashboard looked healthy. Confirm with a Playwright network assertion that gtag actually fires.`
      );
    }

    if (data.propertyIdEnvMatches === false) {
      problems.push(
        `GA4_PROPERTY_ID=${envProperty} but ${GA4_PATH} was pulled from property ${parsed.propertyId} — ` +
          `the collector is reading an artifact from a different property than the one configured.`
      );
    }

    if (problems.length > 0) {
      return makeUnhealthy<Ga4Collected>(problems.join(' | '), data, parsed.pages.length);
    }
    return makeHealthy(data, parsed.pages.length);
  });
}

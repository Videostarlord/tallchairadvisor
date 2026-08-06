/**
 * collectors/quotas.ts — remaining quota per paid/metered service (PRD §7.4).
 *
 * WHY THIS IS A COLLECTOR AND NOT A DASHBOARD
 * data/cost-ledger.jsonl records what we SPENT. It cannot record what we have
 * LEFT — that number lives at the vendor, moves when other tools spend it, and
 * resets on a billing cycle nobody tracks locally. Running out of SerpAPI
 * credits mid-month makes competitor-intelligence.ts silently thin, which
 * looks exactly like "no competitors moved this week".
 *
 * Every number here comes from a live account endpoint. Where a vendor exposes
 * no such endpoint, this collector says so and reports nothing — it does not
 * subtract the local ledger from a remembered plan size and call the result a
 * balance.
 *
 * KNOWN FREE-TIER SIZES (from the workspace's own API-limits note): SerpAPI
 * 250 credits/month; Firecrawl 500 pages/month. They are recorded as
 * `knownFreeTierLimit` and used ONLY to compute a percentage when the vendor
 * does not return a plan size. They are never used in place of a live reading.
 *
 * METERING: none of these account endpoints consume quota, so none is metered.
 * DataForSEO returns `cost` on every response; it is recorded verbatim when
 * non-zero, and skipped when zero because a zero-cost call consumed nothing
 * and 365 zero-rows a year is noise, not accounting.
 */

import { z } from 'zod';
import { meterExternal } from '../lib/metered-client.js';
import {
  describeError,
  fetchWithTimeout,
  firstEnv,
  guard,
  httpReason,
  makeHealthy,
  makeUnhealthy,
  nameList,
  runId,
  type CollectorResult,
} from './types.js';

const SERPAPI_ENV = ['SERP_API_KEY', 'SERPAPI_KEY'];
const FIRECRAWL_ENV = ['FIRECRAWL_API_KEY'];
const DFS_USER_ENV = ['DATAFORSEO_USERNAME', 'DATAFORSEO_LOGIN'];
const DFS_PASS_ENV = ['DATAFORSEO_PASSWORD'];

/** Free-tier sizes. Used only to derive a percentage, never as a balance. */
const SERPAPI_FREE_TIER = 250;
const FIRECRAWL_FREE_TIER = 500;

export interface QuotaEntry {
  service: string;
  envVars: string[];
  configured: boolean;
  unit: 'credits' | 'pages' | 'usd';
  /** Live readings. null means "not obtained" — never 0-as-unknown. */
  used: number | null;
  remaining: number | null;
  limit: number | null;
  pctRemaining: number | null;
  knownFreeTierLimit: number | null;
  detail: Record<string, unknown> | null;
  error: string | null;
}

export interface QuotasCollected {
  services: QuotaEntry[];
  configured: number;
  live: number;
  /** Services whose remaining quota is under 20% — worth acting on. */
  low: string[];
}

/** Percentage remaining, 1 decimal. Pure — unit-tested. */
export function pctRemaining(remaining: number | null, limit: number | null): number | null {
  if (remaining === null || limit === null || limit <= 0) return null;
  return Math.round((remaining / limit) * 1000) / 10;
}

function blank(service: string, envVars: string[], unit: QuotaEntry['unit'], freeTier: number | null): QuotaEntry {
  return {
    service,
    envVars,
    configured: false,
    unit,
    used: null,
    remaining: null,
    limit: null,
    pctRemaining: null,
    knownFreeTierLimit: freeTier,
    detail: null,
    error: null,
  };
}

// ─── SerpAPI ──────────────────────────────────────────────────────────────────

const SerpAccountSchema = z
  .object({
    plan_name: z.string().optional(),
    searches_per_month: z.number().optional(),
    plan_searches_left: z.number().optional(),
    extra_credits: z.number().optional(),
    total_searches_left: z.number().optional(),
    this_month_usage: z.number().optional(),
    account_rate_limit_per_hour: z.number().optional(),
  })
  .passthrough();

async function serpapi(): Promise<QuotaEntry> {
  const entry = blank('serpapi', SERPAPI_ENV, 'credits', SERPAPI_FREE_TIER);
  const key = firstEnv(...SERPAPI_ENV);
  if (key === null) {
    entry.error = `${nameList(SERPAPI_ENV)} unset — cannot read SerpAPI balance (free tier is ${SERPAPI_FREE_TIER} searches/month; key at serpapi.com → Your Account → API Key)`;
    return entry;
  }
  entry.configured = true;
  try {
    const response = await fetchWithTimeout(`https://serpapi.com/account?api_key=${encodeURIComponent(key.value)}`);
    if (!response.ok) {
      entry.error = await httpReason('SerpAPI /account', response, `key from $${key.name}`);
      return entry;
    }
    const parsed = SerpAccountSchema.safeParse(await response.json());
    if (!parsed.success) {
      entry.error = `SerpAPI /account returned an unexpected shape — ${parsed.error.issues[0].message}`;
      return entry;
    }
    const account = parsed.data;
    entry.used = account.this_month_usage ?? null;
    entry.remaining = account.total_searches_left ?? account.plan_searches_left ?? null;
    entry.limit = account.searches_per_month ?? SERPAPI_FREE_TIER;
    entry.pctRemaining = pctRemaining(entry.remaining, entry.limit);
    entry.detail = {
      plan: account.plan_name ?? null,
      planSearchesLeft: account.plan_searches_left ?? null,
      extraCredits: account.extra_credits ?? null,
      rateLimitPerHour: account.account_rate_limit_per_hour ?? null,
    };
  } catch (error) {
    entry.error = `SerpAPI /account unreachable — ${describeError(error)}`;
  }
  return entry;
}

// ─── Firecrawl ────────────────────────────────────────────────────────────────

const FirecrawlCreditSchema = z
  .object({
    success: z.boolean().optional(),
    data: z
      .object({
        remaining_credits: z.number().optional(),
        plan_credits: z.number().optional(),
        billing_period_start: z.string().nullable().optional(),
        billing_period_end: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

async function firecrawl(): Promise<QuotaEntry> {
  const entry = blank('firecrawl', FIRECRAWL_ENV, 'pages', FIRECRAWL_FREE_TIER);
  const key = firstEnv(...FIRECRAWL_ENV);
  if (key === null) {
    entry.error = `${nameList(FIRECRAWL_ENV)} unset — cannot read Firecrawl balance (free tier is ${FIRECRAWL_FREE_TIER} pages/month; key at firecrawl.dev → API Keys)`;
    return entry;
  }
  entry.configured = true;
  try {
    const response = await fetchWithTimeout('https://api.firecrawl.dev/v1/team/credit-usage', {
      headers: { Authorization: `Bearer ${key.value}` },
    });
    if (!response.ok) {
      entry.error = await httpReason(
        'Firecrawl /v1/team/credit-usage',
        response,
        response.status === 404
          ? 'endpoint not available on this account/API version — remaining pages cannot be read live'
          : `key from $${key.name}`
      );
      return entry;
    }
    const parsed = FirecrawlCreditSchema.safeParse(await response.json());
    if (!parsed.success || parsed.data.data === undefined) {
      entry.error = 'Firecrawl credit-usage returned no `data` object — remaining pages not readable';
      return entry;
    }
    const payload = parsed.data.data;
    entry.remaining = payload.remaining_credits ?? null;
    entry.limit = payload.plan_credits ?? FIRECRAWL_FREE_TIER;

    // Firecrawl grants roll over, so `remaining` can legitimately exceed the
    // plan's monthly allotment. The first live run showed remaining 19306
    // against plan_credits 1000, which naively produced "used: -18306, 1930%
    // remaining". A negative usage figure is not a reading, it is a broken
    // subtraction — so both derived numbers are withheld rather than printed.
    const rollover = entry.remaining !== null && entry.limit !== null && entry.remaining > entry.limit;
    entry.used = rollover || entry.remaining === null || entry.limit === null ? null : entry.limit - entry.remaining;
    entry.pctRemaining = rollover ? null : pctRemaining(entry.remaining, entry.limit);
    entry.detail = {
      planCredits: payload.plan_credits ?? null,
      rolloverOrGrantExceedsPlan: rollover,
      note: rollover
        ? 'remaining exceeds plan_credits (rollover/grant credits) — usage and % withheld rather than computed negative'
        : null,
      billingPeriodStart: payload.billing_period_start ?? null,
      billingPeriodEnd: payload.billing_period_end ?? null,
    };
  } catch (error) {
    entry.error = `Firecrawl credit-usage unreachable — ${describeError(error)}`;
  }
  return entry;
}

// ─── DataForSEO ───────────────────────────────────────────────────────────────

const DfsUserSchema = z
  .object({
    status_code: z.number(),
    status_message: z.string().optional(),
    cost: z.number().optional(),
    tasks: z
      .array(
        z
          .object({
            status_code: z.number().optional(),
            status_message: z.string().optional(),
            result: z
              .array(
                z
                  .object({
                    login: z.string().optional(),
                    money: z
                      .object({ balance: z.number().optional(), total: z.number().optional() })
                      .passthrough()
                      .optional(),
                    rates: z.object({}).passthrough().optional(),
                    limits: z.object({}).passthrough().optional(),
                  })
                  .passthrough()
              )
              .nullable()
              .optional(),
          })
          .passthrough()
      )
      .nullable()
      .optional(),
  })
  .passthrough();

async function dataforseo(): Promise<QuotaEntry> {
  const entry = blank('dataforseo', [...DFS_USER_ENV, ...DFS_PASS_ENV], 'usd', null);
  const user = firstEnv(...DFS_USER_ENV);
  const pass = firstEnv(...DFS_PASS_ENV);
  if (user === null || pass === null) {
    const missing = [user === null ? nameList(DFS_USER_ENV) : null, pass === null ? nameList(DFS_PASS_ENV) : null]
      .filter((m) => m !== null)
      .join(' and ');
    entry.error = `${missing} unset — cannot read DataForSEO balance (credentials at dataforseo.com → API Dashboard)`;
    return entry;
  }
  entry.configured = true;
  try {
    const auth = Buffer.from(`${user.value}:${pass.value}`).toString('base64');
    const response = await fetchWithTimeout('https://api.dataforseo.com/v3/appendix/user_data', {
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      entry.error = await httpReason('DataForSEO /v3/appendix/user_data', response, `credentials from $${user.name}`);
      return entry;
    }
    const parsed = DfsUserSchema.safeParse(await response.json());
    if (!parsed.success) {
      entry.error = `DataForSEO user_data returned an unexpected shape — ${parsed.error.issues[0].message}`;
      return entry;
    }
    const payload = parsed.data;
    if (payload.status_code !== 20000) {
      entry.error = `DataForSEO user_data status ${payload.status_code}: ${payload.status_message ?? 'no message'}`;
      return entry;
    }
    const result = payload.tasks?.[0]?.result?.[0];
    entry.remaining = result?.money?.balance ?? null;
    entry.limit = null; // prepaid balance — there is no monthly ceiling to divide by
    entry.detail = { login: result?.login ?? null, limits: result?.limits ?? null };

    // "DataForSEO returns `cost` per response — record verbatim" (PRD §7.1).
    const cost = payload.cost;
    if (typeof cost === 'number' && cost > 0) {
      meterExternal({
        agent: 'collector-quotas',
        run: runId(),
        purpose: 'user_data',
        service: 'dataforseo',
        unit: 'usd',
        amount: cost,
      });
    }
  } catch (error) {
    entry.error = `DataForSEO user_data unreachable — ${describeError(error)}`;
  }
  return entry;
}

// ─── Collector ────────────────────────────────────────────────────────────────

export async function collect(): Promise<CollectorResult<QuotasCollected>> {
  return guard('quotas', async () => {
    const services = await Promise.all([serpapi(), firecrawl(), dataforseo()]);

    const live = services.filter((s) => s.error === null).length;
    const data: QuotasCollected = {
      services,
      configured: services.filter((s) => s.configured).length,
      live,
      low: services.filter((s) => s.pctRemaining !== null && s.pctRemaining < 20).map((s) => s.service),
    };

    const failed = services.filter((s) => s.error !== null);
    if (failed.length > 0) {
      return makeUnhealthy<QuotasCollected>(
        failed.map((s) => `${s.service}: ${s.error}`).join(' | '),
        data,
        live
      );
    }
    return makeHealthy(data, live);
  });
}

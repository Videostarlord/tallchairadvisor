/**
 * collectors/cloudflare.ts — deployment, build status, cache hit rate, WAF
 * events, straight from the Cloudflare REST + GraphQL APIs (PRD §7.4).
 *
 * STATUS: WRITTEN IN FULL, NEVER YET EXECUTED AGAINST THE LIVE API.
 * CLOUDFLARE_API_TOKEN is the PRD §10.1 prerequisite Jackson has not supplied,
 * so at the time of writing this collector has only ever taken its no-token
 * branch. Nothing here is stubbed, mocked, or faked — the calls are the real
 * documented endpoints — but the field-shape assertions below are validated by
 * zod at runtime rather than proven by a live response. If a field name is
 * wrong, this collector will report `healthy: false` with the schema mismatch
 * named. It will never invent a deployment id.
 *
 * WHY THIS MATTERS AT ALL
 * Everything else in the nightly observes what the *pipeline* did. This is the
 * only collector that observes what the *edge* did: whether the last commit
 * actually built, whether the cache is serving, whether the WAF started
 * blocking real users. A green GitHub Action with a failed Pages build is a
 * shipped-nothing week that currently looks identical to a shipped-everything
 * week.
 *
 * TOKEN SCOPES REQUIRED
 *   Account → Cloudflare Pages : Read      (deployments, build status)
 *   Zone    → Analytics        : Read      (cache hit rate)
 *   Zone    → Firewall Services: Read      (WAF events)
 * A token missing one scope yields a 403 on that call only; the collector
 * reports which capability is missing rather than failing wholesale.
 */

import { z } from 'zod';
import {
  bodySnippet,
  describeError,
  envValue,
  fetchWithTimeout,
  guard,
  httpReason,
  makeHealthy,
  makeUnhealthy,
  MS_PER_DAY,
  type CollectorResult,
} from './types.js';

const API = 'https://api.cloudflare.com/client/v4';
const GRAPHQL = `${API}/graphql`;
const SITE_DOMAIN = 'tallchairadvisor.com';

/** The exact reason PRD §10.1 expects to see until the token exists. */
const NO_TOKEN_REASON =
  'CLOUDFLARE_API_TOKEN not set — see PRD §10.1 (token needs Account → Cloudflare Pages:Read, ' +
  'Zone → Analytics:Read, and Zone → Firewall Services:Read; add it to .env locally and as a repo secret ' +
  'so nightly.yml can pass it)';

// ─── Response schemas (validated at runtime; never assumed) ───────────────────

const ApiError = z.array(z.object({ code: z.number().optional(), message: z.string() }).passthrough());

const TokenVerifySchema = z.object({
  success: z.boolean(),
  errors: ApiError,
  result: z.object({ id: z.string(), status: z.string() }).passthrough().nullable(),
});

const AccountsSchema = z.object({
  success: z.boolean(),
  errors: ApiError,
  result: z.array(z.object({ id: z.string(), name: z.string() }).passthrough()).nullable(),
});

const ProjectsSchema = z.object({
  success: z.boolean(),
  errors: ApiError,
  result: z
    .array(
      z
        .object({
          name: z.string(),
          subdomain: z.string().optional(),
          domains: z.array(z.string()).optional(),
          production_branch: z.string().optional(),
        })
        .passthrough()
    )
    .nullable(),
});

const DeploymentsSchema = z.object({
  success: z.boolean(),
  errors: ApiError,
  result: z
    .array(
      z
        .object({
          id: z.string(),
          short_id: z.string().optional(),
          environment: z.string().optional(),
          url: z.string().optional(),
          created_on: z.string().optional(),
          modified_on: z.string().optional(),
          latest_stage: z
            .object({
              name: z.string().optional(),
              status: z.string().optional(),
              started_on: z.string().nullable().optional(),
              ended_on: z.string().nullable().optional(),
            })
            .passthrough()
            .nullable()
            .optional(),
          deployment_trigger: z
            .object({
              type: z.string().optional(),
              metadata: z
                .object({
                  branch: z.string().optional(),
                  commit_hash: z.string().optional(),
                  commit_message: z.string().optional(),
                })
                .passthrough()
                .optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough()
    )
    .nullable(),
});

const ZonesSchema = z.object({
  success: z.boolean(),
  errors: ApiError,
  result: z.array(z.object({ id: z.string(), name: z.string(), plan: z.object({ name: z.string() }).passthrough().optional() }).passthrough()).nullable(),
});

const CacheGraphSchema = z.object({
  errors: z.array(z.object({ message: z.string() }).passthrough()).nullable().optional(),
  data: z
    .object({
      viewer: z.object({
        zones: z.array(
          z.object({
            httpRequests1dGroups: z.array(
              z.object({
                dimensions: z.object({ date: z.string() }),
                sum: z.object({
                  requests: z.number(),
                  cachedRequests: z.number(),
                  bytes: z.number(),
                  cachedBytes: z.number(),
                }),
              })
            ),
          })
        ),
      }),
    })
    .nullable()
    .optional(),
});

const WafGraphSchema = z.object({
  errors: z.array(z.object({ message: z.string() }).passthrough()).nullable().optional(),
  data: z
    .object({
      viewer: z.object({
        zones: z.array(
          z.object({
            firewallEventsAdaptiveGroups: z.array(
              z.object({
                count: z.number(),
                dimensions: z.object({ action: z.string(), source: z.string() }),
              })
            ),
          })
        ),
      }),
    })
    .nullable()
    .optional(),
});

// ─── Public shape ─────────────────────────────────────────────────────────────

export interface CloudflareCollected {
  token: { valid: boolean; status: string | null };
  accountId: string | null;
  zone: { id: string; name: string; plan: string | null } | null;
  pages: {
    project: string;
    deploymentId: string;
    shortId: string | null;
    environment: string | null;
    url: string | null;
    createdOn: string | null;
    stage: string | null;
    /** 'success' | 'failure' | 'active' | 'canceled' … Cloudflare's own value. */
    status: string | null;
    branch: string | null;
    commitHash: string | null;
    commitMessage: string | null;
  } | null;
  cache: {
    windowDays: number;
    requests: number;
    cachedRequests: number;
    hitRatePct: number;
    bytes: number;
    cachedBytes: number;
    byDay: Array<{ date: string; requests: number; cachedRequests: number; hitRatePct: number }>;
  } | null;
  waf: { windowDays: number; totalEvents: number; byAction: Record<string, number>; bySource: Record<string, number> } | null;
  /** Capabilities that failed, with the reason each failed. Never silently dropped. */
  unavailable: Array<{ capability: string; reason: string }>;
}

/** requests → cache hit percentage, 1 decimal. Pure — unit-tested. */
export function hitRate(requests: number, cachedRequests: number): number {
  if (requests <= 0) return 0;
  return Math.round((cachedRequests / requests) * 1000) / 10;
}

function isoDate(offsetDays: number): string {
  return new Date(Date.now() - offsetDays * MS_PER_DAY).toISOString().slice(0, 10);
}

async function cfGet<T>(path: string, token: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetchWithTimeout(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(await httpReason(`Cloudflare API ${path}`, response));
  }
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(`Cloudflare API ${path} returned an unexpected shape — ${parsed.error.issues[0].message} at '${parsed.error.issues[0].path.join('.')}'`);
  }
  return parsed.data;
}

async function cfGraphql<T>(token: string, query: string, variables: Record<string, unknown>, schema: z.ZodType<T>): Promise<T> {
  const response = await fetchWithTimeout(GRAPHQL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    const snippet = await bodySnippet(response);
    throw new Error(`Cloudflare GraphQL ${response.status} ${response.statusText}: ${snippet}`);
  }
  const payload = await response.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Cloudflare GraphQL returned an unexpected shape — ${parsed.error.issues[0].message} at '${parsed.error.issues[0].path.join('.')}'`);
  }
  return parsed.data;
}

function graphqlErrors(errors: Array<{ message: string }> | null | undefined): string | null {
  if (errors === null || errors === undefined || errors.length === 0) return null;
  return errors.map((e) => e.message).join('; ');
}

const CACHE_QUERY = `
query CacheHitRate($zoneTag: String!, $since: Date!, $until: Date!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(limit: 7, filter: { date_geq: $since, date_leq: $until }, orderBy: [date_DESC]) {
        dimensions { date }
        sum { requests cachedRequests bytes cachedBytes }
      }
    }
  }
}`;

const WAF_QUERY = `
query WafEvents($zoneTag: String!, $since: Time!, $until: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      firewallEventsAdaptiveGroups(limit: 20, filter: { datetime_geq: $since, datetime_leq: $until }, orderBy: [count_DESC]) {
        count
        dimensions { action source }
      }
    }
  }
}`;

export async function collect(): Promise<CollectorResult<CloudflareCollected>> {
  return guard('cloudflare', async () => {
    const token = envValue('CLOUDFLARE_API_TOKEN');
    if (token === null) {
      return makeUnhealthy<CloudflareCollected>(NO_TOKEN_REASON);
    }

    const unavailable: Array<{ capability: string; reason: string }> = [];

    // 1 ─ token validity. Everything else is meaningless if this fails.
    let tokenStatus: string | null = null;
    try {
      const verify = await cfGet('/user/tokens/verify', token, TokenVerifySchema);
      tokenStatus = verify.result === null ? null : verify.result.status;
      if (!verify.success || tokenStatus !== 'active') {
        return makeUnhealthy<CloudflareCollected>(
          `CLOUDFLARE_API_TOKEN is set but not active (status: ${tokenStatus === null ? 'unknown' : tokenStatus}` +
            `${verify.errors.length > 0 ? `; ${verify.errors.map((e) => e.message).join('; ')}` : ''}). Rotate it in ` +
            `Cloudflare → My Profile → API Tokens.`
        );
      }
    } catch (error) {
      return makeUnhealthy<CloudflareCollected>(
        `CLOUDFLARE_API_TOKEN could not be verified — ${describeError(error)}`
      );
    }

    // 2 ─ account
    let accountId = envValue('CLOUDFLARE_ACCOUNT_ID');
    if (accountId === null) {
      try {
        const accounts = await cfGet('/accounts?per_page=50', token, AccountsSchema);
        const list = accounts.result;
        if (list === null || list.length === 0) {
          unavailable.push({
            capability: 'account',
            reason: 'token is active but lists no accounts — it likely lacks Account-level scopes; set CLOUDFLARE_ACCOUNT_ID explicitly',
          });
        } else if (list.length > 1) {
          accountId = list[0].id;
          unavailable.push({
            capability: 'account-disambiguation',
            reason: `token sees ${list.length} accounts (${list.map((a) => a.name).join(', ')}); used the first. Set CLOUDFLARE_ACCOUNT_ID to be explicit`,
          });
        } else {
          accountId = list[0].id;
        }
      } catch (error) {
        unavailable.push({ capability: 'account', reason: describeError(error) });
      }
    }

    // 3 ─ Pages project + latest production deployment
    let pages: CloudflareCollected['pages'] = null;
    if (accountId === null) {
      unavailable.push({ capability: 'pages-deployment', reason: 'no account id resolved — cannot query Pages projects' });
    } else {
      try {
        let project = envValue('CLOUDFLARE_PAGES_PROJECT');
        if (project === null) {
          const projects = await cfGet(`/accounts/${accountId}/pages/projects`, token, ProjectsSchema);
          const list = projects.result === null ? [] : projects.result;
          const matched =
            list.find((p) => (p.domains === undefined ? [] : p.domains).some((d) => d.endsWith(SITE_DOMAIN))) ??
            (list.length === 1 ? list[0] : undefined);
          if (matched === undefined) {
            throw new Error(
              `no Pages project serves ${SITE_DOMAIN} (saw: ${list.map((p) => p.name).join(', ') || 'none'}). ` +
                `Set CLOUDFLARE_PAGES_PROJECT to the project name.`
            );
          }
          project = matched.name;
        }

        const deployments = await cfGet(
          `/accounts/${accountId}/pages/projects/${encodeURIComponent(project)}/deployments?env=production&per_page=1`,
          token,
          DeploymentsSchema
        );
        const latest = deployments.result === null ? undefined : deployments.result[0];
        if (latest === undefined) {
          throw new Error(`Pages project "${project}" has no production deployments`);
        }
        const trigger = latest.deployment_trigger;
        pages = {
          project,
          deploymentId: latest.id,
          shortId: latest.short_id === undefined ? null : latest.short_id,
          environment: latest.environment === undefined ? null : latest.environment,
          url: latest.url === undefined ? null : latest.url,
          createdOn: latest.created_on === undefined ? null : latest.created_on,
          stage: latest.latest_stage === undefined || latest.latest_stage === null ? null : (latest.latest_stage.name ?? null),
          status: latest.latest_stage === undefined || latest.latest_stage === null ? null : (latest.latest_stage.status ?? null),
          branch: trigger?.metadata?.branch ?? null,
          commitHash: trigger?.metadata?.commit_hash ?? null,
          commitMessage: trigger?.metadata?.commit_message ?? null,
        };
      } catch (error) {
        unavailable.push({ capability: 'pages-deployment', reason: describeError(error) });
      }
    }

    // 4 ─ zone (needed for both analytics queries)
    let zone: CloudflareCollected['zone'] = null;
    const zoneIdEnv = envValue('CLOUDFLARE_ZONE_ID');
    try {
      if (zoneIdEnv !== null) {
        zone = { id: zoneIdEnv, name: SITE_DOMAIN, plan: null };
      } else {
        const zones = await cfGet(`/zones?name=${SITE_DOMAIN}`, token, ZonesSchema);
        const found = zones.result === null ? undefined : zones.result[0];
        if (found === undefined) {
          throw new Error(`no zone named ${SITE_DOMAIN} visible to this token (needs Zone → Analytics:Read on that zone)`);
        }
        zone = { id: found.id, name: found.name, plan: found.plan === undefined ? null : found.plan.name };
      }
    } catch (error) {
      unavailable.push({ capability: 'zone', reason: describeError(error) });
    }

    // 5 ─ cache hit rate (7-day window)
    let cache: CloudflareCollected['cache'] = null;
    if (zone === null) {
      unavailable.push({ capability: 'cache-hit-rate', reason: 'no zone resolved — cannot query zone analytics' });
    } else {
      try {
        const result = await cfGraphql(token, CACHE_QUERY, { zoneTag: zone.id, since: isoDate(7), until: isoDate(0) }, CacheGraphSchema);
        const gqlError = graphqlErrors(result.errors);
        if (gqlError !== null) throw new Error(gqlError);
        const groups = result.data?.viewer.zones[0]?.httpRequests1dGroups;
        if (groups === undefined) throw new Error('zone analytics returned no httpRequests1dGroups for this zone');
        const requests = groups.reduce((s, g) => s + g.sum.requests, 0);
        const cachedRequests = groups.reduce((s, g) => s + g.sum.cachedRequests, 0);
        cache = {
          windowDays: 7,
          requests,
          cachedRequests,
          hitRatePct: hitRate(requests, cachedRequests),
          bytes: groups.reduce((s, g) => s + g.sum.bytes, 0),
          cachedBytes: groups.reduce((s, g) => s + g.sum.cachedBytes, 0),
          byDay: groups.map((g) => ({
            date: g.dimensions.date,
            requests: g.sum.requests,
            cachedRequests: g.sum.cachedRequests,
            hitRatePct: hitRate(g.sum.requests, g.sum.cachedRequests),
          })),
        };
      } catch (error) {
        unavailable.push({ capability: 'cache-hit-rate', reason: describeError(error) });
      }
    }

    // 6 ─ WAF events (24-hour window; free-plan retention is short)
    let waf: CloudflareCollected['waf'] = null;
    if (zone === null) {
      unavailable.push({ capability: 'waf-events', reason: 'no zone resolved — cannot query firewall events' });
    } else {
      try {
        const since = new Date(Date.now() - MS_PER_DAY).toISOString();
        const until = new Date().toISOString();
        const result = await cfGraphql(token, WAF_QUERY, { zoneTag: zone.id, since, until }, WafGraphSchema);
        const gqlError = graphqlErrors(result.errors);
        if (gqlError !== null) throw new Error(gqlError);
        const groups = result.data?.viewer.zones[0]?.firewallEventsAdaptiveGroups;
        if (groups === undefined) throw new Error('firewallEventsAdaptiveGroups unavailable for this zone/plan');
        const byAction: Record<string, number> = {};
        const bySource: Record<string, number> = {};
        for (const g of groups) {
          byAction[g.dimensions.action] = (byAction[g.dimensions.action] === undefined ? 0 : byAction[g.dimensions.action]) + g.count;
          bySource[g.dimensions.source] = (bySource[g.dimensions.source] === undefined ? 0 : bySource[g.dimensions.source]) + g.count;
        }
        waf = { windowDays: 1, totalEvents: groups.reduce((s, g) => s + g.count, 0), byAction, bySource };
      } catch (error) {
        unavailable.push({ capability: 'waf-events', reason: describeError(error) });
      }
    }

    const data: CloudflareCollected = {
      token: { valid: true, status: tokenStatus },
      accountId,
      zone,
      pages,
      cache,
      waf,
      unavailable,
    };

    const rowCount = (pages === null ? 0 : 1) + (cache === null ? 0 : 1) + (waf === null ? 0 : 1);

    if (unavailable.length > 0) {
      return makeUnhealthy<CloudflareCollected>(
        unavailable.map((u) => `${u.capability}: ${u.reason}`).join(' | '),
        data,
        rowCount
      );
    }

    // A failed build is healthy COLLECTION of a bad fact — the report escalates it,
    // the collector does not pretend it could not see.
    return makeHealthy(data, rowCount);
  });
}

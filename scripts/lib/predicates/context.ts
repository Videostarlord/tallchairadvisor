/**
 * predicates/context.ts — assemble tonight's evidence before any predicate runs.
 *
 * Every input here is OPTIONAL BY DESIGN. Probes (§7.5) and collectors (§7.4) are
 * being built in parallel and may not exist on disk at all. The context records
 * WHY each source is missing rather than substituting a plausible empty value, so
 * the resulting verdict is `unevaluable: "no probe file for 2026-08-05"` instead of
 * a fabricated pass. A missing input must be visible; that is the whole PRD.
 */

import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';
import {
  ContractViolation,
  REPO_ROOT,
  readValidatedIfExists,
} from '../read-validated.js';
import { loadRedirectMap } from '../../redirect-map.js';
import { normalizePath } from './http.js';
import type { CollectorEnvelope, EvalContext, ProbeRecord } from './types.js';

export const BASE_URL = 'https://tallchairadvisor.com';

/** Permissive: the probe record shape is owned by scripts/probes/, which is in flight. */
const ProbeRecordSchema = z.object({ url: z.string() }).passthrough();

const ProbeFileSchema = z.union([
  z.array(ProbeRecordSchema),
  z.object({ results: z.array(ProbeRecordSchema) }).passthrough(),
  z.object({ probes: z.array(ProbeRecordSchema) }).passthrough(),
  z.object({ pages: z.array(ProbeRecordSchema) }).passthrough(),
]);

const CollectorEnvelopeSchema = z.object({
  data: z.unknown(),
  meta: z.object({
    collectedAt: z.string(),
    rowCount: z.number(),
    healthy: z.boolean(),
    reason: z.string().nullable(),
  }),
});

const AnalysisSchema = z.object({
  generatedAt: z.string(),
  opportunities: z.array(
    z.object({
      page: z.string(),
      impressions: z.number(),
      position: z.number(),
      ctr: z.number(),
    }).passthrough(),
  ),
}).passthrough();

const VerifiedAsinsSchema = z.object({
  asins: z.record(z.unknown()),
  known_dead: z.record(z.unknown()).optional(),
}).passthrough();

function toRows(parsed: z.infer<typeof ProbeFileSchema>): ProbeRecord[] {
  if (Array.isArray(parsed)) return parsed as ProbeRecord[];
  const container = parsed as Record<string, unknown>;
  for (const key of ['results', 'probes', 'pages']) {
    const value = container[key];
    if (Array.isArray(value)) return value as ProbeRecord[];
  }
  return [];
}

/** Newest data/probes/YYYY-MM-DD.json at or before `today`, or null with a reason. */
function loadProbes(
  repoRoot: string,
  today: string,
): { probes: Map<string, ProbeRecord> | null; source: string | null; reason: string | null } {
  const dir = resolve(repoRoot, 'data/probes');
  if (!existsSync(dir)) {
    return { probes: null, source: null, reason: 'data/probes/ does not exist — Playwright probes (PRD §7.5) are not built yet' };
  }
  const dated = readdirSync(dir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .map((name) => name.slice(0, 10))
    .filter((date) => date <= today)
    .sort();
  if (dated.length === 0) {
    return { probes: null, source: null, reason: `data/probes/ holds no YYYY-MM-DD.json at or before ${today}` };
  }
  const date = dated[dated.length - 1];
  const relPath = `data/probes/${date}.json`;
  try {
    const parsed = readValidatedIfExists(relPath, ProbeFileSchema, { label: 'probe results' });
    if (parsed === null) {
      return { probes: null, source: null, reason: `${relPath} vanished between listing and read` };
    }
    const map = new Map<string, ProbeRecord>();
    for (const row of toRows(parsed)) map.set(normalizePath(row.url), row);
    if (date !== today) {
      // Usable, but the report must know it is looking at last night's eyes.
      return { probes: map, source: `probe:${date}`, reason: `probe file is ${date}, not ${today}` };
    }
    return { probes: map, source: `probe:${date}`, reason: null };
  } catch (error) {
    if (error instanceof ContractViolation) {
      return { probes: null, source: null, reason: `probe file rejected by contract — ${error.message}` };
    }
    throw error;
  }
}

/** Every data/collectors/<name>.json that satisfies the §7.4 envelope. */
function loadCollectors(repoRoot: string): Map<string, CollectorEnvelope> {
  const out = new Map<string, CollectorEnvelope>();
  const dir = resolve(repoRoot, 'data/collectors');
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    // latest.json is collect-all's rollup across collectors, not a collector envelope.
    if (name === 'latest.json') continue;
    const collector = name.slice(0, -'.json'.length);
    try {
      const parsed = readValidatedIfExists(`data/collectors/${name}`, CollectorEnvelopeSchema, {
        label: `collector ${collector}`,
      });
      if (parsed !== null) out.set(collector, { data: parsed.data, meta: parsed.meta });
    } catch (error) {
      if (!(error instanceof ContractViolation)) throw error;
      // A collector file that violates its own envelope is NOT healthy data. Leaving
      // it out of the map makes every predicate over it read `unevaluable`, which is
      // the honest verdict; swallowing it into a healthy-looking record is not.
      console.warn(`[ledger] collector ${collector} ignored — ${error.message}`);
    }
  }
  return out;
}

/**
 * Page-level GSC metrics. Preference order:
 *   1. `pageMetricsFrom` in scripts/schemas/gsc-history.ts (owned by another agent,
 *      may not exist yet — imported defensively).
 *   2. the `gsc` collector envelope.
 *   3. data/gsc/analysis.json `opportunities`, under an 8-day freshness SLA.
 * Nothing available → null plus a reason. Never an empty map.
 */
async function loadGscMetrics(repoRoot: string): Promise<{
  metrics: Map<string, { ctr: number | null; position: number; impressions: number | null }> | null;
  source: string | null;
  reason: string | null;
}> {
  const reasons: string[] = [];

  // 1. In-flight schema helper.
  try {
    const mod = (await import('../../schemas/gsc-history.js')) as {
      pageMetricsFrom?: (snapshot: unknown) => Map<string, { ctr: number | null; position: number; impressions: number | null }>;
    };
    const snapshot = readValidatedIfExists('data/gsc/analysis.json', z.unknown(), { label: 'GSC analysis' });
    if (typeof mod.pageMetricsFrom === 'function' && snapshot !== null) {
      const metrics = mod.pageMetricsFrom(snapshot);
      if (metrics instanceof Map && metrics.size > 0) {
        const keyed = new Map<string, { ctr: number | null; position: number; impressions: number | null }>();
        for (const [page, value] of metrics) keyed.set(normalizePath(page), value);
        return { metrics: keyed, source: 'gsc:schemas/gsc-history.pageMetricsFrom', reason: null };
      }
    }
  } catch (error) {
    reasons.push(
      error instanceof ContractViolation
        ? `scripts/schemas/gsc-history.ts path rejected: ${error.message}`
        : 'scripts/schemas/gsc-history.ts not available',
    );
  }

  // 2. Collector envelope.
  const collectorFile = resolve(repoRoot, 'data/collectors/gsc.json');
  if (existsSync(collectorFile)) {
    try {
      const envelope = readValidatedIfExists('data/collectors/gsc.json', CollectorEnvelopeSchema, {
        label: 'collector gsc',
      });
      if (envelope !== null) {
        // Rows are used even when meta.healthy is false. collectors/types.ts is
        // explicit that partial data is never fabricated — an unhealthy collector
        // means "something is missing", not "what is here is wrong". Discarding
        // real rows because the run was incomplete would manufacture blindness.
        const rows = extractGscRows(envelope.data);
        if (rows !== null && rows.size > 0) {
          const health = envelope.meta.healthy ? '' : ' (collector unhealthy, rows still genuine)';
          return { metrics: rows, source: `collector:gsc${health}`, reason: null };
        }
        reasons.push(
          envelope.meta.healthy
            ? 'collector gsc carries no recognisable per-page metric rows'
            : `collector gsc is unhealthy and carries no per-page rows — ${envelope.meta.reason ?? 'no reason recorded'}`,
        );
      }
    } catch (error) {
      if (!(error instanceof ContractViolation)) throw error;
      reasons.push(`collector gsc rejected by contract — ${error.message}`);
    }
  } else {
    reasons.push('data/collectors/gsc.json does not exist');
  }

  // 3. analysis.json under its stated SLA.
  try {
    const analysis = readValidatedIfExists('data/gsc/analysis.json', AnalysisSchema, {
      label: 'GSC analysis',
      maxAgeHours: 8 * 24,
      timestampKey: 'generatedAt',
    });
    if (analysis === null) {
      reasons.push('data/gsc/analysis.json does not exist');
    } else {
      const metrics = new Map<string, { ctr: number | null; position: number; impressions: number | null }>();
      for (const row of analysis.opportunities) {
        metrics.set(normalizePath(row.page), {
          ctr: row.ctr,
          position: row.position,
          impressions: row.impressions,
        });
      }
      if (metrics.size > 0) {
        return { metrics, source: `gsc:analysis.json@${analysis.generatedAt}`, reason: null };
      }
      reasons.push('data/gsc/analysis.json has zero opportunity rows');
    }
  } catch (error) {
    if (!(error instanceof ContractViolation)) throw error;
    reasons.push(error.message);
  }

  return { metrics: null, source: null, reason: reasons.join('; ') };
}

/**
 * Best-effort read of per-page rows out of an unknown collector payload.
 *
 * `ctr` and `impressions` are nullable because a page can legitimately appear in
 * a source that carries no click data (pageVelocity has position but no clicks).
 * They were previously filled with NaN, which is exactly the "degraded but
 * plausible" value §7.2 bans: NaN silently loses every numeric comparison, so a
 * ctr-based predicate would quietly report `fail` on a page it never measured —
 * indistinguishable from a real regression. A predicate that needs a null field
 * must return `unevaluable` instead.
 */
function extractGscRows(
  data: unknown,
): Map<string, { ctr: number | null; position: number; impressions: number | null }> | null {
  if (data === null || typeof data !== 'object') return null;
  const container = data as Record<string, unknown>;
  for (const key of ['pages', 'rows', 'opportunities', 'pageMetrics']) {
    const value = container[key];
    if (!Array.isArray(value)) continue;
    const out = new Map<string, { ctr: number | null; position: number; impressions: number | null }>();
    for (const item of value) {
      if (item === null || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const page = typeof row.page === 'string' ? row.page : typeof row.url === 'string' ? row.url : null;
      if (page === null) continue;
      if (typeof row.position !== 'number') continue;
      out.set(normalizePath(page), {
        ctr: typeof row.ctr === 'number' ? row.ctr : null,
        position: row.position,
        impressions: typeof row.impressions === 'number' ? row.impressions : null,
      });
    }
    if (out.size > 0) return out;
  }
  return null;
}

function loadAsins(): { verified: Set<string> | null; dead: Set<string> } {
  try {
    const registry = readValidatedIfExists('data/verified-asins.json', VerifiedAsinsSchema, {
      label: 'verified ASIN registry',
    });
    if (registry === null) return { verified: null, dead: new Set() };
    const dead =
      registry.known_dead === undefined ? new Set<string>() : new Set(Object.keys(registry.known_dead));
    return { verified: new Set(Object.keys(registry.asins)), dead };
  } catch (error) {
    if (!(error instanceof ContractViolation)) throw error;
    console.warn(`[ledger] verified-asins.json unreadable — ${error.message}`);
    return { verified: null, dead: new Set() };
  }
}

export interface BuildContextOptions {
  repoRoot?: string;
  today?: string;
  now?: Date;
  baseUrl?: string;
  allowNetwork?: boolean;
}

export async function buildEvalContext(opts: BuildContextOptions = {}): Promise<EvalContext> {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const now = opts.now ?? new Date();
  const today = opts.today ?? now.toISOString().slice(0, 10);

  const probeState = loadProbes(repoRoot, today);
  const gscState = await loadGscMetrics(repoRoot);
  const asins = loadAsins();

  return {
    repoRoot,
    today,
    now,
    baseUrl: opts.baseUrl ?? BASE_URL,
    probes: probeState.probes,
    probeSource: probeState.source,
    probeReason: probeState.reason,
    collectors: loadCollectors(repoRoot),
    verifiedAsins: asins.verified,
    knownDeadAsins: asins.dead,
    redirects: loadRedirectMap(repoRoot),
    gscPageMetrics: gscState.metrics,
    gscSource: gscState.source,
    gscReason: gscState.reason,
    allowNetwork: opts.allowNetwork !== false,
    pageCache: new Map(),
    subject: null,
  };
}

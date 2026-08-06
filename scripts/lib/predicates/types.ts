/**
 * predicates/types.ts — the vocabulary of machine-evaluable closure.
 *
 * WHY THIS EXISTS
 * PRD §7.3: "a finding cannot be filed without a machine-evaluable closurePredicate.
 * If an agent cannot state how a fix would be verified, it does not get to claim the
 * problem exists." That rule is only worth anything if "machine-evaluable" is a
 * checkable property rather than a vibe, so every predicate kind is a zod schema
 * (see ./index.ts) and every evaluator returns one of exactly three verdicts.
 *
 * THE THIRD VERDICT IS THE POINT.
 * `unevaluable` is not a soft failure. It is the honest statement "the data that
 * would settle this was not available tonight". It must never be counted as pass
 * (that closes a live problem on no evidence) and never as fail (that escalates on
 * the system's own blindness — the exact failure mode this PRD exists to kill).
 * It is §7.6's `unverified` rule pushed down to the predicate layer.
 */

import type { ZodType } from 'zod';

// ─── Predicate kinds ───────────────────────────────────────────────────────────

export type ComparisonOp = '<' | '<=' | '>' | '>=' | '==';

export type ClosurePredicate =
  /** meta description length within [min, max] after HTML-entity decoding. */
  | { kind: 'meta-length'; url: string; min: number; max: number }
  /** probe recorded zero console errors / unhandled rejections. Probe-only. */
  | { kind: 'no-console-errors'; url: string }
  /** every /dp/<ASIN> on the page is in verified-asins.json and not known-dead. */
  | { kind: 'asin-registered'; url: string; minLinks?: number }
  /** GSC URL Inspection reports the URL indexed. Collector-only. */
  | { kind: 'gsc-indexed'; url: string }
  /** GSC average position satisfies `op value` once `afterDays` have elapsed. */
  | { kind: 'gsc-position'; url: string; op: ComparisonOp; value: number; afterDays: number }
  /** rel=canonical resolves to the URL itself. */
  | { kind: 'canonical-self'; url: string }
  /** a JSON-LD block of the named @type is present and parses. */
  | { kind: 'schema-valid'; url: string; type: string }
  /** Direct Answer block + citation capsule sentinel both present. */
  | { kind: 'geo-capsule'; url: string }
  /** network assertion confirms the tag fired. Probe-only. */
  | { kind: 'tag-fires'; url: string; tag: string }
  /** data/collectors/<collector>.json reports meta.healthy === true. */
  | { kind: 'collector-healthy'; collector: string };

export type PredicateKind = ClosurePredicate['kind'];

// ─── Verdicts ──────────────────────────────────────────────────────────────────

/**
 * Machine data that proved (or disproved) the predicate. Never prose — PRD success
 * criterion #2 is "every closed item has evidence attached", and a sentence of
 * English attached to a close is exactly the unfalsifiable claim this replaces.
 */
export interface Evidence {
  /** Where the observation came from: 'fetch:<url>' | 'probe:<date>' | 'collector:<name>' | 'gsc:analysis'. */
  source: string;
  /** ISO timestamp of the observation itself, not of the ledger write. */
  observedAt: string;
  /** The observed values, structured. */
  detail: Record<string, unknown>;
}

export type VerdictResult = 'pass' | 'fail' | 'unevaluable';

export interface PredicateVerdict {
  result: VerdictResult;
  reason: string;
  evidence: Evidence | null;
}

export type Evaluator = (p: ClosurePredicate, ctx: EvalContext) => Promise<PredicateVerdict>;

export function pass(reason: string, evidence: Evidence): PredicateVerdict {
  return { result: 'pass', reason, evidence };
}

export function fail(reason: string, evidence: Evidence | null = null): PredicateVerdict {
  return { result: 'fail', reason, evidence };
}

/**
 * The data needed to decide was not there. Not a failure of the site — a failure of
 * the system's own sight. Callers must not escalate on this.
 */
export function unevaluable(reason: string): PredicateVerdict {
  return { result: 'unevaluable', reason, evidence: null };
}

// ─── Evaluation context ────────────────────────────────────────────────────────

/** One probe record for one URL. Shape is owned by scripts/probes/ (§7.5, in flight),
 *  so it is read permissively and every field access is guarded. */
export type ProbeRecord = Record<string, unknown> & { url: string };

/** §7.4 uniform collector envelope. */
export interface CollectorEnvelope {
  data: unknown;
  meta: {
    collectedAt: string;
    rowCount: number;
    healthy: boolean;
    reason: string | null;
  };
}

export interface PageFetch {
  url: string;
  status: number;
  /** null when the fetch failed or the response was a redirect. */
  html: string | null;
  /** Non-null exactly when html is null. */
  reason: string | null;
  fetchedAt: string;
}

/** The ledger record under evaluation. Kept minimal so predicates never import the ledger. */
export interface PredicateSubject {
  id: string;
  firstSeen: string;
  lastSeen: string;
}

export interface EvalContext {
  repoRoot: string;
  /** ISO date, YYYY-MM-DD. */
  today: string;
  now: Date;
  /** Origin used to absolutise predicate paths. */
  baseUrl: string;
  /** url path (trailing-slashed) → probe record, or null when no probe file exists. */
  probes: Map<string, ProbeRecord> | null;
  /** Provenance label for probe evidence, e.g. 'probe:2026-08-05'. */
  probeSource: string | null;
  /** Why probe data is unavailable, quoted verbatim in unevaluable reasons. */
  probeReason: string | null;
  /** collector name → envelope. Absent collectors are simply missing keys. */
  collectors: Map<string, CollectorEnvelope>;
  /** ASINs cleared for use, or null if the registry could not be read. */
  verifiedAsins: Set<string> | null;
  knownDeadAsins: Set<string>;
  /** public/_redirects, source → target. A source is never evaluated as a page. */
  redirects: Map<string, string>;
  /** page path → GSC metrics, or null when no GSC source was available. */
  gscPageMetrics: Map<string, { ctr: number | null; position: number; impressions: number | null }> | null;
  gscSource: string | null;
  /** Why GSC metrics are unavailable, quoted verbatim in unevaluable reasons. */
  gscReason: string | null;
  /** false disables every live fetch; fetch-backed predicates then read unevaluable. */
  allowNetwork: boolean;
  /** Shared per-run fetch cache so ten predicates on one page cost one request. */
  pageCache: Map<string, PageFetch>;
  /** The record being evaluated, when the loop supplies it (gsc-position needs firstSeen). */
  subject: PredicateSubject | null;
}

// ─── The hard rule's error ─────────────────────────────────────────────────────

/**
 * Thrown at WRITE time — filing, not evaluation. Raised for an absent predicate, an
 * unregistered kind, and equally for a registered kind with missing or ill-typed
 * fields: `{kind:'meta-length'}` with no url/min/max states nothing verifiable and
 * is rejected exactly as hard as no predicate at all.
 *
 * Defined here rather than in ledger.ts so predicate validation stays a leaf module;
 * ledger.ts re-exports it as the public name.
 */
export class MissingPredicateError extends Error {
  constructor(
    message: string,
    public readonly detail: string = ''
  ) {
    super(message);
    this.name = 'MissingPredicateError';
  }
}

/** Registry entry. `schema` is the gate at write time, `evaluate` the gate at night. */
export interface PredicateSpec<K extends PredicateKind = PredicateKind> {
  kind: K;
  schema: ZodType<Extract<ClosurePredicate, { kind: K }>>;
  evaluate: Evaluator;
  /** Human description of what data this predicate needs — quoted in unevaluable reasons. */
  requires: string;
}

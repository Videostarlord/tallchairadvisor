/**
 * predicates/index.ts — the registry, and the gate the hard rule runs through.
 *
 * `validateClosurePredicate` is called at WRITE time by ledger.fileFinding. It
 * rejects three things with the same force:
 *   1. no predicate at all;
 *   2. a predicate whose `kind` is not registered — nothing can evaluate it;
 *   3. a registered kind with missing or ill-typed fields.
 *
 * (3) is the one that is easy to get wrong and the one that matters most.
 * `{kind:'meta-length'}` with no url/min/max LOOKS like a closure predicate and
 * states nothing verifiable. Accepting it would let an agent satisfy the rule with
 * a shape rather than a commitment, and the rule would be decorative within a week.
 */

import { z } from 'zod';
import * as asinRegistered from './asin-registered.js';
import * as canonicalSelf from './canonical-self.js';
import * as collectorHealthy from './collector-healthy.js';
import * as geoCapsule from './geo-capsule.js';
import * as gscIndexed from './gsc-indexed.js';
import * as gscPosition from './gsc-position.js';
import * as metaLength from './meta-length.js';
import * as noConsoleErrors from './no-console-errors.js';
import * as schemaValid from './schema-valid.js';
import * as tagFires from './tag-fires.js';
import * as visualDiff from './visual-diff.js';
import {
  MissingPredicateError,
  unevaluable,
  type ClosurePredicate,
  type EvalContext,
  type Evaluator,
  type PredicateKind,
  type PredicateVerdict,
} from './types.js';

export * from './types.js';
export { buildEvalContext, BASE_URL, type BuildContextOptions } from './context.js';
export { normalizePath, absoluteUrl, fetchPage, probeFor } from './http.js';

interface RegistryEntry {
  schema: z.ZodTypeAny;
  evaluate: Evaluator;
  /** What data this predicate needs. Quoted in errors and in the coverage report. */
  requires: string;
  /** true when the predicate can be settled without a Playwright probe. */
  fetchFallback: boolean;
}

export const PREDICATE_REGISTRY: Record<PredicateKind, RegistryEntry> = {
  'meta-length': {
    schema: metaLength.schema,
    evaluate: metaLength.evaluate,
    requires: 'probe head, else a direct fetch of the page',
    fetchFallback: true,
  },
  'no-console-errors': {
    schema: noConsoleErrors.schema,
    evaluate: noConsoleErrors.evaluate,
    requires: 'Playwright probe only — runtime console events cannot be read from HTML',
    fetchFallback: false,
  },
  'asin-registered': {
    schema: asinRegistered.schema,
    evaluate: asinRegistered.evaluate,
    requires: 'direct fetch of the page + data/verified-asins.json',
    fetchFallback: true,
  },
  'gsc-indexed': {
    schema: gscIndexed.schema,
    evaluate: gscIndexed.evaluate,
    requires: 'gsc collector with URL Inspection records',
    fetchFallback: false,
  },
  'gsc-position': {
    schema: gscPosition.schema,
    evaluate: gscPosition.evaluate,
    requires: 'gsc collector or data/gsc/analysis.json, plus elapsed afterDays',
    fetchFallback: false,
  },
  'canonical-self': {
    schema: canonicalSelf.schema,
    evaluate: canonicalSelf.evaluate,
    requires: 'probe head, else a direct fetch of the page',
    fetchFallback: true,
  },
  'schema-valid': {
    schema: schemaValid.schema,
    evaluate: schemaValid.evaluate,
    requires: 'probe head, else a direct fetch of the page',
    fetchFallback: true,
  },
  'geo-capsule': {
    schema: geoCapsule.schema,
    evaluate: geoCapsule.evaluate,
    requires: 'probe geo section, else a direct fetch of the page',
    fetchFallback: true,
  },
  'tag-fires': {
    schema: tagFires.schema,
    evaluate: tagFires.evaluate,
    requires: 'Playwright probe only — a network assertion, not a markup check',
    fetchFallback: false,
  },
  'collector-healthy': {
    schema: collectorHealthy.schema,
    evaluate: collectorHealthy.evaluate,
    requires: 'data/collectors/<name>.json',
    fetchFallback: false,
  },
  'visual-diff': {
    schema: visualDiff.schema,
    evaluate: visualDiff.evaluate,
    requires: 'Playwright probe run with --visual — rendering cannot be read from HTML',
    fetchFallback: false,
  },
};

export const PREDICATE_KINDS = Object.keys(PREDICATE_REGISTRY) as PredicateKind[];

/**
 * The same eleven schemas as one discriminated union, for validating a predicate
 * embedded in a larger record (the ledger line). Listed explicitly rather than
 * mapped out of the registry so TypeScript can see each literal `kind` and infer
 * the real ClosurePredicate union instead of a bag of unknown fields.
 */
export const closurePredicateSchema = z.discriminatedUnion('kind', [
  metaLength.schema,
  noConsoleErrors.schema,
  asinRegistered.schema,
  gscIndexed.schema,
  gscPosition.schema,
  canonicalSelf.schema,
  schemaValid.schema,
  geoCapsule.schema,
  tagFires.schema,
  collectorHealthy.schema,
  visualDiff.schema,
]);

export function isPredicateKind(value: unknown): value is PredicateKind {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PREDICATE_REGISTRY, value);
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const where = issue.path.length === 0 ? '(root)' : issue.path.join('.');
      if (issue.code === 'invalid_type' && issue.received === 'undefined') {
        return `'${where}' is required (${issue.expected}) and absent`;
      }
      return `'${where}': ${issue.message}`;
    })
    .join('; ');
}

/**
 * THE HARD RULE. Returns the predicate, or throws MissingPredicateError.
 * `subject` names the record being filed so the error points at a finding, not a shrug.
 */
export function validateClosurePredicate(value: unknown, subject = 'record'): ClosurePredicate {
  if (value === null || value === undefined) {
    throw new MissingPredicateError(
      `${subject}: cannot be filed without a closurePredicate. If you cannot state how a fix would be verified, you do not get to claim the problem exists. Registered kinds: ${PREDICATE_KINDS.join(', ')}.`,
      'absent',
    );
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new MissingPredicateError(
      `${subject}: closurePredicate must be an object with a 'kind' field; found ${Array.isArray(value) ? 'array' : typeof value}.`,
      'not-an-object',
    );
  }
  const kind = (value as Record<string, unknown>).kind;
  if (typeof kind !== 'string' || kind === '') {
    throw new MissingPredicateError(
      `${subject}: closurePredicate has no 'kind'. Registered kinds: ${PREDICATE_KINDS.join(', ')}.`,
      'no-kind',
    );
  }
  if (!isPredicateKind(kind)) {
    throw new MissingPredicateError(
      `${subject}: closurePredicate kind '${kind}' has no evaluator, so nothing could ever close this record. Registered kinds: ${PREDICATE_KINDS.join(', ')}.`,
      'unknown-kind',
    );
  }
  const entry = PREDICATE_REGISTRY[kind];
  const parsed = entry.schema.safeParse(value);
  if (!parsed.success) {
    throw new MissingPredicateError(
      `${subject}: closurePredicate kind '${kind}' is malformed — ${formatIssues(parsed.error)}. A predicate that names its kind but not its fields is not machine-evaluable and is rejected exactly as hard as no predicate at all.`,
      'malformed',
    );
  }
  return parsed.data as ClosurePredicate;
}

/** True when the value would be accepted. Never throws — for callers that must not. */
export function isValidClosurePredicate(value: unknown): boolean {
  try {
    validateClosurePredicate(value);
    return true;
  } catch (error) {
    if (error instanceof MissingPredicateError) return false;
    throw error;
  }
}

/**
 * Run one predicate. An evaluator that throws yields `unevaluable`, never `fail`:
 * a crashed evaluator is the system failing to see, and escalating on that is the
 * behaviour this PRD exists to remove. One bad page also must not end the night.
 */
export async function evaluatePredicate(
  predicate: ClosurePredicate,
  ctx: EvalContext,
): Promise<PredicateVerdict> {
  const entry = PREDICATE_REGISTRY[predicate.kind];
  if (entry === undefined) {
    return unevaluable(`no evaluator registered for kind '${predicate.kind}'`);
  }
  try {
    return await entry.evaluate(predicate, ctx);
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return unevaluable(`evaluator for '${predicate.kind}' threw — ${message}`);
  }
}

/** One-line human form, for logs and the nightly report. */
export function describePredicate(p: ClosurePredicate): string {
  switch (p.kind) {
    case 'meta-length':
      return `meta-length ${p.url} ∈ [${p.min}, ${p.max}]`;
    case 'gsc-position':
      return `gsc-position ${p.url} ${p.op} ${p.value} after ${p.afterDays}d`;
    case 'schema-valid':
      return `schema-valid ${p.url} @type=${p.type}`;
    case 'tag-fires':
      return `tag-fires ${p.url} tag=${p.tag}`;
    case 'collector-healthy':
      return `collector-healthy ${p.collector}`;
    case 'visual-diff':
      return `visual-diff ${p.url} ${p.viewport} < ${p.maxPct}%`;
    default:
      return `${p.kind} ${p.url}`;
  }
}

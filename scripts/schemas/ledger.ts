/**
 * ledger.ts — contract for `data/ledger.jsonl` (PRD §7.2 store unification,
 * §7.3 record shape).
 *
 * NOT YET ON DISK. Shape is taken verbatim from PRD §7.3, not from data. Step 3
 * of the build (`scripts/lib/ledger.ts` + `scripts/lib/predicates/`) owns the
 * write path; this file is the read contract it must satisfy.
 *
 * WHAT THE UNIFICATION MEANS (§7.2): `data/ledger.jsonl` absorbs
 * `interventions.jsonl` and `audit-findings.json` as record `kind`s.
 * `retractions.jsonl` stays separate — a retraction is an assertion ABOUT a
 * claim, not a claim. `cost-ledger.jsonl` stays separate — different lifecycle.
 *
 * THE HARD RULE, EXPRESSED IN THE TYPE SYSTEM: `closurePredicate` is REQUIRED
 * and non-nullable. PRD §7.3 — "a finding cannot be filed without a
 * machine-evaluable closurePredicate. If an agent cannot state how a fix would
 * be verified, it does not get to claim the problem exists." Making it optional
 * here would move that rule from "rejected at write time" to "hopefully checked
 * somewhere", which is how it stops being true.
 *
 * Predicates are a DISCRIMINATED union on `kind`, so an unknown predicate kind
 * throws naming the value rather than validating as a bag of unknown fields that
 * no evaluator can run.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

/** §7.3 comparison operator for `gsc-position`. */
export const comparisonOpSchema = z.enum(['<', '<=', '>', '>=', '==']);

/** One evaluator function each, in scripts/lib/predicates/. */
export const closurePredicateSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('meta-length'), url: z.string(), min: z.number(), max: z.number() }).passthrough(),
  z.object({ kind: z.literal('no-console-errors'), url: z.string() }).passthrough(),
  z.object({ kind: z.literal('asin-registered'), url: z.string() }).passthrough(),
  z.object({ kind: z.literal('gsc-indexed'), url: z.string() }).passthrough(),
  z
    .object({
      kind: z.literal('gsc-position'),
      url: z.string(),
      op: comparisonOpSchema,
      value: z.number(),
      afterDays: z.number(),
    })
    .passthrough(),
  z.object({ kind: z.literal('canonical-self'), url: z.string() }).passthrough(),
  z.object({ kind: z.literal('schema-valid'), url: z.string(), type: z.string() }).passthrough(),
  z.object({ kind: z.literal('geo-capsule'), url: z.string() }).passthrough(),
  z.object({ kind: z.literal('tag-fires'), url: z.string(), tag: z.string() }).passthrough(),
]);

export type ClosurePredicate = z.infer<typeof closurePredicateSchema>;

/** open → closed | escalated | regressed. `regressed` is the highest-value output. */
export const ledgerStatusSchema = z.enum(['open', 'closed', 'escalated', 'regressed']);

export const ledgerRecordSchema = z
  .object({
    /** Reuses findingId = sha1(page|issueClass) where the record is a finding. */
    id: z.string(),
    kind: z.string(),
    firstSeen: z.string(),
    lastSeen: z.string(),
    status: ledgerStatusSchema,
    attempts: z.number(),
    /** REQUIRED. See the header — this is the rule the whole ledger rests on. */
    closurePredicate: closurePredicateSchema,
    closedAt: z.string().nullable(),
    closedBy: z.string().nullable(),
    /** The probe/collector record that proved closure. null while open. */
    evidence: z.unknown().nullable(),
  })
  .passthrough();

export type LedgerRecord = z.infer<typeof ledgerRecordSchema>;

/**
 * NO FRESHNESS SLA on the ledger file itself. An append-only log with nothing
 * to append on a clean night is correct. "Is the nightly still running?" is the
 * dead-man's switch's question (§7.7), and it cannot be answered from inside
 * the repo being watched.
 */
export const ledgerOptions: ReadOptions = {
  minRows: 0,
  label: 'ledger',
};

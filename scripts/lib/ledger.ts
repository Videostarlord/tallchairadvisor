/**
 * ledger.ts — L3. One append-only log of every claim the system has ever made
 * about itself, and the machine test that would retire each one.
 *
 * WHY THIS EXISTS
 * Five overlapping stores held state that nothing reconciled: audit-findings.json,
 * interventions.jsonl, retractions.jsonl, the wiki, and the weekly reports. A finding
 * could be "fixed" in one and open in another forever, and nothing in the system could
 * tell you how long anything had been broken. §7.2 folds the claim stores into this
 * one; retractions stay separate because a retraction is an assertion ABOUT a claim.
 *
 * THREE INVARIANTS, in descending order of how much damage their loss causes:
 *
 *   1. NOTHING IS FILED WITHOUT A CLOSURE PREDICATE. PRD §7.3: "If an agent cannot
 *      state how a fix would be verified, it does not get to claim the problem
 *      exists." Enforced at write time, on presence AND on shape.
 *
 *   2. NOTHING IS CLOSED WITHOUT EVIDENCE. PRD success criterion #2. `transition`
 *      to `closed` with null evidence throws. An evidence-less close is how a ledger
 *      becomes a list of things somebody said were fine.
 *
 *   3. THE FILE IS APPEND-ONLY. One line per state transition, never a rewrite.
 *      `reconcileInterventions` rewrote its whole file byte-identically for months
 *      and nobody could see it, because a rewritten file has no history to compare.
 *      `currentState()` folds the log; the log itself is never edited.
 *
 * `scripts/schemas/ledger.ts` (owned by another agent) did not exist when this was
 * written, so the zod schema lives here. If that file lands, move LedgerRecordSchema
 * there and re-export it from this module — nothing else should need to change.
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, isAbsolute, resolve } from 'path';
import { z } from 'zod';
import { makeFindingId } from '../audit-findings.js';
import {
  ContractViolation,
  REPO_ROOT,
  readValidatedJsonlIfExists,
} from './read-validated.js';
import { closurePredicateSchema, validateClosurePredicate } from './predicates/index.js';
import type { ClosurePredicate, Evidence } from './predicates/types.js';

export { MissingPredicateError } from './predicates/types.js';
export type { ClosurePredicate, Evidence } from './predicates/types.js';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type LedgerStatus = 'open' | 'closed' | 'escalated' | 'regressed';
export type LedgerKind = 'finding' | 'intervention';

export interface LedgerRecord {
  /** For findings: sha1(page|issueClass) from audit-findings.ts — stable across regenerations,
   *  which is what makes a re-raise collide with its own history instead of forking a new item. */
  id: string;
  kind: LedgerKind;
  /** YYYY-MM-DD the claim was first filed. Age is measured from here. */
  firstSeen: string;
  /** YYYY-MM-DD of the last transition written for this id. */
  lastSeen: string;
  status: LedgerStatus;
  /** Consecutive failing nights. Only `fail` increments it. */
  attempts: number;
  closurePredicate: ClosurePredicate;
  closedAt: string | null;
  closedBy: string | null;
  evidence: Evidence | null;
  page?: string;
  issueClass?: string;
  severity?: string;
  summary?: string;
}

// ─── Schemas ───────────────────────────────────────────────────────────────────

/** The predicate registry's ten schemas, as one discriminated union. */
export const ClosurePredicateSchema = closurePredicateSchema;

export const EvidenceSchema = z.object({
  source: z.string().min(1),
  observedAt: z.string().min(1),
  detail: z.record(z.unknown()),
});

export const LedgerRecordSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['finding', 'intervention']),
  firstSeen: z.string().min(1),
  lastSeen: z.string().min(1),
  status: z.enum(['open', 'closed', 'escalated', 'regressed']),
  attempts: z.number().int().nonnegative(),
  closurePredicate: ClosurePredicateSchema,
  closedAt: z.string().nullable(),
  closedBy: z.string().nullable(),
  evidence: EvidenceSchema.nullable(),
  page: z.string().optional(),
  issueClass: z.string().optional(),
  severity: z.string().optional(),
  summary: z.string().optional(),
});

// ─── Errors ────────────────────────────────────────────────────────────────────

/** Thrown by `transition(id, 'closed', …)` with no evidence. Invariant 2. */
export class MissingEvidenceError extends Error {
  constructor(id: string) {
    super(
      `ledger ${id}: cannot close without evidence. PRD success criterion #2 is "every closed item has evidence attached" — pass the probe/collector record that proved it, not a sentence.`,
    );
    this.name = 'MissingEvidenceError';
  }
}

/** Thrown when a retracted finding is filed again. Retraction is permanent until superseded. */
export class RetractedFindingError extends Error {
  constructor(id: string, why: string) {
    super(`ledger ${id}: refused — this finding is retracted in data/retractions.jsonl (${why})`);
    this.name = 'RetractedFindingError';
  }
}

export class UnknownRecordError extends Error {
  constructor(id: string) {
    super(`ledger ${id}: no such record — transition() operates on records already filed`);
    this.name = 'UnknownRecordError';
  }
}

// ─── Ledger location (overridable, so tests never touch the real file) ─────────

const DEFAULT_LEDGER_PATH = 'data/ledger.jsonl';
let ledgerPath = process.env.TCA_LEDGER_PATH === undefined ? DEFAULT_LEDGER_PATH : process.env.TCA_LEDGER_PATH;

export function setLedgerPath(path: string): void {
  ledgerPath = path;
}

export function getLedgerPath(): string {
  return ledgerPath;
}

function absoluteLedgerPath(path?: string): string {
  const target = path === undefined ? ledgerPath : path;
  return isAbsolute(target) ? target : resolve(REPO_ROOT, target);
}

// ─── Retractions ───────────────────────────────────────────────────────────────

const RetractionSchema = z
  .object({
    type: z.string(),
    findingId: z.string().optional(),
    page: z.string().optional(),
    issueClass: z.string().optional(),
    why: z.string().optional(),
    supersededAt: z.string().nullable().optional(),
  })
  .passthrough();

export type Retraction = z.infer<typeof RetractionSchema>;

/** Same convention as wiki-utils.loadRetractions: type==='retraction', not superseded. */
export function loadRetractions(path = 'data/retractions.jsonl'): Retraction[] {
  const rows = readValidatedJsonlIfExists(path, RetractionSchema, { label: 'retraction ledger' });
  if (rows === null) return [];
  return rows.filter((row) => row.type === 'retraction' && (row.supersededAt === null || row.supersededAt === undefined));
}

function normalizePage(page: string): string {
  const path = page.replace(/^https?:\/\/[^/]+/, '');
  return path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}/`;
}

/**
 * Match on findingId first, then on (page, issueClass) — same fallback wiki-utils
 * uses, so a retraction survives an ID scheme change.
 */
export function findRetraction(
  retractions: Retraction[],
  id: string,
  page?: string,
  issueClass?: string,
): Retraction | null {
  const byId = retractions.find((r) => r.findingId === id);
  if (byId !== undefined) return byId;
  if (page === undefined || issueClass === undefined) return null;
  const target = normalizePage(page);
  const byShape = retractions.find(
    (r) => r.page !== undefined && normalizePage(r.page) === target && r.issueClass === issueClass,
  );
  return byShape === undefined ? null : byShape;
}

// ─── Read / fold ───────────────────────────────────────────────────────────────

/** Every transition ever written, in file order. Throws ContractViolation on a bad line. */
export function readLedger(path?: string): LedgerRecord[] {
  const rows = readValidatedJsonlIfExists(absoluteLedgerPath(path), LedgerRecordSchema, {
    label: 'ledger',
  });
  if (rows === null) return [];
  return rows;
}

/** Fold the append-only log to the latest record per id. Last write wins. */
export function currentState(path?: string): Map<string, LedgerRecord> {
  const state = new Map<string, LedgerRecord>();
  for (const record of readLedger(path)) state.set(record.id, record);
  return state;
}

/** Every transition written for one id, oldest first. */
export function historyOf(id: string, path?: string): LedgerRecord[] {
  return readLedger(path).filter((record) => record.id === id);
}

export function isFiled(id: string, path?: string): boolean {
  return currentState(path).has(id);
}

// ─── Write ─────────────────────────────────────────────────────────────────────

/**
 * Append one validated transition. Never rewrites, never reorders, never dedupes.
 * The history IS the artifact — regression detection reads it.
 */
export function appendLedger(record: LedgerRecord, path?: string): void {
  const target = absoluteLedgerPath(path);
  const parsed = LedgerRecordSchema.safeParse(record);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `'${issue.path.join('.') || '(root)'}': ${issue.message}`)
      .join('; ');
    throw new ContractViolation(target, `refused to append a malformed ledger record — ${detail}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  appendFileSync(target, `${JSON.stringify(parsed.data)}\n`);
}

export interface FileFindingInput {
  /** Omit for findings and it is derived: sha1(page|issueClass). */
  id?: string;
  kind?: LedgerKind;
  page?: string;
  issueClass?: string;
  severity?: string;
  summary?: string;
  /** REQUIRED. Absent or malformed → MissingPredicateError. */
  closurePredicate: unknown;
  /** YYYY-MM-DD; defaults to today. Set it when backfilling historical records. */
  firstSeen?: string;
  attempts?: number;
  /** Path override, for tests and for --backfill against a scratch ledger. */
  ledgerPath?: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * File a claim. Throws MissingPredicateError if it cannot state how it would be
 * verified, and RetractedFindingError if it has already been ruled invalid.
 *
 * Idempotent: filing an id that already exists returns the current record and
 * writes nothing, so a nightly re-file cannot reset an item's age or attempts.
 */
export function fileFinding(rec: FileFindingInput): LedgerRecord {
  const kind: LedgerKind = rec.kind === undefined ? 'finding' : rec.kind;
  const subject =
    rec.id !== undefined
      ? `${kind} ${rec.id}`
      : `${kind} ${rec.page ?? '(no page)'} ${rec.issueClass ?? '(no issueClass)'}`;

  // The hard rule runs BEFORE the id is derived: a record that cannot be verified
  // should never even acquire an identity in the log.
  const predicate = validateClosurePredicate(rec.closurePredicate, subject);

  let id: string;
  if (rec.id !== undefined && rec.id !== '') {
    id = rec.id;
  } else if (rec.page !== undefined && rec.issueClass !== undefined) {
    id = makeFindingId(rec.page, rec.issueClass);
  } else {
    throw new ContractViolation(
      absoluteLedgerPath(rec.ledgerPath),
      `cannot derive an id for ${subject}: supply either 'id' or both 'page' and 'issueClass'`,
    );
  }

  const retraction = findRetraction(loadRetractions(), id, rec.page, rec.issueClass);
  if (retraction !== null) {
    throw new RetractedFindingError(id, retraction.why ?? 'no reason recorded');
  }

  const existing = currentState(rec.ledgerPath).get(id);
  if (existing !== undefined) return existing;

  const day = rec.firstSeen === undefined ? today() : rec.firstSeen;
  const record: LedgerRecord = {
    id,
    kind,
    firstSeen: day,
    lastSeen: day,
    status: 'open',
    attempts: rec.attempts === undefined ? 0 : rec.attempts,
    closurePredicate: predicate,
    closedAt: null,
    closedBy: null,
    evidence: null,
    ...(rec.page === undefined ? {} : { page: rec.page }),
    ...(rec.issueClass === undefined ? {} : { issueClass: rec.issueClass }),
    ...(rec.severity === undefined ? {} : { severity: rec.severity }),
    ...(rec.summary === undefined ? {} : { summary: rec.summary }),
  };
  appendLedger(record, rec.ledgerPath);
  return record;
}

export interface TransitionOptions {
  closedBy?: string;
  evidence?: Evidence | null;
  /** Consecutive-failure counter. Omit to leave it unchanged. */
  attempts?: number;
  /** YYYY-MM-DD; defaults to today. */
  lastSeen?: string;
  ledgerPath?: string;
}

/**
 * Append the next state for an existing id.
 *
 * `closed` requires evidence (invariant 2). On `regressed`, the prior closedAt /
 * closedBy are RETAINED — "closed 2026-08-06, regressed 2026-08-09" is the whole
 * story, and blanking them would leave the ledger unable to say a fix ever landed.
 */
export function transition(id: string, to: LedgerStatus, opts: TransitionOptions = {}): LedgerRecord {
  const previous = currentState(opts.ledgerPath).get(id);
  if (previous === undefined) throw new UnknownRecordError(id);

  const evidence = opts.evidence === undefined ? previous.evidence : opts.evidence;
  if (to === 'closed' && (evidence === null || evidence === undefined)) {
    throw new MissingEvidenceError(id);
  }

  const day = opts.lastSeen === undefined ? today() : opts.lastSeen;
  const next: LedgerRecord = {
    ...previous,
    status: to,
    lastSeen: day,
    attempts: opts.attempts === undefined ? previous.attempts : opts.attempts,
    evidence: evidence === undefined ? null : evidence,
    closedAt: to === 'closed' ? new Date().toISOString() : previous.closedAt,
    closedBy: to === 'closed' ? (opts.closedBy === undefined ? 'ledger-evaluate' : opts.closedBy) : previous.closedBy,
  };
  appendLedger(next, opts.ledgerPath);
  return next;
}

// ─── Derived facts the report needs ────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

/** PRD success criterion #1: every open item has an age. Days since firstSeen. */
export function ageDays(record: LedgerRecord, now: Date = new Date()): number {
  const start = Date.parse(record.firstSeen);
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((now.getTime() - start) / MS_PER_DAY));
}

/** True if this id was ever closed and later re-opened as regressed. */
export function hasRegressed(id: string, path?: string): boolean {
  return historyOf(id, path).some((record) => record.status === 'regressed');
}

export function ledgerExists(path?: string): boolean {
  return existsSync(absoluteLedgerPath(path));
}

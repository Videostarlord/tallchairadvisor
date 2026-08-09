/**
 * retention.ts — a bounded on-disk footprint for the nightly's own artifacts (A5).
 *
 * WIRED IN 2026-08-09. `scripts/retention-prune.ts` (`npm run retention:prune`)
 * is the caller; .github/workflows/nightly.yml runs it as the step immediately
 * after `ledger:evaluate`, and the `godseye` npm script does the same locally.
 *
 * That ordering is a correctness requirement, not tidiness: `pinnedProbeDates()`
 * reads the ledger's CURRENT statuses, so a finding opened by tonight's
 * evaluation must already be written before the pruner decides what is still
 * under adjudication. Moving this step earlier would silently narrow the pin
 * set. The previous version of this header recorded that NOTHING called this
 * module — worth remembering as the reason the note existed at all, since a
 * library with no caller reads as finished work to everyone who finds it later,
 * and this codebase has already been burned once by a component that looked
 * healthy while doing nothing.
 *
 * WHAT WAS ACTUALLY MEASURED, 2026-08-09, before any policy was written:
 *
 *   data/probes/         1.9 MB   4 dated files, 484–500 KB each, one per night
 *   data/ledger.jsonl    172 KB   291 records since 2026-07-20 (~600 B/record)
 *   data/collectors/     128 KB   fixed filenames, overwritten nightly — flat
 *   raw/                 24 MB    immutable archive, deliberately never pruned
 *
 * Only ONE of those grows without bound at a rate that matters: probe files, at
 * ~490 KB/night ≈ 14 MB/month ≈ 175 MB/year, committed to git every night. The
 * ledger grows at ~0.15% of that rate, and `raw/` is the evidence archive
 * CLAUDE.md forbids modifying. So this module prunes probe files and nothing
 * else, and says so out loud rather than shipping three knobs for one problem.
 *
 * ─── WHY DELETING OLD PROBE FILES CANNOT DESTROY EVIDENCE ────────────────────
 *
 * The ledger closes findings on evidence and `MissingEvidenceError` exists to
 * stop a close without it, so "prune the probes" has to be checked against the
 * evidence chain before it is allowed. Three facts make it safe:
 *
 *   1. NOTHING READS AN OLD PROBE FILE. `predicates/context.ts:loadProbes()`
 *      lists data/probes/, takes the NEWEST YYYY-MM-DD.json at or before today,
 *      and reads only that one. `nightly-report.ts` uses the same latest-dated
 *      rule. There is no code path that opens a probe file from two nights ago.
 *
 *   2. EVIDENCE IS COPIED, NOT REFERENCED. An `Evidence` record is
 *      `{ source, observedAt, detail }` and the detail is written INTO
 *      data/ledger.jsonl at transition time. `source` is a label — "probe:
 *      2026-08-06" — not a path that anything dereferences. Deleting the file
 *      the label names does not remove a single byte of what was observed;
 *      the ledger line still carries it.
 *
 *   3. REGRESSION DETECTION READS THE LEDGER, NOT THE PROBES. `hasRegressed()`
 *      and `currentState()` fold data/ledger.jsonl. A pruned probe file changes
 *      neither.
 *
 * That is the argument for why this is safe in principle. Because "in principle"
 * is how silent data loss gets shipped, the policy also carries two belts:
 *
 *   - The newest probe file is NEVER deleted, whatever the retention window
 *     says. That file is tonight's eyes; losing it would make every predicate
 *     `unevaluable` rather than merely blind to history.
 *   - Any probe date named as `evidence.source` by a ledger record that is NOT
 *     closed (open / escalated / regressed) is PINNED and kept. Those are the
 *     findings still under active adjudication, the ones a human is most likely
 *     to want to open the raw record for. Closed records are already settled and
 *     already carry their detail inline, so they pin nothing. Status is read
 *     from the FOLDED ledger, not the raw append-only history — see
 *     `foldToCurrent()` for why that distinction is the difference between a
 *     working policy and one that reclaims nothing.
 *
 * The ledger itself is deliberately NOT pruned or compacted. Invariant 3 in
 * ledger.ts is that the file is append-only and never rewritten — folding it is
 * how current state is derived, and `historyOf()` needs every transition to tell
 * "open for 20 days" from "closed and re-raised four times". Compaction would
 * buy ~170 KB and cost the property that makes the ledger worth reading. What
 * this module does instead is watch it: if it ever crosses LEDGER_ALARM_BYTES
 * the run says so, so the decision gets revisited against a real number instead
 * of being assumed correct forever.
 */

import { readdirSync, statSync, unlinkSync } from 'fs';
import { existsSync } from 'node:fs';
import { resolve } from 'path';
import { currentState, readLedger, type LedgerRecord } from './ledger.js';
import { REPO_ROOT } from './read-validated.js';

/** Nights of probe history kept on disk. ~490 KB each → ~15 MB steady state. */
export const DEFAULT_PROBE_KEEP = 30;

/**
 * data/ledger.jsonl is not pruned. At the measured 600 B/record it would take
 * roughly 40,000 records to reach this, which is decades at the current rate —
 * so crossing it means the growth model changed, and that is worth a sentence
 * in the nightly rather than a silently enormous file.
 */
export const LEDGER_ALARM_BYTES = 25 * 1024 * 1024;

const PROBE_DIR = 'data/probes';
const DATED_JSON = /^(\d{4}-\d{2}-\d{2})\.json$/;
/** `evidence.source` for a probe-backed transition, e.g. "probe:2026-08-06". */
const PROBE_SOURCE = /^probe:(\d{4}-\d{2}-\d{2})$/;

export interface PrunePlan {
  /** Every dated probe file present, oldest first. */
  present: string[];
  keep: string[];
  /** Kept only because an unclosed finding cites them — would otherwise be cut. */
  pinned: string[];
  del: string[];
}

/**
 * Probe dates cited as evidence by a record that is still being adjudicated.
 *
 * `closed` is excluded on purpose: a closed record has already had its evidence
 * detail written inline and is not going to be re-argued. Everything else —
 * open, escalated, regressed — is live, and the raw record behind its last
 * observation stays on disk for as long as the finding does.
 */
export function pinnedProbeDates(records: LedgerRecord[]): Set<string> {
  const pinned = new Set<string>();
  for (const record of foldToCurrent(records)) {
    if (record.status === 'closed') continue;
    if (record.evidence === null) continue;
    const match = PROBE_SOURCE.exec(record.evidence.source);
    if (match === null) continue;
    pinned.add(match[1]);
  }
  return pinned;
}

/**
 * Last transition per id — the same fold `ledger.currentState()` performs.
 * Idempotent, so handing this an already-folded array is safe.
 *
 * WHY THE FOLD IS NOT OPTIONAL, measured 2026-08-09 against the real ledger
 * data/ledger.jsonl is append-only and holds every TRANSITION, not one row per
 * finding: 291 rows for 63 findings. A finding that was open on 2026-08-06 and
 * closed on 2026-08-09 leaves its open row in the file forever. Pinning off the
 * raw history therefore pins every probe date that ever backed an open
 * transition — which at the time of writing was 4 dates out of the 4 that have
 * ever existed, cited by 50, 48, 48 and 5 non-closed rows respectively.
 *
 * That is a pruner that reclaims nothing, forever: wired in, green, and doing
 * exactly as much as it did when nothing called it. Folding is what makes
 * "still being adjudicated" mean the finding's CURRENT status, which is what
 * this policy has always said it meant.
 *
 * Nothing is lost by folding. Per fact 2 in the header, an older transition's
 * evidence detail is already written inline on its own ledger line, so the
 * probe file was never the only copy of what was observed.
 */
export function foldToCurrent(records: LedgerRecord[]): LedgerRecord[] {
  const latest = new Map<string, LedgerRecord>();
  for (const record of records) latest.set(record.id, record);
  return [...latest.values()];
}

/**
 * Pure: given the dates on disk and the pinned set, decide what goes.
 *
 * `keep` counts from the newest end. The newest file survives even when
 * keep <= 0, because a retention policy that can blind tonight's run is not a
 * retention policy, it is an outage with a schedule.
 */
export function planProbePruning(dates: string[], keep: number, pinned: Set<string>): PrunePlan {
  const present = [...dates].sort();
  if (present.length === 0) {
    return { present, keep: [], pinned: [], del: [] };
  }

  const window = Math.max(1, keep);
  const recent = new Set(present.slice(-window));
  const newest = present[present.length - 1];

  const kept: string[] = [];
  const heldByLedger: string[] = [];
  const del: string[] = [];

  for (const date of present) {
    if (recent.has(date) || date === newest) {
      kept.push(date);
      continue;
    }
    if (pinned.has(date)) {
      kept.push(date);
      heldByLedger.push(date);
      continue;
    }
    del.push(date);
  }

  return { present, keep: kept, pinned: heldByLedger, del };
}

/** Dated probe files on disk, oldest first. Empty when the directory is absent. */
export function probeDatesOnDisk(repoRoot: string = REPO_ROOT): string[] {
  const dir = resolve(repoRoot, PROBE_DIR);
  if (!existsSync(dir)) return [];
  const dates: string[] = [];
  for (const name of readdirSync(dir)) {
    const match = DATED_JSON.exec(name);
    if (match === null) continue;
    dates.push(match[1]);
  }
  return dates.sort();
}

export interface PruneOptions {
  repoRoot?: string;
  keep?: number;
  dryRun?: boolean;
  /**
   * Ledger records to derive pins from. Defaults to the folded current state of
   * the real data/ledger.jsonl. Raw history is accepted too — pinnedProbeDates()
   * folds whatever it is given.
   */
  ledger?: LedgerRecord[];
}

export interface PruneResult {
  plan: PrunePlan;
  deleted: string[];
  bytesFreed: number;
  /** Files the plan named but which could not be removed, with the reason. */
  errors: string[];
  dryRun: boolean;
}

export function pruneProbeArtifacts(opts: PruneOptions = {}): PruneResult {
  const repoRoot = opts.repoRoot === undefined ? REPO_ROOT : opts.repoRoot;
  const keep = opts.keep === undefined ? DEFAULT_PROBE_KEEP : opts.keep;
  const dryRun = opts.dryRun === true;
  const records = opts.ledger === undefined ? [...currentState().values()] : opts.ledger;

  const plan = planProbePruning(probeDatesOnDisk(repoRoot), keep, pinnedProbeDates(records));

  const deleted: string[] = [];
  const errors: string[] = [];
  let bytesFreed = 0;

  for (const date of plan.del) {
    const file = resolve(repoRoot, PROBE_DIR, `${date}.json`);
    try {
      const size = statSync(file).size;
      if (!dryRun) unlinkSync(file);
      deleted.push(date);
      bytesFreed += size;
    } catch (error) {
      // Not fatal, and not swallowed: a probe file that cannot be removed is a
      // permissions or race problem worth naming in the run's own output.
      errors.push(`${date}.json — ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { plan, deleted, bytesFreed, errors, dryRun };
}

export interface LedgerSizeReport {
  path: string;
  exists: boolean;
  bytes: number;
  records: number;
  overAlarm: boolean;
}

/** Size-only. Nothing here deletes or rewrites a ledger line — see the header. */
export function inspectLedgerSize(repoRoot: string = REPO_ROOT, path = 'data/ledger.jsonl'): LedgerSizeReport {
  const file = resolve(repoRoot, path);
  if (!existsSync(file)) {
    return { path, exists: false, bytes: 0, records: 0, overAlarm: false };
  }
  const bytes = statSync(file).size;
  return {
    path,
    exists: true,
    bytes,
    // `file`, not the module default: sizing one path while counting the records
    // of another produces a report that is internally inconsistent in exactly the
    // case (a non-default repoRoot) where someone is checking it deliberately.
    // Identical in production, where both resolve to data/ledger.jsonl.
    records: readLedger(file).length,
    overAlarm: bytes > LEDGER_ALARM_BYTES,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * lib/gsc-rotation.ts — A7. Inspecting 10 URLs a night without starving 39.
 *
 * ⚠️  NOT WIRED IN. Nothing calls this module. A7 is NOT closed.
 *
 * `collectors/gsc.ts:307` still takes the prefix slice this file exists to
 * replace, so the nightly still spends ~6 minutes inspecting all 49 URLs. The
 * design below is complete and its reasoning stands; what is missing is the
 * edit to the collector — read state, call `planRotation()` in place of the
 * `eligible.slice(0, limit)`, call `applyResults()` after the loop, write state
 * back — plus tests, and a decision about what a deliberately-partial night
 * reports now that `lib/agent-health.ts` distinguishes `unevaluable` from zero.
 * A rotation that is working as designed is NOT the same as a collector that
 * could not see, and it must not silently become `healthy: true` either.
 *
 * Authored 2026-08-09; the session that wrote it hit its limit before wiring.
 * Stated here rather than in a commit message alone, because this repo has now
 * produced two modules-with-no-caller in one day (`lib/retention.ts` was the
 * other) and a library with no caller reads as finished work to whoever finds
 * it next. That is the A13 failure shape in source form.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 *
 * `collectors/gsc.ts` inspected all 49 indexable URLs every night at ~1 req/1.1s
 * plus API latency: ~6 minutes of a nightly that otherwise finishes in seconds.
 * The obvious economy is to inspect a slice, and the obvious slice is the one
 * `GSC_INSPECT_LIMIT` already took:
 *
 *     const requested = eligible.slice(0, limit);
 *
 * THAT IS NOT ROTATION, AND IT IS WORSE THAN THE SLOW RUN. `eligible` is sorted
 * by file path, so a prefix slice inspects `/about/` through `/chairs/...` every
 * single night and NEVER inspects the tail — not tomorrow, not next month. R6
 * ("catch GSC indexing errors") would be permanently, silently unsatisfiable for
 * the back half of the site, while the numbers in the record climbed to a
 * healthy-looking 100% of what was requested. Today that starvation is at least
 * reported honestly as `healthy: false` with a named cause; a prefix slice would
 * have traded a slow, complete answer for a fast, confident, partial one.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE UNIT OF COVERAGE IS THE CYCLE, NOT THE NIGHT
 *
 * The selection here is a LEAST-RECENTLY-INSPECTED queue, not an index cursor.
 * An integer cursor over a sorted array is wrong for the same reason the prefix
 * slice is wrong: the array changes. Add a page and every position after it
 * shifts; delete one and the cursor silently skips its neighbour. A queue keyed
 * by URL and ordered by "when did we last actually see this" cannot skip anything
 * — the longer a URL goes uninspected, the closer it moves to the front.
 *
 * That gives full coverage in `ceil(eligible / batch)` nights (5, at 49 and 10),
 * and the state file records exactly when the last full cycle closed, so
 * "coverage completes over a cycle" is a claim a reader can check rather than
 * take on trust.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHAT MUST NOT BE STARVED, AND WHY IT IS THE HARD PART
 *
 * A pure round-robin has one bad case, and it is the case that matters most:
 * a page published today, or a canonical changed today, waits up to a full cycle
 * before anything looks at it. That is precisely the window in which an indexing
 * defect is cheapest to fix and most likely to exist. So two classes jump the
 * queue unconditionally:
 *
 *   new      — no successful inspection on record. Nothing else in the system
 *              can speak to its index state at all: `gsc-indexed` returns
 *              `unevaluable`, not `pass`. Highest priority, always.
 *   changed  — the page SOURCE hash differs from the hash captured at the last
 *              inspection. The observation on file describes a page that no
 *              longer exists. Jumps the queue even if it was inspected tonight's
 *              cycle already, because a stale-by-edit record is not coverage.
 *
 * The hash is of the `.astro` source, not of the rendered page: it is what this
 * repo can compute for free and it moves whenever an edit that could change
 * canonical, noindex, schema or content lands. It is deliberately NOT git mtime
 * — a CI checkout rewrites every mtime, so an mtime-keyed "changed" set would be
 * "all of them" on every run in the only environment that matters.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THE STATE FILE MUST BE COMMITTED, SPELLED OUT
 *
 * The nightly runs on a fresh clone. A rotation cursor that lives only inside the
 * runner is absent on every run, every URL is `new`, `new` sorts by URL, and the
 * batch is the first 10 by path — THE PREFIX SLICE, rebuilt exactly, with extra
 * steps. `data/gsc/inspection-rotation.json` is therefore committed by
 * nightly.yml, and `runs` increments once per run so the failure is observable:
 * a state file that says `runs: 1` every night is one that is not surviving.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';

/** Lives beside data/gsc/latest.json — GSC state, not a collector output. */
export const ROTATION_PATH = 'data/gsc/inspection-rotation.json';

/** 49 eligible URLs / 10 = a 5-night cycle. The number A7 proposed. */
export const DEFAULT_BATCH_SIZE = 10;

/**
 * A cycle may take twice its budget before the rotation is considered broken.
 * Slack, not tolerance: a night the collector cannot run at all must not read as
 * a design failure, but a URL unseen for two full cycles means the rotation is
 * not in fact rotating and the collector says so.
 */
const CYCLE_SLACK_FACTOR = 2;

/** Floor for the staleness budget, so a tiny eligible set cannot produce a 2-day one. */
const MIN_STALENESS_DAYS = 3;

const MS_PER_DAY = 86_400_000;

// ─── Persisted shapes ─────────────────────────────────────────────────────────

/**
 * One URL Inspection observation, verbatim from Google, plus the timestamp of
 * the observation itself.
 *
 * `inspectedAt` is the field that makes carry-forward honest. A row emitted
 * tonight and a row obtained four nights ago are both real observations, and the
 * only thing that distinguishes them is when they were made — so the record
 * carries that, per row, rather than letting the collector's own `collectedAt`
 * stand in for all of them.
 */
export const inspectedUrlSchema = z.object({
  url: z.string().min(1),
  file: z.string().min(1),
  verdict: z.string(),
  coverageState: z.string(),
  indexingState: z.string(),
  robotsTxtState: z.string(),
  pageFetchState: z.string(),
  lastCrawlTime: z.string().nullable(),
  googleCanonical: z.string().nullable(),
  userCanonical: z.string().nullable(),
  /** Non-null only when THIS url's inspection call failed. Never a fake verdict. */
  error: z.string().nullable(),
  /** ISO timestamp of when this observation was obtained. */
  inspectedAt: z.string().min(1),
});

export type InspectedUrl = z.infer<typeof inspectedUrlSchema>;

/** What the collector emits: an observation plus how old it is. */
export interface InspectedUrlRow extends InspectedUrl {
  /** True when this row came from the run that emitted it. */
  fresh: boolean;
  /** Whole days between `inspectedAt` and the emitting run. */
  ageDays: number;
}

export const rotationEntrySchema = z.object({
  url: z.string().min(1),
  file: z.string().min(1),
  /** Source hash as of the last SUCCESSFUL inspection. null = never inspected. */
  inspectedHash: z.string().nullable(),
  /**
   * First run in which this URL was eligible. Anchors the overdue clock for a
   * page that has never been inspected: without it, every URL is infinitely
   * overdue on the night rotation is switched on, and the collector would report
   * a design decision as a fault for a full cycle.
   */
  firstSeenAt: z.string().min(1),
  /** Last SUCCESSFUL inspection. null = never obtained. */
  lastInspectedAt: z.string().nullable(),
  /** Last attempt of any kind. A URL that fails nightly must not hold the head of the queue. */
  lastAttemptedAt: z.string().nullable(),
  /** Verbatim last successful observation. null = never obtained. */
  lastResult: inspectedUrlSchema.nullable(),
});

export type RotationEntry = z.infer<typeof rotationEntrySchema>;

export const rotationCycleSchema = z.object({
  /** 1-based. The currently OPEN cycle. */
  number: z.number(),
  startedAt: z.string().min(1),
  /**
   * The three fields that answer "when did coverage last actually complete".
   * `lastCompletedNumber === number` is the signal that the open cycle has
   * closed and the next run should open a new one.
   */
  lastCompletedNumber: z.number().nullable(),
  lastCompletedAt: z.string().nullable(),
  lastCompletedNights: z.number().nullable(),
});

export type RotationCycle = z.infer<typeof rotationCycleSchema>;

export const rotationStateSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string().min(1),
  /**
   * Increments once per run. Pinned at 1 across many nights is proof the file is
   * not surviving between runs, which silently degenerates rotation into the
   * prefix slice this module exists to replace.
   */
  runs: z.number(),
  batchSize: z.number(),
  cycle: rotationCycleSchema,
  urls: z.array(rotationEntrySchema),
});

export type RotationState = z.infer<typeof rotationStateSchema>;

// ─── Small pure helpers ───────────────────────────────────────────────────────

/** Short, stable digest of a page's source. Only equality is ever compared. */
export function sourceHash(source: string): string {
  return createHash('sha1').update(source).digest('hex').slice(0, 12);
}

function epoch(iso: string | null): number | null {
  if (iso === null) return null;
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Whole days between an ISO timestamp and `now`. null when unparseable/absent. */
export function daysSince(iso: string | null, now: Date): number | null {
  const at = epoch(iso);
  if (at === null) return null;
  return Math.max(0, Math.floor((now.getTime() - at) / MS_PER_DAY));
}

/** Nights a full cycle should take at this batch size. Never below 1. */
export function cycleBudgetNights(eligible: number, batchSize: number): number {
  if (eligible <= 0 || batchSize <= 0) return 1;
  return Math.max(1, Math.ceil(eligible / batchSize));
}

/** Days after which an uninspected URL is a rotation FAILURE rather than a wait. */
export function stalenessBudgetDays(eligible: number, batchSize: number): number {
  return Math.max(MIN_STALENESS_DAYS, cycleBudgetNights(eligible, batchSize) * CYCLE_SLACK_FACTOR);
}

/**
 * Batch size from the environment.
 *
 * `GSC_INSPECT_LIMIT` keeps working and keeps its name — it is the variable that
 * exists in `.env` and in habits — but its MEANING has changed: it is now the
 * per-night batch of a rotation, not a prefix of a list. Under the old reading a
 * limit of 2 meant "these two URLs, forever"; under this one it means "two a
 * night, every URL in turn". `GSC_INSPECT_ALL` restores the full nightly sweep
 * for a one-off complete pass.
 */
export function resolveBatchSize(
  env: NodeJS.ProcessEnv,
  eligible: number
): { batchSize: number; note: string | null } {
  const all = env.GSC_INSPECT_ALL;
  if (typeof all === 'string' && all.trim() !== '' && all.trim() !== '0' && all.trim().toLowerCase() !== 'false') {
    return { batchSize: Math.max(1, eligible), note: 'GSC_INSPECT_ALL is set — inspecting every eligible URL in one run' };
  }
  for (const name of ['GSC_INSPECT_BATCH', 'GSC_INSPECT_LIMIT']) {
    const raw = env[name];
    if (typeof raw !== 'string' || raw.trim() === '') continue;
    const parsed = Number.parseInt(raw.trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return { batchSize: parsed, note: `${name}=${parsed} sets the nightly rotation batch` };
    }
    return {
      batchSize: DEFAULT_BATCH_SIZE,
      note:
        `${name}=${JSON.stringify(raw)} is not a positive integer — falling back to a batch of ` +
        `${DEFAULT_BATCH_SIZE}. It is a per-night batch size, not a prefix length.`,
    };
  }
  return { batchSize: DEFAULT_BATCH_SIZE, note: null };
}

// ─── Planning ─────────────────────────────────────────────────────────────────

export interface EligibleUrl {
  url: string;
  file: string;
  /** Hash of the page source as it exists on this run. */
  hash: string;
}

/** Why a URL is in tonight's batch. Ordered by urgency; see PRIORITY_RANK. */
export type SelectionReason = 'new' | 'changed' | 'due';

const PRIORITY_RANK: Record<SelectionReason, number> = { new: 0, changed: 1, due: 2 };

export interface RotationSelection extends EligibleUrl {
  reason: SelectionReason;
}

export interface RotationPlan {
  batchSize: number;
  cycle: RotationCycle;
  /** True when a completed cycle was closed and a new one opened on this run. */
  rolled: boolean;
  /** True when no usable prior state existed — every URL is `new` by definition. */
  bootstrapped: boolean;
  /** URLs to inspect on this run, in priority order. */
  batch: RotationSelection[];
  /** Entries dropped because the URL is no longer eligible (deleted, noindexed, redirected). */
  dropped: string[];
  /** Eligible URLs already covered in the open cycle, BEFORE this run. */
  coveredBefore: number;
  /** Pruned + extended entry list. The basis `applyResults` builds the next state from. */
  entries: RotationEntry[];
  cycleBudgetNights: number;
  stalenessBudgetDays: number;
}

/** Covered = successfully inspected strictly since the open cycle began. */
export function coveredInCycle(entry: RotationEntry, cycle: RotationCycle): boolean {
  const inspected = epoch(entry.lastInspectedAt);
  const started = epoch(cycle.startedAt);
  if (inspected === null || started === null) return false;
  return inspected >= started;
}

function newCycle(number: number, now: Date): RotationCycle {
  return {
    number,
    startedAt: now.toISOString(),
    lastCompletedNumber: null,
    lastCompletedAt: null,
    lastCompletedNights: null,
  };
}

/**
 * Decide what this run inspects.
 *
 * Pure: no clock beyond the injected `now`, no filesystem, no network. Every
 * interesting property of the rotation — new-first, changed-jumps-the-queue,
 * complete-over-a-cycle, no-URL-starved — is a property of this function alone
 * and is asserted directly in gsc-rotation.test.ts.
 */
export function planRotation(opts: {
  eligible: EligibleUrl[];
  state: RotationState | null;
  batchSize: number;
  now: Date;
}): RotationPlan {
  const { eligible, state, batchSize, now } = opts;
  const nowIso = now.toISOString();

  const previous = new Map<string, RotationEntry>();
  if (state !== null) for (const entry of state.urls) previous.set(entry.url, entry);

  // Prune first. A deleted or newly-noindexed URL left in the state can never be
  // inspected again, so it would hold the cycle open forever and every reader
  // would see a cycle that never completes for a page that no longer exists.
  const eligibleUrls = new Set(eligible.map((e) => e.url));
  const dropped = [...previous.keys()].filter((url) => !eligibleUrls.has(url)).sort();

  const entries: RotationEntry[] = eligible
    .map((item) => {
      const prior = previous.get(item.url);
      if (prior === undefined) {
        return {
          url: item.url,
          file: item.file,
          inspectedHash: null,
          firstSeenAt: nowIso,
          lastInspectedAt: null,
          lastAttemptedAt: null,
          lastResult: null,
        };
      }
      // `file` can move without the URL changing (an index.astro reshuffle).
      return { ...prior, file: item.file };
    })
    .sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));

  // Roll a completed cycle at the START of the next run rather than at the end of
  // the one that completed it. Closing it at the end would force the completing
  // run's own inspections to land either inside the cycle they closed or inside
  // the one they opened, and picking either makes one of the two cycles a lie.
  let cycle = state === null ? newCycle(1, now) : state.cycle;
  let rolled = false;
  if (state !== null && cycle.lastCompletedNumber === cycle.number) {
    cycle = { ...newCycle(cycle.number + 1, now), lastCompletedNumber: cycle.lastCompletedNumber, lastCompletedAt: cycle.lastCompletedAt, lastCompletedNights: cycle.lastCompletedNights };
    rolled = true;
  }

  const hashOf = new Map(eligible.map((e) => [e.url, e.hash]));

  const selectable: RotationSelection[] = [];
  for (const entry of entries) {
    const hash = hashOf.get(entry.url);
    if (hash === undefined) continue;
    const base = { url: entry.url, file: entry.file, hash };
    if (entry.lastInspectedAt === null) {
      selectable.push({ ...base, reason: 'new' });
    } else if (entry.inspectedHash !== hash) {
      // Jumps the queue even when already covered this cycle: the observation on
      // file describes a version of the page that no longer exists.
      selectable.push({ ...base, reason: 'changed' });
    } else if (!coveredInCycle(entry, cycle)) {
      selectable.push({ ...base, reason: 'due' });
    }
  }

  const entryOf = new Map(entries.map((e) => [e.url, e]));
  selectable.sort((a, b) => {
    const rank = PRIORITY_RANK[a.reason] - PRIORITY_RANK[b.reason];
    if (rank !== 0) return rank;
    const ea = entryOf.get(a.url) as RotationEntry;
    const eb = entryOf.get(b.url) as RotationEntry;
    // Least-recently-INSPECTED first; nulls (never seen) ahead of everything.
    const ia = epoch(ea.lastInspectedAt) ?? -1;
    const ib = epoch(eb.lastInspectedAt) ?? -1;
    if (ia !== ib) return ia - ib;
    // Then least-recently-ATTEMPTED, so a URL that fails every night cannot
    // permanently occupy the head of the queue ahead of one never tried at all.
    const aa = epoch(ea.lastAttemptedAt) ?? -1;
    const ab = epoch(eb.lastAttemptedAt) ?? -1;
    if (aa !== ab) return aa - ab;
    return a.url < b.url ? -1 : a.url > b.url ? 1 : 0;
  });

  return {
    batchSize,
    cycle,
    rolled,
    bootstrapped: state === null,
    batch: selectable.slice(0, Math.max(0, batchSize)),
    dropped,
    coveredBefore: entries.filter((e) => coveredInCycle(e, cycle)).length,
    entries,
    cycleBudgetNights: cycleBudgetNights(entries.length, batchSize),
    stalenessBudgetDays: stalenessBudgetDays(entries.length, batchSize),
  };
}

// ─── Applying ─────────────────────────────────────────────────────────────────

/** One attempt's outcome. `result: null` means the call failed — never a fake verdict. */
export interface AttemptOutcome {
  url: string;
  hash: string;
  result: InspectedUrl | null;
}

/**
 * Fold this run's attempts into the next state.
 *
 * A FAILED attempt updates `lastAttemptedAt` and nothing else. It does not count
 * as coverage, does not close a cycle, and does not overwrite the observation
 * already on file — a call that did not come back tells us nothing about the
 * page, and recording it as if it did is the whole failure class this repo is
 * built against.
 */
export function applyResults(opts: {
  plan: RotationPlan;
  previousRuns: number;
  outcomes: AttemptOutcome[];
  now: Date;
}): RotationState {
  const { plan, previousRuns, outcomes, now } = opts;
  const nowIso = now.toISOString();

  const byUrl = new Map(outcomes.map((o) => [o.url, o]));
  const urls: RotationEntry[] = plan.entries.map((entry) => {
    const outcome = byUrl.get(entry.url);
    if (outcome === undefined) return entry;
    if (outcome.result === null) return { ...entry, lastAttemptedAt: nowIso };
    return {
      ...entry,
      inspectedHash: outcome.hash,
      lastAttemptedAt: nowIso,
      lastInspectedAt: outcome.result.inspectedAt,
      lastResult: outcome.result,
    };
  });

  let cycle = plan.cycle;
  const covered = urls.filter((e) => coveredInCycle(e, cycle));
  if (urls.length > 0 && covered.length === urls.length && cycle.lastCompletedNumber !== cycle.number) {
    // The moment coverage was actually achieved is the LAST observation in the
    // cycle, not the moment this function happened to run.
    const completedAt = covered
      .map((e) => e.lastInspectedAt)
      .filter((iso): iso is string => iso !== null)
      .sort()
      .slice(-1)[0];
    const started = epoch(cycle.startedAt);
    const finished = epoch(completedAt);
    cycle = {
      ...cycle,
      lastCompletedNumber: cycle.number,
      lastCompletedAt: completedAt,
      lastCompletedNights:
        started === null || finished === null ? null : Math.max(1, Math.ceil((finished - started) / MS_PER_DAY)),
    };
  }

  return {
    version: 1,
    updatedAt: nowIso,
    runs: previousRuns + 1,
    batchSize: plan.batchSize,
    cycle,
    urls,
  };
}

/**
 * URLs whose most recent observation is older than the staleness budget — or
 * which have never been observed and have been eligible longer than the budget.
 *
 * A non-empty result means the rotation is not delivering what it promises, and
 * that is a collector fault rather than a design decision. A brand-new page
 * inside the budget is NOT overdue: it is waiting its turn, by design, and
 * conflating the two would make every night after a deploy look broken.
 */
export function overdueUrls(
  state: RotationState,
  budgetDays: number,
  now: Date
): Array<{ url: string; ageDays: number | null; everInspected: boolean }> {
  const out: Array<{ url: string; ageDays: number | null; everInspected: boolean }> = [];
  for (const entry of state.urls) {
    const reference = entry.lastInspectedAt ?? entry.firstSeenAt;
    const age = daysSince(reference, now);
    if (age === null || age > budgetDays) {
      out.push({ url: entry.url, ageDays: age, everInspected: entry.lastInspectedAt !== null });
    }
  }
  return out.sort((a, b) => (b.ageDays ?? Number.MAX_SAFE_INTEGER) - (a.ageDays ?? Number.MAX_SAFE_INTEGER));
}

/**
 * Every observation the collector can still stand behind, freshest-first per URL.
 *
 * An observation older than the staleness budget is DROPPED rather than emitted
 * with a caveat. Downstream, `predicates/gsc-indexed.ts` treats a URL with no
 * record as `unevaluable` — the correct third state — and treats a record it can
 * see as an answer. Emitting a two-cycle-old row would convert an honest
 * "we cannot say" into a confident, possibly wrong "indexed", which is exactly
 * the degraded-but-plausible value the collector contract forbids.
 */
export function observableRows(
  state: RotationState,
  opts: { freshUrls: Set<string>; maxAgeDays: number; now: Date }
): InspectedUrlRow[] {
  const rows: InspectedUrlRow[] = [];
  for (const entry of state.urls) {
    if (entry.lastResult === null) continue;
    const age = daysSince(entry.lastResult.inspectedAt, opts.now);
    if (age === null || age > opts.maxAgeDays) continue;
    rows.push({ ...entry.lastResult, fresh: opts.freshUrls.has(entry.url), ageDays: age });
  }
  return rows.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
}

// ─── Persistence ──────────────────────────────────────────────────────────────

/**
 * `absent` and `malformed` are deliberately distinct.
 *
 * Absent is a legitimate state exactly once — the first run. Malformed is a
 * failure, and quietly treating it as absent would silently restart the rotation
 * from scratch every night, which is the prefix slice again wearing a different
 * hat. The collector reports a malformed cursor as a problem and says so.
 */
export type RotationRead =
  | { kind: 'ok'; state: RotationState }
  | { kind: 'absent' }
  | { kind: 'malformed'; reason: string };

export function readRotationState(repoRoot: string, path: string = ROTATION_PATH): RotationRead {
  const abs = resolve(repoRoot, path);
  if (!existsSync(abs)) return { kind: 'absent' };
  let raw: unknown;
  try {
    // lint-architecture-allow R4 -- validated by rotationStateSchema on the next line; a parse failure is reported as 'malformed' and never silently treated as 'absent', which is the distinction this read exists to preserve
    raw = JSON.parse(readFileSync(abs, 'utf-8'));
  } catch (error) {
    return { kind: 'malformed', reason: `not valid JSON — ${error instanceof Error ? error.message : String(error)}` };
  }
  const parsed = rotationStateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      kind: 'malformed',
      reason: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    };
  }
  return { kind: 'ok', state: parsed.data };
}

export function writeRotationState(repoRoot: string, state: RotationState, path: string = ROTATION_PATH): void {
  const validated = rotationStateSchema.parse(state);
  const abs = resolve(repoRoot, path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, `${JSON.stringify(validated, null, 2)}\n`);
}

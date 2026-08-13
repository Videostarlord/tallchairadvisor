/**
 * gsc-rotation.test.ts — A7. The properties that make a partial night honest.
 *
 * Run: npx tsx scripts/lib/__tests__/gsc-rotation.test.ts
 *
 * THE FAILURE THESE TESTS EXIST TO PREVENT is not "rotation is broken". It is
 * "rotation looks like coverage". A prefix slice reports 100% of what it asked
 * for every night while never once inspecting the back half of the site, and
 * every number in the record agrees with it. So the assertions below are mostly
 * about the URLs that were NOT picked:
 *
 *   - the tail is reached (with a cursor AND without one),
 *   - a page published tonight is not made to wait a cycle,
 *   - a failed call does not overwrite the observation already on file,
 *   - an old observation is dropped rather than emitted as if it were current,
 *   - and a deliberately-partial night is distinguishable, from the data alone,
 *     from a rotation that has stopped rotating.
 *
 * Everything here is pure: injected `now`, temp dirs for the persistence cases,
 * no network and no clock reads.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  applyResults,
  bootstrapOffset,
  coveredInCycle,
  cycleBudgetNights,
  daysSince,
  isStatePersisting,
  observableRows,
  overdueUrls,
  planRotation,
  readRotationState,
  resolveBatchSize,
  rotateBy,
  ROTATION_PATH,
  sourceHash,
  stalenessBudgetDays,
  writeRotationState,
  type AttemptOutcome,
  type EligibleUrl,
  type InspectedUrl,
  type RotationState,
} from '../gsc-rotation.js';
import { inspectionProblems } from '../../collectors/gsc.js';

// ─── fixtures ──────────────────────────────────────────────────────────────────

const DAY = 86_400_000;
const T0 = new Date('2026-08-10T02:00:00.000Z');

function at(nights: number): Date {
  return new Date(T0.getTime() + nights * DAY);
}

/** N eligible URLs, sorted by path exactly as indexableUrls() returns them. */
function eligibleSet(count = 49): EligibleUrl[] {
  return Array.from({ length: count }, (_, i) => {
    const slug = String(i).padStart(2, '0');
    return {
      url: `https://tallchairadvisor.com/p${slug}/`,
      file: `src/pages/p${slug}.astro`,
      hash: sourceHash(`source-${slug}`),
    };
  });
}

function observation(url: string, file: string, when: Date): InspectedUrl {
  return {
    url,
    file,
    verdict: 'PASS',
    coverageState: 'Submitted and indexed',
    indexingState: 'INDEXING_ALLOWED',
    robotsTxtState: 'ALLOWED',
    pageFetchState: 'SUCCESSFUL',
    lastCrawlTime: when.toISOString(),
    googleCanonical: url,
    userCanonical: url,
    error: null,
    inspectedAt: when.toISOString(),
  };
}

/** One night: plan, inspect everything in the batch, fold the results back. */
function runNight(
  eligible: EligibleUrl[],
  state: RotationState | null,
  batchSize: number,
  now: Date,
  failUrls: Set<string> = new Set()
): { state: RotationState; picked: string[] } {
  const plan = planRotation({ eligible, state, batchSize, now });
  const outcomes: AttemptOutcome[] = plan.batch.map((item) => ({
    url: item.url,
    hash: item.hash,
    result: failUrls.has(item.url) ? null : observation(item.url, item.file, now),
  }));
  return {
    state: applyResults({ plan, previousRuns: state === null ? 0 : state.runs, outcomes, now }),
    picked: plan.batch.map((b) => b.url),
  };
}

// ─── 1. the prefix slice, in both shapes it can take ───────────────────────────

test('WITH a cursor: all 49 URLs are inspected within one 5-night cycle', () => {
  const eligible = eligibleSet(49);
  let state: RotationState | null = null;
  const seen = new Set<string>();

  for (let night = 0; night < 5; night++) {
    const run = runNight(eligible, state, 10, at(night));
    state = run.state;
    for (const url of run.picked) seen.add(url);
  }

  assert.equal(seen.size, 49, 'a 5-night cycle at batch 10 must reach all 49 — the tail is not optional');
  // The prefix slice would have stopped at p09 and never moved again.
  assert.ok(seen.has('https://tallchairadvisor.com/p48/'), 'the LAST url by path must be inspected');
  assert.equal((state as RotationState).cycle.lastCompletedNumber, 1, 'cycle 1 must be recorded as CLOSED');
  assert.ok((state as RotationState).cycle.lastCompletedAt !== null, 'the night coverage completed must be on record');
});

test('WITHOUT a cursor: an all-new batch still walks the list instead of camping on its front', () => {
  const eligible = eligibleSet(49);
  const seen = new Set<string>();

  // The degenerate world: state never survives, so every night bootstraps.
  for (let night = 0; night < 5; night++) {
    const plan = planRotation({ eligible, state: null, batchSize: 10, now: at(night) });
    for (const item of plan.batch) seen.add(item.url);
  }

  assert.ok(seen.size > 10, `a stateless rotation must not re-pick the same 10 every night (saw ${seen.size})`);
  assert.ok(
    [...seen].some((u) => u >= 'https://tallchairadvisor.com/p40/'),
    'the tail must be reachable even with no cursor at all'
  );
});

test('bootstrapOffset advances by one batch per day and never leaves the array', () => {
  const a = bootstrapOffset(at(0), 10, 49);
  const b = bootstrapOffset(at(1), 10, 49);
  assert.equal((b - a + 49) % 49, 10, 'one day = one batch of movement');
  for (const n of [0, 1, 7, 100]) {
    const offset = bootstrapOffset(at(n), 10, 49);
    assert.ok(offset >= 0 && offset < 49, `offset ${offset} out of range`);
  }
  assert.equal(bootstrapOffset(at(0), 10, 0), 0, 'an empty eligible set is not a division');
});

test('rotateBy is order-preserving and lossless', () => {
  assert.deepEqual(rotateBy([1, 2, 3, 4], 2), [3, 4, 1, 2]);
  assert.deepEqual(rotateBy([1, 2, 3, 4], 0), [1, 2, 3, 4]);
  assert.deepEqual(rotateBy([1, 2, 3, 4], 6), [3, 4, 1, 2]);
  assert.deepEqual(rotateBy([] as number[], 3), []);
});

// ─── 2. the starvation cases that matter most ──────────────────────────────────

test('a page published tonight jumps the queue — it does not wait out the cycle', () => {
  const eligible = eligibleSet(20);
  // Cover everything first, so the cursor is mid-cycle with nothing "due".
  const state = runNight(eligible, null, 20, at(0)).state;

  // A new page, LAST by path — the position a prefix slice would never reach.
  const withNew: EligibleUrl[] = [
    ...eligible,
    { url: 'https://tallchairadvisor.com/zz-new/', file: 'src/pages/zz-new.astro', hash: 'abc123' },
  ];
  const plan = planRotation({ eligible: withNew, state, batchSize: 5, now: at(1) });

  assert.equal(plan.batch[0].url, 'https://tallchairadvisor.com/zz-new/', 'a never-inspected URL is picked FIRST');
  assert.equal(plan.batch[0].reason, 'new');
});

test('an EDITED page jumps the queue even though it was already covered this cycle', () => {
  const eligible = eligibleSet(20);
  const state = runNight(eligible, null, 20, at(0)).state;

  // Same URL, different source: the observation on file describes a page that no
  // longer exists, and "already covered" is not coverage of the new one.
  const edited = eligible.map((e, i) => (i === 17 ? { ...e, hash: 'edited-hash' } : e));
  const plan = planRotation({ eligible: edited, state, batchSize: 5, now: at(1) });

  // Cycle 1 closed last night, so cycle 2 opened and everything is `due` again.
  // The edited page still has to come FIRST: `due` is a turn, `changed` is a
  // record that no longer describes the page it is filed under.
  assert.equal(plan.rolled, true);
  assert.equal(plan.batch[0].url, edited[17].url);
  assert.equal(plan.batch[0].reason, 'changed');
  assert.deepEqual(plan.batch.slice(1).map((b) => b.reason), ['due', 'due', 'due', 'due']);
});

test('a URL that fails every night cannot hold the head of the queue forever', () => {
  const eligible = eligibleSet(4);
  const cursed = new Set([eligible[0].url]);
  let state: RotationState | null = null;
  const seen = new Set<string>();
  for (let night = 0; night < 3; night++) {
    const run = runNight(eligible, state, 1, at(night), cursed);
    state = run.state;
    for (const u of run.picked) seen.add(u);
  }
  assert.ok(seen.size >= 3, `a failing URL must not starve the rest (only saw ${seen.size})`);
});

// ─── 3. a failed call is not an observation ────────────────────────────────────

test('a failed attempt records the attempt and nothing else — the good record survives', () => {
  const eligible = eligibleSet(2);
  const good = runNight(eligible, null, 2, at(0)).state;
  assert.equal(good.urls[0].lastResult?.verdict, 'PASS');

  const plan = planRotation({
    eligible: eligible.map((e) => ({ ...e, hash: 'moved' })),
    state: good,
    batchSize: 2,
    now: at(1),
  });
  const after = applyResults({
    plan,
    previousRuns: good.runs,
    outcomes: plan.batch.map((b) => ({ url: b.url, hash: b.hash, result: null })),
    now: at(1),
  });

  assert.equal(after.urls[0].lastResult?.verdict, 'PASS', 'the surviving observation is the real one');
  assert.equal(after.urls[0].lastInspectedAt, good.urls[0].lastInspectedAt, 'a failure is not coverage');
  assert.equal(after.urls[0].lastAttemptedAt, at(1).toISOString(), 'but the attempt IS recorded');
});

// ─── 4. carry-forward, and its limit ───────────────────────────────────────────

test('carried rows are stamped with the night they came from, not the night they were read', () => {
  const eligible = eligibleSet(4);
  const first = runNight(eligible, null, 2, at(0));
  const second = runNight(eligible, first.state, 2, at(1));

  const fresh = new Set(second.picked);
  const rows = observableRows(second.state, { freshUrls: fresh, maxAgeDays: 10, now: at(1) });

  assert.equal(rows.length, 4, 'all four URLs still have a usable answer on a night that inspected two');
  assert.deepEqual(rows.filter((r) => r.fresh).map((r) => r.url).sort(), [...fresh].sort());
  for (const url of first.picked) {
    assert.equal(rows.find((r) => r.url === url)?.ageDays, 1, 'a one-night-old row says so');
    assert.equal(rows.find((r) => r.url === url)?.fresh, false);
  }
  for (const url of second.picked) {
    assert.equal(rows.find((r) => r.url === url)?.ageDays, 0);
  }
});

test('an observation past the staleness budget is DROPPED, not emitted with a caveat', () => {
  const eligible = eligibleSet(2);
  const state = runNight(eligible, null, 2, at(0)).state;
  const rows = observableRows(state, { freshUrls: new Set(), maxAgeDays: 10, now: at(30) });
  assert.equal(rows.length, 0, 'downstream must see "no record" (unevaluable), never a stale confident verdict');
});

// ─── 5. overdue: the line between waiting and broken ───────────────────────────

test('a brand-new URL inside the budget is NOT overdue — waiting its turn is the design', () => {
  const eligible = eligibleSet(49);
  const plan = planRotation({ eligible, state: null, batchSize: 10, now: at(0) });
  const state = applyResults({ plan, previousRuns: 0, outcomes: [], now: at(0) });
  assert.equal(overdueUrls(state, plan.stalenessBudgetDays, at(1)).length, 0);
});

test('a URL unseen for two full cycles IS overdue — the rotation is not rotating', () => {
  const eligible = eligibleSet(49);
  const plan = planRotation({ eligible, state: null, batchSize: 10, now: at(0) });
  const state = applyResults({ plan, previousRuns: 0, outcomes: [], now: at(0) });
  const overdue = overdueUrls(state, plan.stalenessBudgetDays, at(30));
  assert.equal(overdue.length, 49);
  assert.equal(overdue[0].everInspected, false);
});

test('the budgets are derived from the batch, with a floor', () => {
  assert.equal(cycleBudgetNights(49, 10), 5);
  assert.equal(stalenessBudgetDays(49, 10), 10);
  assert.equal(stalenessBudgetDays(2, 10), 3, 'a tiny site still gets a 3-day floor, not a 1-day one');
  assert.equal(daysSince(null, at(0)), null);
});

// ─── 6. pruning: a deleted page cannot hold the cycle open forever ─────────────

test('a URL that stops being eligible is dropped, so the cycle can still close', () => {
  const eligible = eligibleSet(3);
  const state = runNight(eligible, null, 3, at(0)).state;
  const plan = planRotation({ eligible: eligible.slice(0, 2), state, batchSize: 3, now: at(1) });
  assert.deepEqual(plan.dropped, [eligible[2].url]);
  assert.equal(plan.entries.length, 2, 'the deleted page is gone from the cursor, not held open in it');
  assert.ok(plan.entries.every((e) => coveredInCycle(e, state.cycle)), 'the CLOSED cycle still shows them covered');
  // And the closed cycle is what makes the deletion safe: a URL that can never
  // be inspected again would otherwise keep the open cycle from ever completing.
  assert.equal(state.cycle.lastCompletedNumber, 1);
});

// ─── 7. persistence, and the cursor nobody writes back ─────────────────────────

test('a cursor written today persists; one written 40h ago does not', () => {
  const state = runNight(eligibleSet(2), null, 2, at(0)).state;
  assert.equal(isStatePersisting(state, at(0)), true);
  assert.equal(isStatePersisting(state, new Date(at(0).getTime() + 40 * 3_600_000)), false);
  assert.equal(isStatePersisting({ ...state, updatedAt: 'not-a-date' }, at(0)), false);
});

test('absent and malformed are different answers, and neither is silently the other', () => {
  const dir = mkdtempSync(resolve(tmpdir(), 'tca-rotation-'));
  try {
    assert.equal(readRotationState(dir).kind, 'absent');

    const state = runNight(eligibleSet(2), null, 2, at(0)).state;
    writeRotationState(dir, state);
    const read = readRotationState(dir);
    assert.equal(read.kind, 'ok');
    assert.deepEqual(read.kind === 'ok' ? read.state : null, state, 'a round trip must not lose a field');

    mkdirSync(resolve(dir, 'data/gsc'), { recursive: true });
    writeFileSync(resolve(dir, ROTATION_PATH), '{ not json');
    assert.equal(readRotationState(dir).kind, 'malformed', 'a corrupt cursor must not read as "first run ever"');

    writeFileSync(resolve(dir, ROTATION_PATH), JSON.stringify({ version: 1, urls: [] }));
    assert.equal(readRotationState(dir).kind, 'malformed', 'a cursor missing required fields is malformed too');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ─── 8. GSC_INSPECT_LIMIT is a batch size now, and a typo is not an ask ────────

test('GSC_INSPECT_LIMIT is honoured as a batch and marked explicit', () => {
  const d = resolveBatchSize({ GSC_INSPECT_LIMIT: '2' } as NodeJS.ProcessEnv, 49);
  assert.equal(d.batchSize, 2);
  assert.equal(d.explicit, true);
  assert.match(d.note ?? '', /batch/);
});

test('GSC_INSPECT_ALL restores the full sweep', () => {
  const d = resolveBatchSize({ GSC_INSPECT_ALL: '1' } as NodeJS.ProcessEnv, 49);
  assert.equal(d.batchSize, 49);
  assert.equal(d.all, true);
});

test('an unparseable limit is NOT an explicit ask — a typo must not suppress the sweep fallback', () => {
  const d = resolveBatchSize({ GSC_INSPECT_LIMIT: 'ten' } as NodeJS.ProcessEnv, 49);
  assert.equal(d.explicit, false, 'otherwise a typo silently downgrades an absent cursor to a batch');
  assert.match(d.note ?? '', /not a prefix length/);
});

test('an unset environment defaults to a batch of 10, unmarked', () => {
  const d = resolveBatchSize({} as NodeJS.ProcessEnv, 49);
  assert.equal(d.batchSize, 10);
  assert.equal(d.explicit, false);
  assert.equal(d.note, null);
});

// ─── 9. what a partial night REPORTS — the judgement itself ────────────────────

const HEALTHY_NIGHT: Parameters<typeof inspectionProblems>[0] = {
  eligible: 49,
  requested: 10,
  inspected: 10,
  observed: 49,
  failures: [],
  quotaExceeded: false,
  overdue: [],
  stateNote: null,
  sweeping: false,
  cycleBudgetNights: 5,
  stalenessBudgetDays: 10,
};

test('a rotation working as designed — 10 of 49 fresh, nothing overdue — is NOT a problem', () => {
  assert.deepEqual(inspectionProblems(HEALTHY_NIGHT), []);
});

test('mid-FIRST-cycle, with most URLs not yet observed at all, is still not a problem', () => {
  // Night 1 of 5: 10 inspected, 39 never seen — and none of them overdue yet.
  assert.deepEqual(inspectionProblems({ ...HEALTHY_NIGHT, observed: 10 }), []);
});

test('a URL past the staleness budget IS a problem, and the reason says rotation, not quota', () => {
  const problems = inspectionProblems({
    ...HEALTHY_NIGHT,
    overdue: [{ url: 'https://tallchairadvisor.com/p48/', ageDays: 21, everInspected: true }],
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /staleness budget/);
  assert.match(problems[0], /failing to rotate/);
  assert.match(problems[0], /R6/);
});

test('an unusable cursor is a problem EVEN on a night that swept everything', () => {
  // The case that must not go green: coverage is perfect tonight, and the
  // mechanism that was supposed to make it cheap is not running at all.
  const problems = inspectionProblems({
    ...HEALTHY_NIGHT,
    requested: 49,
    inspected: 49,
    sweeping: true,
    stateNote: 'data/gsc/inspection-rotation.json is absent',
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /survives between runs/);
  assert.match(problems[0], /nightly workflow must/);
});

test('a failed call is reported as an ABSENT verdict, never as a bad one', () => {
  const problems = inspectionProblems({
    ...HEALTHY_NIGHT,
    inspected: 9,
    failures: [{ url: 'https://tallchairadvisor.com/p03/', error: 'HTTP 500' }],
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /not an index state/);
});

test('quota exhaustion suppresses the per-call failure line — one cause, one sentence', () => {
  const problems = inspectionProblems({
    ...HEALTHY_NIGHT,
    inspected: 4,
    quotaExceeded: true,
    failures: [{ url: 'https://tallchairadvisor.com/p04/', error: 'HTTP 429 rateLimitExceeded' }],
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /quota exhausted/);
});

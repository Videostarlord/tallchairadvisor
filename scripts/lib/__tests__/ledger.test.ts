/**
 * ledger.test.ts — the §9 step-3 acceptance row, executable.
 * Run: npx tsx scripts/lib/__tests__/ledger.test.ts
 *
 * No test framework is installed; this follows scripts/keyword-discovery.test.ts —
 * plain asserts, a pass/fail tally, non-zero exit on failure.
 *
 * EVERY test writes to data/.test-ledger-*.jsonl and deletes it afterwards. The real
 * data/ledger.jsonl is append-only and is never touched by this file — a test that
 * appends to the production ledger would inject synthetic history into the one
 * artifact whose whole value is being a truthful record.
 */

import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import {
  MissingEvidenceError,
  MissingPredicateError,
  UnknownRecordError,
  ageDays,
  appendLedger,
  currentState,
  fileFinding,
  hasRegressed,
  historyOf,
  readLedger,
  transition,
  type Evidence,
  type LedgerRecord,
} from '../ledger.js';
import { decide, positionClosureTarget } from '../../ledger-evaluate.js';
import { fail, pass, unevaluable } from '../predicates/types.js';

// ─── harness ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}${detail === '' ? '' : ` — ${detail}`}`);
    failed++;
  }
}

function assertThrows(label: string, run: () => unknown, expected: new (...args: never[]) => Error): void {
  try {
    run();
    assert(label, false, `expected ${expected.name}, nothing thrown`);
  } catch (error) {
    const ok = error instanceof expected;
    assert(label, ok, ok ? '' : `expected ${expected.name}, got ${String(error)}`);
    if (ok) console.log(`        ↳ ${(error as Error).message.slice(0, 150)}`);
  }
}

const scratch = mkdtempSync(resolve(tmpdir(), 'tca-ledger-'));
let counter = 0;
function tempLedger(): string {
  counter += 1;
  return resolve(scratch, `ledger-${counter}.jsonl`);
}

const EVIDENCE: Evidence = {
  source: 'fetch:https://example.test/x/',
  observedAt: '2026-08-05T03:00:00.000Z',
  detail: { length: 150, min: 130, max: 165 },
};

// ─── 1. THE HARD RULE: no predicate → rejected ─────────────────────────────────

console.log('\n[1] a finding filed without a closurePredicate is rejected');

assertThrows(
  'closurePredicate: undefined → MissingPredicateError',
  () =>
    fileFinding({
      page: '/review/gesture/',
      issueClass: 'meta-length',
      closurePredicate: undefined,
      ledgerPath: tempLedger(),
    }),
  MissingPredicateError,
);

assertThrows(
  'closurePredicate: null → MissingPredicateError',
  () => fileFinding({ page: '/a/', issueClass: 'meta-length', closurePredicate: null, ledgerPath: tempLedger() }),
  MissingPredicateError,
);

assertThrows(
  'closurePredicate with an unregistered kind → MissingPredicateError',
  () =>
    fileFinding({
      page: '/a/',
      issueClass: 'meta-length',
      closurePredicate: { kind: 'vibes-good', url: '/a/' },
      ledgerPath: tempLedger(),
    }),
  MissingPredicateError,
);

{
  const path = tempLedger();
  try {
    fileFinding({ page: '/a/', issueClass: 'x', closurePredicate: null, ledgerPath: path });
    // lint-architecture-allow R3 -- the throw IS the assertion; the next line proves nothing was written
  } catch {
    /* expected */
  }
  assert('a rejected filing writes NOTHING to the ledger', !existsSync(path));
}

// ─── 2. malformed predicate → rejected just as hard ────────────────────────────

console.log('\n[2] a malformed predicate (right kind, missing fields) is rejected');

assertThrows(
  "{kind:'meta-length'} with no url/min/max → MissingPredicateError",
  () =>
    fileFinding({
      page: '/review/gesture/',
      issueClass: 'meta-length',
      closurePredicate: { kind: 'meta-length' },
      ledgerPath: tempLedger(),
    }),
  MissingPredicateError,
);

assertThrows(
  "{kind:'meta-length', url} with min/max as strings → MissingPredicateError",
  () =>
    fileFinding({
      page: '/a/',
      issueClass: 'meta-length',
      closurePredicate: { kind: 'meta-length', url: '/a/', min: '130', max: '165' },
      ledgerPath: tempLedger(),
    }),
  MissingPredicateError,
);

assertThrows(
  "{kind:'gsc-position'} with an unsupported op → MissingPredicateError",
  () =>
    fileFinding({
      page: '/a/',
      issueClass: 'x',
      closurePredicate: { kind: 'gsc-position', url: '/a/', op: '≈', value: 5, afterDays: 14 },
      ledgerPath: tempLedger(),
    }),
  MissingPredicateError,
);

assertThrows(
  "{kind:'schema-valid', url} with no type → MissingPredicateError",
  () =>
    fileFinding({
      page: '/a/',
      issueClass: 'schema-missing',
      closurePredicate: { kind: 'schema-valid', url: '/a/' },
      ledgerPath: tempLedger(),
    }),
  MissingPredicateError,
);

{
  const path = tempLedger();
  const record = fileFinding({
    page: '/review/gesture/',
    issueClass: 'meta-length',
    severity: 'high',
    summary: 'meta description is 210 chars',
    closurePredicate: { kind: 'meta-length', url: '/review/gesture/', min: 130, max: 165 },
    ledgerPath: path,
  });
  assert('a well-formed predicate IS accepted', record.status === 'open' && record.attempts === 0);
  assert('id is sha1(page|issueClass) from audit-findings.ts', /^[0-9a-f]{12}$/.test(record.id), record.id);
  assert('the accepted filing is on disk', readLedger(path).length === 1);
}

// ─── 3. regression: passed, then failed → `regressed`, not a fresh finding ─────

console.log('\n[3] a predicate that passed and later fails surfaces as regressed');

{
  const path = tempLedger();
  const filed = fileFinding({
    page: '/review/gesture/',
    issueClass: 'meta-length',
    closurePredicate: { kind: 'meta-length', url: '/review/gesture/', min: 130, max: 165 },
    firstSeen: '2026-08-01',
    ledgerPath: path,
  });

  // night 1 — fail. open, attempts 1.
  const n1 = decide(currentState(path).get(filed.id)!, fail('210 chars, outside [130,165]', EVIDENCE), 3);
  transition(filed.id, n1.to, { attempts: n1.attempts, evidence: EVIDENCE, lastSeen: '2026-08-02', ledgerPath: path });
  assert('night 1 fail → open, attempts 1', n1.to === 'open' && n1.attempts === 1);

  // night 2 — pass. closed, with evidence.
  const n2 = decide(currentState(path).get(filed.id)!, pass('150 chars, within [130,165]', EVIDENCE), 3);
  transition(filed.id, n2.to, { attempts: n2.attempts, evidence: EVIDENCE, lastSeen: '2026-08-03', ledgerPath: path });
  const closed = currentState(path).get(filed.id)!;
  assert('night 2 pass → closed', closed.status === 'closed');
  assert('the close carries evidence (PRD success criterion #2)', closed.evidence !== null);
  assert('the close names who closed it', closed.closedBy !== null && closed.closedAt !== null);

  // night 3 — fail again. THE case: regressed, same id, not a new finding.
  const n3 = decide(currentState(path).get(filed.id)!, fail('212 chars, outside [130,165]', EVIDENCE), 3);
  transition(filed.id, n3.to, { attempts: n3.attempts, evidence: EVIDENCE, lastSeen: '2026-08-04', ledgerPath: path });
  const final = currentState(path).get(filed.id)!;

  assert('final status is exactly `regressed`', final.status === 'regressed', final.status);
  assert('NOT re-raised as a fresh finding — one id in the fold', currentState(path).size === 1);
  assert('id is unchanged across the whole life', final.id === filed.id);
  assert('firstSeen is unchanged — age is not reset by regression', final.firstSeen === '2026-08-01');
  assert('the append-only log kept all 4 transitions', historyOf(filed.id, path).length === 4);
  assert('hasRegressed() sees it', hasRegressed(filed.id, path));
  assert(
    'the prior close is still readable on the regressed record',
    final.closedAt !== null,
    'closedAt was blanked, so the ledger can no longer say a fix ever landed',
  );
  assert('age is measured from firstSeen', ageDays(final, new Date('2026-08-06T00:00:00Z')) === 5);
}

// ─── 4. escalation: 3 fails escalate; an unevaluable night does not ────────────

console.log('\n[4] three consecutive fails escalate; one unevaluable in the middle does not');

{
  const path = tempLedger();
  const filed = fileFinding({
    page: '/review/leap-plus/',
    issueClass: 'meta-length',
    closurePredicate: { kind: 'meta-length', url: '/review/leap-plus/', min: 130, max: 165 },
    firstSeen: '2026-08-01',
    ledgerPath: path,
  });

  const nights = ['fail', 'fail', 'fail'] as const;
  const statuses: string[] = [];
  nights.forEach((_night, index) => {
    const current = currentState(path).get(filed.id)!;
    const d = decide(current, fail('still 210 chars', EVIDENCE), 3);
    transition(filed.id, d.to, {
      attempts: d.attempts,
      evidence: EVIDENCE,
      lastSeen: `2026-08-0${index + 2}`,
      ledgerPath: path,
    });
    statuses.push(`${d.to}/${d.attempts}`);
  });
  assert(
    'fail, fail, fail → open/1, open/2, escalated/3',
    statuses.join(' ') === 'open/1 open/2 escalated/3',
    statuses.join(' '),
  );
}

{
  const path = tempLedger();
  const filed = fileFinding({
    page: '/knee-pain-seat-depth/',
    issueClass: 'meta-length',
    closurePredicate: { kind: 'meta-length', url: '/knee-pain-seat-depth/', min: 130, max: 165 },
    firstSeen: '2026-08-01',
    ledgerPath: path,
  });

  const sequence = [
    fail('night 1: 210 chars', EVIDENCE),
    unevaluable('night 2: no probe data and fetch failed — the system could not see'),
    fail('night 3: 210 chars', EVIDENCE),
  ];
  const trace: string[] = [];
  sequence.forEach((verdict, index) => {
    const current = currentState(path).get(filed.id)!;
    const d = decide(current, verdict, 3);
    if (d.changed) {
      transition(filed.id, d.to, {
        attempts: d.attempts,
        evidence: verdict.evidence,
        lastSeen: `2026-08-0${index + 2}`,
        ledgerPath: path,
      });
    }
    trace.push(`${verdict.result}→${d.to}/${d.attempts}`);
  });

  const final = currentState(path).get(filed.id)!;
  assert(
    'fail, unevaluable, fail over 3 nights → still open, attempts 2',
    final.status === 'open' && final.attempts === 2,
    `${final.status}/${final.attempts} · ${trace.join(' ')}`,
  );
  assert('the unevaluable night is NOT in the log — nothing changed', historyOf(filed.id, path).length === 3);
  console.log(`        ↳ ${trace.join('  ')}`);

  // a 4th failing night now reaches 3 and escalates — the counter was delayed, not lost
  const d4 = decide(final, fail('night 4: 210 chars', EVIDENCE), 3);
  assert('a 4th failing night escalates (counter delayed, not reset)', d4.to === 'escalated' && d4.attempts === 3);
}

// ─── 5. invariant: no close without evidence ───────────────────────────────────

console.log('\n[5] a close with no evidence is rejected');

{
  const path = tempLedger();
  const filed = fileFinding({
    page: '/a/',
    issueClass: 'meta-length',
    closurePredicate: { kind: 'meta-length', url: '/a/', min: 130, max: 165 },
    ledgerPath: path,
  });
  assertThrows(
    "transition(…, 'closed', { evidence: null }) → MissingEvidenceError",
    () => transition(filed.id, 'closed', { evidence: null, ledgerPath: path }),
    MissingEvidenceError,
  );
  assert('the refused close wrote nothing', historyOf(filed.id, path).length === 1);
  assertThrows(
    'transition() on an unknown id → UnknownRecordError',
    () => transition('deadbeef0000', 'closed', { evidence: EVIDENCE, ledgerPath: path }),
    UnknownRecordError,
  );
}

// ─── 6. append-only, and the fold ──────────────────────────────────────────────

console.log('\n[6] the log is append-only and folds last-write-wins');

{
  const path = tempLedger();
  const a = fileFinding({
    page: '/a/',
    issueClass: 'meta-length',
    closurePredicate: { kind: 'meta-length', url: '/a/', min: 130, max: 165 },
    ledgerPath: path,
  });
  fileFinding({
    page: '/b/',
    issueClass: 'canonical-wrong',
    closurePredicate: { kind: 'canonical-self', url: '/b/' },
    ledgerPath: path,
  });
  transition(a.id, 'closed', { evidence: EVIDENCE, ledgerPath: path });
  transition(a.id, 'regressed', { evidence: EVIDENCE, attempts: 1, ledgerPath: path });

  assert('4 lines written for 2 records', readLedger(path).length === 4);
  assert('the fold yields 2 records', currentState(path).size === 2);
  assert('last write wins', currentState(path).get(a.id)!.status === 'regressed');

  const refiled = fileFinding({
    page: '/a/',
    issueClass: 'meta-length',
    closurePredicate: { kind: 'meta-length', url: '/a/', min: 130, max: 165 },
    ledgerPath: path,
  });
  assert('re-filing an existing id is idempotent — no new line', readLedger(path).length === 4);
  assert('re-filing returns the live record, not a reset one', refiled.status === 'regressed');
}

// ─── 7. appendLedger refuses malformed records ─────────────────────────────────

console.log('\n[7] appendLedger validates what it writes');

{
  const path = tempLedger();
  const bad = {
    id: 'x1',
    kind: 'finding',
    firstSeen: '2026-08-01',
    lastSeen: '2026-08-01',
    status: 'open',
    attempts: 0,
    closurePredicate: { kind: 'meta-length', url: '/a/' },
    closedAt: null,
    closedBy: null,
    evidence: null,
  } as unknown as LedgerRecord;
  let threw = false;
  try {
    appendLedger(bad, path);
  } catch {
    threw = true;
  }
  assert('a record whose predicate is malformed cannot be appended', threw);
  assert('nothing was written', !existsSync(path));
}

// ─── 8. a position intervention must beat noise, not just its own baseline ─────
//
// The backfill used to file `op:'<', value: beforeMetric`, i.e. "any improvement
// at all". GSC average position drifts ±0.1–0.5 between weekly pulls, so that
// closed on noise in both directions: a page wandering 8.70 → 8.69 was recorded
// as a successful intervention and fed to what-works.md, and a page sitting
// exactly on its baseline (9.6 against `< 9.6`) could never close no matter what.
{
  assert(
    'the target is strictly better than the baseline, never equal to it',
    positionClosureTarget(9.6) < 9.6,
    `got ${positionClosureTarget(9.6)}`,
  );

  assert(
    'a baseline of 9.6 targets 9.12, not 9.6',
    positionClosureTarget(9.6) === 9.12,
    `got ${positionClosureTarget(9.6)}`,
  );

  // The four interventions escalated on 2026-08-08, with the positions they
  // actually reached. None of them improved; every one must still read as a fail.
  const stuck: Array<{ page: string; before: number; actual: number }> = [
    { page: '/review/leap-plus/', before: 8.7, actual: 8.8 },
    { page: '/chairs/herman-miller-aeron/tall-people/', before: 8.1, actual: 8.2 },
    { page: '/correct-chair-dimensions/', before: 9.6, actual: 9.6 },
    { page: '/office-chairs-for-tall-people/', before: 8.1, actual: 8.5 },
  ];
  for (const s of stuck) {
    assert(
      `${s.page} at ${s.actual} does not satisfy the recalibrated target`,
      !(s.actual < positionClosureTarget(s.before)),
    );
  }

  // The point of the change: drift no longer buys a close.
  assert(
    'a 0.01 drift in the right direction is NOT a close',
    !(8.69 < positionClosureTarget(8.7)),
  );
  assert(
    'a genuine move well past the noise floor IS a close',
    7.9 < positionClosureTarget(8.7),
    `target ${positionClosureTarget(8.7)}`,
  );
}

// ─── done ──────────────────────────────────────────────────────────────────────

rmSync(scratch, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

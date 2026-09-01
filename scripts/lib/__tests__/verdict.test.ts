/**
 * verdict.test.ts — the phone notification's verdict.
 * Run: npx tsx scripts/lib/__tests__/verdict.test.ts
 *
 * Same convention as retention.test.ts: no framework, plain asserts, a tally,
 * and a non-zero exit on failure.
 *
 * ─── WHY THIS IS TESTED AND THE REST OF THE REPORT IS NOT ────────────────────
 *
 * Everything else in the nightly is written by a model and judged by a human.
 * This one line is not: it is computed, it goes in the notification title, and
 * on most days it is the ONLY part of the report that gets read at all. If it
 * says "ALL GOOD" on a night when a check did not run, the entire observation
 * system has produced a lie in the one place it cannot be caught — the reader
 * stops opening the report, and it stays wrong.
 *
 * So the property under test is not "the words are right". It is:
 *
 *     "✅ ALL GOOD" is reachable ONLY when every check ran AND nothing is stuck.
 *
 * Every other input combination must produce something else.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// MUST stay above the nightly-report import — it captures the before-picture.
import { WATCHED, fingerprint } from './fixtures/pre-import-snapshot.js';
import { decideVerdict, countNeedsYou } from '../../nightly-report.js';

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

// ─── 1. The only path to "all good" ───────────────────────────────────────────

console.log('\nthe good verdict is hard to reach, on purpose');
{
  assert('nothing blind, nothing stuck → good', decideVerdict(0, null, 0).kind === 'good');
  assert('and it says so in words a person reads', decideVerdict(0, null, 0).title === 'ALL GOOD');

  // The three ways it must NOT be reachable.
  assert('one blind check blocks it', decideVerdict(1, null, 0).kind !== 'good');
  assert('one stuck item blocks it', decideVerdict(0, null, 1).kind !== 'good');
  assert('a failed health check blocks it', decideVerdict(0, 'check crashed', 0).kind !== 'good');
}

// ─── 2. Blindness outranks breakage ───────────────────────────────────────────
//
// Deliberate. "2 things need you" on a night when a check did not run implies
// the other checks came back clean, and they did not — they came back at all.

console.log('\nnot-looking outranks found-something');
{
  const both = decideVerdict(2, null, 3);
  assert('blind wins when both apply', both.kind === 'blind', both.kind);
  assert('but the stuck count is not hidden', both.title.includes('3'), both.title);
  assert('the health-check failure outranks everything', decideVerdict(5, 'boom', 9).kind === 'blind');
}

// ─── 3. The title is a verdict, not statistics ────────────────────────────────

console.log('\nthe title fits a lock screen and needs no interpretation');
{
  for (const v of [decideVerdict(0, null, 0), decideVerdict(0, null, 2), decideVerdict(1, null, 0), decideVerdict(0, 'x', 0)]) {
    assert(`"${v.title}" is short enough to survive truncation`, v.title.length <= 46, `${v.title.length} chars`);
    // The old title was "God's-Eye 2026-08-13 (88% coverage)". A percentage is a
    // number that needs interpreting, and a lock screen is exactly where nobody
    // interprets anything — it read as reassuring on nights it should not have.
    assert(`"${v.title}" contains no raw percentage`, !/%/.test(v.title), v.title);
    assert(`"${v.title}" is not empty`, v.title.trim().length > 0);
  }
  assert('the good verdict line carries the tick', decideVerdict(0, null, 0).line.includes('✅'));
  assert('the needs-you line carries the warning', decideVerdict(0, null, 1).line.includes('⚠️'));
  assert('the blind line carries the red', decideVerdict(2, null, 0).line.includes('🔴'));
}

// ─── 4. An unreadable count is NOT zero ───────────────────────────────────────
//
// The load-bearing case. If the escalated count cannot be read and that is
// treated as 0, an unreadable ledger produces "ALL GOOD" — the failure this
// whole system exists to prevent, arriving by way of its own summary line.

console.log('\ncountNeedsYou — unreadable is not zero');
{
  assert('a real count is returned', countNeedsYou('{"counts":{"escalated":9}}') === 9);
  assert('zero escalated is a real zero', countNeedsYou('{"counts":{"escalated":0}}') === 0);
  assert('absent file → null, not 0', countNeedsYou(null) === null);
  assert('malformed JSON → null, not 0', countNeedsYou('{not json') === null);
  assert('missing counts key → null, not 0', countNeedsYou('{"generatedAt":"x"}') === null);
  assert('non-numeric escalated → null, not 0', countNeedsYou('{"counts":{"escalated":"nine"}}') === null);
  assert('negative escalated → null, not 0', countNeedsYou('{"counts":{"escalated":-1}}') === null);

  // And the consequence, asserted end to end: null must never reach the good
  // verdict. main() adds 1 to the blind count when the read fails, and this is
  // the assertion that says why that line is there.
  assert(
    'an unreadable count cannot produce ALL GOOD',
    decideVerdict(0 + 1, null, 0).kind === 'blind',
    decideVerdict(1, null, 0).kind,
  );
}

// ─── 5. Importing this module must not RUN the nightly ────────────────────────
//
// Not hypothetical. Writing this file ran the whole nightly on import: a real
// Anthropic call, a report written to wiki/nightly/, the dead-man's-switch
// heartbeat overwritten, and a real push notification sent to Jackson's phone.
// The heartbeat is the dangerous one — a test that refreshes the liveness signal
// makes the watchdog report a healthy system on a night nothing ran.

console.log('\nimporting nightly-report must be side-effect free');
{
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const source = readFileSync(resolve(root, 'scripts/nightly-report.ts'), 'utf-8');
  assert('main() is guarded by invokedDirectly', /const invokedDirectly[\s\S]*if \(invokedDirectly\)/.test(source));
  assert(
    'main() is not called unconditionally at module scope',
    !/^main\(\)/m.test(source),
    'an unguarded top-level main() call is present',
  );
  // The proof, not the proxy: pre-import-snapshot.js fingerprinted the nightly's
  // output files before this module's import of nightly-report.js evaluated. If
  // the guard were absent, at least one of them would have changed by now.
  //
  // This asks "did it CHANGE?", not "does it exist?". The old form asserted
  // absence, which the real nightly falsifies every day after 00:00 UTC when it
  // commits wiki/nightly/<today>.md — the test failed daily in CI on pushes that
  // touched nothing.
  for (const [rel, before] of Object.entries(WATCHED)) {
    assert(
      `importing it did not write ${rel}`,
      fingerprint(rel) === before,
      `${rel} changed during import (was ${before}, now ${fingerprint(rel)}) — the import ran the nightly`,
    );
  }
}

// ─── done ─────────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

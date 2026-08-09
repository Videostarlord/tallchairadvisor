/**
 * execution-log.test.ts — A2.
 *
 * The fixtures are the VERBATIM contents of `reports/fixes-log.md` and
 * `reports/content-log.md` as they stood on 2026-08-09, plus the two forms the
 * writers emit that were not on disk that day (the no-op line from
 * `execute-fixes.ts:402` and the rollback line appended by `thursday.yml:81`).
 *
 * The content-log fixture is the whole point of A2. That single line is the
 * trust layer refusing a fabricated ASIN on a page that had scored 100/100 —
 * the most valuable thing the pipeline did that week — and it reached the
 * nightly report as silence, because these two files were not sources.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXECUTION_LOG_MAX_AGE_HOURS,
  assertExecutionLogFresh,
  executionLogContract,
  parseExecutionLog,
  summarizeExecutionLog,
} from '../execution-log.js';
import { ContractViolation } from '../../lib/read-validated.js';

// ─── The real files, verbatim ──────────────────────────────────────────────────

const CONTENT_LOG_2026_08_07 =
  '# Content Log — 2026-08-07\n' +
  '\n' +
  '- [❌] UNVERIFIED ASIN B000VNLYYS — not in data/verified-asins.json. Open https://www.amazon.com/dp/B000VNLYYS, confirm the listing loads and the title matches, then register it. Never register an ASIN nobody has opened.';

const FIXES_LOG_2026_08_06 =
  '# Fixes Log — 2026-08-06\n' +
  '\n' +
  '- [❌] SKIPPED: src/pages/best-office-chairs-under-500.astro edited 1d ago. Non-technical fixes require 14-day cooldown.';

/** execute-fixes.ts:402 — the plan held no tasks. */
const FIXES_LOG_NO_OP = '# Fixes Log — 2026-08-06\n\nNo fixes needed this week.\n';

/** thursday.yml:81 appends this when a build breaks after a fix lands. */
const FIXES_LOG_ROLLBACK =
  '# Fixes Log — 2026-08-06\n' +
  '\n' +
  '- [✅] Rewrote meta description on src/pages/review/gesture.astro\n' +
  '- [❌ ROLLED BACK] Build error in src/pages/review/leap-plus.astro — file restored to HEAD\n';

const AT = new Date('2026-08-09T09:00:00Z');

// ─── The event A2 exists to surface ────────────────────────────────────────────

test('the fabricated-ASIN refusal parses as a REFUSED entry, not as an empty log', () => {
  const parsed = parseExecutionLog(CONTENT_LOG_2026_08_07, 'reports/content-log.md');
  assert.equal(parsed.title, 'Content Log');
  assert.equal(parsed.date, '2026-08-07');
  assert.equal(parsed.applied, 0);
  assert.equal(parsed.refused, 1);
  assert.match(parsed.entries[0].text, /B000VNLYYS/);
});

test('the real 2026-08-06 fixes log parses as one cooldown skip', () => {
  const parsed = parseExecutionLog(FIXES_LOG_2026_08_06, 'reports/fixes-log.md');
  assert.equal(parsed.refused, 1);
  assert.equal(parsed.applied, 0);
  assert.equal(parsed.declaredNoOp, false);
});

test('a rollback counts as refused, and an applied fix alongside it still counts as applied', () => {
  const parsed = parseExecutionLog(FIXES_LOG_ROLLBACK, 'reports/fixes-log.md');
  assert.equal(parsed.applied, 1);
  assert.equal(parsed.refused, 1);
  assert.equal(parsed.entries[1].marker, '❌ ROLLED BACK');
});

test('an explicit no-op is a valid log — the agent ran and said what it did', () => {
  const parsed = parseExecutionLog(FIXES_LOG_NO_OP, 'reports/fixes-log.md');
  assert.equal(parsed.declaredNoOp, true);
  assert.equal(parsed.entries.length, 0);
  assert.match(summarizeExecutionLog(parsed), /declared nothing to do/);
});

// ─── Non-vacuity ───────────────────────────────────────────────────────────────

test('a header with NOTHING under it is a contract violation, not a quiet success', () => {
  assert.throws(
    () => parseExecutionLog('# Fixes Log — 2026-08-06\n\n', 'reports/fixes-log.md'),
    (error: unknown) => {
      assert.ok(error instanceof ContractViolation);
      assert.match(error.message, /must not read as a quiet success/);
      return true;
    },
  );
});

test('a log with no dated header is refused — the date is the freshness evidence', () => {
  assert.throws(() => parseExecutionLog('Fixes applied today\n- [✅] something', 'reports/fixes-log.md'), ContractViolation);
});

test('an impossible calendar date is refused rather than silently reinterpreted', () => {
  assert.throws(() => parseExecutionLog('# Fixes Log — 2026-13-45\n\n- [✅] x', 'reports/fixes-log.md'), ContractViolation);
});

// ─── Freshness ─────────────────────────────────────────────────────────────────

test('freshness comes from the HEADER DATE, not mtime — mtime lies after a CI clone', () => {
  // Both files below are seconds old on disk in CI. Only the header can tell
  // them apart, and the difference is a live agent versus a dead one.
  const fresh = parseExecutionLog(FIXES_LOG_2026_08_06, 'reports/fixes-log.md');
  assert.doesNotThrow(() => assertExecutionLogFresh(fresh, 'reports/fixes-log.md', EXECUTION_LOG_MAX_AGE_HOURS, AT));

  const stale = parseExecutionLog(FIXES_LOG_2026_08_06.replace('2026-08-06', '2026-06-01'), 'reports/fixes-log.md');
  assert.throws(
    () => assertExecutionLogFresh(stale, 'reports/fixes-log.md', EXECUTION_LOG_MAX_AGE_HOURS, AT),
    (error: unknown) => {
      assert.ok(error instanceof ContractViolation);
      assert.match(error.message, /stale/);
      // execute-content.ts exits WITHOUT writing when it has no tasks, so a
      // stale content log is the live evidence of the Friday-produced-nothing
      // failure. The reason must say that, not just "old".
      assert.match(error.message, /has not produced a log within its own cadence/);
      return true;
    },
  );
});

test('the SLA is 8 days — one full weekly cadence plus a day of slack', () => {
  assert.equal(EXECUTION_LOG_MAX_AGE_HOURS, 8 * 24);
  // 7 days must pass: Thursday-to-Thursday is a healthy interval, not a fault.
  const sevenDaysOld = parseExecutionLog(FIXES_LOG_2026_08_06, 'reports/fixes-log.md');
  const sevenDaysLater = new Date('2026-08-13T00:00:00Z');
  assert.doesNotThrow(() => assertExecutionLogFresh(sevenDaysOld, 'x', EXECUTION_LOG_MAX_AGE_HOURS, sevenDaysLater));
});

// ─── The contract as the nightly consumes it ───────────────────────────────────

test('executionLogContract() passes both real files and throws on a stale one', () => {
  const contract = executionLogContract(24 * 365 * 100);
  assert.doesNotThrow(() => contract(CONTENT_LOG_2026_08_07, 'reports/content-log.md'));
  assert.doesNotThrow(() => contract(FIXES_LOG_2026_08_06, 'reports/fixes-log.md'));

  const tight = executionLogContract(1);
  assert.throws(() => tight(FIXES_LOG_2026_08_06, 'reports/fixes-log.md'), ContractViolation);
});

test('the census line names refusals separately from applications', () => {
  const parsed = parseExecutionLog(FIXES_LOG_ROLLBACK, 'reports/fixes-log.md');
  assert.equal(summarizeExecutionLog(parsed), '2026-08-06: 1 applied, 1 refused/skipped');
});

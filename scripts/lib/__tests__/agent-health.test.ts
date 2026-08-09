/**
 * agent-health.test.ts — A13.
 *
 * The fixtures below are not invented. Every one of them is a failure that
 * already ran in production, unnoticed, for weeks:
 *
 *   - `stop_reason: 'max_tokens'` at exactly 4000 output tokens: the audit,
 *     five consecutive Tuesdays, dropping every finding past the executive
 *     summary while the weekly report looked normal.
 *   - ~610 tokens of a 43,670-token synthesis: the audit again, for a month,
 *     confidently arguing for a strategy that had been formally abandoned.
 *     A HUMAN caught that one.
 *   - a clean verdict read off `source` while the defects lived in `rendered`:
 *     2026-08-09, "no violations" on the .astro files while dist/ carried 26.
 *
 * These tests exist so that none of those three can pass as health again.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  approxTokens,
  appendAgentHealth,
  assertInputFloor,
  classifyStop,
  InputFloorViolation,
  judgeVerdict,
  makeEvaluated,
  makeUnevaluable,
  recordAgentHealth,
  verdictRecord,
  type DetectorVerdict,
} from '../agent-health.js';
import { agentHealthRecordSchema } from '../../schemas/agent-health.js';

const FIELDS = { run: '2026-08-09', agent: 'audit' };

// ─── 1. stop_reason ────────────────────────────────────────────────────────────

test('the real audit truncation — max_tokens at the ceiling — is UNEVALUABLE, not a short answer', () => {
  const verdict = classifyStop({ stopReason: 'max_tokens', outputTokens: 4000, maxTokens: 4000 });
  assert.equal(verdict.status, 'unevaluable');
  assert.match(verdict.reason ?? '', /TRUNCATED/);
  // The reason must carry the two numbers a reader needs to act, not just a label.
  assert.match(verdict.reason ?? '', /4000/);
});

test('a normal completion is evaluated and carries no reason', () => {
  const verdict = classifyStop({ stopReason: 'end_turn', outputTokens: 812, maxTokens: 16000 });
  assert.equal(verdict.status, 'evaluated');
  assert.equal(verdict.reason, null);
});

test('stop_sequence, tool_use and pause_turn are complete turns, not truncations', () => {
  for (const stopReason of ['stop_sequence', 'tool_use', 'pause_turn']) {
    assert.equal(classifyStop({ stopReason, outputTokens: 10, maxTokens: 100 }).status, 'evaluated', stopReason);
  }
});

test('an ABSENT stop_reason is unevaluable — "we did not look" must not read as "it finished"', () => {
  for (const stopReason of [null, undefined]) {
    const verdict = classifyStop({ stopReason, outputTokens: null, maxTokens: null });
    assert.equal(verdict.status, 'unevaluable');
    assert.match(verdict.reason ?? '', /UNKNOWN/);
  }
});

test('a refusal is unevaluable — no output is not the same as no findings', () => {
  assert.equal(classifyStop({ stopReason: 'refusal', outputTokens: 0, maxTokens: 4000 }).status, 'unevaluable');
});

test('an UNRECOGNISED stop_reason is unevaluable — a new SDK value must not default to success', () => {
  const verdict = classifyStop({ stopReason: 'model_context_window_exceeded', outputTokens: 5, maxTokens: 100 });
  assert.equal(verdict.status, 'unevaluable');
  assert.match(verdict.reason ?? '', /unrecognised/);
});

// ─── 2. input floor ────────────────────────────────────────────────────────────

test('the 1.4%-of-synthesis run throws instead of proceeding', () => {
  // ~610 tokens, the size the audit actually received for a month.
  const fragment = 'x'.repeat(610 * 4);
  assert.throws(
    () => assertInputFloor('audit', fragment, 5_000),
    (error: unknown) => {
      assert.ok(error instanceof InputFloorViolation);
      assert.equal(error.floor, 5_000);
      assert.ok(error.tokens < 700);
      assert.match(error.message, /UNDER the/);
      return true;
    },
  );
});

test('a healthy 43,670-token context passes and returns its own size', () => {
  const full = 'x'.repeat(43_670 * 4);
  assert.equal(assertInputFloor('audit', full, 5_000), 43_670);
});

test('the floor and the ceiling measure on the SAME scale', () => {
  // assertPromptBudget uses text.length / 4. A floor computed differently would
  // be a brand-new way to be quietly wrong about the same string.
  const text = 'y'.repeat(4_000);
  assert.equal(approxTokens(text), 1_000);
});

test('exactly at the floor passes — the floor is a minimum, not a strict bound', () => {
  assert.equal(assertInputFloor('strategy', 'z'.repeat(5_000 * 4), 5_000), 5_000);
});

// ─── 3. detector verdicts ──────────────────────────────────────────────────────

const CLEAN_LIVE: DetectorVerdict = { detector: 'probe-summary', read: 'live', claims: 'live', inspected: 49, violations: 0 };

test('the 2026-08-09 lint-content failure: clean on source, claimed for rendered → UNEVALUABLE', () => {
  const verdict = judgeVerdict({ detector: 'lint-content', read: 'source', claims: 'rendered', inspected: 54, violations: 0 });
  assert.equal(verdict.status, 'unevaluable');
  assert.match(verdict.reason ?? '', /cannot see what its own transform emits/);
});

test('the SAME detector reporting violations is still believed — a true positive is a true positive', () => {
  // The bug was that "no violations" was wrong, not that its findings were. A
  // rule that suppressed real findings on a surface mismatch would trade one
  // silent failure for another.
  const verdict = judgeVerdict({ detector: 'lint-content', read: 'source', claims: 'rendered', inspected: 54, violations: 26 });
  assert.equal(verdict.status, 'evaluated');
});

test('a detector that read the surface it claims is believed when clean', () => {
  assert.equal(judgeVerdict(CLEAN_LIVE).status, 'evaluated');
});

test('zero inspected units is unevaluable — the silence of an unplugged alarm', () => {
  const verdict = judgeVerdict({ ...CLEAN_LIVE, inspected: 0 });
  assert.equal(verdict.status, 'unevaluable');
  assert.match(verdict.reason ?? '', /ZERO units/);
});

test('an unmeasured violation count is unevaluable, never a clean bill of health', () => {
  const verdict = judgeVerdict({ ...CLEAN_LIVE, violations: null });
  assert.equal(verdict.status, 'unevaluable');
  assert.match(verdict.reason ?? '', /did not measure/);
});

test('an uncounted denominator is unevaluable even when violations were found', () => {
  const verdict = judgeVerdict({ ...CLEAN_LIVE, inspected: null, violations: 3 });
  assert.equal(verdict.status, 'unevaluable');
});

test('verdictRecord folds a bad verdict into an unevaluable record carrying the reason', () => {
  const record = verdictRecord({ ...CLEAN_LIVE, inspected: 0 }, { run: '2026-08-09', agent: 'probe-summary' });
  assert.equal(record.status, 'unevaluable');
  assert.match(record.reason ?? '', /ZERO units/);
});

// ─── Constructors and the write path ───────────────────────────────────────────

test('makeUnevaluable REFUSES a blank reason — the collectors rule, restated', () => {
  for (const bad of ['', '   ', '\n']) {
    assert.throws(() => makeUnevaluable(bad, FIELDS), /non-empty, specific reason/);
  }
});

test('unmeasured fields are null, never 0', () => {
  const record = makeEvaluated({ run: '2026-08-09', agent: 'nightly-report' });
  assert.equal(record.inputTokens, null);
  assert.equal(record.outputTokens, null);
  assert.equal(record.maxTokens, null);
  assert.equal(record.stopReason, null);
  assert.equal(record.floorTokens, null);
});

test('purpose is omitted rather than nulled, so JSON.stringify drops it', () => {
  const record = makeEvaluated(FIELDS);
  assert.equal('purpose' in record, false);
  assert.equal(JSON.stringify(record).includes('purpose'), false);
});

test('every record this module writes satisfies the schema the nightly reads it back with', () => {
  const dir = mkdtempSync(join(tmpdir(), 'agent-health-'));
  const path = join(dir, 'agent-health.jsonl');
  try {
    appendAgentHealth(makeEvaluated({ ...FIELDS, purpose: 'input-floor', inputTokens: 43_670, floorTokens: 5_000 }), path);
    const stop = classifyStop({ stopReason: 'max_tokens', outputTokens: 4000, maxTokens: 4000 });
    appendAgentHealth(
      makeUnevaluable(stop.reason ?? '', { ...FIELDS, outputTokens: 4000, maxTokens: 4000, stopReason: 'max_tokens' }),
      path,
    );

    const lines = readFileSync(path, 'utf-8').trim().split('\n');
    assert.equal(lines.length, 2);
    for (const line of lines) {
      // lint-architecture-allow R4 -- test fixture: reading back what this module just wrote, to prove the schema accepts it
      const parsed = agentHealthRecordSchema.safeParse(JSON.parse(line));
      assert.equal(parsed.success, true, parsed.success ? '' : parsed.error.message);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the schema REJECTS an unevaluable record with no reason — the invariant holds at read time too', () => {
  const bad = { ...makeEvaluated(FIELDS), status: 'unevaluable' as const };
  assert.equal(agentHealthRecordSchema.safeParse(bad).success, false);
});

test('a failed write returns false and says so — it never throws into the caller', () => {
  // A directory path can be mkdir'd but never opened for append.
  const dir = mkdtempSync(join(tmpdir(), 'agent-health-'));
  try {
    assert.equal(recordAgentHealth(makeEvaluated(FIELDS), dir), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

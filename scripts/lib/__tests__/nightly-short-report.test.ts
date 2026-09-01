/**
 * nightly-short-report.test.ts — the report Jackson actually reads.
 * Run: npx tsx scripts/lib/__tests__/nightly-short-report.test.ts
 *
 * Same convention as verdict.test.ts: no framework, plain asserts, a tally, and
 * a non-zero exit on failure.
 *
 * ─── WHY THIS IS TESTED ──────────────────────────────────────────────────────
 *
 * The narrative went weekly on 2026-08-28 to stop paying ~$0.55/night for prose
 * that restated the same list. The saving worked. What shipped alongside it did
 * not: `--no-narrative` nights were rendered by fallbackReport(), the renderer
 * for when the MODEL CALL BREAKS. So six nights in seven the report opened with
 *
 *     "**The part that writes this report in plain English is what broke**"
 *
 * and listed "**The report writer failed.**" as the #1 thing needing attention,
 * over a "Raw error" block quoting the deliberate skip message. Nothing had
 * failed. Jackson made a cost decision and got a red alarm every night for it.
 *
 * That is the same defect class as a blind check reading green — the words and
 * the world disagree — and it is worse here, because the fix for a report that
 * cries wolf is that the reader stops opening it.
 *
 * The properties under test:
 *   1. a deliberate skip is NEVER described in the vocabulary of a failure
 *   2. the open problems are LISTED, not merely counted
 *   3. an unreadable ledger renders as "I could not read it", never as silence
 */

import assert from 'node:assert';
import {
  parseNeedsYou,
  skippedNarrativeReport,
  decideVerdict,
  type Source,
  type DetectorHealth,
} from '../../nightly-report.js';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${error instanceof Error ? error.message : String(error)}`);
  }
}

const healthy: DetectorHealth = { blind: [], checked: 120, selfFailure: null };

function ledgerSource(content: string | null): Source {
  return {
    name: 'ledger-state',
    path: 'data/ledger-state.json',
    trust: content === null ? 'missing' : 'verified',
    reason: null,
    content,
    ageHours: 0,
  };
}

/** The shape ledger-evaluate.ts actually writes, trimmed to what the report reads. */
const REAL_SHAPE = JSON.stringify({
  counts: { open: 0, closed: 56, escalated: 2, regressed: 1, total: 66 },
  regressed: [
    { id: 'ff01', page: '/review/gesture/', ageDays: 3, attempts: 2, reason: 'position 6.2 does not satisfy < 6.0', predicate: 'gsc-position /review/gesture/ < 6.0 after 14d' },
  ],
  escalated: [
    { id: 'aa01', page: '/review/leap-plus/', ageDays: 41, attempts: 24, reason: 'position 8.7 does not satisfy < 8.7', predicate: 'gsc-position /review/leap-plus/ < 8.7 after 14d' },
    { id: 'bb02', page: '/about/', ageDays: 24, attempts: 0, reason: 'no FAQPage block found', predicate: 'schema-valid /about/' },
  ],
});

console.log('\nnightly short report (--no-narrative nights)\n');

// ── Property 1: a deliberate skip is not a failure ──────────────────────────
test('does NOT claim the report writer failed', () => {
  const verdict = decideVerdict(0, null, 3);
  const md = skippedNarrativeReport([ledgerSource(REAL_SHAPE)], healthy, verdict);
  for (const lie of ['report writer failed', 'is what broke', 'Raw error', 'failed to generate']) {
    assert.ok(!md.includes(lie), `short report must not contain "${lie}" — nothing failed on a --no-narrative night`);
  }
});

test('does not file itself as a thing needing attention', () => {
  const verdict = decideVerdict(0, null, 3);
  const md = skippedNarrativeReport([ledgerSource(REAL_SHAPE)], healthy, verdict);
  const needsYou = md.split('## What needs you')[1]?.split('##')[0] ?? '';
  assert.ok(!/report/i.test(needsYou.split('\n').slice(0, 4).join(' ')),
    'the first item under "What needs you" must be a real site problem, not the reporter');
});

test('says plainly that the essay is weekly', () => {
  const md = skippedNarrativeReport([ledgerSource(REAL_SHAPE)], healthy, decideVerdict(0, null, 3));
  assert.ok(/once a week/i.test(md), 'must explain the cadence in plain words');
});

// ── Property 2: problems are listed, not just counted ───────────────────────
test('LISTS every waiting problem instead of only counting them', () => {
  const md = skippedNarrativeReport([ledgerSource(REAL_SHAPE)], healthy, decideVerdict(0, null, 3));
  for (const page of ['/review/leap-plus/', '/about/', '/review/gesture/']) {
    assert.ok(md.includes(page), `"${page}" is escalated/regressed and must appear by name`);
  }
});

test('puts regressions above long-stuck items', () => {
  const md = skippedNarrativeReport([ledgerSource(REAL_SHAPE)], healthy, decideVerdict(0, null, 3));
  assert.ok(md.indexOf('/review/gesture/') < md.indexOf('/review/leap-plus/'),
    'something that broke again is newer news than something stuck 41 days');
});

test('shows how long a thing has been stuck', () => {
  const md = skippedNarrativeReport([ledgerSource(REAL_SHAPE)], healthy, decideVerdict(0, null, 3));
  assert.ok(md.includes('stuck 41 days'), 'age is the signal that the robot is out of moves');
  assert.ok(md.includes('24 automatic tries'), 'attempt count tells Jackson it is his turn');
});

// ── Property 3: unreadable is never rendered as clean ───────────────────────
test('an unreadable ledger says so and never reads as "nothing needs you"', () => {
  const md = skippedNarrativeReport([ledgerSource(null)], healthy, decideVerdict(1, null, 0));
  assert.ok(/could not read/i.test(md), 'must state that the list could not be read');
  assert.ok(!/Nothing is waiting on you/i.test(md), 'absence of data must never render as all-clear');
});

test('malformed JSON is a read failure, not an empty list', () => {
  assert.strictEqual(parseNeedsYou('{not json'), null);
  assert.strictEqual(parseNeedsYou(null), null);
});

test('a genuinely clean night is allowed to say so', () => {
  const clean = JSON.stringify({ counts: { escalated: 0, regressed: 0 }, escalated: [], regressed: [] });
  const md = skippedNarrativeReport([ledgerSource(clean)], healthy, decideVerdict(0, null, 0));
  assert.ok(/Nothing is waiting on you/i.test(md));
});

// ── Blind checks stay above the fold ────────────────────────────────────────
test('blind checks are shown before the collapsed technical detail', () => {
  const blind: DetectorHealth = {
    blind: [{ detector: 'agent:competitor-intelligence/gap-analysis', reason: 'TRUNCATED at max_tokens' }],
    checked: 120,
    selfFailure: null,
  };
  const md = skippedNarrativeReport([ledgerSource(REAL_SHAPE)], blind, decideVerdict(1, null, 3));
  assert.ok(md.includes('## What I could not check'), 'a blind check must have its own visible section');
  assert.ok(md.indexOf('## What I could not check') < md.indexOf('<details>'),
    'blindness must not be buried inside the collapsed appendix');
  assert.ok(md.includes('does not say the site is fine'), 'must refuse to imply a clean night');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);

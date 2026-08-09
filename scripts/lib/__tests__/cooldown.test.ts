/**
 * cooldown.test.ts — A1.
 *
 * The fixtures below are not invented. They are the VERBATIM task lines the
 * 2026-08-06 weekly plan dropped to the cooldown gate, taken from that plan's
 * own "DROPPED TASKS (enforcement log)" section. That week the pipeline applied
 * exactly zero fixes and its fixes log was one line long.
 *
 * Two of those five SHOULD have been dropped — they are content churn, which is
 * what cooldown is for. Three should not, and the third is the sharpest: the
 * plan's own prose said the spec correction "bypasses the cooldown gate on
 * technical grounds", then the keyword list dropped it anyway because the phrase
 * "Correct the spec contradiction" matched nothing in it.
 *
 * These tests exist so that distinction cannot silently rot again.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyEdit, isCooldownExempt, cooldownVerdict, COOLDOWN_DAYS, COOLDOWN_DAYS_CRITICAL } from '../cooldown.js';

// ─── The five real dropped lines from 2026-08-06 ───────────────────────────────

const DROPPED_2026_08_06 = {
  spec: 'FIX: /chairs/steelcase-leap-plus/seat-height/ | Correct the spec contradiction | FILE: src/pages/chairs/steelcase-leap-plus/seat-height.astro',
  titleKnee: 'FIX: /knee-pain-seat-depth/ | Shorten title from 67 chars to <=60 chars; rewrite for CTR | FILE: src/pages/knee-pain-seat-depth.astro',
  titleDims: 'FIX: /correct-chair-dimensions/ | Shorten title from 73 chars to <=60 chars | FILE: src/pages/correct-chair-dimensions.astro',
  calloutAeron: 'FIX: /review/aeron-size-c/ | Add a 3-tier "Fit Verdict" callout block (Best for / Acceptable / Avoid) | FILE: src/pages/review/aeron-size-c.astro',
  rewriteLeap: 'REWRITE: /review/leap-plus/ | (1) Add a 3-row "Fit Verdict" callout block (2) expand the comparison | FILE: src/pages/review/leap-plus.astro',
} as const;

test('the spec correction is deterministic — the exact case the old keyword list missed', () => {
  assert.equal(classifyEdit(DROPPED_2026_08_06.spec), 'deterministic');
  assert.equal(isCooldownExempt(DROPPED_2026_08_06.spec), true);
});

test('title-length fixes are deterministic — a 73-char title is wrong at any cadence', () => {
  assert.equal(isCooldownExempt(DROPPED_2026_08_06.titleKnee), true);
  assert.equal(isCooldownExempt(DROPPED_2026_08_06.titleDims), true);
});

test('callout blocks and rewrites stay SUBSTANTIVE — the fix must not become a removal', () => {
  assert.equal(classifyEdit(DROPPED_2026_08_06.calloutAeron), 'substantive');
  assert.equal(classifyEdit(DROPPED_2026_08_06.rewriteLeap), 'substantive');
});

test('3 of the 5 real dropped tasks survive, and exactly the right 3', () => {
  const survives = Object.entries(DROPPED_2026_08_06)
    .filter(([, line]) => isCooldownExempt(line))
    .map(([name]) => name)
    .sort();
  assert.deepEqual(survives, ['spec', 'titleDims', 'titleKnee']);
});

// ─── The classes the old two lists covered, which must not regress ─────────────

test('everything both legacy keyword lists exempted is still exempt', () => {
  // strategy.ts had 11 keywords, execute-fixes.ts had 8 different ones. The union
  // of the two is the floor this must never fall below.
  for (const line of [
    'fix the broken schema on this page',
    'bad canonical tag points elsewhere',
    'remove the noindex directive',
    'repair the 404 link in the comparison table',
    'broken link in the sidebar',
    'voice violation: first-person testing claim on an untested chair',
    'missing affiliate tag on the CTA',
    'redirect loop between the two review pages',
    'invalid json-ld block',
    'structured data parse error',
    'FAQPage schema is malformed',
  ]) {
    assert.equal(isCooldownExempt(line), true, `should be exempt: ${line}`);
  }
});

test('classes the legacy lists missed entirely are now covered', () => {
  for (const line of [
    'meta description is 210 chars, too long',
    'shorten the meta description',
    'the seat height spec is wrong — says 22.5" unqualified',
    'factual error in the weight limit',
    'dead ASIN on the money page',
    'missing alt text on the hero image',
    'orphaned page with 0 inbound internal links',
  ]) {
    assert.equal(isCooldownExempt(line), true, `should be exempt: ${line}`);
  }
});

test('discretionary content work is NOT exempt — cooldown still means something', () => {
  for (const line of [
    'Add a Budget Tier Note callout (2-3 sentences)',
    'Expand the "Compare With" section into a full 3-column table',
    'Insert a structured verdict callout block immediately after the intro',
    'Rewrite the introduction to lead with the height threshold',
    'Add a new section on lumbar adjustment range',
  ]) {
    assert.equal(isCooldownExempt(line), false, `should NOT be exempt: ${line}`);
  }
});

// ─── cooldownVerdict ───────────────────────────────────────────────────────────

test('a deterministic defect is never blocked, however recently the page changed', () => {
  const v = cooldownVerdict({ text: DROPPED_2026_08_06.spec, daysSince: 0, critical: false });
  assert.equal(v.blocked, false);
  assert.equal(v.reason, null);
});

test('a substantive revision inside the window is blocked', () => {
  const v = cooldownVerdict({ text: 'Add a Budget Tier Note callout', daysSince: 3 });
  assert.equal(v.blocked, true);
  assert.match(v.reason ?? '', /substantive/);
});

test('a substantive revision outside the window passes', () => {
  const v = cooldownVerdict({ text: 'Add a Budget Tier Note callout', daysSince: COOLDOWN_DAYS });
  assert.equal(v.blocked, false);
});

test('critical pages use the shorter window', () => {
  const text = 'Add a Budget Tier Note callout';
  const days = COOLDOWN_DAYS_CRITICAL;
  assert.equal(cooldownVerdict({ text, daysSince: days, critical: true }).blocked, false);
  assert.equal(cooldownVerdict({ text, daysSince: days, critical: false }).blocked, true);
});

test('decay-flagged pages bypass cooldown — losing position outranks churn risk (CONT-02)', () => {
  const v = cooldownVerdict({ text: 'Rewrite the introduction', daysSince: 0, decayExempt: true });
  assert.equal(v.blocked, false);
});

test('a page never substantively edited is not on cooldown', () => {
  const v = cooldownVerdict({ text: 'Rewrite the introduction', daysSince: Number.POSITIVE_INFINITY });
  assert.equal(v.blocked, false);
});

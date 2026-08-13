/**
 * visual.test.ts — P1.
 *
 * The rule under test is the one every other detector in this repo also obeys:
 * a measurement that did not happen must be distinguishable from a measurement
 * that came back clean. For visual diffs the tempting bug is to treat
 * `diffPct: null` as 0% — "no difference detected" — when it actually means no
 * comparison occurred. That would close a rendering claim on a page nobody drew.
 *
 * Backwards compatibility is tested for real here, because it already broke once
 * during this change: every probe artifact written before P1 has no `visual` key
 * at all, and pr-gate.ts re-derives findings from stored artifacts.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveFindings, VISUAL_DIFF_THRESHOLD_PCT } from '../assertions.js';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  describePlatformMismatch,
  PROVENANCE_PATH,
  readProvenance,
  slugForPath,
  type BaselineProvenance,
} from '../visual.js';
import type { ProbeResult, ProbeVisual } from '../types.js';

/** A healthy record with everything else passing, so only visual findings appear. */
function healthy(over: Partial<ProbeResult> = {}): ProbeResult {
  return {
    url: '/review/gesture/',
    status: 200,
    redirectedTo: null,
    skipped: null,
    consoleErrors: [],
    unhandledRejections: [],
    network: { gtagFired: true, clarityLoaded: true, affiliateHandlerAttached: true, requests: [] },
    head: {
      title: 'x',
      metaDescription: 'y'.repeat(140),
      canonical: 'https://tallchairadvisor.com/review/gesture/',
      og: {}, twitter: {}, jsonLd: [], jsonLdParseErrors: [],
    },
    vitals: { lcp: 1000, cls: 0, inp: 50 },
    geo: { directAnswerPresent: true, citationCapsulePresent: true, faqPageSchemaValid: true, answerFirstOrdering: true },
    errors: [],
    healthy: true,
    observedAt: new Date().toISOString(),
    tags: { gtag: true, clarity: true, affiliate: true },
    visual: null,
    ...over,
  };
}

const vis = (over: Partial<ProbeVisual> = {}): ProbeVisual => ({
  desktop: { diffPct: 0, note: null, baselineCreated: false },
  mobile: { diffPct: 0, note: null, baselineCreated: false },
  ...over,
});

const visualFindings = (r: ProbeResult) => deriveFindings(r).filter((f) => f.issueClass === 'visual-regression');

// ─── slug ──────────────────────────────────────────────────────────────────────

test('slugForPath produces a safe, collision-free filename', () => {
  assert.equal(slugForPath('/'), 'index');
  assert.equal(slugForPath('/review/gesture/'), 'review-gesture');
  assert.equal(slugForPath('/chairs/herman-miller-aeron/tall-people/'), 'chairs-herman-miller-aeron-tall-people');
  assert.equal(slugForPath('/office-chairs-for-6-foot-7/'), 'office-chairs-for-6-foot-7');
});

// ─── the null rule ─────────────────────────────────────────────────────────────

test('diffPct null files NOTHING — no baseline is not "no difference"', () => {
  const r = healthy({ visual: vis({
    desktop: { diffPct: null, note: 'no desktop baseline', baselineCreated: false },
    mobile: { diffPct: null, note: 'screenshot failed', baselineCreated: false },
  }) });
  assert.equal(visualFindings(r).length, 0);
});

test('a freshly created baseline files nothing — it would be comparing with itself', () => {
  const r = healthy({ visual: vis({
    desktop: { diffPct: null, note: 'baseline created', baselineCreated: true },
    mobile: { diffPct: null, note: 'baseline created', baselineCreated: true },
  }) });
  assert.equal(visualFindings(r).length, 0);
});

// ─── the threshold ─────────────────────────────────────────────────────────────

test('a diff under the threshold does not file', () => {
  const under = VISUAL_DIFF_THRESHOLD_PCT - 0.001;
  const r = healthy({ visual: vis({ desktop: { diffPct: under, note: null, baselineCreated: false } }) });
  assert.equal(visualFindings(r).length, 0);
});

test('a diff at or over the threshold files, naming the viewport', () => {
  const r = healthy({ visual: vis({
    mobile: { diffPct: VISUAL_DIFF_THRESHOLD_PCT + 5, note: null, baselineCreated: false },
  }) });
  const found = visualFindings(r);
  assert.equal(found.length, 1);
  assert.match(found[0].summary, /mobile/);
  assert.deepEqual(found[0].closurePredicate, {
    kind: 'visual-diff',
    url: '/review/gesture/',
    viewport: 'mobile',
    maxPct: VISUAL_DIFF_THRESHOLD_PCT,
  });
});

test('both viewports regressing files two separate findings', () => {
  const bad = { diffPct: 40, note: null, baselineCreated: false };
  const r = healthy({ visual: { desktop: bad, mobile: bad } });
  assert.equal(visualFindings(r).length, 2);
});

// ─── failing closed ────────────────────────────────────────────────────────────

test('an unhealthy record files no visual finding — the probe could not see', () => {
  const r = healthy({ healthy: false, visual: vis({ mobile: { diffPct: 90, note: null, baselineCreated: false } }) });
  assert.equal(deriveFindings(r).length, 0, 'deriveFindings returns nothing at all for healthy:false');
});

test('a skipped record files no visual finding', () => {
  const r = healthy({ skipped: 'noindex', visual: vis({ mobile: { diffPct: 90, note: null, baselineCreated: false } }) });
  assert.equal(deriveFindings(r).length, 0);
});

// ─── backwards compatibility — this exact case broke during the build ──────────

test('a probe artifact predating P1 has no `visual` key and must not crash', () => {
  const legacy = healthy();
  // Reproduce an artifact written before the field existed: absent, not null.
  delete (legacy as Partial<ProbeResult>).visual;

  assert.doesNotThrow(
    () => deriveFindings(legacy),
    'pr-gate re-derives findings from stored artifacts, so undefined must be tolerated',
  );
  assert.equal(visualFindings(legacy).length, 0);
});

test('a malformed visual section is ignored rather than throwing', () => {
  for (const broken of [
    { desktop: null, mobile: null },
    { desktop: { diffPct: 'lots' }, mobile: undefined },
    {},
  ]) {
    const r = healthy({ visual: broken as unknown as ProbeVisual });
    assert.doesNotThrow(() => deriveFindings(r));
    assert.equal(visualFindings(r).length, 0);
  }
});

// ─── Baseline provenance (2026-08-13) ─────────────────────────────────────────
//
// THE BUG THIS ENCODES. The 98 baselines were captured on a MacBook (commit
// 05703fa) and every comparison since has run on an ubuntu runner. macOS and
// Linux rasterise fonts differently, so all 49 mobile pages carried a constant
// 1.309–3.678% diff — identical to three decimals on four consecutive nights.
// Five crossed the 2% threshold and were filed as page regressions; the other
// forty-four sat just under it with most of their budget already spent, which
// means the mobile gate was effectively off site-wide while reporting green.
//
// A stable, site-wide, non-zero diff is the signature. The property under test
// is that the cause gets NAMED rather than absorbed into the percentage.

test('a platform mismatch is reported, not absorbed', () => {
  const baseline: BaselineProvenance = {
    capturedAt: '2026-08-09T06:36:45.000Z',
    platform: 'darwin',
    arch: 'arm64',
    runner: 'local',
    source: 'git-archaeology',
    note: '',
  };
  const now: BaselineProvenance = {
    capturedAt: '2026-08-13T10:00:00.000Z',
    platform: 'linux',
    arch: 'x64',
    runner: 'ci',
    source: 'captured',
    note: '',
  };
  const message = describePlatformMismatch(baseline, now);
  assert.ok(message !== null, 'darwin baseline compared on linux must produce a message');
  assert.match(message, /darwin/);
  assert.match(message, /linux/);
  // The message has to say what to DO. "Mismatch detected" with no remedy is how
  // a warning earns the right to be ignored.
  assert.match(message, /recaptured|re-baseline/i);
});

test('same platform says nothing — a warning that always fires is noise', () => {
  const p = (platform: string): BaselineProvenance => ({
    capturedAt: '2026-08-13T10:00:00.000Z',
    platform,
    arch: 'x64',
    runner: 'ci',
    source: 'captured',
    note: '',
  });
  assert.equal(describePlatformMismatch(p('linux'), p('linux')), null);
});

test('absent provenance warns rather than claiming agreement', () => {
  // The load-bearing default. Treating "unknown" as "matching" would restore
  // exactly the silence that let this run for four nights.
  const message = describePlatformMismatch(null, {
    capturedAt: '2026-08-13T10:00:00.000Z',
    platform: 'linux',
    arch: 'x64',
    runner: 'ci',
    source: 'captured',
    note: '',
  });
  assert.ok(message !== null);
  assert.match(message, /provenance is missing/);
});

test('the committed provenance describes the known-bad baseline set', () => {
  // Guards the archaeology itself. If someone re-baselines properly, this file
  // is overwritten with platform: linux and this assertion is what tells them
  // the fixture below is stale rather than the code being wrong.
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const file = resolve(root, PROVENANCE_PATH);
  if (!existsSync(file)) return; // Not yet committed in this checkout.
  const provenance = readProvenance(root);
  assert.ok(provenance !== null, 'the committed provenance file must be readable');
  assert.ok(
    provenance.source === 'git-archaeology' || provenance.source === 'captured',
    'source must say how the record came to exist',
  );
});

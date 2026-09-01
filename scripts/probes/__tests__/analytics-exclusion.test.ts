/**
 * The probe/analytics SEAM: does the browser this probe drives get excluded
 * from GA4 and Clarity?
 *
 * WHY THIS FILE EXISTS. The exclusion is split across two files that never
 * import each other — `USER_AGENT` in probe-page.ts, and two `navigator.userAgent`
 * regexes in src/layouts/Layout.astro. Nothing in the build connects them. If
 * either side drifts, every assertion still passes, every dashboard still
 * renders, and ~54 CI page_views a night quietly refill the property — the same
 * silent-failure class the God's-Eye build exists to kill, and the exact reason
 * `wiki/synthesis/` records that defects live in the SEAM between components,
 * not inside them.
 *
 * So this does not test either side. It tests that they still agree.
 *
 * Run: npx tsx --test scripts/probes/__tests__/analytics-exclusion.test.ts
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { USER_AGENT } from '../probe-page.js';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const LAYOUT = readFileSync(resolve(REPO, 'src/layouts/Layout.astro'), 'utf8');

/** Every `/.../.test(navigator.userAgent)` guard in the layout, as live RegExps. */
function userAgentGuards(): RegExp[] {
  const found = [...LAYOUT.matchAll(/\/((?:[^/\\\n]|\\.)+)\/\.test\(navigator\.userAgent\)/g)];
  return found.map((m) => new RegExp(m[1]));
}

test('the probe user agent carries the marker the layout looks for', () => {
  assert.match(USER_AGENT, / TCA-godseye-probe\//);
});

test('layout guards both analytics tags on the user agent', () => {
  const guards = userAgentGuards();
  assert.equal(
    guards.length,
    2,
    `expected 2 navigator.userAgent guards in Layout.astro (GA4 + Clarity), found ${guards.length}. ` +
      'If a tag was added or removed, update this count deliberately.',
  );
});

test('SEAM: every layout guard actually matches the probe user agent', () => {
  for (const re of userAgentGuards()) {
    assert.ok(
      re.test(USER_AGENT),
      `Layout.astro guard ${re} does NOT match probe USER_AGENT.\n` +
        `  USER_AGENT: ${USER_AGENT}\n` +
        '  Probe traffic will silently reappear in GA4/Clarity. Change both sides together.',
    );
  }
});

test('SEAM: guards do not match an ordinary visitor', () => {
  const human =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
  for (const re of userAgentGuards()) {
    assert.ok(!re.test(human), `Layout.astro guard ${re} matches a real browser — it would exclude real traffic.`);
  }
});

test('GA4 hit is labelled, never suppressed', () => {
  // probe-page.ts asserts /g/collect COMPLETES. Excluding the probe by skipping
  // gtag('config') — or by not loading the tag — would turn that alarm
  // permanently green, which is worse than the pollution it fixes.
  assert.match(LAYOUT, /traffic_type:\s*'internal'/, 'GA4 config must tag the hit as internal traffic');
  assert.match(
    LAYOUT,
    /gtag\('config',\s*gaMeasurementId,\s*isProbe\s*\?/,
    'GA4 config must still run for probes, with traffic_type attached',
  );
});

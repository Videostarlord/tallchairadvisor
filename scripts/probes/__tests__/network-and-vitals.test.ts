/**
 * Unit tests for the two rules the June 16 incident bought:
 *   - "fired" means a request COMPLETED, not that a script tag exists and not that a
 *     request was merely attempted. Under CSP the request never completes.
 *   - a metric that was not measured is null. Never 0, never false.
 *
 * Run: npx tsx --test scripts/probes/__tests__/*.test.ts
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { isClarity, isGtagCollect, isInterestingRequest, tagFiredFrom } from '../probe-page.js';
import { toVitals, type RawVitals } from '../instrument.js';
import { defaultOutPath, isSynthetic, parseArgs } from '../cli.js';

const collect = 'https://analytics.google.com/g/collect?v=2&tid=G-TWK4EPV8DT';
const gtagJs = 'https://www.googletagmanager.com/gtag/js?id=G-TWK4EPV8DT';

test('a GA4 hit is recognised on every host GA4 actually uses', () => {
  assert.ok(isGtagCollect(collect));
  assert.ok(isGtagCollect('https://www.google-analytics.com/g/collect?v=2'));
  assert.ok(isGtagCollect('https://region1.google-analytics.com/g/collect?v=2'));
  assert.ok(isGtagCollect('https://stats.g.doubleclick.net/g/collect?v=2'));
  // Loading the library is NOT a measurement hit. This distinction is the whole point.
  assert.ok(!isGtagCollect(gtagJs));
  assert.ok(isInterestingRequest(gtagJs));
});

test('clarity is matched on subdomains, not by substring', () => {
  assert.ok(isClarity('https://www.clarity.ms/tag/wqec7ap5fe'));
  assert.ok(isClarity('https://z.clarity.ms/collect'));
  assert.ok(!isClarity('https://notclarity.example.com/clarity.ms'));
});

test('a request that never got a response is NOT a fired tag — the June 16 case', () => {
  const blocked = [{ url: collect, status: null, method: 'POST' }];
  assert.equal(tagFiredFrom(blocked, isGtagCollect), false);

  const completed = [{ url: collect, status: 204, method: 'POST' }];
  assert.equal(tagFiredFrom(completed, isGtagCollect), true);

  const errored = [{ url: collect, status: 500, method: 'POST' }];
  assert.equal(tagFiredFrom(errored, isGtagCollect), false);

  // The script tag loading while the hit is blocked is exactly what stayed invisible
  // for a month: markup fine, measurement dead.
  const june16 = [
    { url: gtagJs, status: 200, method: 'GET' },
    { url: collect, status: null, method: 'POST' },
  ];
  assert.equal(tagFiredFrom(june16, isGtagCollect), false);
});

test('vitals: unmeasured is null, measured-zero is 0, and they are different', () => {
  const base: RawVitals = {
    rejections: [],
    lcp: null,
    lcpSupported: false,
    cls: 0,
    clsSupported: false,
    interactions: [],
    inpSupported: false,
    notes: [],
  };
  assert.deepEqual(toVitals(base), { lcp: null, cls: null, inp: null });

  // Observer ran and saw no shifts: a real CLS of 0.
  assert.equal(toVitals({ ...base, clsSupported: true }).cls, 0);

  // Observer ran but no interaction crossed the 16 ms threshold: NOT an INP of 0.
  assert.equal(toVitals({ ...base, inpSupported: true, interactions: [] }).inp, null);

  // INP is the worst interaction, not the mean.
  assert.equal(toVitals({ ...base, inpSupported: true, interactions: [16, 88, 24] }).inp, 88);

  assert.equal(toVitals({ ...base, lcpSupported: true, lcp: 187.6 }).lcp, 188);
});

test('synthetic runs never write the file the predicate evaluator reads', () => {
  const live = parseArgs([]);
  assert.equal(isSynthetic(live), false);
  assert.equal(defaultOutPath(live, '2026-08-06'), 'data/probes/2026-08-06.json');

  for (const argv of [['--csp', "default-src 'self'"], ['--block', 'google-analytics.com'], ['--base', 'https://preview.pages.dev']]) {
    const args = parseArgs(argv);
    assert.equal(isSynthetic(args), true, `${argv[0]} must mark the run synthetic`);
    // The evaluator only picks up /^\d{4}-\d{2}-\d{2}\.json$/, so this name is inert.
    assert.equal(defaultOutPath(args, '2026-08-06'), 'data/probes/synthetic-2026-08-06.json');
  }
});

test('a subset run never overwrites the nightly coverage file', () => {
  assert.equal(defaultOutPath(parseArgs(['--url', '/review/gesture/']), '2026-08-06'), 'data/probes/partial-2026-08-06.json');
  assert.equal(defaultOutPath(parseArgs(['--limit', '3']), '2026-08-06'), 'data/probes/partial-2026-08-06.json');
  assert.equal(defaultOutPath(parseArgs(['--out', '/tmp/x.json', '--limit', '3']), '2026-08-06'), '/tmp/x.json');
});

test('CLI: paths are normalised, unknown flags are rejected, values are required', () => {
  const args = parseArgs(['--url', '/review/gesture', '--url', 'https://tallchairadvisor.com/about/', '--limit', '3', '--concurrency', '99']);
  assert.deepEqual(args.urls, ['/review/gesture/', '/about/']);
  assert.equal(args.limit, 3);
  assert.equal(args.concurrency, 8, 'concurrency is clamped so a typo cannot DDoS the site');
  assert.throws(() => parseArgs(['--nope']), /unknown flag/);
  assert.throws(() => parseArgs(['--url']), /requires a value/);
});

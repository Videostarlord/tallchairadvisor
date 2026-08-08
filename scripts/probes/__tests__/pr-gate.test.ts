/**
 * pr-gate.test.ts — A9's gate, hermetically.
 *
 * The assertions that matter most are the ones proving the gate REFUSES to pass when
 * it did not actually see anything. A deploy gate that green-lights on an empty or
 * failed probe is worse than no gate, because a human stops looking.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKING_CLASSES, evaluate } from '../pr-gate.js';
import { pick } from '../preview-url.js';
import type { ProbeFile, ProbeResult } from '../types.js';

function result(over: Partial<ProbeResult> = {}): ProbeResult {
  return {
    url: '/review/gesture/',
    status: 200,
    redirectedTo: null,
    skipped: null,
    consoleErrors: [],
    unhandledRejections: [],
    // A healthy baseline: both tags actually fired. Anything less and deriveFindings
    // legitimately raises tag-not-firing-*, which would mask what each test is probing.
    network: { gtagFired: true, clarityLoaded: true, affiliateHandlerAttached: true, requests: [] },
    head: {
      title: 'T',
      metaDescription: 'd'.repeat(140),
      canonical: 'https://tallchairadvisor.com/review/gesture/',
      og: {},
      twitter: {},
      jsonLd: [],
      jsonLdParseErrors: [],
    } as unknown as ProbeResult['head'],
    vitals: {} as unknown as ProbeResult['vitals'],
    geo: {
      directAnswerPresent: true,
      citationCapsulePresent: true,
      answerFirstOrdering: true,
      faqPageSchemaValid: true,
    } as unknown as ProbeResult['geo'],
    errors: [],
    healthy: true,
    observedAt: '2026-08-08T00:00:00.000Z',
    tags: { gtagFired: true, clarityFired: true } as unknown as ProbeResult['tags'],
    ...over,
  };
}

const file = (results: ProbeResult[]): ProbeFile => ({
  generatedAt: '2026-08-08T00:00:00.000Z',
  siteUrl: 'https://preview.pages.dev',
  results,
});

test('an empty probe never reads as a pass', () => {
  const v = evaluate(file([]), null);
  assert.notEqual(v.unevaluable, null);
  assert.equal(v.blocking.length, 0, 'and it is not reported as a blocking finding either');
});

test('a run where every page was unhealthy or skipped is unevaluable, not clean', () => {
  for (const over of [{ healthy: false }, { skipped: 'noindex' as const }, { skipped: 'redirect-source' as const }]) {
    const v = evaluate(file([result(over), result({ url: '/x/', ...over })]), null);
    assert.notEqual(v.unevaluable, null, `${JSON.stringify(over)} must not pass`);
  }
});

test('a partially blind run is unevaluable even when the pages it DID see are clean', () => {
  const v = evaluate(file([result(), result({ url: '/x/', healthy: false })]), null);
  assert.notEqual(v.unevaluable, null);
});

test('a truncated run is unevaluable — fewer pages than the workflow asked for', () => {
  assert.notEqual(evaluate(file([result()]), 5).unevaluable, null);
  assert.equal(evaluate(file([result()]), 1).unevaluable, null);
});

test('a fully clean run passes', () => {
  const v = evaluate(file([result()]), 1);
  assert.equal(v.unevaluable, null);
  assert.equal(v.blocking.length, 0);
});

test('each A9 class blocks', () => {
  const base = result();
  const cases: Array<[string, Partial<ProbeResult>]> = [
    ['console-errors', { consoleErrors: [{ text: 'CSP violation', location: 'x' }] }],
    ['canonical-not-self', { head: { ...base.head, canonical: 'https://tallchairadvisor.com/elsewhere/' } }],
    // The June 16 case: gtag.js still returns 200, but no /g/collect completes.
    ['tag-not-firing-gtag', { network: { ...base.network, gtagFired: false } }],
    ['tag-not-firing-clarity', { network: { ...base.network, clarityLoaded: false } }],
  ];
  for (const [cls, over] of cases) {
    const v = evaluate(file([result(over)]), 1);
    assert.ok(
      v.blocking.some((f) => f.issueClass === cls),
      `${cls} must block (got ${v.blocking.map((f) => f.issueClass).join(', ') || 'nothing'})`,
    );
  }
});

test('strategy findings are advisory, never blocking — the kill list must not become a build gate', () => {
  const v = evaluate(
    file([
      result({
        geo: { ...result().geo, directAnswerPresent: false, citationCapsulePresent: false },
        head: { ...result().head, metaDescription: 'too short' },
      }),
    ]),
    1,
  );
  assert.equal(v.blocking.length, 0, `nothing here should block, got: ${v.blocking.map((f) => f.issueClass).join(', ')}`);
  assert.ok(v.advisory.length > 0, 'but the findings are still reported');
  for (const f of v.advisory) assert.equal(BLOCKING_CLASSES.has(f.issueClass), false);
});

test('the blocking set is exactly A9 — widening it should be a deliberate, visible diff', () => {
  assert.deepEqual(
    [...BLOCKING_CLASSES].sort(),
    ['canonical-not-self', 'console-errors', 'tag-not-firing-clarity', 'tag-not-firing-gtag'],
  );
});

// ─── preview-url.pick — which deployment the gate agrees to probe ──────────────
//
// The whole point of matching on commit SHA is that a branch alias keeps serving the
// PREVIOUS build until the new one lands. These assert the gate never accepts one.

const dep = (over: Record<string, unknown> = {}) => ({
  id: 'd1',
  url: 'https://abc123.tca.pages.dev',
  latest_stage: { name: 'deploy', status: 'success' },
  deployment_trigger: { metadata: { commit_hash: 'a'.repeat(40) } },
  ...over,
});

test('a deployment for a DIFFERENT commit is never accepted', () => {
  const r = pick([dep({ deployment_trigger: { metadata: { commit_hash: 'b'.repeat(40) } } })] as never, 'a'.repeat(40));
  assert.equal(r.url, null);
  assert.match(r.reason ?? '', /no Pages deployment yet/);
});

test('the right commit still building is a wait, not a pass', () => {
  const r = pick([dep({ latest_stage: { name: 'build', status: 'active' } })] as never, 'a'.repeat(40));
  assert.equal(r.url, null);
  assert.match(r.reason ?? '', /stage build\/active/);
});

test('a failed build is surfaced as a failure, not an endless wait', () => {
  const r = pick([dep({ latest_stage: { name: 'build', status: 'failure' } })] as never, 'a'.repeat(40));
  assert.match(r.reason ?? '', /FAILED/);
});

test('a succeeded deployment with no url is not usable', () => {
  const r = pick([dep({ url: '' })] as never, 'a'.repeat(40));
  assert.equal(r.url, null);
  assert.match(r.reason ?? '', /carries no url/);
});

test('the matching, succeeded deployment is returned with no trailing slash', () => {
  const r = pick([dep({ url: 'https://abc123.tca.pages.dev/' })] as never, 'a'.repeat(40));
  assert.equal(r.url, 'https://abc123.tca.pages.dev');
  assert.equal(r.reason, null);
});

test('an empty deployment list waits rather than throwing', () => {
  assert.equal(pick([] as never, 'a'.repeat(40)).url, null);
  assert.equal(pick(null as never, 'a'.repeat(40)).url, null);
});

/**
 * Unit tests for the probe's verdict layer.
 *
 * These exist to pin the two rules that are easy to regress and expensive to lose:
 *   1. A record that measured nothing produces NO findings. Deriving claims from the
 *      system's own blindness is the failure mode §7.3 exists to stop.
 *   2. Every finding carries a closure predicate. The ledger rejects one without a
 *      predicate at write time; this asserts the probe never even tries.
 *
 * Run: npx tsx --test scripts/probes/__tests__/*.test.ts
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  canonicalIsSelf,
  deriveFindings,
  faqPageValidity,
  salvageTypeFromRaw,
  summarise,
  META_MAX,
  META_MIN,
} from '../assertions.js';
import { emptyResult } from '../probe-page.js';
import type { ProbeResult } from '../types.js';

function healthyPage(path = '/review/gesture/'): ProbeResult {
  const r = emptyResult(path);
  r.status = 200;
  r.network = {
    gtagFired: true,
    clarityLoaded: true,
    affiliateHandlerAttached: true,
    requests: [{ url: 'https://analytics.google.com/g/collect?v=2', status: 204, method: 'POST' }],
  };
  r.head.metaDescription = 'x'.repeat(146);
  r.head.canonical = `https://tallchairadvisor.com${path}`;
  r.geo = {
    directAnswerPresent: true,
    citationCapsulePresent: true,
    faqPageSchemaValid: true,
    answerFirstOrdering: true,
  };
  return r;
}

test('a clean page produces no findings', () => {
  assert.deepEqual(deriveFindings(healthyPage()), []);
});

test('every finding carries a closure predicate with a known kind', () => {
  const r = healthyPage();
  r.network.gtagFired = false;
  r.network.clarityLoaded = false;
  r.consoleErrors.push({ text: 'boom', location: 'x:1:1' });
  r.head.metaDescription = null;
  r.head.canonical = 'https://tallchairadvisor.com/somewhere-else/';
  r.geo.citationCapsulePresent = false;

  const findings = deriveFindings(r);
  assert.ok(findings.length >= 6);
  const kinds = new Set<string>();
  for (const f of findings) {
    assert.ok(f.closurePredicate !== undefined && f.closurePredicate !== null, `${f.issueClass} has no predicate`);
    assert.equal(typeof f.closurePredicate.kind, 'string');
    kinds.add(f.closurePredicate.kind as string);
  }
  for (const expected of ['no-console-errors', 'tag-fires', 'meta-length', 'canonical-self', 'geo-capsule']) {
    assert.ok(kinds.has(expected), `expected a ${expected} predicate`);
  }
});

test('an unhealthy record files nothing — blindness is not evidence', () => {
  const r = healthyPage();
  r.healthy = false;
  r.errors.push('probe aborted');
  r.network.gtagFired = false;
  assert.deepEqual(deriveFindings(r), []);
});

test('a skipped redirect source files nothing and is never counted as probed', () => {
  const r = emptyResult('/best-office-chairs/');
  r.skipped = 'redirect-source';
  r.status = 301;
  assert.deepEqual(deriveFindings(r), []);

  const summary = summarise([r, healthyPage()]);
  assert.equal(summary.probed, 1);
  assert.equal(summary.skippedRedirectSource, 1);
});

test('meta length bounds are inclusive at both ends', () => {
  const short = healthyPage();
  short.head.metaDescription = 'x'.repeat(META_MIN - 1);
  assert.ok(deriveFindings(short).some((f) => f.issueClass === 'meta-description-length'));

  const atMin = healthyPage();
  atMin.head.metaDescription = 'x'.repeat(META_MIN);
  assert.ok(!deriveFindings(atMin).some((f) => f.issueClass === 'meta-description-length'));

  const atMax = healthyPage();
  atMax.head.metaDescription = 'x'.repeat(META_MAX);
  assert.ok(!deriveFindings(atMax).some((f) => f.issueClass === 'meta-description-length'));

  const long = healthyPage();
  long.head.metaDescription = 'x'.repeat(META_MAX + 1);
  assert.ok(deriveFindings(long).some((f) => f.issueClass === 'meta-description-length'));
});

test('canonical comparison ignores origin so preview deploys are not false positives', () => {
  assert.ok(canonicalIsSelf('https://tallchairadvisor.com/review/gesture/', '/review/gesture/'));
  assert.ok(canonicalIsSelf('https://preview.pages.dev/review/gesture', '/review/gesture/'));
  assert.ok(!canonicalIsSelf('https://tallchairadvisor.com/review/leap-plus/', '/review/gesture/'));
  assert.ok(!canonicalIsSelf(null, '/review/gesture/'));
});

test('FAQPage validity: valid, malformed, and absent are three different answers', () => {
  const valid = JSON.stringify({
    '@type': 'FAQPage',
    mainEntity: [{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }],
  });
  assert.equal(faqPageValidity([valid]), true);

  const noAnswerText = JSON.stringify({
    '@type': 'FAQPage',
    mainEntity: [{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: '' } }],
  });
  assert.equal(faqPageValidity([noAnswerText]), false);

  const emptyMainEntity = JSON.stringify({ '@type': 'FAQPage', mainEntity: [] });
  assert.equal(faqPageValidity([emptyMainEntity]), false);

  // Absent is null, not false — the caller decides whether absence is a defect.
  assert.equal(faqPageValidity([JSON.stringify({ '@type': 'Product', name: 'chair' })]), null);
  assert.equal(faqPageValidity(['{not json']), null);
});

test('FAQPage is found inside arrays and @graph, matching how Layout.astro emits schema', () => {
  const question = { '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } };
  const asArray = JSON.stringify([{ '@type': 'Product' }, { '@type': 'FAQPage', mainEntity: [question] }]);
  assert.equal(faqPageValidity([asArray]), true);
  const asGraph = JSON.stringify({ '@graph': [{ '@type': 'FAQPage', mainEntity: [question] }] });
  assert.equal(faqPageValidity([asGraph]), true);
});

test('an FAQ finding is only filed when a FAQPage node actually exists', () => {
  const noFaq = healthyPage();
  noFaq.geo.faqPageSchemaValid = false;               // absent → rendered false
  noFaq.head.jsonLd = [{ type: 'Product', valid: true, raw: '{}' }];
  assert.ok(!deriveFindings(noFaq).some((f) => f.issueClass === 'faqpage-schema-invalid'));

  const brokenFaq = healthyPage();
  brokenFaq.geo.faqPageSchemaValid = false;
  brokenFaq.head.jsonLd = [{ type: 'FAQPage', valid: true, raw: '{}' }];
  assert.ok(deriveFindings(brokenFaq).some((f) => f.issueClass === 'faqpage-schema-invalid'));
});

test('an unparseable JSON-LD block only files when its type can be named', () => {
  const named = healthyPage();
  named.head.jsonLdParseErrors = ['block 0: Unexpected token :: {"@type":"Product","name":'];
  const findings = deriveFindings(named);
  const schema = findings.find((f) => f.closurePredicate.kind === 'schema-valid');
  assert.ok(schema !== undefined);
  assert.equal(schema.closurePredicate.type, 'Product');

  const unnamed = healthyPage();
  unnamed.head.jsonLdParseErrors = ['block 0: Unexpected end of JSON input :: {"nam'];
  assert.ok(!deriveFindings(unnamed).some((f) => f.closurePredicate.kind === 'schema-valid'));
});

test('salvageTypeFromRaw finds the first @type or gives up honestly', () => {
  assert.equal(salvageTypeFromRaw('{"@type":"BreadcrumbList","x":1}'), 'BreadcrumbList');
  assert.equal(salvageTypeFromRaw('{"name":"no type here"}'), null);
});

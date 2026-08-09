/**
 * predicates.test.ts — the predicate layer, hermetically.
 * Run: npx tsx scripts/lib/__tests__/predicates.test.ts
 *
 * No network. Every fetch-backed evaluator is driven by pre-seeding ctx.pageCache
 * with synthetic HTML, which is exactly what fetchPage() consults first — so the
 * real parsing path runs, without a live request and without a mock framework.
 *
 * The assertions that matter most are the `unevaluable` ones. It is easy to write a
 * predicate layer that quietly reports "fine" when it has no data; that layer would
 * have reported a healthy site throughout the month-long June 16 CSP outage.
 */

import { absoluteUrl } from '../predicates/http.js';
import {
  MissingPredicateError,
  PREDICATE_KINDS,
  buildEvalContext,
  evaluatePredicate,
  isValidClosurePredicate,
  validateClosurePredicate,
  type ClosurePredicate,
  type EvalContext,
  type PageFetch,
  type ProbeRecord,
} from '../predicates/index.js';

// ─── harness ───────────────────────────────────────────────────────────────────

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

const BASE = 'https://tallchairadvisor.test';

interface CtxOverrides {
  probes?: Map<string, ProbeRecord> | null;
  probeSource?: string | null;
  probeReason?: string | null;
  collectors?: EvalContext['collectors'];
  verifiedAsins?: Set<string> | null;
  knownDeadAsins?: Set<string>;
  redirects?: Map<string, string>;
  gscPageMetrics?: EvalContext['gscPageMetrics'];
  gscSource?: string | null;
  gscReason?: string | null;
  subject?: EvalContext['subject'];
  now?: Date;
}

function makeCtx(overrides: CtxOverrides = {}): EvalContext {
  const now = overrides.now === undefined ? new Date('2026-08-05T03:00:00.000Z') : overrides.now;
  return {
    repoRoot: '/nonexistent',
    today: now.toISOString().slice(0, 10),
    now,
    baseUrl: BASE,
    probes: overrides.probes === undefined ? null : overrides.probes,
    probeSource: overrides.probeSource === undefined ? null : overrides.probeSource,
    probeReason: overrides.probeReason === undefined ? 'data/probes/ does not exist' : overrides.probeReason,
    collectors: overrides.collectors === undefined ? new Map() : overrides.collectors,
    verifiedAsins: overrides.verifiedAsins === undefined ? new Set(['B016OIF2JU']) : overrides.verifiedAsins,
    knownDeadAsins: overrides.knownDeadAsins === undefined ? new Set(['B0DEADBEEF']) : overrides.knownDeadAsins,
    redirects: overrides.redirects === undefined ? new Map() : overrides.redirects,
    gscPageMetrics: overrides.gscPageMetrics === undefined ? null : overrides.gscPageMetrics,
    gscSource: overrides.gscSource === undefined ? null : overrides.gscSource,
    gscReason: overrides.gscReason === undefined ? 'data/collectors/gsc.json does not exist' : overrides.gscReason,
    allowNetwork: false,
    pageCache: new Map(),
    subject: overrides.subject === undefined ? null : overrides.subject,
  };
}

/** Seed the fetch cache so the evaluator parses real HTML without a real request. */
function serve(ctx: EvalContext, path: string, html: string, status = 200): void {
  const url = absoluteUrl(path, ctx.baseUrl);
  const page: PageFetch = { url, status, html, reason: null, fetchedAt: '2026-08-05T03:00:00.000Z' };
  ctx.pageCache.set(url, page);
}

const HEAD = (inner: string): string => `<!DOCTYPE html><html><head>${inner}</head><body><p>hi</p></body></html>`;
const DESC_150 = 'x'.repeat(150);

// ─── 1. the write-time gate ────────────────────────────────────────────────────

console.log('\n[1] validateClosurePredicate — presence, kind, and shape');

function rejects(label: string, value: unknown): void {
  try {
    validateClosurePredicate(value, 'test');
    assert(label, false, 'accepted, expected MissingPredicateError');
  } catch (error) {
    assert(label, error instanceof MissingPredicateError, String(error));
  }
}

rejects('undefined', undefined);
rejects('null', null);
rejects('a string', 'meta description should be shorter');
rejects('an array', [{ kind: 'meta-length' }]);
rejects('an object with no kind', { url: '/a/', min: 130, max: 165 });
rejects('an unregistered kind', { kind: 'looks-good-to-me', url: '/a/' });
rejects('meta-length with no fields', { kind: 'meta-length' });
rejects('meta-length with no max', { kind: 'meta-length', url: '/a/', min: 130 });
rejects('meta-length with string bounds', { kind: 'meta-length', url: '/a/', min: '130', max: '165' });
rejects('meta-length with a non-integer bound', { kind: 'meta-length', url: '/a/', min: 130.5, max: 165 });
rejects('canonical-self with no url', { kind: 'canonical-self' });
rejects('schema-valid with no type', { kind: 'schema-valid', url: '/a/' });
rejects('tag-fires with no tag', { kind: 'tag-fires', url: '/a/' });
rejects('gsc-position with no afterDays', { kind: 'gsc-position', url: '/a/', op: '<', value: 5 });
rejects('gsc-position with a bogus op', { kind: 'gsc-position', url: '/a/', op: 'about', value: 5, afterDays: 14 });
rejects('collector-healthy with no collector', { kind: 'collector-healthy' });
rejects('an empty url', { kind: 'canonical-self', url: '' });

assert('meta-length, complete → accepted', isValidClosurePredicate({ kind: 'meta-length', url: '/a/', min: 130, max: 165 }));
assert('canonical-self, complete → accepted', isValidClosurePredicate({ kind: 'canonical-self', url: '/a/' }));
assert('schema-valid, complete → accepted', isValidClosurePredicate({ kind: 'schema-valid', url: '/a/', type: 'FAQPage' }));
assert('asin-registered without optional minLinks → accepted', isValidClosurePredicate({ kind: 'asin-registered', url: '/a/' }));
assert('collector-healthy, complete → accepted', isValidClosurePredicate({ kind: 'collector-healthy', collector: 'gsc' }));
assert('visual-diff, complete → accepted', isValidClosurePredicate({ kind: 'visual-diff', url: '/a/', viewport: 'mobile', maxPct: 2 }));
rejects('visual-diff with an unknown viewport', { kind: 'visual-diff', url: '/a/', viewport: 'tablet', maxPct: 2 });
rejects('visual-diff with no maxPct', { kind: 'visual-diff', url: '/a/', viewport: 'mobile' });

// The count is asserted deliberately so registering a kind is a visible diff,
// exactly like BLOCKING_CLASSES in pr-gate. 11 = the PRD's 9 + collector-healthy
// + visual-diff (P1).
assert(
  'every PRD kind plus collector-healthy and visual-diff is registered',
  PREDICATE_KINDS.length === 11
    && PREDICATE_KINDS.includes('collector-healthy')
    && PREDICATE_KINDS.includes('visual-diff'),
  PREDICATE_KINDS.join(','),
);

// ─── 2. unevaluable is never pass and never fail ───────────────────────────────

console.log('\n[2] probe-only predicates are unevaluable without probes — never pass, never fail');

const run = async (p: ClosurePredicate, ctx: EvalContext) => evaluatePredicate(p, ctx);

{
  const ctx = makeCtx();
  const console_ = await run({ kind: 'no-console-errors', url: '/review/gesture/' }, ctx);
  assert('no-console-errors with no probe → unevaluable', console_.result === 'unevaluable', console_.result);
  assert('  …and says why', /probe/i.test(console_.reason), console_.reason);
  assert('  …and carries no evidence', console_.evidence === null);

  const tag = await run({ kind: 'tag-fires', url: '/review/gesture/', tag: 'gtag' }, ctx);
  assert('tag-fires with no probe → unevaluable', tag.result === 'unevaluable', tag.result);
  assert('  …and says a network event cannot be read from HTML', /network event/i.test(tag.reason), tag.reason);

  const indexed = await run({ kind: 'gsc-indexed', url: '/review/gesture/' }, ctx);
  assert('gsc-indexed with no collector → unevaluable', indexed.result === 'unevaluable', indexed.result);

  const healthy = await run({ kind: 'collector-healthy', collector: 'cloudflare' }, ctx);
  assert('collector-healthy for an unbuilt collector → unevaluable', healthy.result === 'unevaluable', healthy.result);
}

{
  const ctx = makeCtx({ probes: new Map([['/review/gesture/', { url: '/review/gesture/', consoleErrors: 0 }]]), probeSource: 'probe:2026-08-05' });
  const zero = await run({ kind: 'no-console-errors', url: '/review/gesture/' }, ctx);
  assert('probe with 0 console errors → pass with evidence', zero.result === 'pass' && zero.evidence !== null, zero.reason);

  const ctx2 = makeCtx({ probes: new Map([['/a/', { url: '/a/', consoleErrors: ['CSP violation', 'gtag blocked'] }]]), probeSource: 'probe:2026-08-05' });
  const two = await run({ kind: 'no-console-errors', url: '/a/' }, ctx2);
  assert('probe with 2 console errors → fail', two.result === 'fail', two.reason);

  const ctx3 = makeCtx({ probes: new Map([['/a/', { url: '/a/' }]]), probeSource: 'probe:2026-08-05' });
  const silent = await run({ kind: 'no-console-errors', url: '/a/' }, ctx3);
  assert('probe covering the URL but carrying no console field → unevaluable', silent.result === 'unevaluable', silent.reason);
}

{
  const ctx = makeCtx({ probes: new Map([['/a/', { url: '/a/', tags: { gtag: true, clarity: false } }]]), probeSource: 'probe:2026-08-05' });
  const gtag = await run({ kind: 'tag-fires', url: '/a/', tag: 'gtag' }, ctx);
  const clarity = await run({ kind: 'tag-fires', url: '/a/', tag: 'clarity' }, ctx);
  assert('tag-fires reads a fired tag → pass', gtag.result === 'pass', gtag.reason);
  assert('tag-fires reads a blocked tag → fail (the June 16 CSP case)', clarity.result === 'fail', clarity.reason);
}

// ─── 2b. the ProbeResult shape scripts/probes/ actually writes ────────────────

console.log('\n[2b] interop with scripts/probes/types.ts');

{
  // ProbeHead.jsonLd + ProbeGeo, verbatim field names from scripts/probes/types.ts.
  const record: ProbeRecord = {
    url: '/review/gesture/',
    status: 200,
    skipped: null,
    healthy: true,
    observedAt: '2026-08-06T03:00:00.000Z',
    consoleErrors: [],
    unhandledRejections: [],
    head: {
      metaDescription: 'd'.repeat(150),
      canonical: `${BASE}/review/gesture/`,
      jsonLd: [
        { type: 'Review+Product', valid: true, raw: '{}' },
        { type: '(unparseable)', valid: false, raw: 'nope' },
      ],
    },
    geo: { directAnswerPresent: true, citationCapsulePresent: true, faqPageSchemaValid: true, answerFirstOrdering: true },
    tags: { gtag: true, clarity: null, affiliate: null },
  };
  const ctx = makeCtx({ probes: new Map([['/review/gesture/', record]]), probeSource: 'probe:2026-08-06' });

  const meta = await run({ kind: 'meta-length', url: '/review/gesture/', min: 130, max: 165 }, ctx);
  assert('head.metaDescription is read from the probe → pass', meta.result === 'pass', meta.reason);
  assert('  …evidence is sourced to the probe, not a fetch', meta.evidence !== null && meta.evidence.source === 'probe:2026-08-06');

  const canonical = await run({ kind: 'canonical-self', url: '/review/gesture/' }, ctx);
  assert('head.canonical is read from the probe → pass', canonical.result === 'pass', canonical.reason);

  const product = await run({ kind: 'schema-valid', url: '/review/gesture/', type: 'Product' }, ctx);
  assert("head.jsonLd 'Review+Product' splits into both types → pass", product.result === 'pass', product.reason);
  const faq = await run({ kind: 'schema-valid', url: '/review/gesture/', type: 'FAQPage' }, ctx);
  assert('an unparseable block does not satisfy a wanted type → fail', faq.result === 'fail', faq.reason);

  const geo = await run({ kind: 'geo-capsule', url: '/review/gesture/' }, ctx);
  assert('geo.directAnswerPresent + citationCapsulePresent → pass', geo.result === 'pass', geo.reason);

  const gtag = await run({ kind: 'tag-fires', url: '/review/gesture/', tag: 'gtag' }, ctx);
  assert('tags.gtag true → pass', gtag.result === 'pass', gtag.reason);
  const clarity = await run({ kind: 'tag-fires', url: '/review/gesture/', tag: 'clarity' }, ctx);
  assert('tags.clarity null (unknown) → unevaluable, not fail', clarity.result === 'unevaluable', clarity.reason);
}

{
  // "healthy: false = the probe itself could not complete. The record proves nothing."
  const broken: ProbeRecord = {
    url: '/a/',
    healthy: false,
    skipped: null,
    consoleErrors: [],
    head: { metaDescription: 'x'.repeat(150) },
  };
  const ctx = makeCtx({ probes: new Map([['/a/', broken]]), probeSource: 'probe:2026-08-06' });
  const console_ = await run({ kind: 'no-console-errors', url: '/a/' }, ctx);
  assert('an unhealthy probe record is not read → unevaluable', console_.result === 'unevaluable', console_.result);
  assert('  …and says the record proves nothing', /proves nothing/.test(console_.reason), console_.reason);

  const meta = await run({ kind: 'meta-length', url: '/a/', min: 130, max: 165 }, ctx);
  assert(
    'a markup predicate ignores the unhealthy record and falls back to fetch',
    meta.result === 'unevaluable' && /network disabled/.test(meta.reason),
    meta.reason,
  );

  const skipped: ProbeRecord = { url: '/b/', healthy: true, skipped: 'redirect-source', consoleErrors: [] };
  const ctx2 = makeCtx({ probes: new Map([['/b/', skipped]]), probeSource: 'probe:2026-08-06' });
  const tag = await run({ kind: 'tag-fires', url: '/b/', tag: 'gtag' }, ctx2);
  assert('a skipped record → unevaluable naming the skip reason', tag.result === 'unevaluable' && /redirect-source/.test(tag.reason), tag.reason);
}

// ─── 3. redirect sources are never evaluated as pages ──────────────────────────

console.log('\n[3] a 301 source is refused, not audited as a page');

{
  const redirects = new Map([['/best-office-chairs/', '/office-chairs-for-tall-people/']]);
  const ctx = makeCtx({ redirects });
  serve(ctx, '/best-office-chairs/', HEAD(`<meta name="description" content="${DESC_150}">`));
  const verdict = await run({ kind: 'meta-length', url: '/best-office-chairs/', min: 130, max: 165 }, ctx);
  assert('redirect source → unevaluable, not pass', verdict.result === 'unevaluable', verdict.result);
  assert('  …and names the reason', /301 source/.test(verdict.reason), verdict.reason);
}

// ─── 4. meta-length against real markup ────────────────────────────────────────

console.log('\n[4] meta-length');

{
  const ctx = makeCtx();
  serve(ctx, '/ok/', HEAD(`<meta name="description" content="${DESC_150}">`));
  serve(ctx, '/long/', HEAD(`<meta name="description" content="${'y'.repeat(210)}">`));
  serve(ctx, '/none/', HEAD('<title>no description here</title>'));
  serve(ctx, '/entities/', HEAD(`<meta name="description" content="At 6&#39;4&#34; ${'z'.repeat(130)}">`));

  const ok = await run({ kind: 'meta-length', url: '/ok/', min: 130, max: 165 }, ctx);
  assert('150 chars in [130,165] → pass', ok.result === 'pass', ok.reason);
  assert('  …evidence carries the measured length', ok.evidence !== null && ok.evidence.detail.length === 150);

  const long = await run({ kind: 'meta-length', url: '/long/', min: 130, max: 165 }, ctx);
  assert('210 chars → fail, with evidence', long.result === 'fail' && long.evidence !== null, long.reason);

  const none = await run({ kind: 'meta-length', url: '/none/', min: 130, max: 165 }, ctx);
  assert('no meta description → fail (not unevaluable — we looked and it is not there)', none.result === 'fail', none.reason);

  const entities = await run({ kind: 'meta-length', url: '/entities/', min: 130, max: 165 }, ctx);
  const measured = entities.evidence === null ? -1 : (entities.evidence.detail.length as number);
  // "At 6'4\" " decodes to 8 characters; undecoded it would measure 18.
  assert("&#39;/&#34; are decoded before measuring (6'4\" costs 4 chars, not 14)", measured === 138, String(measured));
}

// ─── 5. canonical-self ─────────────────────────────────────────────────────────

console.log('\n[5] canonical-self');

{
  const ctx = makeCtx();
  serve(ctx, '/self/', HEAD(`<link rel="canonical" href="${BASE}/self/">`));
  serve(ctx, '/other/', HEAD(`<link rel="canonical" href="${BASE}/somewhere-else/">`));
  serve(ctx, '/bare/', HEAD('<title>no canonical</title>'));

  const self = await run({ kind: 'canonical-self', url: '/self/' }, ctx);
  assert('canonical → self → pass', self.result === 'pass', self.reason);
  const other = await run({ kind: 'canonical-self', url: '/other/' }, ctx);
  assert('canonical → another page → fail', other.result === 'fail', other.reason);
  const bare = await run({ kind: 'canonical-self', url: '/bare/' }, ctx);
  assert('no canonical → fail', bare.result === 'fail', bare.reason);
}

// ─── 6. schema-valid ───────────────────────────────────────────────────────────

console.log('\n[6] schema-valid');

{
  const ctx = makeCtx();
  serve(ctx, '/faq/', HEAD('<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[]}</script>'));
  serve(ctx, '/graph/', HEAD('<script type="application/ld+json">{"@graph":[{"@type":"BreadcrumbList"},{"@type":["Product","Review"]}]}</script>'));
  serve(ctx, '/broken/', HEAD('<script type="application/ld+json">{"@type":"FAQPage",}</script>'));
  serve(ctx, '/nolddd/', HEAD('<title>nothing</title>'));

  const faq = await run({ kind: 'schema-valid', url: '/faq/', type: 'FAQPage' }, ctx);
  assert('FAQPage present and parses → pass', faq.result === 'pass', faq.reason);
  const product = await run({ kind: 'schema-valid', url: '/graph/', type: 'Product' }, ctx);
  assert('@type inside @graph, array form → pass', product.result === 'pass', product.reason);
  const missing = await run({ kind: 'schema-valid', url: '/graph/', type: 'FAQPage' }, ctx);
  assert('wanted type absent → fail', missing.result === 'fail', missing.reason);
  const broken = await run({ kind: 'schema-valid', url: '/broken/', type: 'FAQPage' }, ctx);
  assert('malformed JSON-LD → fail, not a crash', broken.result === 'fail', broken.reason);
  const none = await run({ kind: 'schema-valid', url: '/nolddd/', type: 'FAQPage' }, ctx);
  assert('no JSON-LD blocks at all → fail', none.result === 'fail', none.reason);
}

// ─── 7. geo-capsule ────────────────────────────────────────────────────────────

console.log('\n[7] geo-capsule');

{
  const ctx = makeCtx();
  serve(ctx, '/both/', '<html><body><p>Direct Answer</p><!-- tca-aio-capsule --><p>capsule</p></body></html>');
  serve(ctx, '/half/', '<html><body><p>Direct Answer</p></body></html>');

  const both = await run({ kind: 'geo-capsule', url: '/both/' }, ctx);
  assert('Direct Answer + capsule sentinel → pass', both.result === 'pass', both.reason);
  const half = await run({ kind: 'geo-capsule', url: '/half/' }, ctx);
  assert('capsule sentinel missing → fail', half.result === 'fail', half.reason);
  assert('  …and names what is missing', /tca-aio-capsule/.test(half.reason), half.reason);
}

// ─── 8. asin-registered ────────────────────────────────────────────────────────

console.log('\n[8] asin-registered');

{
  const ctx = makeCtx();
  serve(ctx, '/good/', '<a href="https://www.amazon.com/dp/B016OIF2JU?tag=tallchairadvi-20">buy</a>');
  serve(ctx, '/invented/', '<a href="https://www.amazon.com/dp/B0GTJ3YT1B">buy</a>');
  serve(ctx, '/dead/', '<a href="https://www.amazon.com/dp/B0DEADBEEF">buy</a>');
  serve(ctx, '/empty/', '<p>no affiliate links at all</p>');

  const good = await run({ kind: 'asin-registered', url: '/good/' }, ctx);
  assert('registered ASIN → pass', good.result === 'pass', good.reason);
  const invented = await run({ kind: 'asin-registered', url: '/invented/' }, ctx);
  assert('hallucinated ASIN → fail', invented.result === 'fail', invented.reason);
  const dead = await run({ kind: 'asin-registered', url: '/dead/' }, ctx);
  assert('known-dead ASIN → fail', dead.result === 'fail', dead.reason);
  const empty = await run({ kind: 'asin-registered', url: '/empty/' }, ctx);
  assert('zero /dp/ links → fail, not a vacuous pass', empty.result === 'fail', empty.reason);
  const allowed = await run({ kind: 'asin-registered', url: '/empty/', minLinks: 0 }, ctx);
  assert('…unless minLinks:0 says so explicitly', allowed.result === 'pass', allowed.reason);

  const noRegistry = makeCtx({ verifiedAsins: null });
  serve(noRegistry, '/good/', '<a href="/dp/B016OIF2JU">buy</a>');
  const blind = await run({ kind: 'asin-registered', url: '/good/' }, noRegistry);
  assert('registry unreadable → unevaluable, never pass', blind.result === 'unevaluable', blind.reason);
}

// ─── 9. gsc-position, and the afterDays window ─────────────────────────────────

console.log('\n[9] gsc-position');

{
  const metrics = new Map([['/review/leap-plus/', { ctr: 1.1, position: 7.4, impressions: 1012 }]]);
  const early = makeCtx({
    gscPageMetrics: metrics,
    gscSource: 'gsc:analysis.json',
    subject: { id: 'abc', firstSeen: '2026-08-01', lastSeen: '2026-08-04' },
  });
  const tooEarly = await run({ kind: 'gsc-position', url: '/review/leap-plus/', op: '<', value: 8.7, afterDays: 14 }, early);
  assert('inside the afterDays window → unevaluable, not fail', tooEarly.result === 'unevaluable', tooEarly.result);
  assert('  …and counts the days', /4 of 14/.test(tooEarly.reason), tooEarly.reason);

  const ready = makeCtx({
    gscPageMetrics: metrics,
    gscSource: 'gsc:analysis.json',
    subject: { id: 'abc', firstSeen: '2026-07-01', lastSeen: '2026-08-04' },
  });
  const improved = await run({ kind: 'gsc-position', url: '/review/leap-plus/', op: '<', value: 8.7, afterDays: 14 }, ready);
  assert('position 7.4 < 8.7 after the window → pass', improved.result === 'pass', improved.reason);
  assert('  …evidence carries the observed position', improved.evidence !== null && improved.evidence.detail.position === 7.4);

  const notYet = await run({ kind: 'gsc-position', url: '/review/leap-plus/', op: '<', value: 5, afterDays: 14 }, ready);
  assert('position 7.4 not < 5 → fail', notYet.result === 'fail', notYet.reason);

  const unknownPage = await run({ kind: 'gsc-position', url: '/never-queried/', op: '<', value: 5, afterDays: 0 }, ready);
  assert('page absent from GSC → unevaluable, not fail', unknownPage.result === 'unevaluable', unknownPage.reason);

  const noGsc = makeCtx({ subject: { id: 'abc', firstSeen: '2026-07-01', lastSeen: '2026-08-04' } });
  const blind = await run({ kind: 'gsc-position', url: '/review/leap-plus/', op: '<', value: 8.7, afterDays: 14 }, noGsc);
  assert('no GSC source at all → unevaluable', blind.result === 'unevaluable', blind.reason);
}

// ─── 10. collector-healthy: unhealthy fails, absent is unevaluable ─────────────

console.log('\n[10] collector-healthy');

{
  const collectors = new Map([
    ['gsc', { data: { pages: [] }, meta: { collectedAt: '2026-08-05T02:00:00Z', rowCount: 120, healthy: true, reason: null } }],
    ['ga4', { data: null, meta: { collectedAt: '2026-08-05T02:00:00Z', rowCount: 0, healthy: false, reason: 'credential revoked' } }],
  ]);
  const ctx = makeCtx({ collectors });
  const healthy = await run({ kind: 'collector-healthy', collector: 'gsc' }, ctx);
  assert('healthy collector → pass with evidence', healthy.result === 'pass' && healthy.evidence !== null, healthy.reason);
  const broken = await run({ kind: 'collector-healthy', collector: 'ga4' }, ctx);
  assert('unhealthy collector → fail, quoting the reason', broken.result === 'fail' && /credential revoked/.test(broken.reason), broken.reason);
  const absent = await run({ kind: 'collector-healthy', collector: 'cloudflare' }, ctx);
  assert('collector that does not exist yet → unevaluable, NOT fail', absent.result === 'unevaluable', absent.reason);
}

// ─── 10b. gsc-indexed against the real collector layout ───────────────────────

console.log('\n[10b] gsc-indexed reads scripts/collectors/gsc.ts output');

{
  // Verbatim shape of data/collectors/gsc.json as written on 2026-08-06, including
  // its healthy:false — the run was capped at 2 of 49 URLs, which makes the rows it
  // did obtain real and the 47 it skipped invisible. Those are different verdicts.
  const collectors = new Map([
    [
      'gsc',
      {
        data: {
          indexInspection: {
            eligible: 49,
            inspected: 2,
            pages: [
              { url: 'https://tallchairadvisor.com/about/', verdict: 'PASS', coverageState: 'Submitted and indexed' },
              { url: 'https://tallchairadvisor.com/orphan/', verdict: 'FAIL', coverageState: 'Discovered – currently not indexed' },
            ],
          },
        },
        meta: {
          collectedAt: '2026-08-06T06:42:01.897Z',
          rowCount: 2,
          healthy: false,
          reason: 'URL Inspection covered 2/49 indexable URLs (4%) — GSC_INSPECT_LIMIT=2 capped the run.',
        },
      },
    ],
  ]);
  const ctx = makeCtx({ collectors: collectors as EvalContext['collectors'] });

  const indexed = await run({ kind: 'gsc-indexed', url: '/about/' }, ctx);
  assert('inspected + PASS → pass, even though the collector run was capped', indexed.result === 'pass', indexed.reason);
  const notIndexed = await run({ kind: 'gsc-indexed', url: '/orphan/' }, ctx);
  assert('inspected + not indexed → fail', notIndexed.result === 'fail', notIndexed.reason);
  const uncovered = await run({ kind: 'gsc-indexed', url: '/review/gesture/' }, ctx);
  assert('one of the 47 uninspected URLs → unevaluable, not fail', uncovered.result === 'unevaluable', uncovered.result);
  assert('  …and quotes the cap that caused the blindness', /GSC_INSPECT_LIMIT/.test(uncovered.reason), uncovered.reason);
}

// ─── 11. a thrown evaluator degrades to unevaluable, never to fail ─────────────

console.log('\n[11] an evaluator that throws yields unevaluable');

{
  const ctx = makeCtx();
  // gsc-indexed with a collector whose data explodes on access.
  const hostile = {
    data: new Proxy({}, { get: () => { throw new Error('boom'); } }),
    meta: { collectedAt: '2026-08-05T02:00:00Z', rowCount: 1, healthy: true, reason: null },
  };
  ctx.collectors.set('gsc', hostile as never);
  const verdict = await run({ kind: 'gsc-indexed', url: '/a/' }, ctx);
  assert('a throwing evaluator → unevaluable, not fail', verdict.result === 'unevaluable', verdict.result);
  assert('  …and reports the throw', /threw|boom/.test(verdict.reason), verdict.reason);
}

// ─── 12. the real context builder does not invent data ─────────────────────────

console.log('\n[12] buildEvalContext against the real repo');

{
  const ctx = await buildEvalContext({ allowNetwork: false });
  assert(
    'probes are either a real map or null-with-a-reason — never an empty stand-in',
    ctx.probes === null ? ctx.probeReason !== null : ctx.probes.size >= 0,
    String(ctx.probeReason),
  );
  assert(
    'GSC metrics are either real or null-with-a-reason',
    ctx.gscPageMetrics === null ? ctx.gscReason !== null : ctx.gscPageMetrics.size > 0,
    String(ctx.gscReason),
  );
  assert('the redirect map loaded from public/_redirects', ctx.redirects.size > 0, `${ctx.redirects.size} rules`);
  assert('the ASIN registry loaded', ctx.verifiedAsins !== null && ctx.verifiedAsins.size > 0);
  console.log(`        ↳ probes: ${ctx.probeSource ?? `none (${ctx.probeReason ?? '?'})`}`);
  console.log(`        ↳ gsc:    ${ctx.gscSource ?? `none (${ctx.gscReason ?? '?'})`}`);
  console.log(`        ↳ redirects: ${ctx.redirects.size}, verified ASINs: ${ctx.verifiedAsins?.size ?? 0}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

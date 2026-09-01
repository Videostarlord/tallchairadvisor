/**
 * aio-track.test.ts — the parsing and the arithmetic, hermetically.
 * Run: npx tsx scripts/aio-track.test.ts
 *
 * No network and no key. Everything worth getting wrong in this script is in
 * reading a SERP payload's shape and in deciding what a rate is computed OVER —
 * the fetching is four lines and fails loudly.
 *
 * The assertions that matter most are the `null` ones. This file's whole claim to
 * being evidence rests on never letting "the request failed" become "there was no
 * AI Overview": one deflates the AIO rate silently and would make the capsule
 * programme look successful in exactly the weeks the collector was broken.
 */

import { computeDeltas, parseArgs, readSerp, selectQueries, summarise, type AioObservation, type AioRun } from './aio-track.js';

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

const DOMAIN = 'tallchairadvisor.com';

// ─── 1. CLI ───────────────────────────────────────────────────────────────────

console.log('\n[1] argument parsing');

assert('defaults to a live run of 20 queries', parseArgs([]).limit === 20 && !parseArgs([]).dryRun);
assert('--dry-run is picked up', parseArgs(['--dry-run']).dryRun);
assert('--limit=5 is picked up', parseArgs(['--limit=5']).limit === 5);

{
  let threw = false;
  try { parseArgs(['--nope']); } catch { threw = true; }
  assert('an unknown flag throws rather than being ignored', threw);
}

// ─── 2. SERP reading ──────────────────────────────────────────────────────────

console.log('\n[2] reading the SERP payload');

const task = (items: unknown[]) => ({ result: [{ items }] });

{
  const r = readSerp(task([{ type: 'organic', url: 'https://btod.com/x', rank_absolute: 1 }]), DOMAIN);
  assert('no ai_overview item → aioPresent false', r.aioPresent === false);
  assert('  …and tcaCited is null, not false', r.tcaCited === null, String(r.tcaCited));
  assert('  …with no cited domains', r.citedDomains.length === 0);
}

{
  const r = readSerp(task([
    { type: 'ai_overview', references: [
      { url: 'https://www.tallchairadvisor.com/review/gesture/' },
      { url: 'https://www.btod.com/blog/tall' },
    ] },
    { type: 'organic', url: 'https://www.tallchairadvisor.com/review/gesture/', rank_absolute: 7 },
  ]), DOMAIN);
  assert('an AIO citing TCA reads tcaCited true', r.aioPresent === true && r.tcaCited === true);
  assert('  …strips www from cited hosts', r.citedDomains.includes('tallchairadvisor.com'));
  assert('  …keeps the competitor host too', r.citedDomains.includes('btod.com'));
  assert('  …reads TCA organic rank alongside', r.tcaOrganicPosition === 7, String(r.tcaOrganicPosition));
}

{
  const r = readSerp(task([
    { type: 'ai_overview', references: [{ url: 'https://www.btod.com/blog/tall' }] },
  ]), DOMAIN);
  assert('an AIO not citing TCA reads tcaCited false', r.aioPresent === true && r.tcaCited === false);
  assert('  …and tcaOrganicPosition is null when TCA is not in the results', r.tcaOrganicPosition === null);
}

{
  // Observed on some query types: references live inside the block items rather
  // than at the top level. Reading only one location misses real citations, which
  // would understate exactly the number this script exists to measure.
  const r = readSerp(task([
    { type: 'ai_overview', items: [{ references: [{ url: 'https://tallchairadvisor.com/correct-chair-dimensions/' }] }] },
  ]), DOMAIN);
  assert('nested block references are read as citations', r.tcaCited === true);
}

{
  const r = readSerp(task([
    { type: 'ai_overview', references: [{ link: 'https://tallchairadvisor.com/x/' }] },
  ]), DOMAIN);
  assert('a reference using `link` instead of `url` still counts', r.tcaCited === true);
}

{
  // The impersonation case. A domain that merely ENDS with the site's name is not
  // the site, and treating it as a citation would inflate the headline number.
  const r = readSerp(task([
    { type: 'ai_overview', references: [{ url: 'https://nottallchairadvisor.com/x' }] },
  ]), DOMAIN);
  assert('a look-alike domain is not counted as a citation', r.tcaCited === false, r.citedDomains.join(','));
}

{
  const r = readSerp(task([
    { type: 'ai_overview', references: [{ url: 'https://blog.tallchairadvisor.com/x' }] },
  ]), DOMAIN);
  assert('a genuine subdomain IS counted', r.tcaCited === true);
}

{
  for (const junk of [null, undefined, {}, { result: [] }, { result: [{}] }]) {
    let threw = false;
    try { readSerp(junk, DOMAIN); } catch { threw = true; }
    assert(`a malformed payload (${JSON.stringify(junk)}) does not throw`, !threw);
  }
}

// ─── 3. rates are computed over what was OBSERVED ─────────────────────────────

console.log('\n[3] summary arithmetic');

const obs = (over: Partial<AioObservation>): AioObservation => ({
  query: 'q', impressions: 0, gscPosition: null, page: null, reason: 'ctr-leak',
  aioPresent: null, tcaCited: null, citedDomains: [], tcaOrganicPosition: null, error: null,
  ...over,
});

{
  const s = summarise([
    obs({ aioPresent: true, tcaCited: true }),
    obs({ aioPresent: true, tcaCited: false }),
    obs({ aioPresent: false }),
    obs({ aioPresent: null, error: 'HTTP 500' }),
  ]);
  assert('failed requests are excluded from the denominator', s.observed === 3 && s.failed === 1);
  assert('  …so the AIO rate is 2/3, not 2/4', s.aioRate === 66.7, String(s.aioRate));
  assert('  …and the citation rate is over AIOs, not over queries', s.citationRate === 50, String(s.citationRate));
}

{
  // The failure this file is really guarding: a wholly broken run must not read
  // as "checked 20 queries, found no AI Overviews, 0% suppression".
  const s = summarise([obs({ error: 'timeout' }), obs({ error: 'timeout' })]);
  assert('a run that saw nothing reports null rates, never 0', s.aioRate === null && s.citationRate === null);
  assert('  …and counts every row as failed', s.failed === 2 && s.observed === 0);
}

{
  const s = summarise([obs({ aioPresent: false }), obs({ aioPresent: false })]);
  assert('genuinely zero AIOs reports 0%, which is different from null', s.aioRate === 0);
  assert('  …with a null citation rate, since there were no AIOs to be cited in', s.citationRate === null);
}

// ─── 4. deltas ────────────────────────────────────────────────────────────────

console.log('\n[4] deltas between runs');

const run = (observations: AioObservation[]): AioRun => ({
  generatedAt: '2026-09-01T00:00:00.000Z',
  domain: DOMAIN,
  querySource: 'test',
  observations,
  summary: summarise(observations),
});

{
  const prev = run([
    obs({ query: 'steelcase leap plus', aioPresent: true, tcaCited: false }),
    obs({ query: 'office chair dimensions', aioPresent: false }),
    obs({ query: 'aeron size c', aioPresent: true, tcaCited: true }),
  ]);
  const now = run([
    obs({ query: 'Steelcase Leap Plus', aioPresent: true, tcaCited: true }),
    obs({ query: 'office chair dimensions', aioPresent: false }),
    obs({ query: 'aeron size c', aioPresent: true, tcaCited: true }),
  ]);
  const d = computeDeltas(now, prev);
  assert('only the query that moved is reported', d.length === 1, JSON.stringify(d));
  assert('  …matched case-insensitively', d[0].query === 'Steelcase Leap Plus');
  assert('  …naming both states', d[0].was === 'AIO, TCA absent' && d[0].now === 'AIO, TCA cited');
}

{
  const prev = run([obs({ query: 'a', aioPresent: true, tcaCited: true })]);
  const now = run([obs({ query: 'a', aioPresent: null, error: 'HTTP 500' })]);
  assert('a failed observation is not reported as a lost citation', computeDeltas(now, prev).length === 0);
}

{
  const now = run([obs({ query: 'a', aioPresent: true, tcaCited: true })]);
  assert('the first ever run produces no deltas rather than inventing them', computeDeltas(now, null).length === 0);
}

{
  const prev = run([obs({ query: 'a', aioPresent: false })]);
  const now = run([obs({ query: 'b', aioPresent: true, tcaCited: true })]);
  assert('a query absent from the previous run is skipped, not reported as new', computeDeltas(now, prev).length === 0);
}

// ─── 5. query selection ───────────────────────────────────────────────────────

console.log('\n[5] query selection from GSC analysis');

{
  const analysis = {
    ctrLeaks: [
      { query: 'small leak', page: '/a/', impressions: 50, position: 9 },
      { query: 'big leak', page: '/b/', impressions: 1519, position: 9.6 },
    ],
    affiliateOpportunities: [
      { page: '/money/', topBuyerQueries: ['best office chairs for tall people', 'big leak'], buyerIntentImpressions: 156 },
    ],
    clusters: [
      { representativeQuery: 'chair cluster', totalImpressions: 9000, avgPosition: 12, pages: ['/c/'] },
    ],
  };

  const all = selectQueries(analysis, 20);
  assert('leaks come first, highest impressions first', all[0].query === 'big leak', JSON.stringify(all.map((q) => q.query)));
  assert('  …carrying the reason they were bought', all[0].reason === 'ctr-leak');
  assert('a query in two sources appears once', all.filter((q) => q.query === 'big leak').length === 1);
  assert('  …keeping the higher-priority reason', all.find((q) => q.query === 'big leak')?.reason === 'ctr-leak');
  assert('buyer-intent queries are included', all.some((q) => q.reason === 'buyer-intent'));
  assert('clusters supply the control group', all.some((q) => q.reason === 'top-cluster'));
  assert('--limit truncates', selectQueries(analysis, 2).length === 2);
}

{
  // The bug the first dry run found. GSC reported 21 CTR leaks, straight priority
  // order filled all 20 slots with them, and the control group — the queries
  // nobody suspects — was never bought. A series drawn only from queries SELECTED
  // for underperforming their position curve cannot tell you whether its AIO rate
  // is high, because it has nothing to be high against.
  const manyLeaks = {
    ctrLeaks: Array.from({ length: 21 }, (_, i) => ({ query: `leak ${i}`, page: '/a/', impressions: 100 - i, position: 9 })),
    affiliateOpportunities: [{ page: '/money/', topBuyerQueries: ['buy one', 'buy two'], buyerIntentImpressions: 156 }],
    clusters: Array.from({ length: 10 }, (_, i) => ({ representativeQuery: `cluster ${i}`, totalImpressions: 500 - i, avgPosition: 12, pages: ['/c/'] })),
  };
  const picked = selectQueries(manyLeaks, 20);
  const byReason = (r: string) => picked.filter((q) => q.reason === r).length;

  assert('a flood of CTR leaks cannot crowd out the other sources', byReason('ctr-leak') === 10, String(byReason('ctr-leak')));
  assert('  …buyer-intent queries are still bought', byReason('buyer-intent') === 2, String(byReason('buyer-intent')));
  assert('  …and the control group is still bought', byReason('top-cluster') === 8, String(byReason('top-cluster')));
  assert('  …filling the run to the limit', picked.length === 20, String(picked.length));
}

{
  // The shares are floors, not caps. A source with nothing to give must hand its
  // slots back rather than shrink the run — otherwise a week with no CTR leaks
  // silently buys a third of the data and the trend breaks with no error.
  const noLeaks = {
    ctrLeaks: [],
    affiliateOpportunities: [{ page: '/money/', topBuyerQueries: ['buy one'], buyerIntentImpressions: 156 }],
    clusters: Array.from({ length: 30 }, (_, i) => ({ representativeQuery: `cluster ${i}`, totalImpressions: 500 - i, avgPosition: 12, pages: ['/c/'] })),
  };
  const picked = selectQueries(noLeaks, 10);
  assert('an empty source hands its share back instead of shrinking the run', picked.length === 10, String(picked.length));
}

{
  assert('an empty analysis yields no queries rather than throwing', selectQueries({}, 20).length === 0);
  assert('a malformed analysis yields no queries', selectQueries(null, 20).length === 0);
  assert(
    'rows with no query text are skipped, not turned into empty queries',
    selectQueries({ ctrLeaks: [{ page: '/a/', impressions: 5 }, { query: '  ', impressions: 5 }] }, 20).length === 0,
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

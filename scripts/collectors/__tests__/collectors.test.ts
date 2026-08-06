/**
 * collectors/__tests__/collectors.test.ts
 *
 * Run: npx tsx scripts/collectors/__tests__/collectors.test.ts
 *
 * No test framework is installed in this repo, so these are plain asserts with
 * a tiny runner. Everything here is PURE — no network, no credentials, no
 * clock dependence beyond injected `now` values. The live behavior of the
 * collectors is verified by actually running `npm run collect:all`, which is
 * the PRD §9 step-4 acceptance test; unit tests cover the logic that would
 * otherwise only be exercised on a night when something is already broken.
 */

import assert from 'node:assert/strict';
import { ContractViolation } from '../../lib/read-validated.js';
import { alertsByIssue } from '../clarity.js';
import { hitRate } from '../cloudflare.js';
import { zeroSessionDays } from '../ga4.js';
import { astroFileToPath, astroFileToUrl, isIndexableSource, tally, type InspectedUrl } from '../gsc.js';
import { expectedCadenceDays, extractCron, isBotCommitter, isStale, subjectOf } from '../github-actions.js';
import { pctRemaining } from '../quotas.js';
import { dateFromPath, daysOld, isExcluded, isOverdue } from '../amazon.js';
import { renderStatusTable } from '../table.js';
import { ageDays, describeError, envValue, firstEnv, guard, makeHealthy, makeUnhealthy } from '../types.js';

let passed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  return (async () => {
    try {
      await fn();
      passed++;
    } catch (error) {
      failures.push(`${name}\n    ${error instanceof Error ? error.message.split('\n').join('\n    ') : String(error)}`);
    }
  })();
}

const inspected = (verdict: string, coverageState: string): InspectedUrl => ({
  url: 'u',
  file: 'f',
  verdict,
  coverageState,
  indexingState: 'x',
  robotsTxtState: 'x',
  pageFetchState: 'x',
  lastCrawlTime: null,
  googleCanonical: null,
  userCanonical: null,
  error: null,
});

async function run(): Promise<void> {
  // ── types: the load-bearing rule ────────────────────────────────────────────

  await test('makeHealthy produces reason:null and healthy:true', () => {
    const result = makeHealthy({ a: 1 }, 3);
    assert.equal(result.meta.healthy, true);
    assert.equal(result.meta.reason, null);
    assert.equal(result.meta.rowCount, 3);
    assert.ok(!Number.isNaN(Date.parse(result.meta.collectedAt)));
  });

  await test('makeUnhealthy REQUIRES a non-empty reason', () => {
    assert.throws(() => makeUnhealthy(''), /non-empty, specific reason/);
    assert.throws(() => makeUnhealthy('   '), /non-empty, specific reason/);
  });

  await test('makeUnhealthy may still carry partial data', () => {
    const result = makeUnhealthy('CLARITY_TOKEN unset', { pages: 2 }, 2);
    assert.equal(result.meta.healthy, false);
    assert.equal(result.meta.reason, 'CLARITY_TOKEN unset');
    assert.deepEqual(result.data, { pages: 2 });
  });

  await test('guard() converts a thrown error into an unhealthy result, never a throw', async () => {
    const result = await guard('demo', async () => {
      throw new Error('boom');
    });
    assert.equal(result.meta.healthy, false);
    assert.match(result.meta.reason ?? '', /^demo: unexpected collector failure — .*boom/);
    assert.equal(result.data, null);
  });

  await test('describeError preserves a ContractViolation verbatim', () => {
    const violation = new ContractViolation('data/ga4/latest.json', 'stale — 19d old, SLA 8d');
    assert.equal(describeError(violation), 'data/ga4/latest.json: stale — 19d old, SLA 8d');
  });

  await test('describeError surfaces an HTTP status when the error carries one', () => {
    const error = Object.assign(new Error('Forbidden'), { response: { status: 403 } });
    assert.match(describeError(error), /HTTP 403 — Forbidden/);
  });

  await test('envValue treats an EMPTY var as unset (the revocation drill)', () => {
    process.env.__TCA_TEST_EMPTY = '';
    process.env.__TCA_TEST_SET = ' value ';
    assert.equal(envValue('__TCA_TEST_EMPTY'), null);
    assert.equal(envValue('__TCA_TEST_SET'), 'value');
    assert.equal(envValue('__TCA_TEST_MISSING'), null);
    assert.deepEqual(firstEnv('__TCA_TEST_EMPTY', '__TCA_TEST_SET'), { name: '__TCA_TEST_SET', value: 'value' });
    assert.equal(firstEnv('__TCA_TEST_EMPTY', '__TCA_TEST_MISSING'), null);
    delete process.env.__TCA_TEST_EMPTY;
    delete process.env.__TCA_TEST_SET;
  });

  await test('ageDays floors to whole days and rejects garbage', () => {
    const now = new Date('2026-08-05T00:00:00Z');
    assert.equal(ageDays('2026-08-03T00:00:00Z', now), 2);
    assert.equal(ageDays('not-a-date', now), null);
    assert.equal(ageDays(null, now), null);
  });

  // ── gsc ─────────────────────────────────────────────────────────────────────

  await test('astroFileToUrl maps page files to canonical trailing-slash URLs', () => {
    assert.equal(astroFileToUrl('src/pages/index.astro'), 'https://tallchairadvisor.com/');
    assert.equal(astroFileToUrl('src/pages/review/gesture.astro'), 'https://tallchairadvisor.com/review/gesture/');
    assert.equal(
      astroFileToUrl('src/pages/chairs/steelcase-gesture/index.astro'),
      'https://tallchairadvisor.com/chairs/steelcase-gesture/'
    );
    assert.equal(astroFileToPath('src/pages/review/gesture.astro'), '/review/gesture/');
  });

  await test('isIndexableSource excludes 404, dynamic routes and noindex pages', () => {
    assert.equal(isIndexableSource('src/pages/404.astro', ''), false);
    assert.equal(isIndexableSource('src/pages/[slug].astro', ''), false);
    assert.equal(isIndexableSource('src/pages/contact.astro', '<Layout noindex={true}>'), false);
    assert.equal(isIndexableSource('src/pages/review/gesture.astro', '<Layout title="x">'), true);
  });

  await test('tally counts verdicts and coverage states', () => {
    const rows = [inspected('PASS', 'Submitted and indexed'), inspected('PASS', 'Indexed, not submitted'), inspected('NEUTRAL', 'Crawled — currently not indexed')];
    assert.deepEqual(tally(rows, 'verdict'), { PASS: 2, NEUTRAL: 1 });
    assert.equal(tally(rows, 'coverageState')['Submitted and indexed'], 1);
  });

  // ── ga4 ─────────────────────────────────────────────────────────────────────

  await test('zeroSessionDays finds the CSP-incident signature', () => {
    assert.deepEqual(
      zeroSessionDays([
        { date: '2026-06-15', sessions: 12 },
        { date: '2026-06-16', sessions: 0 },
        { date: '2026-06-17', sessions: 0 },
      ]),
      ['2026-06-16', '2026-06-17']
    );
  });

  // ── clarity ─────────────────────────────────────────────────────────────────

  await test('alertsByIssue groups behavioral alerts', () => {
    assert.deepEqual(
      alertsByIssue([{ issue: 'low-scroll-depth' }, { issue: 'low-scroll-depth' }, { issue: 'high-rage-clicks' }]),
      { 'low-scroll-depth': 2, 'high-rage-clicks': 1 }
    );
  });

  // ── cloudflare ──────────────────────────────────────────────────────────────

  await test('hitRate is a 1-decimal percentage and never divides by zero', () => {
    assert.equal(hitRate(1000, 850), 85);
    assert.equal(hitRate(3, 1), 33.3);
    assert.equal(hitRate(0, 0), 0);
  });

  // ── github-actions ──────────────────────────────────────────────────────────

  await test('expectedCadenceDays reads cadence out of a cron expression', () => {
    assert.equal(expectedCadenceDays('0 10 * * *'), 1); // nightly
    assert.equal(expectedCadenceDays('0 9 * * 1'), 7); // Monday
    assert.equal(expectedCadenceDays('0 8 1 * *'), 31); // keywords-monthly
    assert.equal(expectedCadenceDays(null), null);
    assert.equal(expectedCadenceDays('bogus'), null);
  });

  await test('REGRESSION: cron step syntax is every-N-days, not monthly', () => {
    // clarity-history.yml is `0 10 */2 * *`. Reading the pinned day-of-month
    // field as "monthly" gave it a 47-day staleness budget instead of 4.
    assert.equal(expectedCadenceDays('0 10 */2 * *'), 2);
    assert.equal(isStale(expectedCadenceDays('0 10 */2 * *'), 5), true);
    assert.equal(isStale(31, 5), false, 'the old, wrong reading would have called 5 days fresh');
  });

  await test('isStale allows 1.5 cadences plus a day of slack', () => {
    assert.equal(isStale(7, 9), false);
    assert.equal(isStale(7, 12), true);
    assert.equal(isStale(null, 400), false);
    assert.equal(isStale(1, 1), false);
    assert.equal(isStale(1, 3), true);
  });

  await test('extractCron pulls the first schedule out of a workflow file', () => {
    assert.equal(extractCron("on:\n  schedule:\n    - cron: '0 10 * * *'\n"), '0 10 * * *');
    assert.equal(extractCron('on:\n  workflow_dispatch:\n'), null);
  });

  await test('isBotCommitter recognises the pipeline bots only', () => {
    assert.equal(isBotCommitter('tca-bot'), true);
    assert.equal(isBotCommitter('github-actions[bot]'), true);
    assert.equal(isBotCommitter('Jackson Christopher'), false);
  });

  await test('subjectOf takes the first line of a commit message', () => {
    assert.equal(subjectOf('[skip cd] nightly: data\n\nbody text'), '[skip cd] nightly: data');
  });

  // ── quotas ──────────────────────────────────────────────────────────────────

  await test('pctRemaining refuses to invent a percentage without a limit', () => {
    assert.equal(pctRemaining(125, 250), 50);
    assert.equal(pctRemaining(null, 250), null);
    assert.equal(pctRemaining(125, null), null);
    assert.equal(pctRemaining(125, 0), null);
  });

  // ── amazon ──────────────────────────────────────────────────────────────────

  await test('dateFromPath reads the export date out of the directory name', () => {
    assert.equal(dateFromPath('raw/affiliate/2026-08-04-amazon-csv/linked-product.csv'), '2026-08-04');
    assert.equal(dateFromPath('raw/affiliate/report.csv'), null);
  });

  await test('daysOld floors at zero and counts whole days', () => {
    const now = Date.parse('2026-08-05T12:00:00Z');
    assert.equal(daysOld(Date.parse('2026-08-04T00:00:00Z'), now), 1);
    assert.equal(daysOld(Date.parse('2026-08-06T00:00:00Z'), now), 0);
  });

  await test('isOverdue nags past 7 days, and treats "no file" as overdue', () => {
    assert.equal(isOverdue(7), false);
    assert.equal(isOverdue(8), true);
    assert.equal(isOverdue(null), true);
  });

  await test('REGRESSION: the collector never counts its own output as an export', () => {
    // The first live run found data/collectors/amazon.json (matches "amazon" +
    // ".json") and reported the affiliate export as 0 days old — a staleness
    // nag that reset itself every time it ran.
    assert.equal(isExcluded('data/collectors/amazon.json'), true);
    assert.equal(isExcluded('data/collectors'), true);
    assert.equal(isExcluded('data/probes/2026-08-06.json'), true);
    assert.equal(isExcluded('raw/affiliate/2026-08-04-amazon-csv/linked-product.csv'), false);
  });

  // ── table ───────────────────────────────────────────────────────────────────

  await test('renderStatusTable prints reasons IN FULL (PRD §7.6 bans truncation)', () => {
    const longReason =
      'CLOUDFLARE_API_TOKEN not set — see PRD §10.1 (token needs Account → Cloudflare Pages:Read, Zone → Analytics:Read, and Zone → Firewall Services:Read; add it to .env locally and as a repo secret so nightly.yml can pass it)';
    const output = renderStatusTable([
      { name: 'gsc', healthy: true, rowCount: 49, reason: null, ms: 61000 },
      { name: 'cloudflare', healthy: false, rowCount: 0, reason: longReason, ms: 2 },
    ]);
    assert.ok(output.includes(longReason), 'full reason must appear verbatim');
    assert.ok(output.includes('1/2 collectors healthy'));
    assert.ok(output.includes('50% observational coverage'));
  });

  await test('renderStatusTable splits a multi-part reason into separate bullets', () => {
    const output = renderStatusTable([
      { name: 'quotas', healthy: false, rowCount: 0, reason: 'serpapi: no key | firecrawl: 404', ms: 5 },
    ]);
    assert.ok(output.includes('- serpapi: no key'));
    assert.ok(output.includes('- firecrawl: 404'));
  });

  // ── module contract ─────────────────────────────────────────────────────────

  await test('every collector module exports a collect() function', async () => {
    const modules = ['gsc', 'ga4', 'clarity', 'cloudflare', 'github-actions', 'quotas', 'amazon'];
    for (const name of modules) {
      const mod = (await import(`../${name}.js`)) as Record<string, unknown>;
      assert.equal(typeof mod.collect, 'function', `${name}.ts must export collect()`);
      assert.equal((mod.collect as () => unknown).length, 0, `${name}.collect() must take no arguments`);
    }
  });

  // ── report ──────────────────────────────────────────────────────────────────

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) {
    for (const failure of failures) console.error(`\n  FAIL ${failure}`);
    process.exit(1);
  }
}

run().catch((error) => {
  console.error('test runner crashed:', error);
  process.exit(1);
});

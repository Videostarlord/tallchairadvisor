/**
 * cost-rollup.test.ts — A6. The reconcile's coverage rule, executable.
 * Run: npx tsx scripts/cost-rollup.test.ts
 *
 * Same convention as scripts/lib/__tests__/retention.test.ts: no framework,
 * plain asserts, a tally, and a non-zero exit on failure.
 *
 * ─── WHAT THIS FILE IS ACTUALLY DEFENDING ────────────────────────────────────
 *
 * On 2026-08-09 `npm run cost:reconcile -- 0 --month 2026-01` printed
 * "OK — within 5%" and exited 0 for a month in which nothing had ever been
 * metered. $0 against a $0 invoice is 0% drift, so the one case where the
 * metered figure is least trustworthy was the one case that could not fail.
 *
 * The same run reported "$5.03 across 14 records" for 2026-08 without
 * mentioning that all 14 belonged to `nightly-report` — because until that date
 * only nightly.yml committed data/cost-ledger.jsonl and every Tue–Sat agent's
 * spend died inside its runner. A drift percentage computed over one ninth of
 * the agents is not a reconciliation, and nothing in the output said so.
 *
 * So the two properties under test are:
 *
 *   1. `llmAgentsInMonth()` names exactly the LLM agents that contributed to a
 *      month, so a partial ledger is visible as partial.
 *   2. External (non-Anthropic) spend never enters that list, because it is not
 *      on the invoice being reconciled against and would overstate coverage.
 *
 * Importing this module must not run the rollup. `cost-rollup.ts` is guarded by
 * `invokedDirectly`, and case 4 asserts that guard still holds — without it,
 * importing the module here would overwrite the real data/cost-summary.json.
 */

import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { llmAgentsInMonth } from './cost-rollup.js';
import type { CostRecord } from './lib/metered-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

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

function llm(agent: string, ts: string): CostRecord {
  return {
    ts,
    agent,
    run: ts.slice(0, 10),
    model: 'claude-sonnet-4-6',
    input: 100,
    output: 10,
    cacheWrite: 0,
    cacheRead: 0,
    usd: { input: 0.0003, output: 0.00015, cacheWrite: 0, cacheRead: 0, total: 0.00045 },
  } as CostRecord;
}

function external(agent: string, service: string, ts: string): CostRecord {
  return {
    ts,
    agent,
    run: ts.slice(0, 10),
    service,
    unit: 'credits',
    amount: 23,
  } as CostRecord;
}

// ─── 1. contributing agents are named, and de-duplicated ──────────────────────

console.log('\nllmAgentsInMonth — coverage');
{
  const records = [
    llm('nightly-report', '2026-08-01T02:00:00.000Z'),
    llm('nightly-report', '2026-08-02T02:00:00.000Z'),
    llm('audit', '2026-08-04T09:00:00.000Z'),
    llm('strategy', '2026-08-05T09:00:00.000Z'),
  ];

  const agents = llmAgentsInMonth(records, '2026-08');
  assert('every contributing agent is named once', agents.join(',') === 'audit,nightly-report,strategy', agents.join(','));
  assert('the list is sorted, so output is stable across runs', agents.join(',') === [...agents].sort().join(','));
}

// ─── 2. the partial-ledger case this was built for ────────────────────────────
//
// The real 2026-08 ledger, before the workflow fix: 14 LLM records, all from the
// one workflow that committed the file. A reader must be able to see that the
// eight weekday agents are absent.

console.log('\nllmAgentsInMonth — the partial ledger that started A6');
{
  const records = Array.from({ length: 14 }, (_, i) =>
    llm('nightly-report', `2026-08-0${(i % 9) + 1}T02:00:00.000Z`)
  );

  const agents = llmAgentsInMonth(records, '2026-08');
  assert('a month carried entirely by one agent reports exactly that one', agents.length === 1 && agents[0] === 'nightly-report', agents.join(','));
  assert(
    'the agents that never reached the repo are absent rather than assumed',
    !agents.includes('audit') && !agents.includes('execute-content') && !agents.includes('verify-deploy')
  );
}

// ─── 3. months are isolated, and external spend is never counted as coverage ──

console.log('\nllmAgentsInMonth — month and record-kind isolation');
{
  const records = [
    llm('audit', '2026-07-28T09:00:00.000Z'),
    llm('strategy', '2026-08-05T09:00:00.000Z'),
    // Not on an Anthropic invoice. Counting these would overstate how much of
    // the bill this ledger can account for — the exact overstatement the
    // coverage line exists to prevent.
    external('keyword-discovery', 'dataforseo', '2026-08-01T09:00:00.000Z'),
    external('competitor-intelligence', 'serpapi', '2026-08-03T09:00:00.000Z'),
    external('asin-check', 'firecrawl', '2026-08-03T09:00:00.000Z'),
  ];

  const august = llmAgentsInMonth(records, '2026-08');
  assert('a July record does not leak into August', !august.includes('audit'), august.join(','));
  assert('an August record is present', august.includes('strategy'), august.join(','));
  assert(
    'external-service agents are excluded — they are not on an Anthropic invoice',
    august.length === 1,
    august.join(',')
  );

  const july = llmAgentsInMonth(records, '2026-07');
  assert('July reports its own contributor', july.join(',') === 'audit', july.join(','));

  const empty = llmAgentsInMonth(records, '2026-01');
  assert('a month with no records reports an empty list, not a fabricated one', empty.length === 0, empty.join(','));
}

// ─── 4. importing this module must not run the rollup ─────────────────────────
//
// `llmAgentsInMonth` is exported for these tests, which only became safe once
// main() was put behind an `invokedDirectly` guard. Without it, this very import
// would have rewritten the real data/cost-summary.json as a side effect of
// running the test suite — a test that silently mutates production data being a
// worse defect than the one under test.

console.log('\ncost-rollup module import is side-effect free');
{
  const source = readFileSync(resolve(ROOT, 'scripts/cost-rollup.ts'), 'utf-8');
  assert('main() is guarded by invokedDirectly', /const invokedDirectly = /.test(source));
  assert('main() is not called unconditionally at module scope', !/^main\(\);$/m.test(source));

  const summary = resolve(ROOT, 'data/cost-summary.json');
  if (existsSync(summary)) {
    const before = readFileSync(summary, 'utf-8');
    llmAgentsInMonth([], '2026-08');
    assert('calling the export does not rewrite data/cost-summary.json', readFileSync(summary, 'utf-8') === before);
  } else {
    assert('data/cost-summary.json was not created by importing the module', !existsSync(summary));
  }
}

// ─── done ─────────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

/**
 * pricing.test.ts — step-1 acceptance (PRD §9)
 *
 *   "A month's metered spend reconciles against the Anthropic Console within 5%.
 *    Drift > 5% files itself as a finding. An unknown model ID throws rather
 *    than pricing at zero."
 *
 * The load-bearing assertion here is the last one. A price table that silently
 * returns 0 for an unrecognized model would make every cost report understate
 * reality without ever failing — the same silent-degradation class the whole
 * God's-Eye build exists to eliminate, applied to money.
 */

import { priceFor, costOf, normalizeModelId, UnknownModelError, knownModels } from '../pricing.js';
import { buildLlmRecord, buildExternalRecord, detectCacheTtl } from '../metered-client.js';

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail?: string): void {
  if (cond) {
    passed++;
    console.log(`  PASS: ${name}`);
  } else {
    failed++;
    console.log(`  FAIL: ${name}${detail ? `\n        ↳ ${detail}` : ''}`);
  }
}

/** Floating-point money: compare to the cent-of-a-cent, not exactly. */
function near(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) < eps;
}

console.log('\n[1] unknown models throw — they never price at zero');
{
  for (const bogus of ['gpt-4', 'claude-sonnet-3', 'llama-3', '', 'claude']) {
    let threw = false;
    let named = false;
    try {
      priceFor(bogus);
    } catch (error) {
      threw = error instanceof UnknownModelError;
      named = error instanceof Error && error.message.includes(bogus);
    }
    check(`priceFor(${JSON.stringify(bogus)}) throws UnknownModelError`, threw);
    if (bogus.length > 0) check(`  …and names the model in the message`, named);
  }

  let costThrew = false;
  try {
    costOf('gpt-4', { input_tokens: 100, output_tokens: 100 });
  } catch (error) {
    costThrew = error instanceof UnknownModelError;
  }
  check('costOf() throws too — no zero-priced path around priceFor()', costThrew);
}

console.log('\n[2] the PRD §7.1 worked record reproduces exactly');
{
  // {"model":"claude-sonnet-4-6","input":6430,"output":4000,"cacheWrite":0,"cacheRead":18200,
  //  "usd":{"input":0.01929,"output":0.06,"cacheWrite":0,"cacheRead":0.00546,"total":0.08475}}
  const c = costOf('claude-sonnet-4-6', {
    input_tokens: 6430,
    output_tokens: 4000,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 18200,
  });
  check('input  = 0.01929', near(c.input, 0.01929), `got ${c.input}`);
  check('output = 0.06', near(c.output, 0.06), `got ${c.output}`);
  check('cacheRead = 0.00546', near(c.cacheRead, 0.00546), `got ${c.cacheRead}`);
  check('total  = 0.08475', near(c.total, 0.08475), `got ${c.total}`);
  check('total is the sum of its parts', near(c.total, c.input + c.output + c.cacheWrite + c.cacheRead));
}

console.log('\n[3] Sonnet-5 introductory pricing is a DATED override, not a constant');
{
  const during = priceFor('claude-sonnet-5', new Date('2026-08-15T00:00:00Z'));
  const lastDay = priceFor('claude-sonnet-5', new Date('2026-08-31T23:59:59Z'));
  const after = priceFor('claude-sonnet-5', new Date('2026-09-01T00:00:00Z'));

  check('during the promo: $2.00 in / $10.00 out', during.input === 2 && during.output === 10);
  check('2026-08-31 is still promotional', lastDay.input === 2 && lastDay.output === 10);
  check('2026-09-01 reverts to $3.00 / $15.00', after.input === 3 && after.output === 15);
  check(
    'cache rates derive from input, so the override propagates',
    near(during.cacheWrite5m, 2 * 1.25) && near(during.cacheWrite1h, 2 * 2) && near(during.cacheRead, 2 * 0.1),
    `5m=${during.cacheWrite5m} 1h=${during.cacheWrite1h} read=${during.cacheRead}`,
  );
  check(
    '…and after expiry they derive from the standard rate',
    near(after.cacheWrite5m, 3 * 1.25) && near(after.cacheRead, 3 * 0.1),
  );
}

console.log('\n[4] dated model IDs resolve to their base model');
{
  check('claude-haiku-4-5-20251001 resolves', priceFor('claude-haiku-4-5-20251001').input === 1);
  check('normalizeModelId strips the date suffix', normalizeModelId('claude-haiku-4-5-20251001') === 'claude-haiku-4-5');
  check('an undated id is unchanged', normalizeModelId('claude-sonnet-4-6') === 'claude-sonnet-4-6');
  check('the table covers the models actually in use', knownModels().includes('claude-sonnet-4-6') && knownModels().includes('claude-haiku-4-5'));
}

console.log('\n[5] cache-write TTL selects the right rate');
{
  const usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 0 };
  const fiveMin = costOf('claude-sonnet-4-6', usage, { cacheTtl: '5m' });
  const oneHour = costOf('claude-sonnet-4-6', usage, { cacheTtl: '1h' });
  check('5m cache-write on 1M tokens = $3.75', near(fiveMin.cacheWrite, 3.75), `got ${fiveMin.cacheWrite}`);
  check('1h cache-write on 1M tokens = $6.00', near(oneHour.cacheWrite, 6.0), `got ${oneHour.cacheWrite}`);
  check('1h is strictly more expensive than 5m', oneHour.cacheWrite > fiveMin.cacheWrite);

  check(
    'detectCacheTtl finds an explicit 1h ttl in params',
    detectCacheTtl({
      system: [{ type: 'text', text: 'x', cache_control: { type: 'ephemeral', ttl: '1h' } }],
    }) === '1h',
  );
  check('detectCacheTtl defaults to 5m', detectCacheTtl({ messages: [] }) === '5m');
}

console.log('\n[6] cache reads are cheap but never free');
{
  const c = costOf('claude-sonnet-4-6', {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 1_000_000,
  });
  check('1M cache-read tokens = $0.30', near(c.cacheRead, 0.3), `got ${c.cacheRead}`);
  check('a cache read still costs something', c.total > 0);
}

console.log('\n[7] ledger records carry every field the rollup needs');
{
  const rec = buildLlmRecord(
    'claude-sonnet-4-6',
    { input_tokens: 6430, output_tokens: 4000, cache_creation_input_tokens: 0, cache_read_input_tokens: 18200 },
    { agent: 'audit', run: '2026-08-06', purpose: 'finding-extraction' },
    '5m',
  ) as Record<string, any>;

  for (const key of ['ts', 'agent', 'run', 'model', 'input', 'output', 'cacheWrite', 'cacheRead', 'usd']) {
    check(`record has \`${key}\``, key in rec);
  }
  check('usd.total matches costOf', near(rec.usd.total, 0.08475), `got ${rec.usd.total}`);
  check('purpose is preserved', rec.purpose === 'finding-extraction');
  check('ts is a valid ISO timestamp', !Number.isNaN(new Date(rec.ts).getTime()));

  const ext = buildExternalRecord({
    agent: 'quotas', run: '2026-08-06', unit: 'credits', amount: 23, service: 'serpapi',
  }) as Record<string, any>;
  check('external record records the service', ext.service === 'serpapi');
  check('external record records unit and amount', ext.unit === 'credits' && ext.amount === 23);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);

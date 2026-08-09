/**
 * env-names.test.ts — A8, executable.
 * Run: npx tsx scripts/lib/__tests__/env-names.test.ts
 *
 * Same convention as retention.test.ts and ledger.test.ts: no framework, plain
 * asserts, a tally, non-zero exit on failure.
 *
 * Every case passes a synthetic env object. Nothing here reads or mutates the
 * real process.env — a test that exported a variable to prove a point would
 * change the behaviour of whatever ran next in the same process.
 *
 * The two properties that matter, and they pull in opposite directions:
 *   1. an alias must still WORK (nothing may break for a machine set up the old way)
 *   2. an alias must never be SILENT (that silence is the whole of A8)
 * A test suite that only checked (1) would pass against the code as it was.
 */

import {
  ENV_NAMES,
  aliasHint,
  describeEnvNameDrift,
  detectEnvNameDrift,
  warnOnEnvNameDrift,
} from '../env-names.js';

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

// ─── the registry itself ──────────────────────────────────────────────────────

console.log('\nregistry');
{
  const canonical = ENV_NAMES.map((s) => s.canonical);
  assert(
    'SERP_API_KEY is canonical — it is the secret nightly.yml passes',
    canonical.includes('SERP_API_KEY'),
  );
  assert(
    'DATAFORSEO_USERNAME is canonical — it is the secret nightly/monday/keywords-monthly pass',
    canonical.includes('DATAFORSEO_USERNAME'),
  );
  assert(
    'the vendor spellings are aliases, not canonical',
    !canonical.includes('SERPAPI_KEY') && !canonical.includes('DATAFORSEO_LOGIN'),
  );
  assert(
    'no name is both a canonical and an alias — that would make drift undecidable',
    ENV_NAMES.every((spec) => spec.aliases.every((alias) => !canonical.includes(alias))),
  );
}

// ─── detection ────────────────────────────────────────────────────────────────

console.log('\ndetectEnvNameDrift');
{
  assert('an empty environment is not drift', detectEnvNameDrift({}).length === 0);

  assert(
    'the canonical name alone is not drift',
    detectEnvNameDrift({ SERP_API_KEY: 'k', DATAFORSEO_USERNAME: 'u' }).length === 0,
  );

  assert(
    'an UNSET credential is not drift — .env.example already tracks that as a gap',
    detectEnvNameDrift({ SERP_API_KEY: '', DATAFORSEO_USERNAME: '   ' }).length === 0,
  );

  const aliasOnly = detectEnvNameDrift({ SERPAPI_KEY: 'k' });
  assert('the alias alone IS drift', aliasOnly.length === 1, `${aliasOnly.length}`);
  assert('and is classified alias-only', aliasOnly[0]?.kind === 'alias-only', aliasOnly[0]?.kind);
  assert('naming the canonical replacement', aliasOnly[0]?.canonical === 'SERP_API_KEY');

  const same = detectEnvNameDrift({ SERP_API_KEY: 'k', SERPAPI_KEY: 'k' });
  assert('both set to the same value is redundant, not a conflict', same[0]?.kind === 'redundant', same[0]?.kind);

  const differ = detectEnvNameDrift({ SERP_API_KEY: 'k1', SERPAPI_KEY: 'k2' });
  assert('both set to DIFFERENT values is a conflict', differ[0]?.kind === 'conflict', differ[0]?.kind);

  const both = detectEnvNameDrift({ SERPAPI_KEY: 'k', DATAFORSEO_LOGIN: 'u' });
  assert('two drifting credentials are both reported', both.length === 2, `${both.length}`);

  assert(
    'whitespace-only alias is not drift',
    detectEnvNameDrift({ SERPAPI_KEY: '  ' }).length === 0,
  );
}

// ─── messages: loud, actionable, and free of secrets ──────────────────────────

console.log('\nmessages');
{
  const secret = 'sk-super-secret-value';
  const drift = detectEnvNameDrift({ SERPAPI_KEY: secret });
  const text = describeEnvNameDrift(drift[0]);

  assert('the message names the variable that is set', text.includes('SERPAPI_KEY'));
  assert('the message names the rename target', text.includes('SERP_API_KEY'));
  assert(
    'the message says WHY it currently appears to work',
    text.includes('quotas.ts'),
    text,
  );
  assert('the message NEVER contains the credential value', !text.includes(secret));

  // A warning that overstates the damage gets ignored. SERP_API_KEY has exactly
  // one reader, so its message must not claim three scripts are about to break.
  assert(
    'SERP_API_KEY drift does not claim scripts break that do not read it',
    !text.includes('keyword-discovery.ts'),
    text,
  );
  const dfs = describeEnvNameDrift(detectEnvNameDrift({ DATAFORSEO_LOGIN: 'u' })[0]);
  assert(
    'DATAFORSEO_LOGIN drift DOES name the scripts that will abort',
    dfs.includes('keyword-discovery.ts') && dfs.includes('competitor-intelligence.ts'),
    dfs,
  );

  const lines: string[] = [];
  const found = warnOnEnvNameDrift({ SERPAPI_KEY: secret, DATAFORSEO_LOGIN: 'u' }, (m) => lines.push(m));
  const block = lines.join('\n');
  assert('warnOnEnvNameDrift returns what it found', found.length === 2, `${found.length}`);
  assert('it prints a banner that cannot be mistaken for routine output', block.includes('ENV NAME DRIFT'));
  assert('it names both variables', block.includes('SERPAPI_KEY') && block.includes('DATAFORSEO_LOGIN'));
  assert('it prints no values', !block.includes(secret));
  assert(
    'it states that it is not fatal — compatibility is kept on purpose',
    block.includes('does not fail'),
    block,
  );

  const quiet: string[] = [];
  warnOnEnvNameDrift({ SERP_API_KEY: 'k' }, (m) => quiet.push(m));
  assert('a clean environment prints nothing at all', quiet.length === 0, `${quiet.length} line(s)`);
}

// ─── aliasHint — the abort-message repair ─────────────────────────────────────

console.log('\naliasHint');
{
  assert(
    'no hint when nothing is set — the abort message is already correct',
    aliasHint('DATAFORSEO_USERNAME', {}) === null,
  );
  const hint = aliasHint('DATAFORSEO_USERNAME', { DATAFORSEO_LOGIN: 'u' });
  assert('a hint appears when the credential is present under its alias', hint !== null);
  assert('the hint names the alias that IS set', hint !== null && hint.includes('DATAFORSEO_LOGIN'));
  assert('the hint names the canonical spelling to rename to', hint !== null && hint.includes('DATAFORSEO_USERNAME'));
  assert('the hint carries no value', hint !== null && !hint.includes('u='));
  assert('an unknown variable yields no hint rather than throwing', aliasHint('NOT_A_REAL_VAR', {}) === null);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

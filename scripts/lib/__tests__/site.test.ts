/**
 * site.test.ts — the site is named, and naming it is overridable.
 * Run: npx tsx scripts/lib/__tests__/site.test.ts
 *
 * Same convention as retention.test.ts: no framework, plain asserts, a tally, and
 * a non-zero exit on failure.
 *
 * THE PROPERTY UNDER TEST
 * Not "the functions return strings" — that is free. The property is that a
 * SECOND site can distinguish itself from this one WITHOUT editing code, because
 * the whole failure this module exists to prevent is two indistinguishable
 * lock-screen alerts. A default that cannot be overridden is a hardcoded literal
 * with extra indirection, and would pass any test that only checked the default.
 *
 * Every case passes an explicit env object. Nothing here reads or mutates
 * process.env: a test that depends on the ambient environment passes on the
 * machine that wrote it and reports the operator's shell everywhere else.
 */

import { DEFAULT_SITE_DOMAIN, siteDomain, siteLabel } from '../site.js';

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

const env = (values: Record<string, string>): NodeJS.ProcessEnv => values;

// ─── 1. The default is this repo's site ───────────────────────────────────────

console.log('\ndefaults');
{
  assert('an empty env yields the repo default domain', siteDomain(env({})) === DEFAULT_SITE_DOMAIN, siteDomain(env({})));
  assert('the default label drops the TLD', siteLabel(env({})) === 'tallchairadvisor', siteLabel(env({})));
}

// ─── 2. A fork overrides without editing code ─────────────────────────────────

console.log('\noverrides — the reason this module exists');
{
  const second = env({ SITE_DOMAIN: 'example-chairs.com' });
  assert('SITE_DOMAIN replaces the domain', siteDomain(second) === 'example-chairs.com', siteDomain(second));
  assert('the label follows the domain', siteLabel(second) === 'example-chairs', siteLabel(second));

  const labelled = env({ SITE_DOMAIN: 'example-chairs.com', SITE_LABEL: 'chairs2' });
  assert('SITE_LABEL wins over the derived label', siteLabel(labelled) === 'chairs2', siteLabel(labelled));
  assert('SITE_LABEL does not change the domain', siteDomain(labelled) === 'example-chairs.com', siteDomain(labelled));
}

// ─── 3. Two sites are actually distinguishable ────────────────────────────────
// The point of the module, asserted directly rather than implied by the cases
// above. If this ever passes while these two produce the same string, the
// notification is back to being site-blind and nothing else here would say so.

console.log('\ndistinguishability');
{
  const a = env({ SITE_DOMAIN: 'tallchairadvisor.com' });
  const b = env({ SITE_DOMAIN: 'standingdeskadvisor.com' });
  assert('two sites produce different labels', siteLabel(a) !== siteLabel(b), `${siteLabel(a)} vs ${siteLabel(b)}`);

  // The collision SITE_LABEL exists for: same first DNS label, different TLD.
  // Without the override these two are the same notification again.
  const c = env({ SITE_DOMAIN: 'tallchair.com' });
  const d = env({ SITE_DOMAIN: 'tallchair.io' });
  assert('same first label collides, which is why SITE_LABEL exists', siteLabel(c) === siteLabel(d), `${siteLabel(c)} vs ${siteLabel(d)}`);
  const dLabelled = env({ SITE_DOMAIN: 'tallchair.io', SITE_LABEL: 'tallchair-io' });
  assert('SITE_LABEL resolves that collision', siteLabel(c) !== siteLabel(dLabelled), `${siteLabel(c)} vs ${siteLabel(dLabelled)}`);
}

// ─── 4. Blank is not a value ──────────────────────────────────────────────────
// An unset GitHub secret substitutes an EMPTY STRING, not an absent variable —
// the failure mode this repo has already been bitten by (wiki/log.md 2026-08-06).
// A blank SITE_DOMAIN must fall back to the default, never produce an empty title.

console.log('\nblank and whitespace');
{
  assert('blank SITE_DOMAIN falls back', siteDomain(env({ SITE_DOMAIN: '' })) === DEFAULT_SITE_DOMAIN);
  assert('whitespace SITE_DOMAIN falls back', siteDomain(env({ SITE_DOMAIN: '   ' })) === DEFAULT_SITE_DOMAIN);
  assert('blank SITE_LABEL falls back to derived', siteLabel(env({ SITE_LABEL: '' })) === 'tallchairadvisor');
  assert('values are trimmed', siteDomain(env({ SITE_DOMAIN: '  example.com  ' })) === 'example.com', siteDomain(env({ SITE_DOMAIN: '  example.com  ' })));
  assert('a label is never empty', siteLabel(env({ SITE_DOMAIN: '.com' })) !== '', siteLabel(env({ SITE_DOMAIN: '.com' })));
}

// ─── done ─────────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

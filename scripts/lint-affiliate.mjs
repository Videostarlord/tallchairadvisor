/**
 * lint-affiliate.mjs — every Amazon link carries the tracking ID its product class says it should.
 *
 * WHY THIS IS A LINT AND NOT A CONVENTION
 * Tracking IDs are the only per-product-class revenue signal that still exists:
 * Amazon no longer discloses what an indirect order was, only which ID referred
 * it. A single mistagged link silently moves revenue into the wrong bucket, and
 * nothing downstream can detect it — the report just shows a plausible number.
 *
 * This repo's signature failure is a rule that lives in prose and gets forgotten
 * by the next page. So: src/data/affiliate-tags.ts is the map, and this fails the
 * build on any link that disagrees with it or on any ASIN it has never seen.
 *
 * Run: npm run lint:affiliate
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const MAP = resolve(ROOT, 'src/data/affiliate-tags.ts');

/** Parsed out of the TS source rather than imported: this is a plain .mjs with no loader. */
const src = readFileSync(MAP, 'utf-8');
const TAGS = Object.fromEntries([...src.matchAll(/^\s*(chair|accessory|desk):\s*'([^']+)',/gm)].map(m => [m[1], m[2]]));
const ASINS = Object.fromEntries([...src.matchAll(/^\s*([A-Z0-9]{10}):\s*'(chair|accessory|desk)',/gm)].map(m => [m[1], m[2]]));
const SEARCHES = Object.fromEntries([...src.matchAll(/^\s*'([^']+)':\s*'(chair|accessory|desk)',/gm)].map(m => [m[1], m[2]]));

if (Object.keys(TAGS).length !== 3) {
  console.error(`lint:affiliate: could not parse the three tracking IDs out of ${relative(ROOT, MAP)}`);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.astro$/.test(entry)) out.push(full);
  }
  return out;
}

const problems = [];
let checked = 0;

for (const file of walk(resolve(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf-8');
  for (const m of text.matchAll(/https:\/\/www\.amazon\.com\/[^"'\s]*tag=([A-Za-z0-9-]+)/g)) {
    checked++;
    const url = m[0];
    const tag = m[1];
    const line = text.slice(0, m.index).split('\n').length;
    const where = `${relative(ROOT, file)}:${line}`;

    const dp = /\/dp\/([A-Z0-9]{10})/.exec(url);
    let expectedClass = null;
    if (dp !== null) {
      expectedClass = ASINS[dp[1]] ?? null;
      if (expectedClass === null) {
        problems.push(`${where}\n    ASIN ${dp[1]} is not in src/data/affiliate-tags.ts. Add it with its class — an unmapped product cannot be attributed to any revenue bucket.`);
        continue;
      }
    } else if (/\/s\?/.test(url)) {
      const k = /[?&]k=([^&"']+)/.exec(url);
      const key = k === null ? '' : decodeURIComponent(k[1].replace(/\+/g, ' '));
      expectedClass = SEARCHES[key] ?? null;
      if (expectedClass === null) {
        problems.push(`${where}\n    search link "${key}" is not in SEARCH_CLASS in src/data/affiliate-tags.ts.`);
        continue;
      }
    } else {
      problems.push(`${where}\n    Amazon link is neither /dp/<ASIN> nor /s?k=... — this linter cannot classify it. Add a case or use a product link.`);
      continue;
    }

    const expectedTag = TAGS[expectedClass];
    if (tag !== expectedTag) {
      problems.push(`${where}\n    tag=${tag} but this is a ${expectedClass} product — must be tag=${expectedTag}. Revenue under the wrong ID is unrecoverable; Amazon reports by ID and nothing else.`);
    }
  }
}

// ── No dynamically built Amazon URLs ────────────────────────────────────────
//
// Every check in this file is a TEXT scan for a literal
// `https://www.amazon.com/...tag=...`. A URL assembled at runtime — from an ASIN
// prop, a template literal, a variable — is invisible to all of them, so a
// single helper that "cleaned up" link markup would take every link passing
// through it out of the gate while the lint kept reporting green.
//
// That is the exact shape of failure this repo keeps paying for: a rule that
// still exists but no longer applies to the new code path.
// src/components/BuyBox.astro takes a FINISHED href for this reason, and this
// rule is what keeps it that way.
//
// Scoped to `amazon.com/` WITH the path slash — a URL being built. Layout.astro
// legitimately reads `hostname.endsWith('amazon.com')` to classify outbound
// clicks; that is inspection, not construction, and is not this rule's business.
for (const file of walk(resolve(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf-8');
  for (const m of text.matchAll(/amazon\.com\//g)) {
    const start = text.lastIndexOf('https://www.amazon.com/', m.index);
    let covered = false;
    if (start !== -1) {
      const candidate = /https:\/\/www\.amazon\.com\/[^"'\s`]*/y;
      candidate.lastIndex = start;
      const hit = candidate.exec(text);
      // A candidate containing an interpolation or a concatenation is a BUILDER
      // wearing a literal's clothes — `https://www.amazon.com/dp/${asin}` has no
      // quotes or spaces in it and would otherwise read as a fine literal here.
      covered = hit !== null && hit.index + hit[0].length > m.index && !/\$\{|['"]\s*\+|\+\s*['"]/.test(hit[0]);
    }
    if (covered) continue;
    const line = text.slice(0, m.index).split('\n').length;
    problems.push(`${relative(ROOT, file)}:${line}\n    this Amazon URL is not a complete literal. Every check in lint:affiliate is a text scan, so a URL built at runtime silently escapes ALL of them — the tag would go unverified while this lint still reported green. Pass the finished href instead (see src/components/BuyBox.astro).`);
  }
}

// The click side must agree with the link side, or the GA4/Amazon join is broken.
for (const file of walk(resolve(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf-8');
  for (const m of text.matchAll(/<a\s[^>]*?tag=(tcachair-20|tcaaccessory-20|tcadesk-20)[^>]*?>/gs)) {
    if (!/data-affiliate-class=/.test(m[0])) {
      const line = text.slice(0, m.index).split('\n').length;
      problems.push(`${relative(ROOT, file)}:${line}\n    affiliate link has a tracking ID but no data-affiliate-class — GA4 will record the click as 'unclassified' and it will not join to the Amazon revenue for that class.`);
    }
  }
}

console.log(`Affiliate tag lint — ${checked} Amazon link(s) in src/`);
if (problems.length === 0) {
  console.log('\n✓ every link carries the tracking ID its class requires');
  process.exit(0);
}
console.error(`\n✗ ${problems.length} problem(s):\n`);
for (const p of problems) console.error(`  ${p}\n`);
process.exit(1);

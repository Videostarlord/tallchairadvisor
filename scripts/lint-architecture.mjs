#!/usr/bin/env node
/**
 * lint-architecture.mjs — enforces the God's-Eye structural invariants (PRD §7.1, §7.2)
 *
 * WHY THIS EXISTS
 * Every rule here corresponds to a failure that already happened on the live site:
 *
 *   R1  `?? []` on a parsed history snapshot made reconcileInterventions rewrite
 *       data/interventions.jsonl byte-identically for months, under a green check.
 *   R2  the same nullish-default pattern, generalised — 80 sites at last count.
 *   R3  `catch {}` is how a failed collector becomes an empty report section
 *       instead of an alarm.
 *   R4  raw JSON.parse bypasses readValidated(), which is the only place that
 *       knows a file's freshness SLA and non-empty floor.
 *   R5  an unmetered messages.create is spend nobody can account for — 8 token-log
 *       entries existed for 15 call sites.
 *
 * RATCHET DESIGN
 * There are ~157 pre-existing violations. A lint that fails on all of them on day
 * one gets disabled on day one. So known violations are recorded in
 * .architecture-baseline.json and reported as KNOWN; only NEW violations fail the
 * build. As call sites migrate, run --update-baseline to shrink the allowance.
 * The baseline can only shrink: if a KNOWN entry disappears, that is progress and
 * is reported; --strict fails on any remaining KNOWN and is the end-state gate.
 *
 * Deliberately dependency-free and regex-based. A real parser would be more
 * precise, but this must run in CI before `npm ci` finishes and must never be the
 * reason a nightly cannot report.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, relative, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCAN_DIR = resolve(ROOT, 'scripts');
const BASELINE_PATH = resolve(__dirname, '.architecture-baseline.json');

const args = process.argv.slice(2);
const UPDATE_BASELINE = args.includes('--update-baseline');
const STRICT = args.includes('--strict');
const VERBOSE = args.includes('--verbose');

/**
 * Files exempt from a given rule. Only R5 has a whole-file exemption — the
 * metered client is by definition the one place allowed to call the SDK.
 * read-validated.ts is likewise the only place allowed to JSON.parse.
 * Nothing is exempt from R1/R2/R3: the library code is exactly where a silent
 * degrade does the most damage.
 */
const RULES = [
  {
    id: 'R1-nullish-array-default',
    describe: '`?? []` on parsed/external input — the reconciler bug. Use readValidated() and let it throw.',
    exempt: [],
    // `?? []` or `?? ([])`, tolerant of whitespace
    test: line => /\?\?\s*\(?\s*\[\s*\]/.test(line),
  },
  {
    id: 'R2-nullish-object-default',
    describe: '`?? {}` on parsed/external input — same class as R1.',
    exempt: [],
    test: line => /\?\?\s*\(?\s*\{\s*\}/.test(line),
  },
  {
    id: 'R3-empty-catch',
    describe: 'empty catch block — a swallowed failure is an invisible failure.',
    exempt: [],
    // `catch {}`, `catch (e) {}`, `catch(err){ }` — empty body on one line.
    // Multi-line empty catches are caught by the block scanner below.
    test: line => /catch\s*(\([^)]*\))?\s*\{\s*\}/.test(line),
  },
  {
    id: 'R4-raw-json-parse',
    describe: 'JSON.parse outside read-validated.ts — bypasses freshness SLA and schema.',
    exempt: ['scripts/lib/read-validated.ts'],
    test: line => /\bJSON\.parse\s*\(/.test(line),
  },
  {
    id: 'R5-direct-messages-create',
    describe: 'messages.create outside metered-client.ts — unmetered spend.',
    exempt: ['scripts/lib/metered-client.ts'],
    test: line => /\bmessages\s*\.\s*create\s*\(/.test(line),
  },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'vendor' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|mts|mjs|js)$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * Strip line comments and block comments so a rule pattern inside prose (this
 * file's own header, for instance) is not reported as a violation. Crude but
 * sufficient: we only need to avoid false positives, and a missed violation
 * inside a comment is not a violation.
 */
function stripComments(source) {
  const noBlock = source.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  return noBlock.split('\n').map(l => l.replace(/\/\/.*$/, ''));
}

/** Multi-line `catch (e) {\n}` with nothing but whitespace between the braces. */
function findMultilineEmptyCatch(lines) {
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /catch\s*(\([^)]*\))?\s*\{\s*$/.exec(lines[i]);
    if (!m) continue;
    for (let j = i + 1; j < lines.length; j++) {
      const body = lines[j].trim();
      if (body === '') continue;
      if (body === '}') hits.push(i + 1);
      break;
    }
  }
  return hits;
}

function scan() {
  const violations = [];
  for (const file of walk(SCAN_DIR)) {
    const rel = relative(ROOT, file);
    const lines = stripComments(readFileSync(file, 'utf-8'));

    for (const rule of RULES) {
      if (rule.exempt.includes(rel)) continue;
      lines.forEach((line, idx) => {
        if (rule.test(line)) {
          violations.push({ rule: rule.id, file: rel, line: idx + 1, text: line.trim().slice(0, 120) });
        }
      });
    }

    for (const line of findMultilineEmptyCatch(lines)) {
      violations.push({ rule: 'R3-empty-catch', file: rel, line, text: 'multi-line empty catch block' });
    }
  }
  return violations;
}

/** Baseline key excludes the line number: edits shift lines constantly and a
 *  line-pinned baseline would produce phantom "new" violations on every commit.
 *  File + rule + normalized source text is stable under reformatting. */
const keyOf = v => `${v.rule}::${v.file}::${v.text.replace(/\s+/g, ' ')}`;

const violations = scan();

if (UPDATE_BASELINE) {
  const baseline = {
    generatedAt: new Date().toISOString(),
    note: 'Known pre-existing violations. This file may only shrink. Regenerate with `npm run lint:architecture -- --update-baseline` after migrating call sites.',
    counts: {},
    keys: violations.map(keyOf).sort(),
  };
  for (const v of violations) baseline.counts[v.rule] = (baseline.counts[v.rule] ?? 0) + 1;
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`Baseline written: ${violations.length} known violations`);
  for (const [rule, n] of Object.entries(baseline.counts).sort()) console.log(`  ${rule.padEnd(30)} ${n}`);
  process.exit(0);
}

let known = new Set();
let baselineCounts = {};
if (existsSync(BASELINE_PATH)) {
  const b = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'));
  known = new Set(b.keys);
  baselineCounts = b.counts ?? {};
} else {
  console.error('No .architecture-baseline.json — run with --update-baseline to establish one.');
  console.error('Treating every violation as new.\n');
}

const fresh = violations.filter(v => !known.has(keyOf(v)));
const stillKnown = violations.filter(v => known.has(keyOf(v)));
const fixed = [...known].filter(k => !violations.some(v => keyOf(v) === k));

const counts = {};
for (const v of violations) counts[v.rule] = (counts[v.rule] ?? 0) + 1;

console.log('Architecture lint — scripts/\n');
console.log('| rule | total | known | new |');
console.log('|---|---|---|---|');
for (const rule of RULES) {
  const total = counts[rule.id] ?? 0;
  const nNew = fresh.filter(v => v.rule === rule.id).length;
  console.log(`| ${rule.id} | ${total} | ${total - nNew} | ${nNew} |`);
}
console.log(`\nbaseline: ${known.size} known · fixed since baseline: ${fixed.length}`);

if (VERBOSE && stillKnown.length) {
  console.log('\nKNOWN (migration backlog):');
  for (const v of stillKnown) console.log(`  ${v.file}:${v.line}  [${v.rule}]  ${v.text}`);
}

if (fresh.length) {
  console.error(`\n✗ ${fresh.length} NEW violation(s):\n`);
  for (const v of fresh) {
    const rule = RULES.find(r => r.id === v.rule);
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    [${v.rule}] ${v.text}`);
    console.error(`    → ${rule?.describe ?? ''}\n`);
  }
  process.exit(1);
}

if (STRICT && stillKnown.length) {
  console.error(`\n✗ --strict: ${stillKnown.length} known violation(s) remain. Migration incomplete.`);
  for (const v of stillKnown) console.error(`  ${v.file}:${v.line}  [${v.rule}]  ${v.text}`);
  process.exit(1);
}

console.log('\n✓ no new violations');

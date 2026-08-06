/**
 * run-tests.mjs — `npm test`. Runs every scripts/**\/*.test.ts and aggregates.
 *
 * WHY A RUNNER AND NOT `node --test`
 * This repo has two test conventions and both are legitimate:
 *
 *   - 7 standalone files (scripts/lib/__tests__/*, collectors, keyword-*) predate any
 *     runner. They are plain tsx scripts: a pass/fail tally and a non-zero exit.
 *   - 4 probe files (scripts/probes/__tests__/*) use node:test.
 *
 * `node --test` would collect the second group and silently ignore the first — which is
 * the failure mode this whole codebase exists to avoid. Spawning each file and reading
 * its exit code treats both honestly, needs no new dependency, and does not require
 * rewriting 7 working files to satisfy a runner.
 *
 * CONTRACT WITH CI
 * Exit 0 only when EVERY file exits 0. A file that cannot start (import error, missing
 * data) is a FAILURE, not a skip — an unrunnable test is indistinguishable from an
 * absent one, and neither proves anything.
 *
 * Usage:
 *   npm test                    # everything
 *   npm test -- ledger          # only files whose path contains 'ledger'
 */

import { spawnSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const SCRIPTS_DIR = resolve(fileURLToPath(new URL('.', import.meta.url)));
const REPO_ROOT = resolve(SCRIPTS_DIR, '..');

/** Every *.test.ts under scripts/, sorted so output order is stable across machines. */
function findTests(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...findTests(full));
    else if (entry.endsWith('.test.ts')) out.push(full);
  }
  return out.sort();
}

const filter = process.argv[2] ?? null;
const all = findTests(SCRIPTS_DIR);
const files = filter === null ? all : all.filter((f) => f.includes(filter));

if (files.length === 0) {
  console.error(filter === null ? 'no *.test.ts files found under scripts/' : `no test file matches '${filter}'`);
  process.exit(1);
}

console.log(`running ${files.length} test file(s)${filter === null ? '' : ` matching '${filter}'`}\n`);

const failed = [];
const started = Date.now();

for (const file of files) {
  const rel = relative(REPO_ROOT, file);
  const t0 = Date.now();
  // stdio:'inherit' — a failing assertion's own message is the useful output. Capturing
  // and re-printing it would only add a layer between the failure and the person reading it.
  const result = spawnSync('npx', ['tsx', file], { cwd: REPO_ROOT, stdio: 'inherit' });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  if (result.error !== undefined) {
    console.error(`\n✗ ${rel} — could not start: ${result.error.message}`);
    failed.push(rel);
  } else if (result.status !== 0) {
    console.error(`\n✗ ${rel} (exit ${result.status}, ${secs}s)`);
    failed.push(rel);
  } else {
    console.log(`\n✓ ${rel} (${secs}s)`);
  }
}

const total = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\n${'─'.repeat(60)}`);

if (failed.length > 0) {
  console.error(`${files.length - failed.length}/${files.length} files passed in ${total}s — FAILED:`);
  for (const f of failed) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`${files.length}/${files.length} files passed in ${total}s`);

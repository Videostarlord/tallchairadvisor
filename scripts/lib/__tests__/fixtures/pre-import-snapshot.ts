/**
 * Records the state of the nightly's two side-effect targets BEFORE
 * `scripts/nightly-report.ts` is loaded.
 *
 * WHY A SEPARATE MODULE. ESM hoists every static import above the module body,
 * so a snapshot written inline in verdict.test.ts would run *after*
 * nightly-report.js had already been evaluated — too late to prove anything.
 * Import order between modules IS guaranteed, so importing this file above the
 * nightly-report import gives a genuine before-picture.
 *
 * WHAT THIS REPLACED, AND WHY IT MATTERED. The assertion used to be
 * "wiki/nightly/<today>.md does not exist". That is only proof on a day the
 * real nightly has not run — and the nightly commits that exact file at 00:00
 * UTC, so from midnight onward the test failed every single day, in CI, on a
 * push that had changed nothing. A test that cries wolf daily is a test that
 * gets ignored, which is how the side effect it guards would come back
 * unnoticed. Existence was never the property under test; CHANGE is.
 */

import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

/** A file's identity as "did this change?" needs it: absent, or size+mtime. */
function fingerprint(rel: string): string {
  const p = resolve(root, rel);
  if (!existsSync(p)) return 'ABSENT';
  const s = statSync(p);
  return `${s.size}@${s.mtimeMs}`;
}

const today = new Date().toISOString().slice(0, 10);

/** Paths the nightly writes. The heartbeat is the dangerous one: refreshing it
 *  makes the dead-man's switch report a healthy system on a night nothing ran. */
export const WATCHED: Record<string, string> = {
  [`wiki/nightly/${today}.md`]: '',
  'data/nightly-heartbeat.json': '',
};

for (const rel of Object.keys(WATCHED)) WATCHED[rel] = fingerprint(rel);

export { fingerprint };

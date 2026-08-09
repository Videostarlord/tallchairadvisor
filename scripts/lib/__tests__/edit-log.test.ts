/**
 * edit-log.test.ts — A1 Phase 2.
 *
 * The property under test is the one that broke the old gate: a mechanical edit
 * must not arm a content cooldown. Everything else here defends the failure
 * posture — an unreadable log must be distinguishable from an empty one, because
 * conflating them is how "we didn't look" starts reading as "nothing to see".
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { resolve, join } from 'path';
import {
  appendEdit,
  readEditLog,
  daysSinceSubstantiveEdit,
  pagesWithRecentSubstantiveEdit,
  recordEdit,
  EDIT_LOG_PATH,
} from '../edit-log.js';

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), 'tca-edit-log-'));
  mkdirSync(resolve(dir, 'data'), { recursive: true });
  return dir;
}

const NOW = new Date('2026-08-08T12:00:00Z');
const iso = (daysAgo: number) =>
  new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString().split('T')[0];

test('a missing log is empty, not an error', () => {
  const root = scratch();
  try {
    assert.deepEqual(readEditLog(root), { entries: [], malformed: 0 });
    assert.equal(daysSinceSubstantiveEdit(root, 'src/pages/x.astro', NOW), Number.POSITIVE_INFINITY);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('THE POINT OF A1: deterministic edits never arm a cooldown', () => {
  const root = scratch();
  try {
    // A link sweep and a spec qualification, today. Under the old git-based gate
    // these two commits locked the page for 14 days.
    recordEdit(root, 'src/pages/review/gesture.astro', 'deterministic', 'execute-fixes', 'inbound link', iso(0));
    recordEdit(root, 'src/pages/review/gesture.astro', 'deterministic', 'execute-fixes', 'spec qualified', iso(0));

    assert.equal(
      daysSinceSubstantiveEdit(root, 'src/pages/review/gesture.astro', NOW),
      Number.POSITIVE_INFINITY,
      'deterministic edits must not count as substantive revisions',
    );
    const recent = pagesWithRecentSubstantiveEdit(root, 14, NOW);
    assert.notEqual(recent, 'unknown');
    assert.equal((recent as Set<string>).size, 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a substantive edit does arm a cooldown, and ages out of it', () => {
  const root = scratch();
  try {
    recordEdit(root, 'src/pages/a.astro', 'substantive', 'execute-fixes', 'rewrote intro', iso(3));
    recordEdit(root, 'src/pages/b.astro', 'substantive', 'execute-content', 'new page', iso(30));

    assert.equal(daysSinceSubstantiveEdit(root, 'src/pages/a.astro', NOW), 3);
    assert.equal(daysSinceSubstantiveEdit(root, 'src/pages/b.astro', NOW), 30);

    const recent = pagesWithRecentSubstantiveEdit(root, 14, NOW) as Set<string>;
    assert.deepEqual([...recent], ['src/pages/a.astro']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the most recent substantive edit wins when a page has several', () => {
  const root = scratch();
  try {
    recordEdit(root, 'src/pages/a.astro', 'substantive', 'x', 'old', iso(40));
    recordEdit(root, 'src/pages/a.astro', 'substantive', 'x', 'newer', iso(2));
    recordEdit(root, 'src/pages/a.astro', 'substantive', 'x', 'middle', iso(20));
    assert.equal(daysSinceSubstantiveEdit(root, 'src/pages/a.astro', NOW), 2);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a malformed line is skipped and counted, not thrown', () => {
  const root = scratch();
  try {
    recordEdit(root, 'src/pages/a.astro', 'substantive', 'x', 'good', iso(1));
    writeFileSync(resolve(root, EDIT_LOG_PATH), 'not json\n{"page":"b"}\n', { flag: 'a' });

    const { entries, malformed } = readEditLog(root);
    assert.equal(entries.length, 1);
    assert.equal(malformed, 2, 'one unparseable line + one that fails the schema');
    // A bad line must not blind the gate to the good ones.
    assert.equal(daysSinceSubstantiveEdit(root, 'src/pages/a.astro', NOW), 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('an UNREADABLE log is unknown, never mistaken for empty', () => {
  const root = scratch();
  try {
    // A directory where the file should be: readFileSync throws EISDIR.
    mkdirSync(resolve(root, EDIT_LOG_PATH), { recursive: true });

    assert.equal(readEditLog(root).malformed, -1);
    assert.equal(daysSinceSubstantiveEdit(root, 'src/pages/a.astro', NOW), 'unknown');
    assert.equal(pagesWithRecentSubstantiveEdit(root, 14, NOW), 'unknown');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('schema rejects an entry that cannot be reasoned about', () => {
  const root = scratch();
  try {
    assert.throws(() => appendEdit(root, {
      page: 'src/pages/a.astro',
      // @ts-expect-error deliberately invalid
      editClass: 'mechanical',
      appliedDate: '2026-08-08',
      agent: 'x',
      description: 'y',
    }));
    assert.throws(() => appendEdit(root, {
      page: 'src/pages/a.astro',
      editClass: 'substantive',
      appliedDate: '08/08/2026',
      agent: 'x',
      description: 'y',
    }));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

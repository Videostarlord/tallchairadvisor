/**
 * affiliate-store.test.ts — the daily/weekly split.
 *
 * The load-bearing test here is `mtime must never decide freshness`. It exists
 * because latest.json carries no date in its filename, so any staleness check
 * that stats the file would read a CI checkout's fresh mtime and report the data
 * current on every run — forever, including runs where the pull failed and wrote
 * nothing. collectors/amazon.ts already hit that exact bug once, when its own
 * output matched its own scan and became "the newest export, 0 days old".
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, utimesSync } from 'fs';
import { tmpdir } from 'os';
import { resolve, join } from 'path';
import {
  writeSnapshot,
  readSnapshot,
  ageDaysFromSnapshot,
  LATEST_PATH,
  HISTORY_PATH,
  type AffiliateSnapshot,
} from '../affiliate-store.js';

function scratch(): string {
  const d = mkdtempSync(join(tmpdir(), 'tca-aff-'));
  mkdirSync(resolve(d, 'data/affiliate'), { recursive: true });
  return d;
}

const NOW = new Date('2026-08-09T12:00:00Z');

function snap(over: Partial<AffiliateSnapshot> = {}): AffiliateSnapshot {
  return {
    fetchedAt: NOW.toISOString(),
    window: { start: '2026-07-11', end: '2026-08-09', kind: 'rolling-30-day' },
    totals: { clicks: 108, total_ordered_items: 7, total_ordered_revenue: 3337.74, total_earnings: 100.4 },
    rows: [{
      day: '2026-08-08', clicks: '4', total_ordered_items: '0', total_ordered_revenue: '0.00',
      shipped_items: '0', returned_items: '0', total_revenue: '0.00', total_earnings: '0.00',
    }],
    mode: 'daily',
    ...over,
  };
}

test('a snapshot round-trips and history is appended', () => {
  const root = scratch();
  try {
    writeSnapshot(root, snap());
    writeSnapshot(root, snap({ mode: 'weekly' }));

    const read = readSnapshot(root);
    assert.equal(read.kind, 'ok');
    assert.equal(read.kind === 'ok' ? read.snapshot.mode : null, 'weekly', 'latest.json is overwritten, not appended');

    const hist = readFileLines(resolve(root, HISTORY_PATH));
    assert.equal(hist.length, 2, 'history.jsonl is append-only');
    // lint-architecture-allow R4 -- parsing this test's own fixture written two lines above, not external input
    const first = JSON.parse(hist[0]) as { clicks: number };
    // lint-architecture-allow R4 -- same
    const second = JSON.parse(hist[1]) as { mode: string };
    assert.equal(first.clicks, 108);
    assert.equal(second.mode, 'weekly');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('THE LOAD-BEARING ONE: mtime must never decide freshness', () => {
  const root = scratch();
  try {
    // A snapshot pulled 9 days ago...
    const old = new Date(NOW.getTime() - 9 * 86_400_000).toISOString();
    writeSnapshot(root, snap({ fetchedAt: old }));

    // ...in a file whose mtime was just stamped "now", exactly as a CI checkout does.
    const p = resolve(root, LATEST_PATH);
    utimesSync(p, NOW, NOW);

    assert.equal(
      ageDaysFromSnapshot(readSnapshot(root), NOW),
      9,
      'age must come from fetchedAt inside the file, not the filesystem timestamp',
    );
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('absent and malformed are distinct, and neither is fresh', () => {
  const root = scratch();
  try {
    assert.equal(readSnapshot(root).kind, 'absent');
    assert.equal(ageDaysFromSnapshot(readSnapshot(root), NOW), null);

    writeFileSync(resolve(root, LATEST_PATH), '{not json');
    assert.equal(readSnapshot(root).kind, 'malformed');
    assert.equal(ageDaysFromSnapshot(readSnapshot(root), NOW), null, 'unknown age is null, never 0');

    // Valid JSON, wrong shape — still malformed, never silently accepted.
    writeFileSync(resolve(root, LATEST_PATH), JSON.stringify({ fetchedAt: NOW.toISOString() }));
    assert.equal(readSnapshot(root).kind, 'malformed');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('an unparseable fetchedAt yields null age, not 0', () => {
  const root = scratch();
  try {
    writeSnapshot(root, snap({ fetchedAt: 'last Tuesday' }));
    assert.equal(ageDaysFromSnapshot(readSnapshot(root), NOW), null);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('age is whole days and never negative', () => {
  const root = scratch();
  try {
    // Clock skew: a snapshot stamped slightly in the future must not read as -1.
    writeSnapshot(root, snap({ fetchedAt: new Date(NOW.getTime() + 3_600_000).toISOString() }));
    assert.equal(ageDaysFromSnapshot(readSnapshot(root), NOW), 0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the schema rejects a snapshot that cannot be reasoned about', () => {
  const root = scratch();
  try {
    // @ts-expect-error mode is a closed set
    assert.throws(() => writeSnapshot(root, snap({ mode: 'hourly' })));
    assert.throws(() => writeSnapshot(root, snap({ fetchedAt: '' })));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

function readFileLines(p: string): string[] {
  return readFileSync(p, 'utf-8').split('\n').filter((l) => l.trim() !== '');
}

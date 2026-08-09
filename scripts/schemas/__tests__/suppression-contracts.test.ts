/**
 * suppression-contracts.test.ts — the two contracts added by A4 whose whole job
 * is to stop a broken file from reading as "nothing to suppress" / "no gaps".
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THIS TEST EXISTS
 *
 * `data/content-failed.json` and `data/gsc/link-audit.json` were both read the
 * same way before this: raw `JSON.parse` inside a `catch {}`, then `?? []` /
 * `Object.keys(... ?? {})`. Each has a degraded reading that is not merely wrong
 * but ACTIVELY HARMFUL and completely silent:
 *
 *   content-failed → empty set  = "no slug has ever failed" = retry every page
 *                                 that already failed generation twice
 *   link-audit     → empty gaps = "every high-impression page is well linked"
 *                                 = Module 8's entire output disappears
 *
 * Neither degraded state is distinguishable from the healthy one by looking at
 * the plan afterwards. So the contract is the only place it can be caught, and
 * these tests pin the two properties that matter: a MALFORMED file throws, and
 * a legitimately EMPTY one does not.
 *
 * The live files are validated too. If either ever stops satisfying its schema,
 * that is a defect in the writer, and it should surface here before it surfaces
 * as a suspiciously quiet weekly plan.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { contentFailedSchema } from '../content-failed.js';
import { linkAuditSchema } from '../link-audit.js';
import { readValidated, REPO_ROOT } from '../../lib/read-validated.js';
import { contentFailedOptions } from '../content-failed.js';
import { linkAuditOptions } from '../link-audit.js';

test('an empty content-failed registry is valid — "nothing has failed" is the goal state', () => {
  const parsed = contentFailedSchema.parse({});
  assert.deepEqual(Object.keys(parsed), []);
});

test('a content-failed entry missing its reason throws rather than being dropped', () => {
  // The dangerous shape: the slug IS present, so a lenient reader would still
  // suppress it — but a reader that drops the whole file on a parse error would
  // un-suppress every slug at once. Refusing the file is the honest outcome.
  const result = contentFailedSchema.safeParse({ '/foo/': { date: '2026-08-09' } });
  assert.equal(result.success, false);
});

test('content-failed rejects a bare string value — the pre-contract writer shape', () => {
  const result = contentFailedSchema.safeParse({ '/foo/': 'validation failed' });
  assert.equal(result.success, false);
});

test('link-audit with zero gaps is valid; link-audit with no gaps KEY is not', () => {
  const healthy = linkAuditSchema.parse({
    generatedAt: '2026-08-09T00:00:00.000Z',
    impressionsThreshold: 500,
    linkThreshold: 3,
    gaps: [],
  });
  assert.deepEqual(healthy.gaps, []);

  // Module 8 stopped emitting. Under `gaps ?? []` this was indistinguishable
  // from the healthy case above; under the contract it is a violation.
  const missing = linkAuditSchema.safeParse({
    generatedAt: '2026-08-09T00:00:00.000Z',
    impressionsThreshold: 500,
    linkThreshold: 3,
  });
  assert.equal(missing.success, false);
});

test('a link-audit gap row must carry the numbers the planner ranks on', () => {
  const result = linkAuditSchema.safeParse({
    generatedAt: '2026-08-09T00:00:00.000Z',
    impressionsThreshold: 500,
    linkThreshold: 3,
    gaps: [{ page: '/review/gesture/', inboundLinkCount: 1, threshold: 3 }],
  });
  assert.equal(result.success, false, 'a gap with no impressions cannot be sorted or thresholded');
});

test('the live files on disk satisfy their contracts', () => {
  for (const [path, schema, opts] of [
    ['data/content-failed.json', contentFailedSchema, contentFailedOptions],
    ['data/gsc/link-audit.json', linkAuditSchema, linkAuditOptions],
  ] as const) {
    if (!existsSync(resolve(REPO_ROOT, path))) continue; // absence is a state, not a failure
    assert.doesNotThrow(() => readValidated(path, schema, opts), `${path} violates its contract`);
  }
});

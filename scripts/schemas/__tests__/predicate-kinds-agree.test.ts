/**
 * predicate-kinds-agree.test.ts — the WRITE path and the READ path must list
 * the same closure-predicate kinds.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THIS TEST EXISTS
 *
 * There are two independent lists of predicate kinds:
 *
 *   scripts/lib/predicates/index.ts   the WRITE path — what may be FILED
 *   scripts/schemas/ledger.ts         the READ path  — what may be LOADED
 *
 * On 2026-08-09 `visual-diff` (P1) was added to the first and not the second.
 * The probe filed 10 real visual-regression findings and the next validated
 * read of data/ledger.jsonl threw on all of them. **The ledger became
 * unreadable at the exact moment a new detector started working** — which is
 * the failure the `collector-healthy` comment in ledger.ts had already
 * predicted in writing, for the same reason, one member earlier.
 *
 * This is the same class as the cooldown classifier that lived in two files
 * with two different keyword lists (A1): any rule enforced in two places will
 * eventually be two different rules. Where the two cannot be collapsed into one
 * — and here they cannot, since schemas/ must stay free of the predicate
 * layer's imports — the next best thing is to make drift LOUD.
 *
 * If this test fails: you added a kind to one list. Add it to the other.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { closurePredicateSchema as readSchema } from '../ledger.js';
import { PREDICATE_KINDS } from '../../lib/predicates/index.js';

/** Discriminator literals a zod discriminated union actually accepts. */
function kindsOf(schema: typeof readSchema): string[] {
  const options = (schema as unknown as { options: { shape: { kind: { value: string } } }[] }).options;
  return options.map((o) => o.shape.kind.value).sort();
}

test('the ledger read schema accepts exactly the kinds the predicate registry can file', () => {
  const write = [...PREDICATE_KINDS].sort();
  const read = kindsOf(readSchema);

  const missingFromRead = write.filter((k) => !read.includes(k));
  const missingFromWrite = read.filter((k) => !write.includes(k));

  assert.deepEqual(
    missingFromRead,
    [],
    `these kinds can be FILED but not READ back — the ledger will throw on the first one written: ${missingFromRead.join(', ')}. ` +
      'Add them to closurePredicateSchema in scripts/schemas/ledger.ts.',
  );
  assert.deepEqual(
    missingFromWrite,
    [],
    `these kinds are accepted on read but cannot be filed — dead members, or a kind was removed from the registry: ${missingFromWrite.join(', ')}.`,
  );
  assert.deepEqual(read, write);
});

test('visual-diff specifically round-trips, since its absence broke the ledger once', () => {
  const filed = { kind: 'visual-diff', url: '/review/gesture/', viewport: 'mobile', maxPct: 2 };
  assert.equal(readSchema.safeParse(filed).success, true);
  assert.ok(PREDICATE_KINDS.includes('visual-diff'));
});

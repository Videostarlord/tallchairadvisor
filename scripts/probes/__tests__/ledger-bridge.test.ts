/**
 * The ledger (§7.3) is written by a different component on a different schedule. These
 * tests pin the two behaviours that keep the probe useful either way:
 *   - a missing ledger degrades to a STATED reason, never to a silent no-op;
 *   - findings are still derived and written to data/probes/ regardless.
 *
 * Run: npx tsx --test scripts/probes/__tests__/*.test.ts
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileFindings, loadLedger } from '../ledger-bridge.js';

test('a missing ledger yields an explicit reason, not a silent skip', async () => {
  const empty = mkdtempSync(join(tmpdir(), 'tca-probe-'));
  const { mod, reason } = await loadLedger(empty);
  assert.equal(mod, null);
  assert.match(reason ?? '', /ledger\.ts does not exist/);

  const report = await fileFindings(empty, [], { maxNew: 10, dryRun: false });
  assert.equal(report.available, false);
  assert.equal(report.filed, 0);
  assert.ok(report.reason !== null, 'a skipped filing must always say why');
});

test('a dry run says it is a dry run', async () => {
  const report = await fileFindings(process.cwd(), [], { maxNew: 10, dryRun: true });
  assert.equal(report.available, false);
  assert.match(report.reason ?? '', /disabled/);
});

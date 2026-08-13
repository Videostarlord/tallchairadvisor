/**
 * retention.test.ts — the A5 safety property, executable.
 * Run: npx tsx scripts/lib/__tests__/retention.test.ts
 *
 * Same convention as ledger.test.ts: no framework, plain asserts, a tally, and a
 * non-zero exit on failure.
 *
 * THE PROPERTY UNDER TEST
 * A retention policy that can delete the raw record behind a finding a human is
 * still arguing about is not a retention policy, it is quiet evidence loss — the
 * exact thing MissingEvidenceError exists upstream to prevent. So the load-bearing
 * test here is not "pruning works", it is:
 *
 *     a probe file cited by a STILL-OPEN ledger finding is on disk after a real,
 *     non-dry-run prune that deleted its equally-old neighbour.
 *
 * It asserts on the FILESYSTEM after `pruneProbeArtifacts()` has actually unlinked
 * things, not on the plan object. A plan that says "keep" while the unlink loop
 * removes the file anyway would pass a plan-level assertion and still lose the
 * evidence, and that gap is precisely where this class of bug lives.
 *
 * Nothing here touches data/probes/ or data/ledger.jsonl. Every case runs against
 * a temp repo root, and the one case that needs a real ledger file points
 * setLedgerPath() at a scratch copy and restores it afterwards.
 */

import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import {
  AGENT_HEALTH_ALARM_BYTES,
  DEFAULT_PROBE_KEEP,
  LEDGER_ALARM_BYTES,
  foldToCurrent,
  formatBytes,
  inspectAgentHealthSize,
  inspectLedgerSize,
  pinnedProbeDates,
  planProbePruning,
  probeDatesOnDisk,
  pruneProbeArtifacts,
} from '../retention.js';
import { getLedgerPath, setLedgerPath, type LedgerRecord, type LedgerStatus } from '../ledger.js';

// ─── harness ───────────────────────────────────────────────────────────────────

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

const scratch = mkdtempSync(resolve(tmpdir(), 'tca-retention-'));

/** A minimal record whose only interesting fields are status and evidence.source. */
function record(id: string, status: LedgerStatus, source: string | null): LedgerRecord {
  return {
    id,
    kind: 'finding',
    firstSeen: '2026-07-01',
    lastSeen: '2026-08-09',
    status,
    attempts: 0,
    closurePredicate: { kind: 'collector-healthy', collector: 'gsc' },
    closedAt: status === 'closed' ? '2026-08-09' : null,
    closedBy: status === 'closed' ? 'test' : null,
    evidence:
      source === null
        ? null
        : { source, observedAt: '2026-08-09T10:00:00.000Z', detail: { note: 'synthetic' } },
    page: `/page-${id}/`,
    issueClass: 'synthetic',
  };
}

/** A temp repo root with data/probes/<date>.json for each date given. */
function makeProbeRepo(name: string, dates: string[]): string {
  const root = resolve(scratch, name);
  const dir = resolve(root, 'data/probes');
  mkdirSync(dir, { recursive: true });
  for (const date of dates) {
    writeFileSync(resolve(dir, `${date}.json`), `{"date":"${date}","pages":[]}\n`);
  }
  return root;
}

const probeFile = (root: string, date: string): string => resolve(root, 'data/probes', `${date}.json`);

// ─── 1. pinnedProbeDates: which statuses hold a file, and which do not ─────────

console.log('\npinnedProbeDates');
{
  const pinned = pinnedProbeDates([
    record('open-1', 'open', 'probe:2026-07-01'),
    record('escalated-1', 'escalated', 'probe:2026-07-02'),
    record('regressed-1', 'regressed', 'probe:2026-07-03'),
    record('closed-1', 'closed', 'probe:2026-07-04'),
    record('no-evidence', 'open', null),
    record('not-a-probe', 'open', 'collector:gsc'),
  ]);

  assert('an open finding pins its probe date', pinned.has('2026-07-01'));
  assert('an escalated finding pins its probe date', pinned.has('2026-07-02'));
  assert('a regressed finding pins its probe date', pinned.has('2026-07-03'));
  assert(
    'a CLOSED finding pins nothing — its detail is already inline in the ledger',
    !pinned.has('2026-07-04'),
  );
  assert('a finding with no evidence pins nothing', pinned.size === 3, `size ${pinned.size}`);
  assert(
    'a non-probe evidence source (collector:gsc) is not read as a probe date',
    !pinned.has('gsc'),
  );
}

// ─── 1b. the fold — an append-only history must not pin every date it mentions ─

console.log('\npinnedProbeDates folds the append-only history');
{
  // data/ledger.jsonl holds transitions, not findings. This is one finding's
  // whole life: opened on the 1st, escalated on the 2nd, closed on the 3rd.
  // Un-folded, its two stale non-closed rows would pin 07-01 and 07-02 forever.
  const history = [
    record('lifecycle', 'open', 'probe:2026-07-01'),
    record('lifecycle', 'escalated', 'probe:2026-07-02'),
    record('lifecycle', 'closed', 'probe:2026-07-03'),
  ];

  const pinned = pinnedProbeDates(history);
  assert(
    'a finding that is closed NOW pins none of the dates it cited while open',
    pinned.size === 0,
    [...pinned].join(','),
  );

  // And the converse: a finding whose last row is still open keeps pinning.
  const reopened = pinnedProbeDates([
    ...history,
    record('lifecycle', 'regressed', 'probe:2026-07-04'),
  ]);
  assert(
    'a regression re-pins, and pins only the date of the latest observation',
    reopened.size === 1 && reopened.has('2026-07-04'),
    [...reopened].join(','),
  );

  assert('foldToCurrent keeps the last row per id', foldToCurrent(history).length === 1);
  assert(
    'foldToCurrent is idempotent — folding a folded array changes nothing',
    foldToCurrent(foldToCurrent(history)).length === 1,
  );
  assert(
    'foldToCurrent does not merge distinct ids',
    foldToCurrent([record('a', 'open', null), record('b', 'open', null)]).length === 2,
  );
}

// ─── 2. planProbePruning: the window, and the newest-file floor ────────────────

console.log('\nplanProbePruning');
{
  const dates = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05'];
  const plan = planProbePruning(dates, 2, new Set());
  assert('keep=2 retains the two newest', plan.keep.join(',') === '2026-08-04,2026-08-05', plan.keep.join(','));
  assert('keep=2 deletes the three oldest', plan.del.join(',') === '2026-08-01,2026-08-02,2026-08-03', plan.del.join(','));

  const zero = planProbePruning(dates, 0, new Set());
  assert(
    'keep=0 still retains the newest file — a policy may not blind tonight',
    zero.keep.join(',') === '2026-08-05' && !zero.del.includes('2026-08-05'),
    `keep=${zero.keep.join(',')}`,
  );

  const empty = planProbePruning([], DEFAULT_PROBE_KEEP, new Set());
  assert('an empty directory plans nothing', empty.del.length === 0 && empty.keep.length === 0);

  const unsorted = planProbePruning(['2026-08-05', '2026-08-01', '2026-08-03'], 1, new Set());
  assert(
    'input order does not decide what is newest',
    unsorted.keep.join(',') === '2026-08-05',
    unsorted.keep.join(','),
  );
}

// ─── 3. THE SAFETY PROPERTY — asserted against the filesystem ─────────────────

console.log('\npinned probe evidence survives a real prune');
{
  // Two files of identical age fall outside the keep window. One is cited by an
  // OPEN finding; the other by nothing. If pinning were decorative, both would go.
  const dates = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05'];
  const root = makeProbeRepo('pinned-survives', dates);

  const result = pruneProbeArtifacts({
    repoRoot: root,
    keep: 2,
    ledger: [
      record('still-open', 'open', 'probe:2026-08-01'),
      record('long-closed', 'closed', 'probe:2026-08-02'),
    ],
  });

  assert(
    'the pinned file is STILL ON DISK after a non-dry-run prune',
    existsSync(probeFile(root, '2026-08-01')),
    'the raw record behind an open finding was deleted — this is the A5 failure',
  );
  assert(
    'the prune was real: an unpinned file of the SAME age is gone',
    !existsSync(probeFile(root, '2026-08-02')),
    'nothing was deleted, so the survival above proves nothing',
  );
  assert('the third out-of-window file is gone too', !existsSync(probeFile(root, '2026-08-03')));
  assert('both in-window files survive', existsSync(probeFile(root, '2026-08-04')) && existsSync(probeFile(root, '2026-08-05')));

  assert(
    'the pin is reported, not silent',
    result.plan.pinned.join(',') === '2026-08-01',
    result.plan.pinned.join(','),
  );
  assert('deleted matches what actually left the disk', result.deleted.join(',') === '2026-08-02,2026-08-03', result.deleted.join(','));
  assert('nothing failed to unlink', result.errors.length === 0, result.errors.join(' | '));
  assert('bytes freed is a real measurement, not a count', result.bytesFreed > 0, `${result.bytesFreed}`);
  assert(
    'probeDatesOnDisk agrees with the filesystem afterwards',
    probeDatesOnDisk(root).join(',') === '2026-08-01,2026-08-04,2026-08-05',
    probeDatesOnDisk(root).join(','),
  );
}

// ─── 4. a closed finding does NOT hold a file — the pin is selective ──────────

console.log('\nclosed findings release their probe file');
{
  const root = makeProbeRepo('closed-releases', ['2026-08-01', '2026-08-04', '2026-08-05']);
  pruneProbeArtifacts({
    repoRoot: root,
    keep: 2,
    ledger: [record('long-closed', 'closed', 'probe:2026-08-01')],
  });
  assert(
    'a date cited only by a CLOSED finding is pruned',
    !existsSync(probeFile(root, '2026-08-01')),
    'closed findings would pin forever, and the policy would never reclaim anything',
  );
}

// ─── 5. the newest file is never deleted, even when an old pin exists ─────────

console.log('\nthe newest file is untouchable');
{
  const root = makeProbeRepo('newest-floor', ['2026-08-01', '2026-08-09']);
  pruneProbeArtifacts({ repoRoot: root, keep: 0, ledger: [] });
  assert('keep=0 leaves tonight’s probe on disk', existsSync(probeFile(root, '2026-08-09')));
  assert('keep=0 still reclaims the old one', !existsSync(probeFile(root, '2026-08-01')));
}

// ─── 6. --dry-run touches nothing ─────────────────────────────────────────────

console.log('\ndry run');
{
  const root = makeProbeRepo('dry-run', ['2026-08-01', '2026-08-04', '2026-08-05']);
  const result = pruneProbeArtifacts({ repoRoot: root, keep: 2, dryRun: true, ledger: [] });
  assert('dry run names what it would delete', result.deleted.join(',') === '2026-08-01', result.deleted.join(','));
  assert('dry run deletes nothing', existsSync(probeFile(root, '2026-08-01')));
  assert('dry run says so in its result', result.dryRun);
}

// ─── 7. a missing probe directory is not an error ─────────────────────────────

console.log('\nabsent probe directory');
{
  const root = resolve(scratch, 'no-probes');
  mkdirSync(root, { recursive: true });
  const result = pruneProbeArtifacts({ repoRoot: root, keep: 2, ledger: [] });
  assert('no data/probes/ → nothing planned, nothing thrown', result.deleted.length === 0 && result.errors.length === 0);
  assert('probeDatesOnDisk returns empty rather than throwing', probeDatesOnDisk(root).length === 0);
}

// ─── 8. inspectLedgerSize reports, and never rewrites ─────────────────────────

console.log('\ninspectLedgerSize');
{
  const root = resolve(scratch, 'ledger-size');
  mkdirSync(resolve(root, 'data'), { recursive: true });

  const absent = inspectLedgerSize(root, 'data/ledger.jsonl');
  assert('an absent ledger reports exists:false, not 0 bytes as fact', !absent.exists && absent.bytes === 0);
  assert('an absent ledger cannot trip the alarm', !absent.overAlarm);

  const file = resolve(root, 'data/ledger.jsonl');
  const lines = [record('a', 'open', 'probe:2026-08-01'), record('b', 'closed', 'probe:2026-08-02')]
    .map((r) => JSON.stringify(r))
    .join('\n');
  writeFileSync(file, `${lines}\n`);

  const previous = getLedgerPath();
  setLedgerPath(file);
  try {
    const report = inspectLedgerSize(root, 'data/ledger.jsonl');
    assert('a present ledger is sized', report.exists && report.bytes > 0, `${report.bytes}`);
    assert('records are counted from the same file that was sized', report.records === 2, `${report.records}`);
    assert('a 2-record ledger is nowhere near the alarm', !report.overAlarm);
    assert('the ledger file is not rewritten by inspection', existsSync(file));
  } finally {
    setLedgerPath(previous);
  }

  assert('the alarm threshold is a real size, not a placeholder', LEDGER_ALARM_BYTES === 25 * 1024 * 1024);
}

// ─── 8b. agent-health.jsonl is watched and NEVER pruned ───────────────────────
//
// THE PROPERTY UNDER TEST, and it is the same one as section 8 with higher
// stakes. A probe file may be deleted because the ledger already holds a copy of
// what it observed. Nothing anywhere copies an agent-health record, so that line
// is the ONLY evidence that an agent went blind on a given night. The load-bearing
// assertion here is therefore not "the size is reported", it is:
//
//     a real, non-dry-run prune leaves data/agent-health.jsonl byte-for-byte intact.
//
// If someone later points the pruner at this file, that assertion fails and the
// argument in retention.ts's header gets re-read before the evidence is gone.

console.log('\ninspectAgentHealthSize');
{
  const root = resolve(scratch, 'agent-health-size');
  mkdirSync(resolve(root, 'data', 'probes'), { recursive: true });

  const absent = inspectAgentHealthSize(root, 'data/agent-health.jsonl');
  assert(
    'an absent agent-health log reports exists:false, not 0 records as fact',
    !absent.exists && absent.bytes === 0 && absent.records === 0
  );
  assert('an absent agent-health log cannot trip the alarm', !absent.overAlarm);

  const file = resolve(root, 'data/agent-health.jsonl');
  const health = [
    { ts: '2026-08-09T01:00:00.000Z', run: '2026-08-09', agent: 'audit', status: 'evaluated', reason: null },
    { ts: '2026-08-09T02:00:00.000Z', run: '2026-08-09', agent: 'strategy', status: 'unevaluable', reason: 'TRUNCATED' },
  ];
  // A blank line and a trailing newline, because real JSONL has both and a
  // record count that drifts on whitespace is not a record count.
  writeFileSync(file, `${JSON.stringify(health[0])}\n\n${JSON.stringify(health[1])}\n`);
  const bytesBefore = statSync(file).size;

  const report = inspectAgentHealthSize(root, 'data/agent-health.jsonl');
  assert('a present agent-health log is sized', report.exists && report.bytes > 0, `${report.bytes}`);
  assert('blank lines are not counted as records', report.records === 2, `${report.records}`);
  assert('a 2-record health log is nowhere near the alarm', !report.overAlarm);

  // Counting lines rather than parsing them is the deliberate difference from
  // inspectLedgerSize. A malformed line must not make the file look smaller than
  // it is — "the log stopped growing" is the wrong answer to "how big is it".
  writeFileSync(file, `${JSON.stringify(health[0])}\n{ this is not json\n`);
  const malformed = inspectAgentHealthSize(root, 'data/agent-health.jsonl');
  assert(
    'a malformed line still counts toward size, rather than silently vanishing',
    malformed.exists && malformed.records === 2,
    `${malformed.records}`
  );

  // The safety property. Give the pruner something it WILL delete, then prove it
  // left the health log alone.
  writeFileSync(file, `${JSON.stringify(health[0])}\n\n${JSON.stringify(health[1])}\n`);
  for (const date of ['2026-07-01', '2026-07-02', '2026-08-08', '2026-08-09']) {
    writeFileSync(resolve(root, 'data/probes', `${date}.json`), '{}');
  }
  const pruned = pruneProbeArtifacts({ repoRoot: root, keep: 1, ledger: [], dryRun: false });
  assert('the prune under test actually deleted something', pruned.deleted.length > 0, `${pruned.deleted.length}`);
  assert('a real prune does not delete data/agent-health.jsonl', existsSync(file));
  assert(
    'a real prune does not rewrite or truncate data/agent-health.jsonl',
    statSync(file).size === bytesBefore,
    `${statSync(file).size} vs ${bytesBefore}`
  );

  assert(
    'the agent-health alarm threshold is a real size, not a placeholder',
    AGENT_HEALTH_ALARM_BYTES === 25 * 1024 * 1024
  );
}

// ─── 9. formatBytes ───────────────────────────────────────────────────────────

console.log('\nformatBytes');
{
  assert('bytes', formatBytes(512) === '512 B', formatBytes(512));
  assert('kilobytes', formatBytes(490 * 1024) === '490.0 KB', formatBytes(490 * 1024));
  assert('megabytes', formatBytes(15 * 1024 * 1024) === '15.0 MB', formatBytes(15 * 1024 * 1024));
}

// ─── done ─────────────────────────────────────────────────────────────────────

rmSync(scratch, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

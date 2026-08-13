/**
 * retention-prune.ts — `npm run retention:prune`, the caller scripts/lib/retention.ts
 * was missing (A5).
 *
 * ORDERING IS THE WHOLE POINT, AND IT IS NOT COSMETIC
 * This must run AFTER `ledger:evaluate` in .github/workflows/nightly.yml, because
 * the pinning set is derived from the ledger's CURRENT statuses. Run it before,
 * and tonight's newly-opened finding has not been written yet — its probe file
 * would look unpinned and be eligible for deletion the moment it aged out. Run it
 * after, and every finding still under adjudication has already declared the probe
 * date it rests on. `pinnedProbeDates()` is only as good as the ledger it reads.
 *
 * EXIT CODE
 * Always 0 short of a harness failure, matching collect-all.ts: a probe file that
 * could not be unlinked is knowledge, not a reason to fail a night of observation.
 * Individual unlink failures are printed loudly and counted; they are never
 * swallowed, which is the R3 failure this repo keeps re-learning.
 *
 * Usage:
 *   npm run retention:prune               # keep DEFAULT_PROBE_KEEP nights
 *   npm run retention:prune -- --dry-run  # print the plan, delete nothing
 *   npm run retention:prune -- --keep=7
 */

import {
  DEFAULT_PROBE_KEEP,
  formatBytes,
  inspectAgentHealthSize,
  inspectLedgerSize,
  pruneProbeArtifacts,
  type LedgerSizeReport,
} from './lib/retention.js';

interface Options {
  keep: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Options {
  let keep = DEFAULT_PROBE_KEEP;
  let dryRun = false;

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    const match = /^--keep=(\d+)$/.exec(arg);
    if (match !== null) {
      keep = Number.parseInt(match[1], 10);
      continue;
    }
    // An unrecognised flag is a typo, and a typo that silently keeps the default
    // is how `--keep=7` becomes "kept 30 and nobody noticed".
    throw new Error(`unrecognised argument '${arg}' — expected --dry-run or --keep=N`);
  }

  return { keep, dryRun };
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  const result = pruneProbeArtifacts({ keep: opts.keep, dryRun: opts.dryRun });
  const { plan } = result;

  const verb = result.dryRun ? 'would delete' : 'deleted';
  console.log(
    `[retention] probes: ${plan.present.length} on disk, keeping ${plan.keep.length} ` +
      `(window ${opts.keep}), ${verb} ${result.deleted.length} — ${formatBytes(result.bytesFreed)}`
  );

  if (plan.pinned.length > 0) {
    // Named, not counted. These are the files a human is most likely to want, and
    // "3 pinned" does not tell anyone which unclosed finding is holding them.
    console.log(
      `[retention] pinned by unclosed ledger findings, kept past the window: ${plan.pinned.join(', ')}`
    );
  }

  if (result.deleted.length > 0) {
    console.log(`[retention] ${verb}: ${result.deleted.join(', ')}`);
  }

  for (const error of result.errors) {
    console.error(`[retention] could NOT remove ${error}`);
  }

  reportWatchedFile(inspectLedgerSize(), 'LEDGER');
  // A13's log gets the ledger's treatment, not the probes': sized every night,
  // never pruned. scripts/lib/retention.ts says at length why deleting evidence
  // about detector blindness would be the failure A13 was built to end.
  reportWatchedFile(inspectAgentHealthSize(), 'AGENT-HEALTH');
}

/**
 * An append-only file this module watches but deliberately never prunes.
 *
 * Absence is reported as absence, not as zero — an agent-health log that does not
 * exist means no agent has recorded a stop_reason yet, which is UNMONITORED
 * rather than healthy, and the nightly says so in its own words.
 */
function reportWatchedFile(report: LedgerSizeReport, alarmLabel: string): void {
  if (!report.exists) {
    console.log(`[retention] ${report.path} absent — nothing to size`);
    return;
  }

  console.log(
    `[retention] ${report.path}: ${formatBytes(report.bytes)} across ${report.records} record(s) — not pruned, by design`
  );

  if (report.overAlarm) {
    // Deliberately not an exit code. The decision to never compact these files
    // was made against a measured growth rate; crossing this means the rate
    // changed and the decision is due a re-argument, not that tonight failed.
    console.error(
      `[retention] ${alarmLabel} ALARM — ${report.path} is ${formatBytes(report.bytes)}, past the ` +
        `threshold that says the growth model in scripts/lib/retention.ts is out of date. ` +
        `Re-derive it before assuming append-only is still free.`
    );
  }
}

try {
  main();
} catch (error) {
  console.error('[retention] HARNESS FAILURE — retention could not run.');
  console.error(error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error));
  process.exit(1);
}

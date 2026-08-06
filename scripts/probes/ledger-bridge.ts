/**
 * probes/ledger-bridge.ts — file findings without depending on the ledger existing.
 *
 * scripts/lib/ledger.ts is being written in parallel with this file. A static import
 * would make the whole probe unrunnable until it lands, which would be the tail wagging
 * the dog: the probe's own acceptance test does not need the ledger. So the import is
 * dynamic, guarded by existsSync, and every filing call is individually wrapped —
 * `fileFinding` legitimately throws (MissingPredicateError, RetractedFindingError) and
 * a thrown finding must never abort a run that still has 40 pages to look at.
 *
 * IT NEVER FILES WITHOUT A PREDICATE. `fileFinding` rejects that at write time by
 * design (PRD §7.3), and this bridge does not try to work around it — a probe finding
 * that cannot state its own closure test does not deserve to be recorded.
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import type { ProbeFinding } from './assertions.js';

interface LedgerModule {
  fileFinding: (rec: Record<string, unknown>) => { id: string; status: string; firstSeen: string };
  /** Optional: present in the shipped ledger, used only to count what was appended. */
  readLedger?: (path?: string) => unknown[];
}

export interface FilingReport {
  available: boolean;
  /** Why the ledger was not used. Printed in the summary; never silent. */
  reason: string | null;
  filed: number;
  /** Already open — fileFinding is idempotent and returns the existing record. */
  existing: number;
  rejected: { issue: string; error: string }[];
  suppressed: number;
}

export async function loadLedger(repoRoot: string): Promise<{ mod: LedgerModule | null; reason: string | null }> {
  const path = resolve(repoRoot, 'scripts/lib/ledger.ts');
  if (!existsSync(path)) {
    return { mod: null, reason: 'scripts/lib/ledger.ts does not exist yet (PRD §7.3 in flight) — findings were derived but not filed' };
  }
  try {
    const mod = (await import('../lib/ledger.js')) as unknown as Partial<LedgerModule>;
    if (typeof mod.fileFinding !== 'function') {
      return { mod: null, reason: 'scripts/lib/ledger.ts exports no fileFinding() — findings were derived but not filed' };
    }
    return { mod: mod as LedgerModule, reason: null };
  } catch (error) {
    return { mod: null, reason: `scripts/lib/ledger.ts failed to import (${(error as Error).message}) — findings were derived but not filed` };
  }
}

export async function fileFindings(
  repoRoot: string,
  findings: ProbeFinding[],
  opts: { ledgerPath?: string; maxNew: number; dryRun: boolean },
): Promise<FilingReport> {
  const report: FilingReport = { available: false, reason: null, filed: 0, existing: 0, rejected: [], suppressed: 0 };

  if (opts.dryRun) {
    report.reason = 'ledger filing disabled for this run (synthetic base, --no-ledger, or a CSP/block override is active)';
    return report;
  }

  const { mod, reason } = await loadLedger(repoRoot);
  if (mod === null) {
    report.reason = reason;
    return report;
  }
  report.available = true;

  // Count what was actually appended. `firstSeen === today` cannot tell a fresh filing
  // from a re-filing on the same day, and reporting 50 new findings twice would be the
  // sort of quietly-wrong number this whole build exists to eliminate.
  const ledgerSize = (): number | null => {
    if (typeof mod.readLedger !== 'function') return null;
    try {
      return mod.readLedger(opts.ledgerPath).length;
    } catch {
      return null;
    }
  };
  const before = ledgerSize();

  let attempts = 0;
  let accepted = 0;
  for (const finding of findings) {
    // Runaway guard, not a silencer: the suppressed count is printed and reported.
    if (attempts >= opts.maxNew) { report.suppressed = findings.length - attempts; break; }
    attempts++;
    try {
      mod.fileFinding({
        page: finding.page,
        issueClass: finding.issueClass,
        severity: finding.severity,
        summary: finding.summary,
        closurePredicate: finding.closurePredicate,
        ...(opts.ledgerPath === undefined ? {} : { ledgerPath: opts.ledgerPath }),
      });
      accepted++;
    } catch (error) {
      report.rejected.push({ issue: `${finding.page} ${finding.issueClass}`, error: (error as Error).message });
    }
  }

  const after = ledgerSize();
  if (before !== null && after !== null) {
    report.filed = after - before;
    report.existing = accepted - report.filed;
  } else {
    // The ledger would not tell us its size. Say so rather than invent a split.
    report.filed = accepted;
    report.reason = 'ledger size could not be read — "filed" counts accepted calls, which include idempotent re-files';
  }
  return report;
}

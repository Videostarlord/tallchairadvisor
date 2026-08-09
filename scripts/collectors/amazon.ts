/**
 * collectors/amazon.ts — affiliate data freshness.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THIS WAS "THE ONE COLLECTOR THAT CANNOT PULL". IT NO LONGER IS.
 *
 * Amazon Associates still exposes no public reporting API, and that framing
 * (PRD §4 non-goal, §10.2 "the one irreducible human dependency") was correct
 * until 2026-08-09. It is now obsolete: scripts/amazon-pull.ts replays a stored
 * session against Associates Central's own internal reporting endpoint and
 * refreshes data/affiliate/latest.json daily.
 *
 * So the question this collector answers has changed:
 *
 *   was:  "how old is the newest export Jackson dropped on disk?"
 *   now:  "did the automated pull run recently and succeed?"
 *         ...falling back to the old question when no snapshot exists yet.
 *
 * WHAT HAS NOT CHANGED: it reports NO revenue it did not read, never estimates
 * from GA4 affiliate_click events, and never turns "I could not see" into a
 * number. A stale snapshot is reported as stale — never as zero. The pull itself
 * obeys the same rule: on an expired session it files `amazon-session-expired`
 * and writes nothing, because a fabricated $0 could trip the kill-list gate on a
 * month that actually earned.
 *
 * TWO THRESHOLDS, FOR TWO DIFFERENT BOTTLENECKS:
 *   AUTOMATED_STALE_DAYS = 3 — a daily job; two silent failures should show.
 *   NAG_THRESHOLD_DAYS   = 7 — hand-dropped exports, where a human is the limit.
 *
 * Either way the unhealthy result becomes a ledger finding with a closure
 * predicate, so the gap has an age, recurs nightly, and closes on its own
 * evidence rather than living in Jackson's head.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { REPO_ROOT } from '../lib/read-validated.js';
import {
  guard,
  makeHealthy,
  makeUnhealthy,
  MS_PER_DAY,
  type CollectorResult,
} from './types.js';
import { readSnapshot, ageDaysFromSnapshot, LATEST_PATH } from '../lib/affiliate-store.js';

/** Roots scanned, in the order reported back to Jackson when nothing is found. */
const SEARCH_ROOTS = ['raw/affiliate', 'raw/amazon', 'data/affiliate', 'raw', 'data'];
const MAX_DEPTH = 3;
const NAG_THRESHOLD_DAYS = 7;

/** Filenames that plausibly are an Associates export. */
const NAME_PATTERN = /(amazon|associate|affiliate|earnings|tracking-id|linked-product|top-sellers)/i;
const EXTENSION_PATTERN = /\.(csv|tsv|xlsx?|json|md)$/i;

/**
 * Directories that must never count as an affiliate export.
 *
 * This exists because the first live run found `data/collectors/amazon.json` —
 * THIS COLLECTOR'S OWN OUTPUT — matched `amazon` + `.json` and became "the
 * newest export, 0 days old". A staleness nag that resets itself by running is
 * worse than no nag at all: it would have reported affiliate data permanently
 * fresh no matter how long Jackson went without exporting anything.
 */
const EXCLUDED_DIRS = ['data/collectors', 'data/probes', 'data/reddit', 'raw/reddit', 'node_modules'];

export interface AffiliateFile {
  path: string;
  date: string | null;
  dateSource: 'filename' | 'mtime';
  ageDays: number;
  sizeBytes: number;
  /** Data rows for CSV/TSV (header excluded). null for non-tabular files. */
  dataRows: number | null;
}

export interface AmazonCollected {
  /** True once the automated pull is the source. Was permanently false before 2026-08-09. */
  pullable: boolean;
  reason: string;
  searchedPaths: string[];
  nagThresholdDays: number;
  matchCount: number;
  newest: AffiliateFile | null;
  recent: AffiliateFile[];
  overdue: boolean;
  /** State of data/affiliate/latest.json. `ageDays: null` = present but unusable. */
  automatedPull: { present: boolean; ageDays: number | null; note: string };
}

/**
 * SLA for the automated pull, in days.
 *
 * 3, not 7. The daily workflow means two consecutive silent failures should be
 * visible — waiting a week to notice would waste most of the freshness the daily
 * cadence was added to buy. The 7-day NAG_THRESHOLD_DAYS still governs the
 * hand-dropped-export fallback below, where a human is the bottleneck.
 */
const AUTOMATED_STALE_DAYS = 3;

function emptyData(): AmazonCollected {
  return {
    pullable: false,
    reason: NO_API_NOTE,
    searchedPaths: SEARCH_ROOTS,
    nagThresholdDays: NAG_THRESHOLD_DAYS,
    matchCount: 0,
    newest: null,
    recent: [],
    overdue: true,
    automatedPull: { present: false, ageDays: null, note: 'no automated snapshot found' },
  };
}

// ─── Pure helpers (unit-tested) ───────────────────────────────────────────────

/** YYYY-MM-DD anywhere in the path — directory or filename. */
export function dateFromPath(path: string): string | null {
  const match = /(20\d{2})-(\d{2})-(\d{2})/.exec(path);
  if (match === null) return null;
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

/** Whole days old, floored at 0. Pure. */
export function daysOld(epochMs: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - epochMs) / MS_PER_DAY));
}

export function isOverdue(ageDays: number | null, threshold = NAG_THRESHOLD_DAYS): boolean {
  return ageDays === null ? true : ageDays > threshold;
}

/** Header-excluded row count for a CSV-ish file. null when not tabular. */
function countDataRows(absPath: string): number | null {
  if (!/\.(csv|tsv)$/i.test(absPath)) return null;
  const lines = readFileSync(absPath, 'utf-8').split('\n').filter((l) => l.trim() !== '');
  return Math.max(0, lines.length - 1);
}

// ─── Disk scan ────────────────────────────────────────────────────────────────

/** True when a repo-relative path sits inside an excluded directory. Pure. */
export function isExcluded(relPath: string): boolean {
  const normalized = relPath.split('\\').join('/');
  return EXCLUDED_DIRS.some((dir) => normalized === dir || normalized.startsWith(`${dir}/`));
}

function walk(absDir: string, depth: number, out: string[]): void {
  if (depth > MAX_DEPTH) return;
  if (isExcluded(relative(REPO_ROOT, absDir))) return;
  let entries: string[];
  try {
    entries = readdirSync(absDir);
  } catch {
    // Unreadable directory is a real, reportable condition — but not a reason
    // to abandon the scan. Recorded by its absence from `searchedPaths` output
    // below; deliberately not an empty catch (lint rule R3).
    return void console.error(`[amazon] could not read ${absDir} — skipping that subtree`);
  }
  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    const full = join(absDir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, depth + 1, out);
    } else if (
      EXTENSION_PATTERN.test(entry) &&
      NAME_PATTERN.test(full) &&
      !isExcluded(relative(REPO_ROOT, full))
    ) {
      out.push(full);
    }
  }
}

function scan(root: string): AffiliateFile[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const rel of SEARCH_ROOTS) {
    const abs = resolve(root, rel);
    if (!existsSync(abs)) continue;
    walk(abs, 0, found);
  }

  const files: AffiliateFile[] = [];
  for (const abs of found) {
    if (seen.has(abs)) continue;
    seen.add(abs);
    const rel = relative(root, abs);
    const stat = statSync(abs);
    const named = dateFromPath(rel);
    const epoch = named === null ? stat.mtimeMs : Date.parse(named);
    files.push({
      path: rel,
      date: named === null ? new Date(stat.mtimeMs).toISOString().slice(0, 10) : named,
      dateSource: named === null ? 'mtime' : 'filename',
      ageDays: daysOld(epoch),
      sizeBytes: stat.size,
      dataRows: countDataRows(abs),
    });
  }
  return files.sort((a, b) => a.ageDays - b.ageDays || b.sizeBytes - a.sizeBytes);
}

// ─── Collector ────────────────────────────────────────────────────────────────

const NO_API_NOTE =
  'Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2). This collector reports ' +
  'export staleness only; it never pulls, estimates, or infers affiliate revenue.';

export async function collect(): Promise<CollectorResult<AmazonCollected>> {
  return guard('amazon', async () => {
    // ── The automated pull, since 2026-08-09 ────────────────────────────────
    //
    // This collector's original premise — "there is nothing to pull" — is no
    // longer true. scripts/amazon-pull.ts refreshes data/affiliate/latest.json
    // daily from the reporting API, so the honest question changed from "how old
    // is the newest file Jackson dropped on disk" to "did the automated pull run
    // recently and succeed".
    //
    // FRESHNESS COMES FROM `fetchedAt` INSIDE THE FILE, NEVER FROM mtime.
    // latest.json carries no date in its name, so the disk scan below would date
    // it by mtime — and a CI checkout stamps every file it writes with "now".
    // The nag would read 0 days old on every run forever, including runs where
    // the pull failed and wrote nothing. That is the same self-resetting-nag bug
    // this collector already hit once, when its own output matched the scan.
    const snapshotRead = readSnapshot(REPO_ROOT);
    const snapshotAge = ageDaysFromSnapshot(snapshotRead);

    if (snapshotRead.kind === 'malformed') {
      return makeUnhealthy<AmazonCollected>(
        `${LATEST_PATH} exists but could not be read: ${snapshotRead.reason}. Affiliate revenue is UNKNOWN this run — ` +
          'that is not the same as zero, and nothing downstream may treat it as such.',
        { ...emptyData(), automatedPull: { present: true, ageDays: null, note: snapshotRead.reason } },
        0
      );
    }

    if (snapshotRead.kind === 'ok' && snapshotAge !== null) {
      const s = snapshotRead.snapshot;
      const data: AmazonCollected = {
        ...emptyData(),
        pullable: true,
        reason:
          'Pulled automatically from the Associates reporting API by scripts/amazon-pull.ts. ' +
          'Daily overview only — ASIN-level attribution still requires a manual export.',
        automatedPull: {
          present: true,
          ageDays: snapshotAge,
          note:
            `window ${s.window.start}..${s.window.end} (${s.window.kind}, mode=${s.mode}); ` +
            `${s.totals.clicks ?? 0} clicks, ${s.totals.total_ordered_items ?? 0} ordered, ` +
            `$${(s.totals.total_ordered_revenue ?? 0).toFixed(2)} ordered revenue, ` +
            `$${(s.totals.total_earnings ?? 0).toFixed(2)} SHIPPED earnings (pre-clawback, not net)`,
        },
        overdue: snapshotAge > AUTOMATED_STALE_DAYS,
      };

      if (data.overdue) {
        return makeUnhealthy<AmazonCollected>(
          `the automated affiliate pull last succeeded ${snapshotAge} days ago (${s.fetchedAt}), SLA is ` +
            `${AUTOMATED_STALE_DAYS} days. The daily workflow is failing or the stored Amazon session expired — ` +
            'check data/collectors/amazon-session.json and the "Amazon — Weekly Associates Pull" / nightly runs. ' +
            'No revenue figure is inferred here; stale data is reported as stale, never as zero.',
          data,
          s.rows.length
        );
      }
      return makeHealthy(data, s.rows.length);
    }

    // ── Fallback: no automated snapshot yet, so measure hand-dropped exports ──
    const files = scan(REPO_ROOT);
    const newest = files.length === 0 ? null : files[0];

    const data: AmazonCollected = {
      ...emptyData(),
      matchCount: files.length,
      newest,
      recent: files.slice(0, 8),
      overdue: isOverdue(newest === null ? null : newest.ageDays),
      automatedPull: {
        present: false,
        ageDays: null,
        note: snapshotRead.kind === 'absent'
          ? `${LATEST_PATH} does not exist yet — the automated pull has not run successfully`
          : 'automated snapshot unusable; measuring hand-dropped exports instead',
      },
    };

    if (newest === null) {
      return makeUnhealthy<AmazonCollected>(
        `no Amazon Associates export found on disk. Looked under ${SEARCH_ROOTS.join(', ')} (depth ${MAX_DEPTH}) for ` +
          `files matching ${NAME_PATTERN.source} with a ${EXTENSION_PATTERN.source} extension. ` +
          `Download the CSV bundle from Amazon Associates → Reports → Download Report and drop it in ` +
          `raw/affiliate/YYYY-MM-DD-amazon-csv/. ${NO_API_NOTE}`,
        data,
        0
      );
    }

    if (data.overdue) {
      return makeUnhealthy<AmazonCollected>(
        `affiliate data is ${newest.ageDays} days stale — newest export is ${newest.path} ` +
          `(${newest.date}, dated by ${newest.dateSource}), SLA is ${NAG_THRESHOLD_DAYS} days. ` +
          `Export a fresh bundle from Amazon Associates → Reports → Download Report into ` +
          `raw/affiliate/${new Date().toISOString().slice(0, 10)}-amazon-csv/. ${NO_API_NOTE}`,
        data,
        files.length
      );
    }

    return makeHealthy(data, files.length);
  });
}

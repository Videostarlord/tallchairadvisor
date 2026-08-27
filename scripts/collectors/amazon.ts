/**
 * collectors/amazon.ts — affiliate export freshness.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THIS IS THE ONE COLLECTOR THAT CANNOT PULL. IT IS AGAIN, AND PERMANENTLY.
 *
 * Amazon Associates exposes no public reporting API for individual associates
 * (PRD §4 non-goal, §10.2 "the one irreducible human dependency").
 *
 * Between 2026-08-09 and 2026-08-26 that was worked around: scripts/amazon-pull.ts
 * replayed a Playwright `storageState` session against Associates Central's own
 * internal reporting endpoint. **That automation was RETIRED on 2026-08-26 at
 * Jackson's direction and is not coming back.** The session expired after ~11
 * days, re-capturing it is a manual login to a live financial account that only
 * a human may ever perform, and a "no-manual-work" pipeline whose keystone is a
 * recurring manual credential capture was not automation — it was a fortnightly
 * chore wearing a workflow's clothes.
 *
 * DO NOT REBUILD IT. The failure was structural, not a bug: any session-replay
 * scheme against Amazon has the same expiry treadmill underneath it. If this
 * collector's nag becomes annoying, the correct fix is a longer threshold or a
 * different affiliate program — never a new scraper.
 *
 * So the question this collector answers is the original one, restored:
 *
 *   "how old is the newest export Jackson dropped on disk?"
 *
 * WHAT HAS NEVER CHANGED: it reports NO revenue it did not read, never estimates
 * from GA4 affiliate_click events, and never turns "I could not see" into a
 * number. A stale export is reported as stale — never as zero. A fabricated $0
 * could trip the kill-list gate on a month that actually earned.
 *
 * The unhealthy result becomes a ledger finding with a closure predicate, so the
 * gap has an age, recurs nightly, and closes on its own evidence rather than
 * living in Jackson's head.
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

/** Roots scanned, in the order reported back to Jackson when nothing is found. */
const SEARCH_ROOTS = ['raw/affiliate', 'raw/amazon', 'raw', 'data'];
const MAX_DEPTH = 3;
const NAG_THRESHOLD_DAYS = 7;

/** Filenames that plausibly are an Associates export. */
const NAME_PATTERN = /(amazon|associate|affiliate|earnings|tracking-id|linked-product|top-sellers)/i;
const EXTENSION_PATTERN = /\.(csv|tsv|xlsx?|json|md)$/i;

/**
 * Directories that must never count as an affiliate export.
 *
 * `data/collectors` is here because the first live run found
 * `data/collectors/amazon.json` — THIS COLLECTOR'S OWN OUTPUT — matched `amazon`
 * + `.json` and became "the newest export, 0 days old". A staleness nag that
 * resets itself by running is worse than no nag at all.
 *
 * `data/affiliate` is here for the SAME BUG in a second disguise, and it matters
 * more now than it did before. `data/affiliate/latest.json` matches `affiliate`
 * + `.json`, carries no date in its filename, and would therefore be dated by
 * mtime — which a CI checkout stamps with "now" on every single run. The nag
 * would read 0 days old forever. That file is also FROZEN at 2026-08-09 (see
 * data/affiliate/README.md), so dating it by mtime would be doubly wrong: a file
 * that has not been updated in months reporting as fresh every night.
 */
const EXCLUDED_DIRS = [
  'data/collectors',
  'data/affiliate',
  'data/probes',
  'data/reddit',
  'raw/reddit',
  'node_modules',
];

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
  /**
   * Always false. Kept in the shape rather than deleted so the field reads as a
   * settled answer ("no, and here is why") instead of an omission the next agent
   * decides to fill in.
   */
  pullable: false;
  reason: string;
  searchedPaths: string[];
  nagThresholdDays: number;
  matchCount: number;
  newest: AffiliateFile | null;
  recent: AffiliateFile[];
  overdue: boolean;
}

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
  'Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 ' +
  'session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is ' +
  'hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers ' +
  'affiliate revenue.';

/** The instructions repeated in every unhealthy message, so the fix travels with the nag. */
const HOW_TO_EXPORT =
  'Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). ' +
  'Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not ' +
  'contain it, and a window that is guessed rather than recorded has already caused one export in this archive ' +
  'to be misread as a second positive month.';

export async function collect(): Promise<CollectorResult<AmazonCollected>> {
  return guard('amazon', async () => {
    const files = scan(REPO_ROOT);
    const newest = files.length === 0 ? null : files[0];

    const data: AmazonCollected = {
      ...emptyData(),
      matchCount: files.length,
      newest,
      recent: files.slice(0, 8),
      overdue: isOverdue(newest === null ? null : newest.ageDays),
    };

    if (newest === null) {
      return makeUnhealthy<AmazonCollected>(
        `no Amazon Associates export found on disk. Looked under ${SEARCH_ROOTS.join(', ')} (depth ${MAX_DEPTH}) for ` +
          `files matching ${NAME_PATTERN.source} with a ${EXTENSION_PATTERN.source} extension. ${HOW_TO_EXPORT} ` +
          NO_API_NOTE,
        data,
        0
      );
    }

    if (data.overdue) {
      return makeUnhealthy<AmazonCollected>(
        `affiliate data is ${newest.ageDays} days stale — newest export is ${newest.path} ` +
          `(${newest.date}, dated by ${newest.dateSource}), SLA is ${NAG_THRESHOLD_DAYS} days. ${HOW_TO_EXPORT} ` +
          NO_API_NOTE,
        data,
        files.length
      );
    }

    return makeHealthy(data, files.length);
  });
}

/**
 * collectors/amazon.ts — affiliate export staleness. THE ONE COLLECTOR THAT
 * CANNOT PULL (PRD §4 non-goal, §10.2 "the one irreducible human dependency").
 *
 * Amazon Associates has no reporting API for individual associates. There is
 * nothing to authenticate against and nothing to fetch. Jackson downloads the
 * CSV bundle by hand and drops it in raw/affiliate/.
 *
 * So this collector's entire job is to answer one question honestly:
 *   "How old is the newest affiliate export on disk, and is that too old?"
 *
 * It reports file paths, dates, sizes and row counts — facts that exist on
 * disk. It reports NO revenue, NO click counts, NO conversion rates, and it
 * never estimates them from GA4 affiliate_click events. A plausible revenue
 * number that nobody exported is worse than no number, because it would make
 * the monetization picture look measured when it is guessed.
 *
 * NAG THRESHOLD: 7 days. Past that this collector goes `healthy: false`, which
 * makes it a ledger finding with a closure predicate — meaning the nag has an
 * age, appears every night until a fresh export lands, and closes by itself
 * when one does. That is the intended behavior: the human dependency is
 * tracked like any other open item rather than living in Jackson's head.
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
  pullable: false;
  reason: string;
  searchedPaths: string[];
  nagThresholdDays: number;
  matchCount: number;
  newest: AffiliateFile | null;
  recent: AffiliateFile[];
  overdue: boolean;
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
    const files = scan(REPO_ROOT);
    const newest = files.length === 0 ? null : files[0];

    const data: AmazonCollected = {
      pullable: false,
      reason: NO_API_NOTE,
      searchedPaths: SEARCH_ROOTS,
      nagThresholdDays: NAG_THRESHOLD_DAYS,
      matchCount: files.length,
      newest,
      recent: files.slice(0, 8),
      overdue: isOverdue(newest === null ? null : newest.ageDays),
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

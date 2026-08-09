/**
 * lib/affiliate-store.ts — the live affiliate layer.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THERE ARE TWO LAYERS AND NOT ONE
 *
 * CLAUDE.md splits `data/` from `raw/`: `data/` is live state agents read,
 * `raw/` is the immutable dated archive. The affiliate pull needs both, for
 * different reasons and on different clocks.
 *
 *   data/affiliate/latest.json   overwritten DAILY. What the nightly reads.
 *   data/affiliate/history.jsonl one appended line per pull. Trend over time.
 *   raw/affiliate/<date>-...     written WEEKLY. The archive snapshot.
 *
 * Running the weekly snapshot daily instead would put ~30 near-identical dated
 * reports a month into `raw/`, which is an archive of decisions and evidence,
 * not a log. The signal would be buried in its own copies.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * FRESHNESS IS A FIELD, NOT A FILE TIMESTAMP
 *
 * `fetchedAt` is written INSIDE the file, and every staleness check must read it
 * from there rather than stat'ing the file.
 *
 * This is not a style preference. `latest.json` carries no date in its name, so
 * a mtime-based check would fall back to the filesystem — and a CI checkout sets
 * mtime to "now" on every file it writes. The staleness nag would report the
 * data perfectly fresh on every run, forever, including the runs where the pull
 * failed and wrote nothing. collectors/amazon.ts already documents this exact
 * class of bug: its first live run found the collector's OWN output and called
 * it "the newest export, 0 days old". A nag that resets itself by running is
 * worse than no nag at all.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { z } from 'zod';

export const LATEST_PATH = 'data/affiliate/latest.json';
export const HISTORY_PATH = 'data/affiliate/history.jsonl';

/** One day's row, exactly as the reporting API returns it (all values strings). */
export const dayRowSchema = z.object({
  day: z.string(),
  clicks: z.string(),
  total_ordered_items: z.string(),
  total_ordered_revenue: z.string(),
  shipped_items: z.string(),
  returned_items: z.string(),
  total_revenue: z.string(),
  total_earnings: z.string(),
}).passthrough();

export const affiliateSnapshotSchema = z.object({
  /** ISO timestamp of the pull. THE authoritative freshness signal. */
  fetchedAt: z.string().min(1),
  window: z.object({
    start: z.string(),
    end: z.string(),
    kind: z.string(),
  }),
  /**
   * Summed over the window. `total_earnings` is SHIPPED earnings, not net —
   * the returns clawback is not in the API's column set. Named plainly so a
   * consumer cannot mistake it for take-home.
   */
  totals: z.record(z.number()),
  rows: z.array(dayRowSchema),
  /** Which run wrote this: 'daily' or 'weekly'. */
  mode: z.enum(['daily', 'weekly']),
});

export type AffiliateSnapshot = z.infer<typeof affiliateSnapshotSchema>;

/** One compact line per pull. Append-only; union-merged in .gitattributes. */
export const historyEntrySchema = z.object({
  fetchedAt: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  clicks: z.number(),
  orderedItems: z.number(),
  orderedRevenue: z.number(),
  shippedEarnings: z.number(),
  mode: z.enum(['daily', 'weekly']),
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export function writeSnapshot(repoRoot: string, snapshot: AffiliateSnapshot): void {
  const parsed = affiliateSnapshotSchema.parse(snapshot);
  const path = resolve(repoRoot, LATEST_PATH);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(parsed, null, 2)}\n`);

  const entry: HistoryEntry = {
    fetchedAt: parsed.fetchedAt,
    windowStart: parsed.window.start,
    windowEnd: parsed.window.end,
    clicks: parsed.totals.clicks ?? 0,
    orderedItems: parsed.totals.total_ordered_items ?? 0,
    orderedRevenue: parsed.totals.total_ordered_revenue ?? 0,
    shippedEarnings: parsed.totals.total_earnings ?? 0,
    mode: parsed.mode,
  };
  appendFileSync(resolve(repoRoot, HISTORY_PATH), `${JSON.stringify(historyEntrySchema.parse(entry))}\n`);
}

/** `'absent'` and `'malformed'` are distinct on purpose — see readFreshness. */
export type SnapshotRead =
  | { kind: 'ok'; snapshot: AffiliateSnapshot }
  | { kind: 'absent' }
  | { kind: 'malformed'; reason: string };

export function readSnapshot(repoRoot: string): SnapshotRead {
  const path = resolve(repoRoot, LATEST_PATH);
  if (!existsSync(path)) return { kind: 'absent' };
  let raw: unknown;
  try {
    // lint-architecture-allow R4 -- validated by affiliateSnapshotSchema immediately below; a parse failure is reported as 'malformed', never silently treated as absent
    raw = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (error) {
    return { kind: 'malformed', reason: `not valid JSON — ${(error as Error).message}` };
  }
  const parsed = affiliateSnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    return { kind: 'malformed', reason: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  return { kind: 'ok', snapshot: parsed.data };
}

/**
 * Whole days since the last successful pull, derived from `fetchedAt`.
 *
 * `null` means the age could not be established — no file, unparseable file, or
 * an unreadable timestamp. Callers must treat null as STALE, never as fresh:
 * "we don't know when this was pulled" and "it was pulled today" are opposite
 * facts and only one of them is safe to act on.
 */
export function ageDaysFromSnapshot(read: SnapshotRead, now: Date = new Date()): number | null {
  if (read.kind !== 'ok') return null;
  const t = Date.parse(read.snapshot.fetchedAt);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / 86_400_000));
}

/**
 * lib/edit-log.ts — what the pipeline actually changed, and when.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THIS REPLACES `git log`
 *
 * Cooldown used to ask git: "was this file touched in 14 days?" Git answers a
 * question nobody asked. It cannot distinguish
 *
 *     "the strategist rewrote this page's argument"          <- cooldown's subject
 *     "a sweep added one inbound link to 8 orphaned pages"   <- not churn
 *     "17 files had a spec claim qualified"                  <- not churn
 *     "prettier reflowed the frontmatter"                    <- not churn
 *
 * and counted all four the same. Because the pipeline's own bulk fixes land as
 * commits, every sweep re-armed the lockout on everything it touched: 49 of 54
 * pages were on cooldown on 2026-08-09, almost entirely because of the system's
 * own work. The gate tightened in proportion to how much the system did.
 *
 * The fix is not a smarter git heuristic — commit messages are prose and would
 * rot the same way the keyword lists did. It is to stop inferring intent from
 * version control and have the agents record what they did, at the moment they
 * did it, in the vocabulary the gate actually reasons about.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * FAILURE POSTURE
 *
 * An unreadable or absent log yields `unknown`, never a number. Callers treat
 * `unknown` as "cannot determine -> do not permit a substantive revision", which
 * fails closed in the direction that cannot cause damage: deterministic defects
 * are exempt before the log is ever consulted, so a corrupt log never blocks a
 * broken canonical or a wrong spec — it only defers discretionary rewrites.
 *
 * This mirrors `unevaluable` in the predicate layer and `healthy:false` in the
 * probe: silence is not evidence of absence, and a gate that cannot see must not
 * approve.
 */

import { appendFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';
import type { EditClass } from './cooldown.js';

export const EDIT_LOG_PATH = 'data/edit-log.jsonl';

export const editEntrySchema = z.object({
  /** Repo-relative page path, e.g. 'src/pages/review/gesture.astro'. */
  page: z.string().min(1),
  /** Which gate this edit answers to. Only 'substantive' arms a cooldown. */
  editClass: z.enum(['deterministic', 'substantive']),
  /** ISO date (YYYY-MM-DD) the edit was applied. */
  appliedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'appliedDate must be YYYY-MM-DD'),
  /** Which agent applied it — 'execute-fixes', 'execute-content', 'seed', or a human. */
  agent: z.string().min(1),
  /** One line of what changed. Human-facing; never parsed. */
  description: z.string(),
});

export type EditEntry = z.infer<typeof editEntrySchema>;

/**
 * Append one edit. Called at the moment of the write, by the agent doing it —
 * not reconstructed later, which is the property that makes it trustworthy.
 */
export function appendEdit(repoRoot: string, entry: EditEntry): void {
  const parsed = editEntrySchema.parse(entry);
  const dir = resolve(repoRoot, 'data');
  mkdirSync(dir, { recursive: true });
  appendFileSync(resolve(repoRoot, EDIT_LOG_PATH), `${JSON.stringify(parsed)}\n`);
}

/**
 * Every well-formed entry in the log.
 *
 * Malformed lines are skipped rather than thrown, and counted in `malformed`.
 * A single bad line must not blind the whole gate — but the count is returned
 * so a caller can say so out loud instead of quietly reading a truncated log.
 */
export function readEditLog(repoRoot: string): { entries: EditEntry[]; malformed: number } {
  const path = resolve(repoRoot, EDIT_LOG_PATH);
  if (!existsSync(path)) return { entries: [], malformed: 0 };

  let text: string;
  try {
    text = readFileSync(path, 'utf-8');
  } catch {
    // Unreadable is not empty. Signal it as wholly malformed so callers fail closed.
    return { entries: [], malformed: -1 };
  }

  const entries: EditEntry[] = [];
  let malformed = 0;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    let candidate: unknown;
    try {
      // lint-architecture-allow R4 -- validated by editEntrySchema on the next line; a throw here is counted as malformed, never silently accepted
      candidate = JSON.parse(trimmed);
    } catch {
      malformed += 1;
      continue;
    }
    const result = editEntrySchema.safeParse(candidate);
    if (result.success) entries.push(result.data);
    else malformed += 1;
  }
  return { entries, malformed };
}

/** `number` = days since the last substantive edit. `'unknown'` = the log could not be read. */
export type DaysSince = number | 'unknown';

function daysBetween(isoDate: string, now: Date): number {
  const then = Date.parse(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - then) / 86_400_000);
}

/**
 * Days since this page last had a SUBSTANTIVE revision.
 *
 * Returns `Infinity` when the page has no substantive entry — the honest answer
 * to "how long since we rewrote this", which is "we never have". Deterministic
 * entries are recorded for audit but deliberately never counted here: fixing a
 * canonical does not start a content-churn clock.
 */
export function daysSinceSubstantiveEdit(
  repoRoot: string,
  page: string,
  now: Date = new Date(),
): DaysSince {
  const { entries, malformed } = readEditLog(repoRoot);
  if (malformed === -1) return 'unknown';

  const dates = entries
    .filter((e) => e.page === page && e.editClass === 'substantive')
    .map((e) => daysBetween(e.appliedDate, now));

  if (dates.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...dates);
}

/**
 * Every page with a substantive edit inside `withinDays`, as file paths.
 *
 * The direct replacement for `getPagesOnCooldown()`'s `git log` call. Returns
 * `'unknown'` rather than an empty set when the log is unreadable, so the caller
 * cannot mistake "nothing is on cooldown" for "I could not tell".
 */
export function pagesWithRecentSubstantiveEdit(
  repoRoot: string,
  withinDays: number,
  now: Date = new Date(),
): Set<string> | 'unknown' {
  const { entries, malformed } = readEditLog(repoRoot);
  if (malformed === -1) return 'unknown';

  const recent = new Set<string>();
  for (const e of entries) {
    if (e.editClass !== 'substantive') continue;
    if (daysBetween(e.appliedDate, now) < withinDays) recent.add(e.page);
  }
  return recent;
}

/** Convenience for call sites that already classified the edit. */
export function recordEdit(
  repoRoot: string,
  page: string,
  editClass: EditClass,
  agent: string,
  description: string,
  appliedDate: string = new Date().toISOString().split('T')[0],
): void {
  appendEdit(repoRoot, { page, editClass, appliedDate, agent, description });
}

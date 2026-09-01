/**
 * lib/retired-agents.ts — which acting agents are switched off, and why that
 * must be recorded in code rather than only in a commented-out cron.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE BUG THIS PREVENTS
 *
 * On 2026-08-29 the schedules for Wednesday (strategy), Thursday (execute-fixes)
 * and Friday (execute-content) were disabled: in six months they had changed
 * `src/` six times, while all 19 pages and every revenue-relevant change came
 * out of human-directed sessions.
 *
 * Disabling the cron alone would have made things WORSE, not cheaper. The
 * nightly loads `reports/fixes-log.md` and `reports/content-log.md` as
 * contracted sources with a 192-hour freshness SLA. With the agents off those
 * files can never be refreshed, so every single night the report would have
 * declared two contract failures and lowered its own coverage percentage —
 * an alarm firing because nothing happened, which is indistinguishable from one
 * firing because something broke.
 *
 * That is this repo's most expensive recurring shape: a check that still runs
 * after the thing it checks has changed. The Amazon collector hit it, the
 * visual baselines hit it, the closure predicates hit it.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE PAIRING RULE
 *
 * A retired agent is retired in TWO places, and they must agree:
 *   1. the `schedule:` block in .github/workflows/<day>.yml, commented out
 *   2. an entry here
 *
 * Re-enabling means restoring the cron AND deleting the entry. If only the cron
 * comes back, the agent runs and its output is ignored. If only the entry goes,
 * the alarms return for an agent that is still off. Both files say so in their
 * own text so neither can be changed alone by accident.
 *
 * NOT DELETION. These agents work; they are simply not what grows this site
 * today. The operating model is: the pipeline observes, Jackson decides.
 */

/** Sources whose staleness is EXPECTED because their writer is switched off. */
export const RETIRED_AGENT_SOURCES: Readonly<Record<string, string>> = {
  'fixes-log': 'Thursday execute-fixes — schedule retired 2026-08-29 (workflow_dispatch only)',
  'content-log': 'Friday execute-content — schedule retired 2026-08-29 (workflow_dispatch only)',
};

/**
 * True when a source's writer is retired, so its age is not evidence of failure.
 *
 * Deliberately keyed on the SOURCE name the nightly already uses rather than on
 * a file path: paths move, and a rename that silently un-retires an agent would
 * bring the false alarms back without anyone editing this file.
 */
export function isRetiredSource(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(RETIRED_AGENT_SOURCES, name);
}

/** Why it is retired — surfaced in the report so the silence is explained, not hidden. */
export function retirementReason(name: string): string | null {
  return RETIRED_AGENT_SOURCES[name] ?? null;
}

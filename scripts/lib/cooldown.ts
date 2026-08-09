/**
 * lib/cooldown.ts — the single answer to "may this page be edited today".
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS (A1)
 *
 * The cooldown gate was the reason the pipeline found problems competently and
 * shipped none: a full-week stress test ran 29 findings -> 6 planned -> 0 applied.
 * Three separate defects combined to produce that number.
 *
 * 1. IT MEASURED THE WRONG THING. Cooldown was `git log --since=14d -- <file>`:
 *    ANY commit touching the file. But most commits touching a page are the
 *    pipeline's own mechanical sweeps — injecting an inbound link into 8 orphans
 *    (66bc44c), rolling a GEO capsule across 45 pages (a2f809f), qualifying a
 *    spec claim on 17 (fe06db6). Each sweep re-armed a 14-day lockout on every
 *    page it touched, so the system's own work blocked its next work. On
 *    2026-08-09 that left 49 of 54 pages locked. The gate got *tighter* the more
 *    the system did, which is precisely backwards.
 *
 * 2. TWO CLASSIFIERS THAT DISAGREED. strategy.ts exempted 11 keywords at plan
 *    time; execute-fixes.ts exempted 8 different ones at apply time. A task could
 *    survive planning and die on application for a reason the planner could not
 *    see. Both lists now live here, once.
 *
 * 3. NEITHER LIST COVERED THE DEFECTS THE SYSTEM ACTUALLY FINDS. The 2026-08-06
 *    plan dropped its own spec correction to cooldown — the same plan whose prose
 *    said that fix "bypasses the cooldown gate on technical grounds". The phrase
 *    "Correct the spec contradiction" matched no keyword in either list.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE DISTINCTION THIS FILE ENCODES
 *
 * Cooldown exists for two real reasons, and neither applies to every edit:
 *   - repeatedly rewriting a page's substance looks like thrash to Google; and
 *   - two content changes inside one measurement window make attribution
 *     impossible — you cannot tell which one moved the metric.
 *
 * Both are arguments about SUBSTANTIVE revision: adding a section, changing the
 * angle, rewriting body copy. Neither is an argument for leaving a 73-character
 * title, a broken canonical, or a factually wrong seat-height spec in place for
 * two more weeks. Those are DETERMINISTIC defects: there is exactly one correct
 * value, the current one is provably not it, and the fix is verifiable by
 * machine. Waiting does not make them righter — it just ships the error longer.
 *
 * So: deterministic defects are exempt from cooldown. Substantive revisions are
 * not. That is the whole rule.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not exempt everything. "Add a 3-tier Fit Verdict callout block" and
 * "Expand the Compare With section" stay subject to cooldown, because they are
 * exactly the churn the gate was built to govern. A fix that unblocked those too
 * would not be a fix; it would be a removal.
 */

/**
 * A page edit is one of two kinds. The name is the argument: `deterministic`
 * means a machine can state the correct value and check it afterwards.
 */
export type EditClass = 'deterministic' | 'substantive';

/**
 * Deterministic-defect vocabulary, grouped by the defect each line describes.
 *
 * These are matched against model-generated prose, which is inherently fuzzy —
 * so the patterns are deliberately generous within each group, and the groups
 * are deliberately narrow. Adding a phrase here is a claim that the edit it
 * describes has ONE correct answer. If it has a range of defensible answers, it
 * is substantive and belongs nowhere near this list.
 */
const DETERMINISTIC_PATTERNS: readonly RegExp[] = [
  // ── Head-tag length and validity ────────────────────────────────────────────
  // A title is 50-60 chars or it is not. Nothing about waiting improves it.
  /\btitle\s*(tag|length)\b/i,
  /\bshorten\s+(the\s+)?title\b/i,
  /\b(meta|meta[- ]description)\b.*\b(length|too long|too short|shorten|truncat)/i,
  /\bshorten\s+(the\s+)?meta\b/i,
  /\b\d{2,3}\s*chars?\b.*\b(to|->|→)\b/i,          // "67 chars to <=60"

  // ── Structured data ─────────────────────────────────────────────────────────
  /\bschema\b/i,
  /\bjson-?ld\b/i,
  /\bstructured data\b/i,
  /\bparse error\b/i,
  /\bfaqpage\b/i,

  // ── Crawl/index directives ──────────────────────────────────────────────────
  /\bcanonical\b/i,
  /\bnoindex\b/i,
  /\brobots\b/i,
  /\bredirect\b/i,
  /\b404\b/i,
  /\bbroken link\b/i,
  /\bsitemap\b/i,

  // ── Affiliate correctness ───────────────────────────────────────────────────
  // A missing or dead tag earns nothing. There is one right string.
  /\baffiliate\b/i,
  /\basin\b/i,
  /\btag=tallchairadvi-20\b/i,
  /\bdead link\b/i,

  // ── Factual/spec correctness ────────────────────────────────────────────────
  // The class the old lists missed entirely, and the one with the clearest
  // single correct answer: a chair's seat height is a number the manufacturer
  // publishes. 2026-08-06 dropped exactly this to cooldown.
  /\bspec (contradiction|error|correction|conflict|mismatch)\b/i,
  /\b(correct|fix|wrong|incorrect|inaccurate|contradict)\w*\b.{0,40}\bspec\b/i,
  /\bfactual (error|correction|inaccuracy)\b/i,
  /\b(seat height|seat depth|weight limit|dimension)s?\b.{0,40}\b(wrong|incorrect|correct|contradict|mismatch)/i,
  /\bunqualified\b.{0,30}\bclaim\b/i,

  // ── Voice / compliance ──────────────────────────────────────────────────────
  // The testing-voice constraint is a hard rule, not a stylistic preference:
  // first-person testing voice on a chair Jackson never sat in is a false claim.
  /\bvoice violation\b/i,
  /\bfirst-person\b.{0,40}\b(violation|incorrect|untested)\b/i,

  // ── Accessibility / structural link defects ─────────────────────────────────
  /\balt text\b/i,
  /\b(inbound|internal) link\b/i,
  /\borphan(ed)?\b/i,
];

/**
 * Classify a task line, plan line, or fix description.
 *
 * Takes free prose because that is what both call sites have: the strategist
 * emits markdown task lines and execute-fixes carries a `description` string.
 * Passing the WHOLE line matters — the defect noun and its qualifier are often
 * in different clauses ("Correct the spec contradiction ... seat height").
 */
export function classifyEdit(text: string): EditClass {
  return DETERMINISTIC_PATTERNS.some((p) => p.test(text)) ? 'deterministic' : 'substantive';
}

/**
 * The gate both call sites ask. True = this edit may proceed regardless of when
 * the page was last touched.
 */
export function isCooldownExempt(text: string): boolean {
  return classifyEdit(text) === 'deterministic';
}

/** Days a substantive revision must wait. Deterministic defects wait zero. */
export const COOLDOWN_DAYS = 14;

/**
 * Critical pages — high impressions, top-10 position, ~no clicks — get a shorter
 * window, because the cost of leaving them broken is measured in clicks per day.
 * Preserved from execute-fixes.ts, which is where it was already correct.
 */
export const COOLDOWN_DAYS_CRITICAL = 7;

/**
 * The single cooldown decision, so no caller re-derives it.
 *
 * `daysSince` is Infinity when the page has no recorded substantive edit — which
 * is the common case on a fresh edit log and correctly means "not on cooldown".
 */
export function cooldownVerdict(opts: {
  text: string;
  daysSince: number;
  critical?: boolean;
  /** Decay-flagged pages bypass cooldown (CONT-02) — losing position outranks churn risk. */
  decayExempt?: boolean;
}): { blocked: boolean; reason: string | null } {
  const { text, daysSince, critical = false, decayExempt = false } = opts;

  if (isCooldownExempt(text)) return { blocked: false, reason: null };
  if (decayExempt) return { blocked: false, reason: null };

  const required = critical ? COOLDOWN_DAYS_CRITICAL : COOLDOWN_DAYS;
  if (daysSince >= required) return { blocked: false, reason: null };

  return {
    blocked: true,
    reason: critical
      ? `substantively edited ${daysSince}d ago; CRITICAL pages require ${required}d between substantive revisions`
      : `substantively edited ${daysSince}d ago; substantive revisions require ${required}d`,
  };
}

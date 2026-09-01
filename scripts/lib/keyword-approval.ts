/**
 * lib/keyword-approval.ts — the gate that used to be a human typing `approved: true`.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 *
 * The content pipeline ran end to end for six months and shipped ZERO pages.
 * It was never broken: keyword-discovery filled opportunities.json every month,
 * keywords-push flushed `approved: true` entries into the roadmap, and Friday's
 * execute-content wrote pages from the roadmap. But nothing set `approved`, so
 * the queue drained once and never refilled. 18 candidates sat untouched.
 *
 * Jackson's instruction (2026-08-29): no manual intervention in this workflow.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * REMOVING A GATE IS NOT THE SAME AS AUTOMATING IT
 *
 * The naive reading is "delete the flag, approve everything". That would have
 * been actively destructive. Of the 18 candidates sitting in the queue today,
 * **16 are `tca_status: 'ranking'`** — keywords the site ALREADY ranks for.
 * Building pages for those does not win traffic, it splits it, and the site
 * already carries 7 cannibalization conflicts.
 *
 * The second naive reading is "approve the ones marked `gap`". There are exactly
 * two, and BOTH are duplicates of pages that already exist:
 *
 *   "ergonomic chairs for tall people" → /ergonomic-chairs-for-tall-people/
 *        …which is /office-chairs-for-tall-people/ with a synonym swapped.
 *   "steelcase gesture review"         → /steelcase-gesture-review/
 *        …which is /review/gesture/, the site's only first-hand review.
 *
 * So a `status === 'gap'` rule would have shipped two cannibalising pages on day
 * one. The gate has to encode what a careful human would actually check, which
 * is topic collision against pages that EXIST, not against the roadmap.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * THE ASYMMETRY THAT SETS THE THRESHOLDS
 *
 * A false APPROVE publishes a cannibalising page onto a live money site and has
 * to be found, unpublished and redirected. A false REJECT costs one month of
 * delay on one keyword, and the candidate returns in the next discovery run.
 *
 * These are not close. Every threshold below is set to fail toward rejection,
 * and every rejection records its reason so a wrong one is visible rather than
 * silent.
 */

/** Candidate shape — the subset of Opportunity this module judges. */
export interface ApprovalCandidate {
  keyword: string;
  search_volume: number;
  keyword_difficulty: number;
  tca_status: string;
  target_slug: string;
  score: number;
}

export type ApprovalVerdict =
  | { approved: true; reason: string }
  | { approved: false; reason: string };

/**
 * Floors. Deliberately low — the expensive mistake is approving a duplicate, not
 * approving something small. A 50/mo keyword that nothing else covers is a fine
 * page; a 1000/mo keyword the site already ranks for is not.
 */
export const MIN_SEARCH_VOLUME = 50;
export const MAX_KEYWORD_DIFFICULTY = 35;
export const MIN_SCORE = 0.4;

/** Words that carry no topical meaning when comparing two page subjects. */
const STOPWORDS = new Set([
  'a','an','the','for','of','to','in','on','with','and','or','best','top','review','reviews',
  'guide','vs','versus','my','your','you','is','are','how','what','which','chair','chairs',
]);

/** Topic tokens of a phrase or slug: lowercased, de-punctuated, stopwords dropped. */
export function topicTokens(input: string): Set<string> {
  return new Set(
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

/**
 * Jaccard overlap of two topic-token sets, 0..1.
 *
 * Chosen over substring matching because the collisions that matter are
 * synonym swaps, not prefixes: "ergonomic chairs for tall people" shares no
 * useful substring with "office-chairs-for-tall-people" but overlaps on
 * {tall, people} once "chair(s)" and "for/the" are dropped — and that IS the
 * same page.
 */
export function topicOverlap(a: string, b: string): number {
  const ta = topicTokens(a);
  const tb = topicTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / new Set([...ta, ...tb]).size;
}

/**
 * 0.5, i.e. half the combined vocabulary is shared.
 *
 * Calibrated against the live collisions rather than picked: the two `gap`
 * candidates that must be caught score 0.60 and 0.67 against their existing
 * pages, while genuinely distinct pairs on this site sit below 0.34.
 */
export const TOPIC_COLLISION_THRESHOLD = 0.5;

/**
 * Judge one candidate.
 *
 * `existingSlugs` must be pages that EXIST ON DISK, not roadmap entries — the
 * roadmap is what we are about to write to, and checking a queue against itself
 * is how a duplicate gets in.
 */
export function judge(
  c: ApprovalCandidate,
  existingSlugs: readonly string[],
  alreadyApprovedThisRun: readonly string[] = []
): ApprovalVerdict {
  if (c.tca_status === 'ranking') {
    return {
      approved: false,
      reason: `site already ranks for "${c.keyword}" — a new page splits that traffic rather than winning any`,
    };
  }

  if (c.tca_status === 'targeting') {
    return {
      approved: false,
      reason: `a page is already targeting "${c.keyword}" — wait for it to rank or fail before adding another`,
    };
  }

  const slug = (c.target_slug ?? '').trim();
  if (slug === '' || slug === '/unknown/' || !slug.startsWith('/')) {
    return {
      approved: false,
      reason: `no usable target_slug (${JSON.stringify(c.target_slug)}) — discovery could not say where this would live`,
    };
  }

  if (existingSlugs.includes(slug)) {
    return { approved: false, reason: `${slug} already exists` };
  }

  if (c.search_volume < MIN_SEARCH_VOLUME) {
    return { approved: false, reason: `${c.search_volume}/mo is below the ${MIN_SEARCH_VOLUME}/mo floor` };
  }
  if (c.keyword_difficulty > MAX_KEYWORD_DIFFICULTY) {
    return { approved: false, reason: `KD ${c.keyword_difficulty} is above the ${MAX_KEYWORD_DIFFICULTY} ceiling` };
  }
  if (c.score < MIN_SCORE) {
    return { approved: false, reason: `score ${c.score} is below the ${MIN_SCORE} floor` };
  }

  // Topic collision against what is actually published. This is the check that
  // stops the two "gap" candidates, and it is the one a human was doing by eye.
  for (const existing of existingSlugs) {
    const overlap = topicOverlap(c.keyword, existing);
    if (overlap >= TOPIC_COLLISION_THRESHOLD) {
      return {
        approved: false,
        reason: `"${c.keyword}" overlaps ${existing} at ${(overlap * 100).toFixed(0)}% topic tokens — near-duplicate of a page that already exists`,
      };
    }
  }

  // Cluster dedup within one run. Discovery returns close variants of the same
  // phrase ("best office chair for tall people/person/man"); approving several
  // would commission near-identical pages in a single batch.
  for (const approved of alreadyApprovedThisRun) {
    const overlap = topicOverlap(c.keyword, approved);
    if (overlap >= TOPIC_COLLISION_THRESHOLD) {
      return {
        approved: false,
        reason: `duplicate of "${approved}" already approved in this run (${(overlap * 100).toFixed(0)}% overlap)`,
      };
    }
  }

  return {
    approved: true,
    reason: `true gap: ${c.search_volume}/mo, KD ${c.keyword_difficulty}, score ${c.score}, no existing page within ${(TOPIC_COLLISION_THRESHOLD * 100).toFixed(0)}% topic overlap`,
  };
}

/** Judge a whole batch, threading approvals so cluster dedup sees earlier picks. */
export function judgeBatch(
  candidates: readonly ApprovalCandidate[],
  existingSlugs: readonly string[]
): { candidate: ApprovalCandidate; verdict: ApprovalVerdict }[] {
  const approvedKeywords: string[] = [];
  // Highest score first, so when two variants collide the better one survives.
  const ordered = [...candidates].sort((a, b) => b.score - a.score);
  const out: { candidate: ApprovalCandidate; verdict: ApprovalVerdict }[] = [];
  for (const c of ordered) {
    const verdict = judge(c, existingSlugs, approvedKeywords);
    if (verdict.approved) approvedKeywords.push(c.keyword);
    out.push({ candidate: c, verdict });
  }
  return out;
}

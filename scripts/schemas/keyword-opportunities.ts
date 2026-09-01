/**
 * keyword-opportunities.ts — contract for `data/keywords/opportunities.json`.
 *
 * A bare JSON ARRAY written by scripts/keyword-discovery.ts and read by
 * scripts/keywords-approve.ts and scripts/keywords-push.ts.
 *
 * WHY THIS FILE NOW NEEDS A CONTRACT AND DID NOT BEFORE. Until 2026-08-29 this
 * file was read by a human who set `approved: true` by hand. It is now the input
 * to an autonomous chain that decides WHAT GETS PUBLISHED to a live money site:
 * discovery → approve → roadmap → Friday writes the page. A malformed entry
 * silently coerced — a `search_volume` arriving as the string "880", a missing
 * `tca_status` reading as undefined and therefore "not ranking" — would route
 * straight through the approval gate into a published page.
 *
 * `tca_status` is the load-bearing field: it is what rejects the 16 candidates
 * the site already ranks for. It is an ENUM rather than a string precisely
 * because a typo or a new unhandled value must fail loudly here, not fall
 * through `!== 'ranking'` and get approved.
 *
 * No freshness SLA: discovery runs monthly, and a queue nobody refilled this
 * month is not stale. minRows 0 — an empty opportunity list is a real state.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

export const opportunitySchema = z
  .object({
    keyword: z.string(),
    search_volume: z.number(),
    keyword_difficulty: z.number(),
    cpc: z.number(),
    intent: z.string(),
    /** Enum on purpose — see the header. An unknown value must throw. */
    tca_status: z.enum(['gap', 'targeting', 'ranking']),
    target_slug: z.string(),
    reason: z.string(),
    score: z.number(),
    approved: z.boolean(),
    /** Written by keywords-approve.ts; absent until it has run once. */
    approval_reason: z.string().optional(),
    approved_at: z.string().optional(),
    /** Set by keywords-push.ts when the entry reaches the roadmap. */
    pushed_at: z.string().optional(),
  })
  .passthrough();

export type KeywordOpportunity = z.infer<typeof opportunitySchema>;

export const keywordOpportunitiesSchema = z.array(opportunitySchema);

export const keywordOpportunitiesOptions: ReadOptions = {
  minRows: 0,
  label: 'keyword opportunities',
};

/**
 * verified-asins.ts — contract for `data/verified-asins.json` (PRD §7.2: no
 * freshness SLA, ≥1 entry).
 *
 * The allowlist of Amazon ASINs cleared to appear in src/pages. Enforced by
 * scripts/lint-content.mjs in the Saturday deploy gate, and the backing store
 * for the `asin-registered` closure predicate (§7.3).
 *
 * NO FRESHNESS SLA: a curated allowlist that nobody edited this month is
 * correct, not stale. The ≥1 floor is the load-bearing check — an empty registry
 * would make every ASIN on the site unverifiable while the lint reported clean,
 * so `asins` must never validate as empty.
 *
 * The leading `_README` / `_WHY` / `_HOW_TO_ADD` / `_NOT_AN_HTTP_CHECK` keys are
 * real, documented parts of the file and are modelled as required — dropping one
 * means someone rewrote the file without reading it.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

export const asinEntrySchema = z
  .object({
    product: z.string(),
    /** ISO date the human verified the listing resolves. */
    verified: z.string(),
    by: z.string(),
    source: z.string(),
  })
  .passthrough();

export const verifiedAsinsSchema = z
  .object({
    _README: z.string(),
    _WHY: z.string(),
    _HOW_TO_ADD: z.string(),
    _NOT_AN_HTTP_CHECK: z.string(),
    /**
     * ASIN → provenance. `.refine` rather than `minRows`, because `minRows`
     * counts the SIX top-level keys and would happily pass an empty registry.
     */
    asins: z
      .record(asinEntrySchema)
      .refine((r) => Object.keys(r).length >= 1, {
        message: 'ASIN registry is empty; every affiliate link on the site would be unverifiable',
      }),
    /** ASIN → prose explanation of why it is dead. May legitimately be empty. */
    known_dead: z.record(z.string()),
  })
  .passthrough();

export type VerifiedAsins = z.infer<typeof verifiedAsinsSchema>;

export const verifiedAsinsOptions: ReadOptions = {
  minRows: 1,
  label: 'verified ASIN registry',
};

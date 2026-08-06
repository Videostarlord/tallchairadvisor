/**
 * retractions.ts — contract for `data/retractions.jsonl` (PRD §7.2: no
 * freshness SLA, ≥0 rows).
 *
 * A retraction is an assertion ABOUT a claim, not a claim, which is why §7.2
 * keeps it out of the unified ledger. Append-only: `appendRetraction` only ever
 * calls appendFileSync, and `supersededAt` is the immutability latch.
 *
 * `type` is modelled as a literal rather than a free string. wiki-utils.ts
 * anticipates other record types later; when one arrives, this schema throws
 * naming the file and the value — which is the correct, loud way to find out
 * that a reader needs updating, rather than the record being silently filtered
 * out of every downstream count.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

export const retractionSchema = z
  .object({
    type: z.literal('retraction'),
    date: z.string(),
    /** sha1(page|issueClass) from scripts/audit-findings.ts, 12 hex chars. */
    findingId: z.string(),
    page: z.string(),
    issueClass: z.string(),
    /** The wrong claim, verbatim enough to recognise. */
    claim: z.string(),
    /** Why it is wrong — the evidence. */
    why: z.string(),
    /** Standing rule injected into the audit prompt. */
    rule: z.string(),
    /** Non-null when the retraction is itself withdrawn. */
    supersededAt: z.string().nullable(),
  })
  .passthrough();

export type Retraction = z.infer<typeof retractionSchema>;

export const retractionsOptions: ReadOptions = {
  minRows: 0,
  label: 'retraction ledger',
};

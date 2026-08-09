/**
 * link-audit.ts — contract for `data/gsc/link-audit.json` (Module 8, CONT-03).
 *
 * Written by `gsc-analyze.ts` on the Monday run alongside `analysis.json`, read
 * by `strategy.ts` to inject internal-link tasks into the weekly plan.
 *
 * WHY THIS EXISTS
 * `strategy.ts` read it as `existsSync(p) ? JSON.parse(p) : { gaps: [] }` and
 * then `linkAudit.gaps ?? []`. Two independent ways for "Module 8 stopped
 * emitting gaps" to arrive at the plan as "there are no link gaps this week" —
 * and the second one fires on a file that IS present, which is the reconciler
 * bug verbatim. Under this contract a present file must carry a `gaps` array;
 * only absence yields the empty reading, and absence is checked once, explicitly.
 *
 * NO FRESHNESS SLA — DELIBERATE, AND IT DOCUMENTS A KNOWN DEFECT
 * The committed copy of this file is stamped 2026-07-20 while `analysis.json`
 * next to it is stamped 2026-08-06, because `data/gsc/link-audit.json` is absent
 * from the `git add` list in `.github/workflows/monday.yml` (line 114). The
 * writer runs every Monday; the result is simply never committed. An 8-day SLA
 * here would therefore throw on the CI checkout for a reason that has nothing to
 * do with the collector, so the age check stays off until the workflow's add
 * scope is fixed. The SHAPE is still enforced, which is the part that was
 * silently degrading.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

export const internalLinkGapSchema = z
  .object({
    /** Full URL as GSC reports it, e.g. 'https://tallchairadvisor.com/review/gesture/'. */
    page: z.string(),
    /** 90-day GSC impressions — the reason this page is worth linking to. */
    impressions: z.number(),
    /** Inbound links counted by scanning src/pages, self-links excluded. */
    inboundLinkCount: z.number(),
    /** Site policy floor, 3, from wiki/pages/concepts/internal-linking.md. */
    threshold: z.number(),
  })
  .passthrough();

export const linkAuditSchema = z
  .object({
    generatedAt: z.string(),
    impressionsThreshold: z.number(),
    linkThreshold: z.number(),
    /**
     * Legitimately empty: "every high-impression page already has ≥3 inbound
     * links" is the goal state, not a failure. The floor that matters is that
     * the KEY is present — its absence means Module 8 did not run.
     */
    gaps: z.array(internalLinkGapSchema),
  })
  .passthrough();

export type LinkAudit = z.infer<typeof linkAuditSchema>;

export const linkAuditOptions: ReadOptions = {
  minRows: 1,
  label: 'internal link audit',
};

/**
 * audit-findings.ts — contract for `data/audit-findings.json` (PRD §7.2: 8-day
 * SLA, ≥0 findings).
 *
 * ≥0 IS DELIBERATE AND IS NOT THE SAME AS "no floor". An audit that finds
 * nothing is a valid audit; an audit that never ran is not. Those two are told
 * apart by the 8-day SLA on `generatedAt`, not by counting findings — which is
 * exactly the distinction the pre-contract code could not make.
 *
 * Shape derives from the `AuditFindingsFile` interface in
 * `scripts/audit-findings.ts`. The file is regenerated weekly by the Tuesday
 * audit agent and is not present between the first run of a fresh clone and the
 * first audit, so readers use `readValidatedIfExists`.
 *
 * `issueClass` is a CLOSED SET on purpose: `findingId = sha1(page|issueClass)`,
 * so a free-text class would silently break ID stability, and with it retraction
 * matching and week-over-week tracking. An unmodelled class must throw.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';
import { ISSUE_CLASSES } from '../audit-findings.js';

export const issueClassSchema = z.enum(ISSUE_CLASSES);
export const severitySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const auditFindingSchema = z
  .object({
    /** sha1(page|issueClass) truncated to 12 — stable across regenerations. */
    findingId: z.string(),
    page: z.string(),
    issueClass: issueClassSchema,
    severity: severitySchema,
    summary: z.string(),
    recommendation: z.string(),
    /** Compact metric context, e.g. '40,195 impr, pos 5.7, 0.04% CTR'. */
    evidence: z.string().optional(),
  })
  .passthrough();

export const suppressedFindingSchema = z
  .object({
    findingId: z.string(),
    page: z.string(),
    issueClass: z.string(),
    retractedOn: z.string(),
  })
  .passthrough();

export const auditFindingsSchema = z
  .object({
    generatedAt: z.string(),
    dateRange: z
      .object({
        start: z.string(),
        end: z.string(),
      })
      .passthrough(),
    executiveSummary: z.string(),
    weeklyFocus: z.array(z.string()),
    pagesNotNeedingAction: z.array(z.string()),
    /** ≥0: a clean week is a real result. */
    findings: z.array(auditFindingSchema),
    /** Findings dropped because they match data/retractions.jsonl. */
    suppressed: z.array(suppressedFindingSchema),
  })
  .passthrough();

export type AuditFindingsFileParsed = z.infer<typeof auditFindingsSchema>;

export const auditFindingsOptions: ReadOptions = {
  maxAgeHours: 8 * 24,
  minRows: 0,
  timestampKey: 'generatedAt',
  label: 'audit findings',
};

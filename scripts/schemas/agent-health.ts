/**
 * agent-health.ts — contract for `data/agent-health.jsonl` (A13).
 *
 * Mirrors `AgentHealthRecord` in `scripts/lib/agent-health.ts`. If that
 * interface changes, this schema is the thing that must change with it.
 *
 * NO FRESHNESS SLA, for the same reason `data/cost-ledger.jsonl` has none: the
 * pipeline runs Mon–Sat, so "no agent ran since yesterday" is a real and common
 * state and a contract that throws on a quiet Sunday trains everyone to ignore
 * it. Staleness of THIS file is not a health question — the dead-man's switch
 * already covers "nothing ran at all".
 *
 * `reason` is `string | null` rather than `string | undefined` deliberately: a
 * nullable field that is present-and-null reads as "checked, nothing to say",
 * whereas an absent key reads as "the writer forgot". The distinction is the
 * whole point of the layer.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

export const agentHealthRecordSchema = z
  .object({
    ts: z.string(),
    run: z.string(),
    agent: z.string(),
    purpose: z.string().optional(),
    status: z.enum(['evaluated', 'unevaluable']),
    reason: z.string().nullable(),
    inputTokens: z.number().nullable(),
    floorTokens: z.number().nullable(),
    outputTokens: z.number().nullable(),
    maxTokens: z.number().nullable(),
    stopReason: z.string().nullable(),
  })
  .passthrough()
  .superRefine((record, ctx) => {
    // The invariant `makeUnevaluable()` enforces at write time, enforced again
    // at read time. A blindness record nobody can act on is worse than none.
    if (record.status === 'unevaluable' && (record.reason === null || record.reason.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'status "unevaluable" requires a non-empty reason — see makeUnevaluable()',
      });
    }
  });

export type AgentHealthRecordParsed = z.infer<typeof agentHealthRecordSchema>;

export const agentHealthOptions: ReadOptions = {
  minRows: 0,
  label: 'agent health',
};

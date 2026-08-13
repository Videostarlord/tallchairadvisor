/**
 * cost-ledger.ts — contract for `data/cost-ledger.jsonl` (PRD §7.1).
 *
 * NOT YET ON DISK at the time this schema was written: the ledger is created by
 * the first `meteredCreate` call. Shape is therefore taken from the
 * `LlmCostRecord` / `ExternalCostRecord` interfaces in
 * `scripts/lib/metered-client.ts` and the record example in PRD §7.1, not
 * reverse-engineered from data. If those interfaces change, this schema is the
 * thing that must change with them.
 *
 * Two record kinds share the file. They are discriminated STRUCTURALLY, not by
 * a `kind` tag — an LLM record has `model` + token counts, an external record
 * has `service` + `unit` + `amount`. A plain `z.union` is used rather than
 * `z.discriminatedUnion` for that reason.
 *
 * NO FRESHNESS SLA. "No LLM calls since yesterday" is a real and common state
 * (the pipeline runs Mon–Sat), and a cost ledger that throws on a quiet Sunday
 * would train everyone to ignore it. Spend anomalies are a rollup question
 * (`npm run cost:rollup`, PRD §7.1), not a read-time contract question.
 *
 * Non-USD units are NEVER converted to dollars. A credit is a credit; inventing
 * an exchange rate is a fabricated cost, which is the same sin as pricing an
 * unknown model at zero.
 */

import { z } from 'zod';
import type { ReadOptions } from '../lib/read-validated.js';

/** Mirrors `CostBreakdown` in scripts/lib/pricing.ts. */
export const costBreakdownSchema = z
  .object({
    input: z.number(),
    output: z.number(),
    cacheWrite: z.number(),
    cacheRead: z.number(),
    total: z.number(),
  })
  .passthrough();

/** Mirrors `LlmCostRecord` in scripts/lib/metered-client.ts. */
export const llmCostRecordSchema = z
  .object({
    ts: z.string(),
    agent: z.string(),
    /** ISO date of the pipeline run, e.g. '2026-08-06'. */
    run: z.string(),
    purpose: z.string().optional(),
    model: z.string(),
    input: z.number(),
    output: z.number(),
    cacheWrite: z.number(),
    cacheRead: z.number(),
    usd: costBreakdownSchema,
    /**
     * A13, added 2026-08-09. OPTIONAL, not required, and that is deliberate:
     * the ~29 records written before this date genuinely do not know their own
     * stop reason. Requiring the key would make the contract throw on real
     * history; defaulting it to 'end_turn' would fabricate evidence that every
     * historical call completed cleanly — which is exactly the claim the audit
     * truncation disproves. Absent means unknown, and unknown is the truth.
     */
    stopReason: z.string().nullable().optional(),
    maxTokens: z.number().nullable().optional(),
    /**
     * Added 2026-08-13, OPTIONAL for the same reason `stopReason` is and with a
     * blunter consequence. The 53 records written before that date do not know
     * which site they belong to and CANNOT be made to: an Anthropic invoice is
     * per API key, the token counts carry no site, and nothing anywhere else
     * remembers. Requiring the key would throw on real history. Defaulting it to
     * `tallchairadvisor.com` would be worse — it would look like attribution
     * while being a guess, and the first month a second site runs is exactly the
     * month that guess becomes wrong and invisible.
     *
     * Absent means UNATTRIBUTABLE, and cost-rollup says so in those words rather
     * than silently folding those dollars into whichever site is asking.
     */
    site: z.string().optional(),
  })
  .passthrough();

/** Mirrors `ExternalCostRecord` — DataForSEO / SerpAPI / Firecrawl. */
export const externalCostRecordSchema = z
  .object({
    ts: z.string(),
    agent: z.string(),
    run: z.string(),
    purpose: z.string().optional(),
    service: z.string(),
    unit: z.enum(['usd', 'credits', 'pages']),
    amount: z.number(),
    /** See `site` on llmCostRecordSchema — optional for the same reason. */
    site: z.string().optional(),
  })
  .passthrough();

export const costRecordSchema = z.union([llmCostRecordSchema, externalCostRecordSchema]);

export type CostRecordParsed = z.infer<typeof costRecordSchema>;

export const costLedgerOptions: ReadOptions = {
  minRows: 0,
  label: 'cost ledger',
};

/**
 * `data/token-log.jsonl` — the RETIRED pre-§7.1 log. PRD §7.1: "retained as a
 * historical artifact and never written again." Schema exists only so the
 * historical file can be read under contract during cost reconciliation; nothing
 * may append to it.
 */
export const tokenLogRecordSchema = z
  .object({
    ts: z.string(),
    agent: z.string(),
    input_tokens: z.number(),
    output_tokens: z.number(),
    cache_creation: z.number(),
    cache_read: z.number(),
  })
  .passthrough();

export const tokenLogOptions: ReadOptions = {
  minRows: 0,
  label: 'token log (retired)',
};

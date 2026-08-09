/**
 * metered-client.ts — God's-Eye Nightly §7.1 cost meter.
 *
 * THE ONLY PLACE IN THIS REPO THAT MAY CALL THE ANTHROPIC MESSAGES ENDPOINT.
 * `scripts/lint-architecture.mjs` rule R1 enforces that. Agents call
 * `meteredCreate(params, ctx)` instead of instantiating their own client.
 *
 * Behavior (PRD §7.1):
 *   1. Calls the SDK.
 *   2. Reads usage.{input_tokens, output_tokens, cache_creation_input_tokens,
 *      cache_read_input_tokens}.
 *   3. Prices it at write time via scripts/lib/pricing.ts.
 *   4. Appends one record to data/cost-ledger.jsonl.
 *   5. Returns the message unchanged.
 *
 * Ledger append never breaks the caller's LLM call — but it is never silent
 * either: a failed append prints a LOUD warning to stderr naming the file and
 * the error, so the loss shows up in CI logs instead of vanishing.
 *
 * A13 ADDENDUM — WHY stop_reason IS CAPTURED HERE AND NOWHERE ELSE
 * Four call sites already checked `response.stop_reason === 'max_tokens'` by
 * hand; eleven did not. The audit was one of the eleven, and it stopped at
 * exactly its 4000-token ceiling on five consecutive weekly runs while every
 * dashboard stayed green. A per-call-site check is a convention, and this
 * codebase's signature failure is a convention that one new call site forgets.
 *
 * This function is already the ONE place every LLM call in the repo passes
 * through — lint rule R5 guarantees it. So truncation detection belongs here
 * for exactly the reason cost accounting does: it is the only chokepoint where
 * "every agent" is enforceable rather than hoped for. Every call now writes an
 * `evaluated` / `unevaluable` record to data/agent-health.jsonl, and the
 * nightly refuses to report a clean night while any `unevaluable` record sits
 * in tonight's window.
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { costOf, type CostBreakdown, type TokenUsage } from './pricing.js';
import { classifyStop, makeEvaluated, makeUnevaluable, recordAgentHealth } from './agent-health.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repo root, resolved the way every other script in this repo resolves it. */
export const ROOT = resolve(__dirname, '../..');

/** Append-only cost ledger. Separate lifecycle from data/ledger.jsonl (PRD §7.2). */
export const COST_LEDGER_PATH = resolve(ROOT, 'data/cost-ledger.jsonl');

export interface MeterContext {
  /** 'audit' | 'strategy' | 'nightly' | ... */
  agent: string;
  /** ISO date of the pipeline run, e.g. '2026-08-06'. */
  run: string;
  /** Optional sub-label, e.g. 'finding-extraction'. */
  purpose?: string;
}

/**
 * One LLM call, exactly the PRD §7.1 record shape:
 * {"ts","agent","run","purpose","model","input","output","cacheWrite","cacheRead","usd":{...}}
 * `purpose` is omitted (not null) when unset — JSON.stringify drops undefined.
 *
 * A13 additions: `stopReason` and `maxTokens`. Together they are the proof of
 * truncation — `stop_reason: 'max_tokens'` with `output === maxTokens` is the
 * signature of the month-long audit failure, and neither field alone shows it.
 * Both are `null` when unknown, never a plausible default, and both are
 * OPTIONAL on the schema so the ~29 records already on disk still validate:
 * back-filling them with 'end_turn' would be inventing evidence.
 */
export interface LlmCostRecord {
  ts: string;
  agent: string;
  run: string;
  purpose?: string;
  model: string;
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  usd: CostBreakdown;
  /** Verbatim `stop_reason`. null = the response carried none. */
  stopReason: string | null;
  /** The ceiling the call requested. null = not recorded. */
  maxTokens: number | null;
}

/**
 * One non-LLM metered call (DataForSEO / SerpAPI / Firecrawl). Same ledger,
 * different shape: no `model`, no token counts. Readers discriminate on the
 * presence of `service`/`unit`. Non-USD units are NOT converted to dollars —
 * a credit is a credit; inventing an exchange rate would be a fabricated cost.
 */
export interface ExternalCostRecord {
  ts: string;
  agent: string;
  run: string;
  purpose?: string;
  service: string;
  unit: 'usd' | 'credits' | 'pages';
  amount: number;
}

export type CostRecord = LlmCostRecord | ExternalCostRecord;

/** True when the record came from meterExternal() rather than meteredCreate(). */
export function isExternalRecord(record: CostRecord): record is ExternalCostRecord {
  return typeof (record as ExternalCostRecord).service === 'string';
}

/**
 * Deep scan of the request for a 1-hour cache breakpoint. Any content block
 * carrying `cache_control: { type: 'ephemeral', ttl: '1h' }` means the whole
 * request's cache writes bill at the 2x rate; otherwise 5m (1.25x).
 */
function hasOneHourCacheControl(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasOneHourCacheControl);
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const cacheControl = record.cache_control;
    if (cacheControl !== null && typeof cacheControl === 'object') {
      const ttl = (cacheControl as Record<string, unknown>).ttl;
      if (ttl === '1h') return true;
    }
    return Object.values(record).some(hasOneHourCacheControl);
  }
  return false;
}

/** '1h' when any block requests the 1-hour TTL, else '5m'. */
export function detectCacheTtl(params: unknown): '5m' | '1h' {
  return hasOneHourCacheControl(params) ? '1h' : '5m';
}

/**
 * Build the ledger record for one priced LLM call. Pure — no I/O.
 *
 * `completion` is optional so the existing four-argument call shape keeps
 * working; omitting it records `null`/`null`, which reads as "not observed"
 * rather than "completed normally".
 */
export function buildLlmRecord(
  model: string,
  usage: TokenUsage,
  ctx: MeterContext,
  cacheTtl: '5m' | '1h',
  at: Date = new Date(),
  completion: { stopReason: string | null; maxTokens: number | null } = { stopReason: null, maxTokens: null }
): LlmCostRecord {
  const usd = costOf(model, usage, { cacheTtl, at });
  const record: LlmCostRecord = {
    ts: at.toISOString(),
    agent: ctx.agent,
    run: ctx.run,
    model,
    stopReason: completion.stopReason,
    maxTokens: completion.maxTokens,
    input: usage.input_tokens,
    output: usage.output_tokens,
    cacheWrite:
      usage.cache_creation_input_tokens === null ||
      usage.cache_creation_input_tokens === undefined
        ? 0
        : usage.cache_creation_input_tokens,
    cacheRead:
      usage.cache_read_input_tokens === null || usage.cache_read_input_tokens === undefined
        ? 0
        : usage.cache_read_input_tokens,
    usd,
  };
  if (ctx.purpose !== undefined) record.purpose = ctx.purpose;
  return record;
}

/** Build the ledger record for one non-LLM metered call. Pure — no I/O. */
export function buildExternalRecord(
  rec: {
    agent: string;
    run: string;
    purpose?: string;
    unit: 'usd' | 'credits' | 'pages';
    amount: number;
    service: string;
  },
  at: Date = new Date()
): ExternalCostRecord {
  if (typeof rec.amount !== 'number' || !Number.isFinite(rec.amount) || rec.amount < 0) {
    throw new Error(
      `metered-client: meterExternal() amount for "${rec.service}" must be a non-negative finite number, got ${JSON.stringify(rec.amount)}`
    );
  }
  const record: ExternalCostRecord = {
    ts: at.toISOString(),
    agent: rec.agent,
    run: rec.run,
    service: rec.service,
    unit: rec.unit,
    amount: rec.amount,
  };
  if (rec.purpose !== undefined) record.purpose = rec.purpose;
  return record;
}

/**
 * Append one record as a JSONL line. Exported with an explicit path so tests
 * can write to a temp file instead of the live ledger. Throws on failure —
 * callers decide whether that is fatal (meteredCreate says no; see below).
 */
export function appendRecord(record: CostRecord, ledgerPath: string = COST_LEDGER_PATH): void {
  mkdirSync(dirname(ledgerPath), { recursive: true });
  appendFileSync(ledgerPath, `${JSON.stringify(record)}\n`);
}

/**
 * Append, but never let a ledger failure destroy the caller's already-paid-for
 * LLM response. The failure is reported loudly on stderr and the function
 * returns false so callers/tests can observe it. This is deliberately NOT an
 * empty catch (banned by lint rule R3) — the spend really happened, and a
 * silent drop is the exact failure class this PRD exists to eliminate.
 */
export function appendRecordSafely(
  record: CostRecord,
  ledgerPath: string = COST_LEDGER_PATH
): boolean {
  try {
    appendRecord(record, ledgerPath);
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      `[cost-meter] LEDGER WRITE FAILED — spend occurred but was NOT recorded.\n` +
        `  file:   ${ledgerPath}\n` +
        `  reason: ${reason}\n` +
        `  record: ${JSON.stringify(record)}`
    );
    return false;
  }
}

/**
 * The repo's one Anthropic client. Instantiated lazily so importing this module
 * (e.g. from cost-rollup or a test) does not require ANTHROPIC_API_KEY.
 */
let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (client === null) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Metered wrapper around the Anthropic Messages endpoint.
 *
 * @param params Standard SDK params. Streaming params are not supported here —
 *               no current call site streams, and a streamed response has no
 *               single usage block to price at write time.
 * @param ctx    Who is spending, on which run, for what.
 * @returns The message, unchanged.
 */
export async function meteredCreate(
  params: Anthropic.MessageCreateParams,
  ctx: MeterContext
): Promise<Anthropic.Message> {
  if (params.stream === true) {
    throw new Error(
      'metered-client: meteredCreate() does not support stream:true — a streamed ' +
        'response cannot be priced at write time. Use a non-streaming request.'
    );
  }

  const message = (await getClient().messages.create(
    params as Anthropic.MessageCreateParamsNonStreaming
  )) as Anthropic.Message;

  // The response's own model string is authoritative (it may carry a dated
  // suffix the caller did not send); fall back to the requested model.
  const model =
    typeof message.model === 'string' && message.model.length > 0
      ? message.model
      : String(params.model);

  const usage: TokenUsage = {
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
    cache_creation_input_tokens: message.usage.cache_creation_input_tokens,
    cache_read_input_tokens: message.usage.cache_read_input_tokens,
  };

  const stopReason = typeof message.stop_reason === 'string' ? message.stop_reason : null;
  const maxTokens = typeof params.max_tokens === 'number' ? params.max_tokens : null;

  // A13. Recorded BEFORE pricing, and outside its try/catch, because a truncated
  // response is a correctness fact and an unpriceable model is an accounting
  // fact. Losing the first because of the second is how the audit truncation
  // could have hidden a second time.
  const stop = classifyStop({ stopReason, outputTokens: usage.output_tokens, maxTokens });
  const health = { run: ctx.run, agent: ctx.agent, purpose: ctx.purpose, inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, maxTokens, stopReason };
  recordAgentHealth(
    stop.status === 'evaluated'
      ? makeEvaluated(health)
      : makeUnevaluable(stop.reason ?? 'unevaluable completion', health)
  );

  // Pricing failures (unknown model) must be loud too, but must not discard a
  // response the caller already paid for.
  try {
    const record = buildLlmRecord(model, usage, ctx, detectCacheTtl(params), new Date(), { stopReason, maxTokens });
    appendRecordSafely(record);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      `[cost-meter] PRICING FAILED — call to "${model}" by agent "${ctx.agent}" was NOT recorded.\n` +
        `  reason: ${reason}`
    );
  }

  return message;
}

/**
 * Record a non-LLM metered call. DataForSEO reports `cost` per response
 * (unit 'usd', recorded verbatim); SerpAPI reports credits; Firecrawl reports
 * pages. Never throws for ledger I/O reasons — it warns on stderr instead.
 */
export function meterExternal(rec: {
  agent: string;
  run: string;
  purpose?: string;
  unit: 'usd' | 'credits' | 'pages';
  amount: number;
  service: string;
}): void {
  appendRecordSafely(buildExternalRecord(rec));
}

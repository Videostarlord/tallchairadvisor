/**
 * pricing.ts — God's-Eye Nightly §7.1 price table.
 *
 * USD per million tokens (MTok). Single source of truth for every cost figure
 * the pipeline reports. There is no fallback rate and no zero-price path: an
 * unknown model ID throws `UnknownModelError` naming the model.
 *
 * Cache rates are DERIVED from the input rate, never hardcoded:
 *   cache-write 5m = 1.25x input
 *   cache-write 1h = 2.00x input
 *   cache-read     = 0.10x input
 * so a dated rate override propagates to the cache rates automatically.
 *
 * Run the tests: npx tsx scripts/lib/__tests__/pricing.test.ts
 */

/** USD per million tokens for one model, at one point in time. */
export interface ModelPrices {
  input: number;
  output: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
}

/** Thrown when a model ID has no entry in the price table. Never price at zero. */
export class UnknownModelError extends Error {
  readonly model: string;
  readonly normalized: string;

  constructor(model: string, normalized: string, known: string[]) {
    super(
      `pricing.ts: no price entry for model "${model}"` +
        (normalized === model ? '' : ` (normalized to "${normalized}")`) +
        `. Known models: ${known.join(', ')}. ` +
        `Add it to BASE_RATES before using it — an unpriced call must never be recorded as free.`
    );
    this.name = 'UnknownModelError';
    this.model = model;
    this.normalized = normalized;
  }
}

interface RateCard {
  /** USD per MTok, input */
  input: number;
  /** USD per MTok, output */
  output: number;
}

/**
 * Standard rates. PRD §7.1 table.
 *
 * | Model               | Input | Output |
 * | claude-sonnet-4-6   | 3.00  | 15.00  |
 * | claude-haiku-4-5    | 1.00  |  5.00  |
 * | claude-opus-5       | 5.00  | 25.00  |
 * | claude-sonnet-5     | 3.00  | 15.00  |  (see DATED_OVERRIDES for intro pricing)
 */
const BASE_RATES: Readonly<Record<string, RateCard>> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },
  'claude-opus-5': { input: 5.0, output: 25.0 },
  'claude-sonnet-5': { input: 3.0, output: 15.0 },
};

/**
 * Time-boxed rate overrides, checked before BASE_RATES.
 *
 * `from` / `until` are inclusive UTC calendar days (YYYY-MM-DD); `null` means
 * unbounded on that side. An override wins when the pricing date falls inside
 * its window; otherwise the base rate applies. This is why Sonnet 5's
 * introductory price is a table row and not a constant — on 2026-09-01 the
 * window closes and priceFor() returns 3.00/15.00 with no code change.
 */
interface DatedOverride {
  model: string;
  from: string | null;
  until: string | null;
  rate: RateCard;
  note: string;
}

const DATED_OVERRIDES: readonly DatedOverride[] = [
  {
    model: 'claude-sonnet-5',
    from: null,
    until: '2026-08-31',
    rate: { input: 2.0, output: 10.0 },
    note: 'Sonnet 5 introductory pricing, through 2026-08-31 (PRD §7.1 footnote)',
  },
];

const CACHE_WRITE_5M_MULTIPLIER = 1.25;
const CACHE_WRITE_1H_MULTIPLIER = 2.0;
const CACHE_READ_MULTIPLIER = 0.1;

/** Tokens are billed per million. */
const TOKENS_PER_UNIT = 1_000_000;

/**
 * Model IDs in this repo appear both bare (`claude-sonnet-4-6`) and dated
 * (`claude-haiku-4-5-20251001`). Strip a trailing 8-digit date suffix and
 * lowercase; anything that still misses the table throws.
 */
export function normalizeModelId(model: string): string {
  return String(model).trim().toLowerCase().replace(/-\d{8}$/, '');
}

/** UTC calendar day (YYYY-MM-DD) used for override window comparisons. */
function utcDay(at: Date): string {
  if (Number.isNaN(at.getTime())) {
    throw new Error('pricing.ts: priceFor() received an invalid Date');
  }
  return at.toISOString().slice(0, 10);
}

function activeRate(normalized: string, at: Date): RateCard | null {
  const day = utcDay(at);
  for (const override of DATED_OVERRIDES) {
    if (override.model !== normalized) continue;
    if (override.from !== null && day < override.from) continue;
    if (override.until !== null && day > override.until) continue;
    return override.rate;
  }
  const base = BASE_RATES[normalized];
  return base === undefined ? null : base;
}

/**
 * Full price card for a model at a point in time.
 *
 * @param model Model ID as sent to / returned by the API (dated suffix tolerated).
 * @param at    Pricing date. Defaults to now. Pass the ledger record's timestamp
 *              to reprice historical usage correctly.
 * @throws UnknownModelError naming the model when no entry exists.
 */
export function priceFor(model: string, at: Date = new Date()): ModelPrices {
  const normalized = normalizeModelId(model);
  const rate = activeRate(normalized, at);
  if (rate === null) {
    throw new UnknownModelError(model, normalized, Object.keys(BASE_RATES));
  }
  return {
    input: rate.input,
    output: rate.output,
    cacheWrite5m: rate.input * CACHE_WRITE_5M_MULTIPLIER,
    cacheWrite1h: rate.input * CACHE_WRITE_1H_MULTIPLIER,
    cacheRead: rate.input * CACHE_READ_MULTIPLIER,
  };
}

/** Every model this table can price. Used by lint/report code, not by callers. */
export function knownModels(): string[] {
  return Object.keys(BASE_RATES);
}

/** Anthropic `usage` block, as returned on a Message. */
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export interface CostBreakdown {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  total: number;
}

export interface CostOptions {
  /** Cache TTL actually requested. Selects the 1.25x or 2x write rate. Default '5m'. */
  cacheTtl?: '5m' | '1h';
  /** Pricing date. Defaults to now. */
  at?: Date;
}

/**
 * USD figures are rounded to 8 decimal places (sub-micro-dollar) so the ledger
 * carries clean JSON instead of float artifacts like 0.019289999999999998.
 * Each component is rounded, then the rounded components are summed and the
 * total rounded again — so `total` always equals the sum of the printed parts.
 */
const USD_PRECISION = 1e8;
function roundUsd(value: number): number {
  return Math.round(value * USD_PRECISION) / USD_PRECISION;
}

function requireTokenCount(value: number | null | undefined, field: string): number {
  if (value === null || value === undefined) return 0;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(
      `pricing.ts: usage.${field} must be a non-negative finite number, got ${JSON.stringify(value)}`
    );
  }
  return value;
}

/**
 * Price one API call. Throws rather than returning a degraded value: an unknown
 * model, a missing token count, or a malformed usage block all fail loudly.
 */
export function costOf(model: string, usage: TokenUsage, opts?: CostOptions): CostBreakdown {
  const prices = priceFor(model, opts?.at === undefined ? new Date() : opts.at);

  if (usage === null || usage === undefined || typeof usage !== 'object') {
    throw new Error(`pricing.ts: costOf() requires a usage object for model "${model}"`);
  }
  if (typeof usage.input_tokens !== 'number' || typeof usage.output_tokens !== 'number') {
    throw new Error(
      `pricing.ts: costOf() requires numeric usage.input_tokens and usage.output_tokens for model "${model}"`
    );
  }

  const inputTokens = requireTokenCount(usage.input_tokens, 'input_tokens');
  const outputTokens = requireTokenCount(usage.output_tokens, 'output_tokens');
  const cacheWriteTokens = requireTokenCount(
    usage.cache_creation_input_tokens,
    'cache_creation_input_tokens'
  );
  const cacheReadTokens = requireTokenCount(
    usage.cache_read_input_tokens,
    'cache_read_input_tokens'
  );

  const cacheWriteRate = opts?.cacheTtl === '1h' ? prices.cacheWrite1h : prices.cacheWrite5m;

  const input = roundUsd((inputTokens * prices.input) / TOKENS_PER_UNIT);
  const output = roundUsd((outputTokens * prices.output) / TOKENS_PER_UNIT);
  const cacheWrite = roundUsd((cacheWriteTokens * cacheWriteRate) / TOKENS_PER_UNIT);
  const cacheRead = roundUsd((cacheReadTokens * prices.cacheRead) / TOKENS_PER_UNIT);

  return {
    input,
    output,
    cacheWrite,
    cacheRead,
    total: roundUsd(input + output + cacheWrite + cacheRead),
  };
}

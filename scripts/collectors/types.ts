/**
 * collectors/types.ts — the uniform shape every L1 collector returns (PRD §7.4).
 *
 * THE LOAD-BEARING RULE
 *   "A collector that returns nothing writes `healthy: false` with a reason.
 *    It never silently succeeds."
 *
 * Two corollaries this module enforces mechanically:
 *
 *   1. `reason` is REQUIRED when `healthy === false`, and `makeUnhealthy()`
 *      refuses an empty or whitespace-only one. A collector cannot report
 *      "failed" and leave Jackson to work out which credential died.
 *   2. `collect()` never throws. `guard()` wraps every implementation so an
 *      unexpected exception becomes an unhealthy record with a classified
 *      reason instead of taking the whole nightly down. A crashed collector
 *      that erases the other six is the same silent-failure class the PRD
 *      exists to kill.
 *
 * HEALTH SEMANTICS (used consistently across all seven collectors)
 *   healthy === true  ⟺  every fact this collector claims to provide was
 *                        obtained from its real source and satisfies its
 *                        contract. Nothing was inferred, defaulted or faked.
 *   healthy === false ⟺  something was not obtained. Partial data MAY still be
 *                        attached (never fabricated), and `reason` names what
 *                        is missing and what to do about it.
 *
 * Note the distinction that matters for github-actions.ts: "I could not see"
 * is unhealthy; "I saw clearly, and what I saw is bad" is healthy data with a
 * bad value in it. Conflating the two would make a failing Monday look like a
 * broken observer.
 */

import { ContractViolation } from '../lib/read-validated.js';

export interface CollectorMeta {
  /** ISO timestamp of when this collection ran. */
  collectedAt: string;
  /** Count of primary rows obtained. Each collector documents what it counts. */
  rowCount: number;
  healthy: boolean;
  /** REQUIRED when healthy === false. Specific and actionable, never "failed". */
  reason: string | null;
}

export interface CollectorResult<T> {
  data: T | null;
  meta: CollectorMeta;
}

/** Signature every collector module exports. */
export type Collector<T> = () => Promise<CollectorResult<T>>;

// ─── Constructors ──────────────────────────────────────────────────────────────

export function makeHealthy<T>(data: T, rowCount: number, collectedAt = new Date().toISOString()): CollectorResult<T> {
  return { data, meta: { collectedAt, rowCount, healthy: true, reason: null } };
}

/**
 * The only way to report failure. Throws if handed a useless reason — a vague
 * reason defeats the entire step, so it is a programming error, caught in tests.
 */
export function makeUnhealthy<T>(
  reason: string,
  data: T | null = null,
  rowCount = 0,
  collectedAt = new Date().toISOString()
): CollectorResult<T> {
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new Error('collectors: makeUnhealthy() requires a non-empty, specific reason');
  }
  return { data, meta: { collectedAt, rowCount, healthy: false, reason: reason.trim() } };
}

// ─── Error classification ──────────────────────────────────────────────────────

interface GoogleApiErrorish {
  code?: number | string;
  status?: number | string;
  message?: string;
  response?: { status?: number; statusText?: string; data?: unknown };
  errors?: Array<{ message?: string; reason?: string }>;
}

/**
 * Turn any thrown value into a specific, actionable sentence.
 *
 * This is where "the collector failed" becomes "403 from Search Console:
 * the service account is not a verified owner of the property". Deliberately
 * verbose: the whole point of step 4 is that the nightly names the credential.
 */
export function describeError(error: unknown): string {
  if (error instanceof ContractViolation) {
    // Already names the file, the failing key and the expectation.
    return error.message;
  }

  if (error instanceof Error) {
    const err = error as Error & GoogleApiErrorish;
    const parts: string[] = [];

    const status = err.response?.status ?? err.status ?? err.code;
    if (typeof status === 'number' || (typeof status === 'string' && /^\d{3}$/.test(status))) {
      parts.push(`HTTP ${status}`);
    } else if (typeof err.code === 'string' && err.code !== '') {
      parts.push(err.code);
    }

    const detail = Array.isArray(err.errors)
      ? err.errors.map((e) => e.message ?? e.reason ?? '').filter((m) => m !== '').join('; ')
      : '';

    parts.push(err.message === '' ? err.name : err.message);
    if (detail !== '' && !err.message.includes(detail)) parts.push(detail);

    // Node's fetch collapses every transport problem into "fetch failed".
    if (err.message === 'fetch failed' && err.cause instanceof Error) {
      parts.push(`cause: ${err.cause.message}`);
    }
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      parts.push('(request timed out — the endpoint did not respond in time)');
    }

    return parts.filter((p) => p !== '').join(' — ');
  }

  return `non-Error thrown: ${String(error)}`;
}

/**
 * Wrap a collector implementation so it cannot throw out of `collect()`.
 * `label` prefixes the reason so a stack-free message still names its origin.
 */
export async function guard<T>(
  label: string,
  implementation: () => Promise<CollectorResult<T>>
): Promise<CollectorResult<T>> {
  try {
    return await implementation();
  } catch (error) {
    return makeUnhealthy<T>(`${label}: unexpected collector failure — ${describeError(error)}`);
  }
}

// ─── Environment ───────────────────────────────────────────────────────────────

/**
 * Trimmed env value, or null when unset OR empty.
 *
 * The empty case is not pedantry: `CLARITY_TOKEN= npm run collect:all` — the
 * revocation drill from PRD §9 — leaves the key PRESENT and empty, and dotenv
 * will not overwrite a key that already exists in process.env. Treating '' as
 * set would make a revoked credential look configured.
 */
export function envValue(name: string): string | null {
  const raw = process.env[name];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed === '' ? null : trimmed;
}

/** First env var that is actually set, with the name that supplied it. */
export function firstEnv(...names: string[]): { name: string; value: string } | null {
  for (const name of names) {
    const value = envValue(name);
    if (value !== null) return { name, value };
  }
  return null;
}

/** "GSC_SERVICE_ACCOUNT_JSON" or "SERP_API_KEY / SERPAPI_KEY" for error text. */
export function nameList(names: string[]): string {
  return names.join(' / ');
}

// ─── Time ──────────────────────────────────────────────────────────────────────

export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

/** ISO date (YYYY-MM-DD) used as the `run` key on cost-ledger records. */
export function runId(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Whole days between an ISO timestamp and now; null when unparseable. */
export function ageDays(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (typeof iso !== 'string' || iso === '') return null;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  return Math.floor((now.getTime() - parsed) / MS_PER_DAY);
}

export function ageHours(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (typeof iso !== 'string' || iso === '') return null;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  return Math.round(((now.getTime() - parsed) / MS_PER_HOUR) * 10) / 10;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── HTTP ──────────────────────────────────────────────────────────────────────

export const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * fetch with a hard timeout. A nightly that hangs on a dead endpoint never
 * reports at all, which is indistinguishable from the failure mode the
 * dead-man's switch is meant to catch.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

/** First 200 chars of a response body, for error reasons. Never throws. */
export async function bodySnippet(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.replace(/\s+/g, ' ').trim().slice(0, 200);
  } catch (error) {
    return `<body unreadable: ${describeError(error)}>`;
  }
}

/** Standard, specific reason line for a non-2xx response. */
export async function httpReason(service: string, response: Response, hint?: string): Promise<string> {
  const snippet = await bodySnippet(response);
  const tail = hint === undefined ? '' : ` — ${hint}`;
  return `${response.status} ${response.statusText} from ${service}${tail}${snippet === '' ? '' : `: ${snippet}`}`;
}

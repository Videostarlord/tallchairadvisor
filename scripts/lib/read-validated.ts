/**
 * read-validated.ts — L0 contracts. The only sanctioned way to read a data file.
 *
 * WHY THIS EXISTS
 * `reconcileInterventions` (scripts/agents/wiki-utils.ts:235) read `raw.pages`
 * from GSC history snapshots. Those snapshots have no `pages` key — per-page
 * metrics live under `opportunities`. `?? []` turned that into an empty Map,
 * every intervention entry came back unchanged, and the file was rewritten
 * byte-identical. Green checkmarks weekly, zero reconciliations, for months.
 *
 * The bug class is not "someone typed the wrong key". The bug class is that a
 * missing key was allowed to look like an empty result. Under this module that
 * is unrepresentable: a read either returns data that satisfies a stated
 * contract, or it throws a ContractViolation naming the file, the failing key,
 * and the expectation — plus, where it can work it out, the key you meant.
 *
 * INVARIANTS (do not weaken):
 *   1. No function here ever returns a degraded-but-plausible value.
 *      No `?? []`, no `?? {}`, no empty catch, no silent default.
 *   2. `readValidatedIfExists` returns null ONLY when the file is absent.
 *      A present-but-invalid file still throws.
 *   3. JSON.parse is confined to this file (lint-enforced repo-wide).
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { dirname, isAbsolute, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

/** scripts/lib/read-validated.ts → repo root. */
export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const MS_PER_HOUR = 3_600_000;

// ─── Error type ────────────────────────────────────────────────────────────────

export class ContractViolation extends Error {
  constructor(
    public file: string,
    public detail: string
  ) {
    super(`${file}: ${detail}`);
    this.name = 'ContractViolation';
  }
}

export interface ReadOptions {
  /** Throws if the file mtime OR the embedded timestamp is older than this. */
  maxAgeHours?: number;
  /** Throws if array length / JSONL line count / Object.keys() count is below this floor. */
  minRows?: number;
  /** Human name used in error messages, e.g. 'GSC analysis'. */
  label?: string;
  /**
   * Dotted path to an embedded ISO timestamp, e.g. 'generatedAt'. Preferred over
   * mtime: mtime lies after a `git clone` in CI, where every file is "new".
   * For JSONL, resolved against the LAST record in the file.
   */
  timestampKey?: string;
}

// ─── Path handling ─────────────────────────────────────────────────────────────

function absolutePath(path: string): string {
  return isAbsolute(path) ? path : resolve(REPO_ROOT, path);
}

/** Repo-relative display form, so errors read `data/gsc/analysis.json: …`. */
function displayPath(path: string, label?: string): string {
  const abs = absolutePath(path);
  const rel = relative(REPO_ROOT, abs);
  const shown = rel.startsWith('..') || rel === '' ? abs : rel;
  return label === undefined ? shown : shown;
}

// ─── Small utilities ───────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[n];
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Walk a dotted / segmented path through parsed data. Returns undefined off the end. */
function valueAt(data: unknown, path: ReadonlyArray<string | number>): unknown {
  let cur: unknown = data;
  for (const seg of path) {
    if (Array.isArray(cur) && typeof seg === 'number') {
      cur = cur[seg];
    } else if (isPlainRecord(cur)) {
      cur = cur[String(seg)];
    } else {
      return undefined;
    }
  }
  return cur;
}

function dotted(path: ReadonlyArray<string | number>): string {
  if (path.length === 0) return '(root)';
  return path
    .map((seg, i) => (typeof seg === 'number' ? `[${seg}]` : i === 0 ? seg : `.${seg}`))
    .join('');
}

function shortPreview(value: unknown): string {
  if (value === undefined) return 'undefined';
  const text = JSON.stringify(value);
  if (text === undefined) return String(value);
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
}

function lineColFromOffset(text: string, offset: number): { line: number; column: number } {
  const upTo = text.slice(0, offset);
  const line = upTo.split('\n').length;
  const lastBreak = upTo.lastIndexOf('\n');
  return { line, column: offset - lastBreak };
}

// ─── Zod schema introspection (message enrichment only, never control flow) ────

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Peel Optional/Nullable/Default/Effects wrappers so we can see the real node. */
function unwrapSchema(schema: any): any {
  let cur = schema;
  for (let guard = 0; guard < 12; guard++) {
    const typeName: string | undefined = cur?._def?.typeName;
    if (typeName === 'ZodOptional' || typeName === 'ZodNullable' || typeName === 'ZodDefault' || typeName === 'ZodCatch' || typeName === 'ZodReadonly') {
      cur = cur._def.innerType;
    } else if (typeName === 'ZodEffects') {
      cur = cur._def.schema;
    } else if (typeName === 'ZodPipeline') {
      cur = cur._def.in;
    } else if (typeName === 'ZodBranded') {
      cur = cur._def.type;
    } else {
      return cur;
    }
  }
  return cur;
}

function objectShape(schema: any): Record<string, any> | undefined {
  const node = unwrapSchema(schema);
  if (node?._def?.typeName !== 'ZodObject') return undefined;
  const raw = node._def.shape;
  const shape = typeof raw === 'function' ? raw() : raw;
  return isPlainRecord(shape) ? (shape as Record<string, any>) : undefined;
}

/** Sub-schema at a data path, or undefined if the path leaves the modelled shape. */
function schemaAt(root: any, path: ReadonlyArray<string | number>): any {
  let cur = unwrapSchema(root);
  for (const seg of path) {
    const typeName: string | undefined = cur?._def?.typeName;
    if (typeName === 'ZodObject') {
      const shape = objectShape(cur);
      if (shape === undefined) return undefined;
      cur = unwrapSchema(shape[String(seg)]);
    } else if (typeName === 'ZodArray' || typeName === 'ZodSet') {
      cur = unwrapSchema(cur._def.type);
    } else if (typeName === 'ZodRecord') {
      cur = unwrapSchema(cur._def.valueType);
    } else if (typeName === 'ZodTuple') {
      const items = cur._def.items;
      cur = Array.isArray(items) ? unwrapSchema(items[Number(seg)]) : undefined;
    } else {
      return undefined;
    }
    if (cur === undefined) return undefined;
  }
  return cur;
}

/** 'array, ≥1' / 'object' / 'string' … Falls back to what zod reported. */
function describeExpected(sub: any, reported: string | undefined): string {
  const node = unwrapSchema(sub);
  const typeName: string | undefined = node?._def?.typeName;
  if (typeName === 'ZodArray') {
    const min = node?._def?.minLength?.value;
    return typeof min === 'number' ? `array, ≥${min}` : 'array';
  }
  if (typeName === 'ZodObject') return 'object';
  if (typeName === 'ZodString') return 'string';
  if (typeName === 'ZodNumber') return 'number';
  if (typeName === 'ZodBoolean') return 'boolean';
  if (typeName === 'ZodRecord') return 'record';
  if (typeName === 'ZodEnum') {
    const values = node?._def?.values;
    if (Array.isArray(values)) return `one of ${values.map((v: unknown) => JSON.stringify(v)).join(' | ')}`;
  }
  if (typeName === 'ZodLiteral') return `literal ${JSON.stringify(node?._def?.value)}`;
  return reported === undefined ? 'value' : reported;
}

/** Keys the schema genuinely requires on an object node (optional/default excluded). */
function requiredKeysOf(sub: any): string[] {
  const shape = objectShape(sub);
  if (shape === undefined) return [];
  return Object.keys(shape).filter((key) => {
    const typeName: string | undefined = shape[key]?._def?.typeName;
    return typeName !== 'ZodOptional' && typeName !== 'ZodDefault';
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── "Did you mean …?" ─────────────────────────────────────────────────────────

/** pages → page, opportunities → opportunity, dailyTrend → dailyTrend. */
function singularize(key: string): string {
  if (/ies$/.test(key)) return `${key.slice(0, -3)}y`;
  if (/sses$/.test(key)) return key.slice(0, -2);
  if (/s$/.test(key) && !/ss$/.test(key)) return key.slice(0, -1);
  return key;
}

/**
 * The single most valuable function in this file.
 *
 * A required key is absent. Something in the same object almost certainly holds
 * the data the caller wanted. Two signals, in order of confidence:
 *
 *   1. NAME. Nearest sibling by Levenshtein distance ≤ 3 — the plain typo case
 *      (`rows` vs `row`, `pageViews` vs `pageView`).
 *   2. SHAPE. The history-snapshot case, where the right answer is not remotely
 *      similar by name: asking for `pages` when the file holds `opportunities`.
 *      Score every sibling of the expected type by how much of the expected
 *      ELEMENT shape it carries. `opportunities[0]` has page/impressions/
 *      position/clicks/ctr — a perfect match for what a `pages` reader wants —
 *      while `impressionGravity[0]` has only `page`. Name distance would never
 *      find this; shape finds it every time.
 */
function suggestSibling(
  missingKey: string,
  parent: unknown,
  expectedNode: unknown,
  expectedTypeName: string | undefined
): string | null {
  if (!isPlainRecord(parent)) return null;
  const siblings = Object.keys(parent);
  if (siblings.length === 0) return null;

  // ── Signal 1: name distance ──
  let bestName: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const key of siblings) {
    const distance = levenshtein(missingKey.toLowerCase(), key.toLowerCase());
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = key;
    }
  }
  if (bestName !== null && bestDistance > 0 && bestDistance <= 3 && bestDistance < missingKey.length) {
    return bestName;
  }

  // ── Signal 2: shape affinity ──
  const wantsArray = expectedTypeName === 'array' || expectedTypeName === 'ZodArray';
  if (!wantsArray) return null;

  const expectedElementKeys = requiredKeysOf(schemaAt(expectedNode, [0]));
  const singular = singularize(missingKey);

  let bestKey: string | null = null;
  let bestScore = 0;
  let bestCount = 0;

  for (const key of siblings) {
    const value = parent[key];
    if (!Array.isArray(value) || value.length === 0) continue;
    const first = value[0];
    if (!isPlainRecord(first)) continue;

    let score: number;
    if (expectedElementKeys.length > 0) {
      const hits = expectedElementKeys.filter((k) => k in first).length;
      score = hits / expectedElementKeys.length;
    } else {
      // No modelled element shape: fall back to "does the row carry a field
      // named like the singular of the key we asked for".
      score = singular in first ? 1 : 0;
    }

    if (score > bestScore || (score === bestScore && score > 0 && value.length > bestCount)) {
      bestScore = score;
      bestKey = key;
      bestCount = value.length;
    }
  }

  // Half the expected element shape is the floor for a confident suggestion.
  return bestScore >= 0.5 ? bestKey : null;
}

/** Reverse direction: an unexpected key is present; which schema key was meant? */
function suggestSchemaKey(unknownKey: string, schemaKeys: ReadonlyArray<string>): string | null {
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const key of schemaKeys) {
    const distance = levenshtein(unknownKey.toLowerCase(), key.toLowerCase());
    if (distance < bestDistance) {
      bestDistance = distance;
      best = key;
    }
  }
  return best !== null && bestDistance <= 3 ? best : null;
}

// ─── Zod error → human contract failure ────────────────────────────────────────

function formatIssue(issue: z.ZodIssue, data: unknown, schema: unknown): string {
  const path = issue.path;
  const where = dotted(path);
  const sub = schemaAt(schema, path);

  if (issue.code === 'invalid_type') {
    const expectation = describeExpected(sub, issue.expected);

    if (issue.received === 'undefined') {
      const parent = valueAt(data, path.slice(0, -1));
      const missingKey = String(path[path.length - 1]);
      const suggestion = suggestSibling(missingKey, parent, sub, issue.expected);
      const hint = suggestion === null ? '' : ` Did you mean '${suggestion}'?`;
      return `schema requires '${where}' (${expectation}); key absent.${hint}`;
    }

    const actual = valueAt(data, path);
    return `key '${where}' must be ${expectation}; found ${issue.received} (${shortPreview(actual)})`;
  }

  if (issue.code === 'too_small') {
    const actual = valueAt(data, path);
    const found = Array.isArray(actual)
      ? `${actual.length} row(s)`
      : isPlainRecord(actual)
        ? `${Object.keys(actual).length} key(s)`
        : shortPreview(actual);
    return `'${where}' requires ≥${String(issue.minimum)}; found ${found}`;
  }

  if (issue.code === 'too_big') {
    return `'${where}' requires ≤${String(issue.maximum)}; found ${shortPreview(valueAt(data, path))}`;
  }

  if (issue.code === 'unrecognized_keys') {
    const shape = objectShape(sub);
    const schemaKeys = shape === undefined ? [] : Object.keys(shape);
    const hints = issue.keys
      .map((key) => {
        const suggestion = suggestSchemaKey(key, schemaKeys);
        return suggestion === null ? `'${key}'` : `'${key}' (did you mean '${suggestion}'?)`;
      })
      .join(', ');
    return `unexpected key(s) at '${where}': ${hints}`;
  }

  if (issue.code === 'invalid_enum_value') {
    return `'${where}' must be one of ${issue.options.map((o) => JSON.stringify(o)).join(' | ')}; found ${shortPreview(issue.received)}`;
  }

  if (issue.code === 'invalid_union_discriminator') {
    return `'${where}' must have a discriminator in ${issue.options.map((o) => JSON.stringify(o)).join(' | ')}; found ${shortPreview(valueAt(data, path))}`;
  }

  return `'${where}': ${issue.message}`;
}

function describeZodError(error: z.ZodError, data: unknown, schema: unknown): string {
  const issues = error.issues;
  const headline = formatIssue(issues[0], data, schema);
  if (issues.length === 1) return headline;
  const rest = issues
    .slice(1, 4)
    .map((issue) => formatIssue(issue, data, schema))
    .join('; ');
  const more = issues.length > 4 ? `, +${issues.length - 4} further` : '';
  return `${headline} (+${issues.length - 1} more contract violation(s): ${rest}${more})`;
}

// ─── Core steps ────────────────────────────────────────────────────────────────

function readText(absPath: string, display: string): string {
  if (!existsSync(absPath)) {
    throw new ContractViolation(display, 'file does not exist; a required input was never written');
  }
  const text = readFileSync(absPath, 'utf-8');
  if (text.trim() === '') {
    throw new ContractViolation(display, 'file is empty; a required input was written as zero bytes');
  }
  return text;
}

function parseJson(text: string, display: string, lineOffset: number): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const positionMatch = /position (\d+)/.exec(message);
    let locator = '';
    if (positionMatch !== null) {
      const offset = Number(positionMatch[1]);
      const { line, column } = lineColFromOffset(text, offset);
      locator = ` at byte offset ${offset} (line ${line + lineOffset}, column ${column})`;
    }
    throw new ContractViolation(display, `malformed JSON — ${message}${locator}`);
  }
}

function validate<T>(data: unknown, schema: z.ZodType<T>, display: string, prefix: string): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new ContractViolation(display, `${prefix}${describeZodError(result.error, data, schema)}`);
}

function checkFreshness(
  display: string,
  absPath: string,
  timestampSource: unknown,
  opts: ReadOptions
): void {
  if (opts.maxAgeHours === undefined) return;

  let sourceName: string;
  let iso: string;
  let epochMs: number;

  if (opts.timestampKey !== undefined) {
    const raw = valueAt(timestampSource, opts.timestampKey.split('.'));
    if (typeof raw !== 'string') {
      const state = raw === undefined ? 'key absent' : `found ${typeof raw} (${shortPreview(raw)})`;
      throw new ContractViolation(
        display,
        `freshness contract requires '${opts.timestampKey}' (ISO timestamp string); ${state}`
      );
    }
    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) {
      throw new ContractViolation(
        display,
        `freshness contract requires '${opts.timestampKey}' to be an ISO timestamp; found ${JSON.stringify(raw)}`
      );
    }
    sourceName = opts.timestampKey;
    iso = raw;
    epochMs = parsed;
  } else {
    const stat = statSync(absPath);
    sourceName = 'file mtime';
    epochMs = stat.mtimeMs;
    iso = new Date(stat.mtimeMs).toISOString();
  }

  const ageHours = (Date.now() - epochMs) / MS_PER_HOUR;
  if (ageHours > opts.maxAgeHours) {
    throw new ContractViolation(
      display,
      `stale — ${sourceName} ${iso} is ${Math.round(ageHours)}h old, SLA is ${opts.maxAgeHours}h`
    );
  }
}

function checkMinRows(display: string, value: unknown, opts: ReadOptions): void {
  if (opts.minRows === undefined) return;
  let count: number;
  if (Array.isArray(value)) {
    count = value.length;
  } else if (isPlainRecord(value)) {
    count = Object.keys(value).length;
  } else {
    throw new ContractViolation(
      display,
      `minRows=${opts.minRows} requires an array or record at the top level; found ${value === null ? 'null' : typeof value}`
    );
  }
  if (count < opts.minRows) {
    throw new ContractViolation(display, `requires ≥${opts.minRows} row(s); found ${count}`);
  }
}

function withLabel(detail: string, label: string | undefined): string {
  return label === undefined ? detail : `${detail} (${label})`;
}

/** Re-brand a ContractViolation's detail with the caller's label, once, at the boundary. */
function labelled<T>(label: string | undefined, run: () => T): T {
  if (label === undefined) return run();
  try {
    return run();
  } catch (error) {
    if (error instanceof ContractViolation) {
      throw new ContractViolation(error.file, withLabel(error.detail, label));
    }
    throw error;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Read a JSON file and validate it against a contract. Throws ContractViolation
 * on absence, emptiness, malformed JSON, schema mismatch, staleness, or an
 * under-populated result. Never returns a degraded value.
 */
export function readValidated<T>(path: string, schema: z.ZodType<T>, opts: ReadOptions = {}): T {
  const absPath = absolutePath(path);
  const display = displayPath(path);
  return labelled(opts.label, () => {
    const text = readText(absPath, display);
    const raw = parseJson(text, display, 0);
    const data = validate(raw, schema, display, '');
    checkFreshness(display, absPath, data, opts);
    checkMinRows(display, data, opts);
    return data;
  });
}

/**
 * Read a JSONL file, validating every line against `lineSchema`.
 * Blank lines are skipped; invalid lines are NEVER skipped — the first one
 * throws, naming its 1-indexed line number.
 *
 * `timestampKey`, when supplied with `maxAgeHours`, is resolved against the
 * LAST record in the file (the most recently appended one).
 */
export function readValidatedJsonl<T>(
  path: string,
  lineSchema: z.ZodType<T>,
  opts: ReadOptions = {}
): T[] {
  const absPath = absolutePath(path);
  const display = displayPath(path);
  return labelled(opts.label, () => {
    const text = readText(absPath, display);
    const lines = text.split(/\r?\n/);
    const records: T[] = [];

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (line.trim() === '') continue;
      const lineNumber = index + 1;
      let raw: unknown;
      try {
        raw = parseJson(line, display, 0);
      } catch (error) {
        if (error instanceof ContractViolation) {
          throw new ContractViolation(display, `line ${lineNumber}: ${error.detail}`);
        }
        throw error;
      }
      records.push(validate(raw, lineSchema, display, `line ${lineNumber}: `));
    }

    const last = records.length === 0 ? undefined : records[records.length - 1];
    checkFreshness(display, absPath, last, opts);
    checkMinRows(display, records, opts);
    return records;
  });
}

/**
 * Same contract as `readValidated`, except that an ABSENT file yields null.
 * A file that exists but does not satisfy the contract still throws — absence
 * is a state, corruption is a failure, and the two must never be conflated.
 */
export function readValidatedIfExists<T>(
  path: string,
  schema: z.ZodType<T>,
  opts: ReadOptions = {}
): T | null {
  if (!existsSync(absolutePath(path))) return null;
  return readValidated(path, schema, opts);
}

/**
 * Same contract, for text already in memory — an LLM's JSON response, a fetched
 * body, a git blob. `label` stands in for the filename in error messages.
 */
export function parseValidated<T>(text: string, schema: z.ZodType<T>, label: string): T {
  if (text.trim() === '') {
    throw new ContractViolation(label, 'empty input; expected JSON');
  }
  const raw = parseJson(text, label, 0);
  return validate(raw, schema, label, '');
}

/**
 * JSONL variant of `readValidatedIfExists` — absent file yields an empty array
 * ONLY because "no records yet" is the honest reading of an append-only log
 * that has never been appended to. A present-but-invalid file still throws.
 */
export function readValidatedJsonlIfExists<T>(
  path: string,
  lineSchema: z.ZodType<T>,
  opts: ReadOptions = {}
): T[] | null {
  if (!existsSync(absolutePath(path))) return null;
  return readValidatedJsonl(path, lineSchema, opts);
}

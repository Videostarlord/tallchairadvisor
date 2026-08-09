/**
 * agent-health.ts — A13. The `null`-not-zero discipline, one level up.
 *
 * WHY THIS EXISTS
 * `probes/types.ts` already encodes the rule for a PAGE: a field the probe could
 * not measure is `null`, never a plausible default, because `gtagFired: false`
 * meaning "we didn't look" is what hid a dead GA4 tag for a month. `collectors/
 * types.ts` encodes the same rule for a COLLECTOR: returning nothing writes
 * `healthy:false` with a reason, never a silent success.
 *
 * Nothing encoded it for the AGENTS. Every incident in this system's history is
 * a MEASUREMENT failing quietly rather than a page failing loudly:
 *
 *   - CSP blocked GA4 for a month behind healthy-looking dashboards.
 *   - The Friday workflow committed nothing for 5 days and said nothing.
 *   - audit.ts ran at `max_tokens: 4000` and hit the ceiling on 5 of 5 runs,
 *     truncating the findings array every week for a month.
 *   - audit.ts received 1.4% of the strategy synthesis for a month, and because
 *     slicing keeps the TOP of a file, the surviving fragment argued FOR a
 *     strategy that had been formally abandoned. The agent was not uninformed,
 *     it was MISINFORMED — and Jackson caught it, not the system.
 *   - 2026-08-09: a content-spec gate reported "no violations" against the
 *     SOURCE while the RENDERED pages carried 26 real defects, because its
 *     context matching was blind to HTML tables. Caught by a human re-checking
 *     the built `dist/` output.
 *
 * THE THREE THINGS THIS FILE MAKES UNREPRESENTABLE
 *
 *   1. A TRUNCATED RESPONSE LOOKING LIKE A COMPLETE ONE.
 *      `classifyStop()` turns `stop_reason: 'max_tokens'` into `unevaluable`
 *      with a reason. Recorded on EVERY metered call, so the signal that would
 *      have caught the month-long audit truncation on day one now exists on
 *      day one for every agent, including ones not yet written.
 *
 *   2. AN AGENT PROCEEDING CONFIDENTLY ON A FRAGMENT.
 *      `assertInputFloor()` is the mirror image of `assertPromptBudget()`. That
 *      guards the CEILING and throws rather than truncating; this guards the
 *      FLOOR and throws rather than proceeding. A prompt can be wrong by being
 *      too small, and that failure is quieter and was more expensive.
 *
 *   3. A CLEAN VERDICT FROM A DETECTOR THAT COULD NOT HAVE SEEN THE DEFECT.
 *      `judgeVerdict()`. A detector that reads only its INPUTS cannot see what
 *      its own transform EMITS; a detector that inspected zero units has found
 *      no violations for the same reason an unplugged smoke alarm never sounds.
 *      Neither is `clean`. Both are `unevaluable`.
 *
 * `unevaluable` IS NOT `zero`, AND IT IS NOT A FAILURE EITHER. It is the third
 * state the whole system was missing: "this detector could not see, so its
 * silence proves nothing." A consumer must never fold it into either.
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repo root, resolved the way every other script in this repo resolves it. */
export const ROOT = resolve(__dirname, '../..');

/** Append-only agent-health log. Separate lifecycle from data/cost-ledger.jsonl. */
export const AGENT_HEALTH_PATH = resolve(ROOT, 'data/agent-health.jsonl');

/**
 * The third state. `evaluated` means the observation happened and its result —
 * good or bad — can be believed. `unevaluable` means the observation did not
 * happen, or happened over a surface that cannot contain the answer.
 */
export type Evaluability = 'evaluated' | 'unevaluable';

export interface AgentHealthRecord {
  ts: string;
  /** ISO date of the pipeline run, matching MeterContext.run. */
  run: string;
  /** 'audit' | 'strategy' | 'nightly-report' | 'probe-summary' | ... */
  agent: string;
  purpose?: string;
  status: Evaluability;
  /** REQUIRED when status === 'unevaluable'. Specific and actionable, never "failed". */
  reason: string | null;
  /** Approx tokens of context handed to the agent. null = not measured, never 0. */
  inputTokens: number | null;
  /** The floor `inputTokens` was asserted against, when one applied. */
  floorTokens: number | null;
  /** Tokens the model emitted. null = not measured. */
  outputTokens: number | null;
  /** The ceiling the call requested. Pairs with stopReason to prove truncation. */
  maxTokens: number | null;
  /** Verbatim `stop_reason`. null = the response carried none, which is itself unevaluable. */
  stopReason: string | null;
}

/** Fields a caller supplies; `ts` and the status pair are filled in by the constructors. */
export interface AgentHealthFields {
  run: string;
  agent: string;
  purpose?: string;
  inputTokens?: number | null;
  floorTokens?: number | null;
  outputTokens?: number | null;
  maxTokens?: number | null;
  stopReason?: string | null;
}

/**
 * Same estimator `assertPromptBudget()` and `assertNoTruncation()` already use.
 * Deliberately shared: a floor and a ceiling measured on different scales would
 * be a new way to be quietly wrong.
 */
export function approxTokens(text: string): number {
  return Math.round(text.length / 4);
}

function baseRecord(fields: AgentHealthFields, at: Date): Omit<AgentHealthRecord, 'status' | 'reason'> {
  const record: Omit<AgentHealthRecord, 'status' | 'reason'> = {
    ts: at.toISOString(),
    run: fields.run,
    agent: fields.agent,
    inputTokens: fields.inputTokens === undefined ? null : fields.inputTokens,
    floorTokens: fields.floorTokens === undefined ? null : fields.floorTokens,
    outputTokens: fields.outputTokens === undefined ? null : fields.outputTokens,
    maxTokens: fields.maxTokens === undefined ? null : fields.maxTokens,
    stopReason: fields.stopReason === undefined ? null : fields.stopReason,
  };
  if (fields.purpose !== undefined) record.purpose = fields.purpose;
  return record;
}

export function makeEvaluated(fields: AgentHealthFields, at: Date = new Date()): AgentHealthRecord {
  return { ...baseRecord(fields, at), status: 'evaluated', reason: null };
}

/**
 * The only way to record blindness. Mirrors `collectors/types.ts#makeUnhealthy`
 * exactly, including the refusal of a useless reason: an `unevaluable` record
 * nobody can act on is worse than none, because it burns the reader's attention
 * without telling them which credential, ceiling or surface to go and fix.
 */
export function makeUnevaluable(
  reason: string,
  fields: AgentHealthFields,
  at: Date = new Date()
): AgentHealthRecord {
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new Error('agent-health: makeUnevaluable() requires a non-empty, specific reason');
  }
  return { ...baseRecord(fields, at), status: 'unevaluable', reason: reason.trim() };
}

// ─── 1. stop_reason ────────────────────────────────────────────────────────────

/**
 * Stop reasons that mean "the model finished saying what it had to say".
 * `pause_turn` and `tool_use` are complete turns awaiting continuation, not
 * truncations — the content produced so far is whole.
 */
const COMPLETE_STOPS = new Set(['end_turn', 'stop_sequence', 'tool_use', 'pause_turn']);

/**
 * The single signal that would have caught the month-long audit truncation on
 * day one. Five consecutive runs stopped at exactly 4000 output tokens and
 * nothing anywhere held an opinion about that.
 *
 * An UNRECOGNISED stop reason is unevaluable, not evaluated. A new SDK value we
 * have never seen is precisely the case where assuming success is unearned.
 */
export function classifyStop(input: {
  stopReason: string | null | undefined;
  outputTokens: number | null;
  maxTokens: number | null;
}): { status: Evaluability; reason: string | null } {
  const { stopReason, outputTokens, maxTokens } = input;

  if (stopReason === null || stopReason === undefined) {
    return {
      status: 'unevaluable',
      reason:
        'the response carried no stop_reason, so whether it is complete or truncated is UNKNOWN. ' +
        'Treat its output as unevaluable, not as empty.',
    };
  }

  if (stopReason === 'max_tokens') {
    const at = outputTokens === null ? 'an unrecorded' : `${outputTokens}`;
    const ceiling = maxTokens === null ? 'its' : `its ${maxTokens}-token`;
    return {
      status: 'unevaluable',
      reason:
        `TRUNCATED — the response hit ${ceiling} max_tokens ceiling at ${at} output tokens. ` +
        `Everything after the cut is missing and nothing downstream can tell. This is the exact ` +
        `shape of the audit running at max_tokens:4000 for a month, silently dropping every ` +
        `finding past the executive summary. Raise max_tokens at the call site and re-run.`,
    };
  }

  if (stopReason === 'refusal') {
    return {
      status: 'unevaluable',
      reason: 'the model refused to complete this turn — no output was produced, which is not the same as no findings.',
    };
  }

  if (!COMPLETE_STOPS.has(stopReason)) {
    return {
      status: 'unevaluable',
      reason:
        `unrecognised stop_reason ${JSON.stringify(stopReason)} — this code has never seen it and ` +
        `cannot claim the response is complete. Add it to COMPLETE_STOPS in scripts/lib/agent-health.ts ` +
        `once its meaning is confirmed.`,
    };
  }

  return { status: 'evaluated', reason: null };
}

// ─── 2. input floor ────────────────────────────────────────────────────────────

export class InputFloorViolation extends Error {
  constructor(
    public label: string,
    public tokens: number,
    public floor: number,
    message: string
  ) {
    super(message);
    this.name = 'InputFloorViolation';
  }
}

/**
 * Assert an agent was actually given its context.
 *
 * `assertPromptBudget()` guards the ceiling because decisions-log.md grows
 * forever. This guards the floor because the read path can shrink without
 * anyone noticing: a `.slice()`, a renamed wiki page, a `readWikiPage()` that
 * returns '' for a file that moved. On 2026-07 the audit received 1.4% of a
 * 43,670-token synthesis — roughly 610 tokens — and ran happily for a month.
 *
 * The floor is deliberately far BELOW a healthy run rather than near it. Its
 * job is to catch collapse, not drift; a floor tuned tight would fire on a
 * normal week, get raised, and stop meaning anything.
 */
export function assertInputFloor(label: string, text: string, floorTokens: number): number {
  const tokens = approxTokens(text);
  if (tokens < floorTokens) {
    throw new InputFloorViolation(
      label,
      tokens,
      floorTokens,
      `${label}: prompt context is ~${tokens.toLocaleString()} tokens, UNDER the ` +
        `${floorTokens.toLocaleString()} floor. REFUSING to run on a fragment. An agent given 1.4% of ` +
        `its context does not produce 1.4% of an answer — it produces a confident wrong one, because ` +
        `slicing keeps the top of a file and the top is the oldest strategy. Check that every wiki page ` +
        `this agent reads still exists at the path it reads, then re-run.`
    );
  }
  return tokens;
}

// ─── 3. detector verdicts ──────────────────────────────────────────────────────

/**
 * WHICH ARTEFACT A DETECTOR ACTUALLY OPENED.
 *
 *   source   — the repo's own inputs: .astro files, JSON data, wiki pages.
 *   rendered — what the build emitted: dist/ HTML.
 *   live     — what the internet serves: a fetched or browser-loaded page.
 *
 * These are three different artefacts and a defect can exist in any one without
 * existing in the others. The distinction is the whole point of this section.
 */
export type DetectorSurface = 'source' | 'rendered' | 'live';

export interface DetectorVerdict {
  /** 'lint-content' | 'probe-summary' | 'audit' | ... */
  detector: string;
  /** The surface actually opened. */
  read: DetectorSurface;
  /** The surface whose defects this verdict is being taken to cover. */
  claims: DetectorSurface;
  /** Units actually inspected on `read` (pages, files, records). null = not counted. */
  inspected: number | null;
  /** Violations found. null = NOT MEASURED. Never 0-as-unknown. */
  violations: number | null;
}

/**
 * THE HIGHEST-VALUE RULE IN THIS FILE.
 *
 * On 2026-08-09 a content-spec gate reported "no violations" and was believed.
 * It had read the `.astro` SOURCE; the defects it was trusted to catch lived in
 * the RENDERED `dist/` HTML, inside table markup its context matching could not
 * see. 26 real defects shipped behind a green check. A human found them by
 * opening the built output.
 *
 *   A DETECTOR THAT READS ONLY ITS INPUTS CANNOT SEE WHAT ITS OWN TRANSFORM EMITS.
 *
 * So a CLEAN verdict — and only a clean verdict — is refused when the surface
 * read is not the surface claimed. A verdict that FOUND violations is still
 * believed: reading the source and finding a real defect is a true positive
 * regardless of surface, and refusing it would suppress genuine findings. It is
 * the absence of findings that the surface gap makes meaningless.
 *
 * The zero-inspected rule is the same argument at its limit: a detector that
 * opened nothing has found nothing for reasons entirely unrelated to the site.
 */
export function judgeVerdict(v: DetectorVerdict): { status: Evaluability; reason: string | null } {
  if (v.violations === null) {
    return {
      status: 'unevaluable',
      reason: `${v.detector} did not measure violations — a null count is not a clean bill of health.`,
    };
  }

  if (v.inspected === null) {
    return {
      status: 'unevaluable',
      reason:
        `${v.detector} reported ${v.violations} violation(s) but did not record how many units it ` +
        `inspected, so the result cannot be sized. An uncounted denominator is not a measurement.`,
    };
  }

  if (v.inspected === 0) {
    return {
      status: 'unevaluable',
      reason:
        `${v.detector} inspected ZERO units on the ${v.read} surface. "No violations" here is the ` +
        `silence of an unplugged alarm, not evidence of health.`,
    };
  }

  if (v.violations === 0 && v.read !== v.claims) {
    return {
      status: 'unevaluable',
      reason:
        `${v.detector} read the ${v.read} surface but its clean verdict is being taken to cover the ` +
        `${v.claims} surface. A detector that reads only its inputs cannot see what its own transform ` +
        `emits — on 2026-08-09 exactly this reported "no violations" on source while dist/ carried 26. ` +
        `Either re-run it against ${v.claims}, or stop treating its silence as coverage of ${v.claims}.`,
    };
  }

  return { status: 'evaluated', reason: null };
}

/** Fold a verdict into a health record, so blindness and truncation land in one log. */
export function verdictRecord(
  v: DetectorVerdict,
  fields: AgentHealthFields,
  at: Date = new Date()
): AgentHealthRecord {
  const judged = judgeVerdict(v);
  return judged.status === 'evaluated'
    ? makeEvaluated(fields, at)
    : makeUnevaluable(judged.reason ?? 'unevaluable', fields, at);
}

// ─── Persistence ───────────────────────────────────────────────────────────────

/**
 * Append one record as a JSONL line. Exported with an explicit path so tests can
 * write to a temp file instead of the live log. Throws on failure — callers
 * decide whether that is fatal (`recordAgentHealth` says no).
 */
export function appendAgentHealth(record: AgentHealthRecord, path: string = AGENT_HEALTH_PATH): void {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(record)}\n`);
}

/**
 * Append, but never let a logging failure destroy the caller's work. Modelled on
 * `appendRecordSafely` in metered-client.ts, including the loud stderr line:
 * deliberately NOT an empty catch (lint rule R3), because a health log that can
 * fail silently is the same joke as a smoke alarm with a dead battery.
 *
 * An `unevaluable` record additionally prints its reason at warning volume, so
 * the signal reaches CI logs on the night it happens rather than waiting for a
 * reader to open the nightly.
 */
export function recordAgentHealth(record: AgentHealthRecord, path: string = AGENT_HEALTH_PATH): boolean {
  if (record.status === 'unevaluable') {
    console.error(
      `[agent-health] UNEVALUABLE — ${record.agent}${record.purpose === undefined ? '' : ` (${record.purpose})`}\n` +
        `  ${record.reason}`
    );
  }
  try {
    appendAgentHealth(record, path);
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      `[agent-health] LOG WRITE FAILED — the run happened but its health was NOT recorded.\n` +
        `  file:   ${path}\n` +
        `  reason: ${reason}\n` +
        `  record: ${JSON.stringify(record)}`
    );
    return false;
  }
}

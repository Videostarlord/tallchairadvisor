/**
 * probes/assertions.ts — pure verdicts over a ProbeResult.
 *
 * Deliberately free of Playwright and of `fs` so every rule here is unit-testable
 * without a browser (see __tests__/assertions.test.ts). The browser's only job is to
 * observe; deciding what an observation MEANS happens here, where it can be checked.
 *
 * Every failing assertion carries the closure predicate that would prove it fixed.
 * PRD §7.3: "If an agent cannot state how a fix would be verified, it does not get to
 * claim the problem exists." That rule is enforced at the ledger's write path — this
 * module simply never produces a finding without one.
 */

import type { ProbeResult, ProbeVisualViewport } from './types.js';

/** Google truncates around 155–160; the site's own audit rule is 130–155 ideal. */
export const META_MIN = 130;
export const META_MAX = 165;

/**
 * P1. Percentage of changed pixels above which a page is reported as visually
 * regressed.
 *
 * Lives HERE, not in visual.ts, so this module keeps its promise to import
 * neither Playwright nor `fs` — visual.ts imports the constant from here rather
 * than the other way round, and the dependency runs pure -> impure.
 *
 * 2% is the plan's starting guess and is NOT calibrated. `visual-regression` is
 * therefore absent from BLOCKING_CLASSES in pr-gate.ts and stays advisory until a
 * week of real diffs justifies a number. Wiring an uncalibrated threshold to a
 * merge gate is how a gate becomes noise everyone clicks through.
 */
export const VISUAL_DIFF_THRESHOLD_PCT = 2;

export interface ProbeFinding {
  page: string;
  issueClass: string;
  severity: 'high' | 'medium' | 'low';
  summary: string;
  closurePredicate: Record<string, unknown>;
}

// ─── JSON-LD ───────────────────────────────────────────────────────────────────

type Node = Record<string, unknown>;

function nodesOf(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodesOf);
  if (value === null || typeof value !== 'object') return [];
  const obj = value as Node;
  if (Array.isArray(obj['@graph'])) return (obj['@graph'] as unknown[]).flatMap(nodesOf);
  return [obj];
}

function typesOf(node: Node): string[] {
  const t = node['@type'];
  if (typeof t === 'string') return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === 'string');
  return [];
}

function nonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * A FAQPage is valid when it has a non-empty mainEntity of Questions, each with a
 * name and an acceptedAnswer carrying text. Google rejects the rich result otherwise,
 * so "present but malformed" must not read as valid.
 *
 * Returns null when the page carries no FAQPage node at all — the caller decides
 * whether absence is a failure (it is not, for pages that never claimed one).
 */
export function faqPageValidity(rawBlocks: string[]): boolean | null {
  let found = false;
  for (const raw of rawBlocks) {
    let parsed: unknown;
    try {
      // lint-architecture-allow R4 -- parsing untrusted JSON-LD scraped from a live page, not a data file; malformed blocks are the expected case
      parsed = JSON.parse(raw);
      // lint-architecture-allow R3 -- an unparseable block is reported separately by probe-page.ts jsonLdParseErrors; skipping it here is the handled path
    } catch {
      continue;
    }
    for (const node of nodesOf(parsed)) {
      if (!typesOf(node).includes('FAQPage')) continue;
      found = true;
      const main = node.mainEntity;
      if (!Array.isArray(main) || main.length === 0) return false;
      for (const q of main) {
        if (q === null || typeof q !== 'object') return false;
        const question = q as Node;
        if (!typesOf(question).includes('Question')) return false;
        if (!nonEmptyString(question.name)) return false;
        const answer = question.acceptedAnswer;
        if (answer === null || typeof answer !== 'object') return false;
        const a = answer as Node;
        if (!typesOf(a).includes('Answer')) return false;
        if (!nonEmptyString(a.text)) return false;
      }
    }
  }
  return found ? true : null;
}

/** First `"@type":"X"` in a block that failed to parse — enough to name a predicate. */
export function salvageTypeFromRaw(raw: string): string | null {
  const m = raw.match(/"@type"\s*:\s*"([A-Za-z][A-Za-z0-9]*)"/);
  return m === null ? null : m[1];
}

// ─── Canonical ─────────────────────────────────────────────────────────────────

/** Canonical must resolve to this very URL. Origin-insensitive so previews pass. */
export function canonicalIsSelf(canonical: string | null, path: string): boolean {
  if (canonical === null) return false;
  const canonicalPath = canonical.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0] || '/';
  const normalise = (p: string) => (p === '/' ? '/' : p.endsWith('/') ? p : `${p}/`);
  return normalise(canonicalPath) === normalise(path);
}

// ─── Findings ──────────────────────────────────────────────────────────────────

/**
 * Every failing assertion on one probed page, each with its closure predicate.
 *
 * Skipped and unhealthy records produce NOTHING. An unhealthy record means the probe
 * could not complete — filing findings from it would manufacture claims out of the
 * system's own blindness, which is the failure mode §7.3's `unevaluable` verdict
 * exists to prevent.
 */
export function deriveFindings(result: ProbeResult): ProbeFinding[] {
  if (result.skipped !== null || !result.healthy) return [];
  const url = result.url;
  const out: ProbeFinding[] = [];

  if (result.consoleErrors.length > 0 || result.unhandledRejections.length > 0) {
    out.push({
      page: url,
      issueClass: 'console-errors',
      severity: 'medium',
      summary: `${result.consoleErrors.length} console error(s), ${result.unhandledRejections.length} unhandled rejection(s): ${
        result.consoleErrors[0]?.text ?? result.unhandledRejections[0] ?? ''
      }`.slice(0, 400),
      closurePredicate: { kind: 'no-console-errors', url },
    });
  }

  if (!result.network.gtagFired) {
    out.push({
      page: url,
      issueClass: 'tag-not-firing-gtag',
      severity: 'high',
      summary: 'No GA4 /g/collect request completed on this page — analytics is blind here (June 16 CSP class).',
      closurePredicate: { kind: 'tag-fires', url, tag: 'gtag' },
    });
  }

  if (!result.network.clarityLoaded) {
    out.push({
      page: url,
      issueClass: 'tag-not-firing-clarity',
      severity: 'medium',
      summary: 'No successful *.clarity.ms response on this page — Clarity session recording is not running.',
      closurePredicate: { kind: 'tag-fires', url, tag: 'clarity' },
    });
  }

  const desc = result.head.metaDescription;
  const len = desc === null ? 0 : desc.length;
  if (desc === null || len < META_MIN || len > META_MAX) {
    out.push({
      page: url,
      issueClass: 'meta-description-length',
      severity: 'medium',
      summary: desc === null
        ? 'No meta description in the rendered head.'
        : `Meta description is ${len} chars, outside ${META_MIN}–${META_MAX}.`,
      closurePredicate: { kind: 'meta-length', url, min: META_MIN, max: META_MAX },
    });
  }

  if (!canonicalIsSelf(result.head.canonical, url)) {
    out.push({
      page: url,
      issueClass: 'canonical-not-self',
      severity: 'high',
      summary: `Canonical is ${result.head.canonical ?? '(absent)'}, expected ${url}.`,
      closurePredicate: { kind: 'canonical-self', url },
    });
  }

  for (const error of result.head.jsonLdParseErrors) {
    const type = salvageTypeFromRaw(error) ?? null;
    if (type === null) continue; // Unnameable type → no predicate → no finding. Stays in errors[].
    out.push({
      page: url,
      issueClass: `schema-parse-${type}`,
      severity: 'high',
      summary: `A JSON-LD block containing ${type} failed to parse: ${error}`.slice(0, 400),
      closurePredicate: { kind: 'schema-valid', url, type },
    });
  }

  if (result.geo.faqPageSchemaValid === false && result.head.jsonLd.some((b) => b.type.includes('FAQPage'))) {
    out.push({
      page: url,
      issueClass: 'faqpage-schema-invalid',
      severity: 'medium',
      summary: 'FAQPage node present but malformed (missing Question/acceptedAnswer/text).',
      closurePredicate: { kind: 'schema-valid', url, type: 'FAQPage' },
    });
  }

  if (!result.geo.directAnswerPresent || !result.geo.citationCapsulePresent) {
    const missing = [
      result.geo.directAnswerPresent ? null : 'Direct Answer block',
      result.geo.citationCapsulePresent ? null : 'citation capsule (<!-- tca-aio-capsule -->)',
    ].filter((x): x is string => x !== null);
    out.push({
      page: url,
      issueClass: 'geo-capsule-missing',
      severity: 'low',
      summary: `Missing ${missing.join(' and ')} — page is not answer-first for AI Overviews.`,
      closurePredicate: { kind: 'geo-capsule', url },
    });
  }

  // ── P1 visual regression ─────────────────────────────────────────────────────
  // Reads numbers the probe already computed rather than doing I/O here, which
  // keeps deriveFindings pure AND means the skipped/unhealthy guard at the top of
  // this function covers visual findings for free. A page that failed to load
  // files no visual finding — the `unevaluable` guard in pr-gate.ts is what stops
  // that reading as a pass, exactly as for every other class.
  //
  // `diffPct === null` NEVER files. It means no comparison happened (no baseline,
  // capture failed, dimensions changed) and a finding would assert something
  // nobody measured.
  // `visual` is absent entirely on every probe artifact written before P1, and
  // pr-gate.ts re-derives findings from stored artifacts — so this must tolerate
  // `undefined`, not just `null`, or the gate crashes on any older file.
  if (result.visual !== null && typeof result.visual === 'object') {
    for (const viewport of ['desktop', 'mobile'] as const) {
      const v = result.visual[viewport] as ProbeVisualViewport | undefined;
      if (v === undefined || v === null || typeof v !== 'object') continue;
      if (typeof v.diffPct !== 'number') continue;
      if (v.diffPct < VISUAL_DIFF_THRESHOLD_PCT) continue;
      out.push({
        page: url,
        issueClass: 'visual-regression',
        severity: 'medium',
        summary: `${viewport} rendering differs from baseline by ${v.diffPct}% (threshold ${VISUAL_DIFF_THRESHOLD_PCT}%). Re-baseline if the change was intended.`,
        closurePredicate: { kind: 'visual-diff', url, viewport, maxPct: VISUAL_DIFF_THRESHOLD_PCT },
      });
    }
  }

  return out;
}

// ─── Run summary ───────────────────────────────────────────────────────────────

export interface Summary {
  probed: number;
  skippedRedirectSource: number;
  skippedNoindex: number;
  unhealthy: number;
  partial: number;
  failures: Record<string, number>;
}

export function summarise(results: ProbeResult[]): Summary {
  const summary: Summary = {
    probed: 0,
    skippedRedirectSource: 0,
    skippedNoindex: 0,
    unhealthy: 0,
    partial: 0,
    failures: {},
  };
  for (const r of results) {
    if (r.skipped === 'redirect-source') { summary.skippedRedirectSource++; continue; }
    if (r.skipped === 'noindex') { summary.skippedNoindex++; continue; }
    summary.probed++;
    if (!r.healthy) summary.unhealthy++;
    else if (r.errors.length > 0) summary.partial++;
    for (const finding of deriveFindings(r)) {
      summary.failures[finding.issueClass] = (summary.failures[finding.issueClass] ?? 0) + 1;
    }
  }
  return summary;
}

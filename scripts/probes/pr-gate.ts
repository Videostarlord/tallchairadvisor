/**
 * probes/pr-gate.ts — A9. Turns a preview-URL probe run into a deploy decision.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS A SEPARATE STEP AND NOT AN EXIT CODE IN run.ts
 *
 * `npm run probe` exits non-zero ONLY when the harness itself could not run. That is
 * deliberate and documented at the top of run.ts: "an exit code that means 'the site
 * has a problem' trains everyone to ignore red." The nightly depends on that contract
 * — a failing assertion there is a SUCCESSFUL observation.
 *
 * A PR gate needs the opposite: a non-zero exit when the site has a specific kind of
 * problem. Rather than break the nightly's contract, this reads the probe's artifact
 * and makes its own decision. run.ts keeps meaning "did the observation work"; this
 * file means "may this ship".
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * WHAT BLOCKS, AND WHY ONLY THESE
 *
 * Blocking (A9): a regression a human did not intend and cannot see in a diff.
 *   console-errors · tag-not-firing-gtag · tag-not-firing-clarity · canonical-not-self
 *
 * Non-blocking: meta-description-length, geo-capsule-missing, faqpage-schema-invalid.
 * These are strategy calls owned by the kill list and the nightly, not deploy blockers.
 * A `geo-capsule-missing` finding stopping a merge would let a content directive
 * silently become a build gate — precisely the coupling the strategy classifier
 * (data/strategy-rules.json) was built to prevent.
 *
 * Findings are re-derived here with deriveFindings() rather than re-implemented. The
 * probe artifact stores `results`, not findings, and a second implementation of the
 * assertions would drift from the first — a lesson learned the expensive way when a
 * hand-written mirror of probe-page.ts was used to verify the 2026-08-08 GEO rollout.
 *
 * Usage:
 *   tsx scripts/probes/pr-gate.ts --in probe-pr.json [--expect-pages N]
 */

import { readFileSync, appendFileSync } from 'fs';
import { deriveFindings, type ProbeFinding } from './assertions.js';
import type { ProbeFile, ProbeResult } from './types.js';

/** A9: these three classes only. Kept as a frozen set so adding one is a visible diff. */
export const BLOCKING_CLASSES: ReadonlySet<string> = new Set([
  'console-errors',
  'tag-not-firing-gtag',
  'tag-not-firing-clarity',
  'canonical-not-self',
]);

export interface GateVerdict {
  blocking: ProbeFinding[];
  advisory: ProbeFinding[];
  probed: number;
  /** Set when the gate REFUSES TO JUDGE. Never conflated with "passed". */
  unevaluable: string | null;
}

/**
 * A probe that observed nothing must not read as a clean bill of health. This is the
 * same rule the predicate layer applies with `unevaluable` and the probe applies with
 * `healthy:false`: silence is not evidence of absence. A gate that passes when the
 * browser never launched is worse than no gate, because it is trusted.
 */
export function evaluate(file: ProbeFile, expectPages: number | null): GateVerdict {
  const results: ProbeResult[] = Array.isArray(file.results) ? file.results : [];
  const findings = results.flatMap(deriveFindings);
  const blocking = findings.filter((f) => BLOCKING_CLASSES.has(f.issueClass));
  const advisory = findings.filter((f) => !BLOCKING_CLASSES.has(f.issueClass));

  let unevaluable: string | null = null;
  if (results.length === 0) {
    unevaluable = 'the probe returned zero results — nothing was observed, so nothing is proven';
  } else if (expectPages !== null && results.length < expectPages) {
    unevaluable = `probed ${results.length} page(s) but expected ${expectPages} — the run was truncated`;
  } else {
    // Two ways a record yields no findings without the page being fine:
    // `healthy:false` (the probe could not complete) and `skipped` (redirect source
    // or noindex). deriveFindings returns nothing for both, by design. Counting
    // either as a pass would make an outage — or a gate pointed at a list of
    // redirects — indistinguishable from a clean run.
    const blind = results.filter((r) => r.healthy === false || r.skipped !== null);
    if (blind.length === results.length) {
      unevaluable = `no page was actually observed — all ${results.length} were unhealthy or skipped`;
    } else if (blind.length > 0) {
      unevaluable =
        `${blind.length} of ${results.length} page(s) produced no findings because they were unhealthy or skipped: ` +
        blind.map((r) => `${r.url}${r.skipped !== null ? ` (${r.skipped})` : ' (unhealthy)'}`).join(', ');
    }
  }

  return { blocking, advisory, probed: results.length, unevaluable };
}

function summary(v: GateVerdict, base: string): string {
  const l: string[] = [`## Preview probe — ${base}`, ''];
  if (v.unevaluable !== null) {
    l.push(`### ⚠️ Unevaluable`, '', v.unevaluable, '', 'Treated as a failure. A gate that cannot see cannot approve.', '');
  }
  l.push(`Probed **${v.probed}** page(s) · **${v.blocking.length}** blocking · **${v.advisory.length}** advisory`, '');
  if (v.blocking.length > 0) {
    l.push('### ❌ Blocking', '', '| page | class | detail |', '|---|---|---|');
    for (const f of v.blocking) l.push(`| \`${f.page}\` | \`${f.issueClass}\` | ${f.summary.replace(/\|/g, '\\|')} |`);
    l.push('');
  }
  if (v.advisory.length > 0) {
    l.push(
      '<details><summary>Advisory — not deploy blockers (strategy calls, owned by the nightly)</summary>',
      '',
      '| page | class | detail |',
      '|---|---|---|',
    );
    for (const f of v.advisory) l.push(`| \`${f.page}\` | \`${f.issueClass}\` | ${f.summary.replace(/\|/g, '\\|')} |`);
    l.push('', '</details>', '');
  }
  if (v.blocking.length === 0 && v.unevaluable === null) l.push('✅ No tag, canonical, or console regressions on the probed pages.');
  return l.join('\n');
}

function main(): void {
  const argv = process.argv.slice(2);
  const read = (flag: string): string | null => {
    const i = argv.indexOf(flag);
    if (i === -1) return null;
    const v = argv[i + 1];
    if (v === undefined) throw new Error(`${flag} requires a value`);
    return v;
  };

  const input = read('--in') ?? 'probe-pr.json';
  const expectRaw = read('--expect-pages');
  const expectPages = expectRaw === null ? null : Number.parseInt(expectRaw, 10);
  if (expectPages !== null && !Number.isFinite(expectPages)) throw new Error('--expect-pages must be a number');

  // lint-architecture-allow R4 -- this reads the artifact run.ts wrote one step earlier in the same job, not external input; a malformed file throws here and fails the gate, which is the correct outcome
  const file = JSON.parse(readFileSync(input, 'utf-8')) as ProbeFile;
  const verdict = evaluate(file, expectPages);
  const text = summary(verdict, typeof file.siteUrl === 'string' ? file.siteUrl : '(unknown base)');

  console.log(text);
  const stepSummary = process.env.GITHUB_STEP_SUMMARY;
  if (stepSummary !== undefined && stepSummary !== '') appendFileSync(stepSummary, `${text}\n`);

  if (verdict.unevaluable !== null || verdict.blocking.length > 0) process.exit(1);
}

/** Only run as a script, so the test can import evaluate(). */
const invokedDirectly = process.argv[1] !== undefined && /pr-gate\.ts$/.test(process.argv[1]);
if (invokedDirectly) main();

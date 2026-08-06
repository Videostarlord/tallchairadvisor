/**
 * strategy-filter.ts — deterministic enforcement of the ROUTING DIRECTIVE
 *
 * WHY THIS EXISTS
 * On 2026-08-06 the audit filed findings recommending meta rewrites on
 * /knee-pain-seat-depth/ and /correct-chair-dimensions/ — pages the kill list
 * has forbidden touching since 2026-07-24. The first cause was truncation: the
 * auditor received 1.4% of the synthesis and none of the directive. That was
 * fixed. With the FULL directive in the prompt, three violations still landed.
 *
 * So the prompt layer cannot enforce this, which is the same lesson
 * assert-safe-to-act.ts already records: guarding upstream is an optimization,
 * the deterministic gate is the guarantee.
 *
 * IT SEPARATES, IT DOES NOT DELETE
 * Every finding stays in data/audit-findings.json. Classified ones move to
 * `outOfStrategy[]` carrying the rule id and the directive text that classified
 * them. They are visible in the rendered report and in the nightly. They are
 * simply not fed to the planner, which has five slots and should spend them on
 * work the current strategy actually wants.
 *
 * This distinction is the whole design. A filter that deleted findings would be
 * indistinguishable from an audit that never found them — and if the strategy
 * changes, you would have no record of what was hidden. Reversing a
 * classification is one line in data/strategy-rules.json; the findings return on
 * the next audit because they were never destroyed.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { AuditFinding } from './audit-findings.js';

export interface StrategyRule {
  id: string;
  directive: string;
  why: string;
  issueClasses: string[];
  pages?: string[];
  exceptPages?: string[];
  positionWorseThan?: number;
}

export interface StrategyRules {
  adoptedOn: string;
  source: string;
  reviewBy?: string;
  alwaysInScope: { issueClasses: string[] };
  rules: StrategyRule[];
}

/** One finding held back, with the reason a human can audit. */
export interface OutOfStrategyEntry {
  findingId: string;
  page: string;
  issueClass: string;
  severity: string;
  summary: string;
  /** Which rule classified it. */
  ruleId: string;
  /** The directive text, verbatim, so the report can quote the source. */
  directive: string;
  /** Why this rule exists. */
  why: string;
}

/** Normalize to path form with a trailing slash, matching makeFindingId. */
function normalizePage(page: string): string {
  const path = page.replace(/^https?:\/\/[^/]+/, '');
  return path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}/`;
}

export function loadStrategyRules(root: string): StrategyRules | null {
  const path = resolve(root, 'data/strategy-rules.json');
  if (!existsSync(path)) return null;
  try {
    // lint-architecture-allow R4 -- read before scripts/schemas exists in this path; shape is asserted immediately below
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as StrategyRules;
    if (!Array.isArray(parsed.rules) || !parsed.alwaysInScope) {
      console.error('[strategy-filter] data/strategy-rules.json is malformed (no rules/alwaysInScope) — NOT filtering.');
      return null;
    }
    return parsed;
  } catch (error) {
    // Failing open is deliberate here. If the rules cannot be read, the correct
    // behaviour is to show Jackson every finding, not to hide findings using a
    // config nobody could parse.
    console.error(
      `[strategy-filter] cannot read data/strategy-rules.json — NOT filtering, every finding will be shown:\n  ` +
        `${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/**
 * Split findings into what the current strategy wants worked on and what it
 * does not. `positions` maps page → GSC position, used by the position rule;
 * a page with no position data is never classified by that rule, because
 * "unknown" must not be treated as "bad".
 */
export function classifyFindings(
  findings: AuditFinding[],
  rules: StrategyRules | null,
  positions: Map<string, number>,
): { inScope: AuditFinding[]; outOfStrategy: OutOfStrategyEntry[] } {
  if (!rules) return { inScope: findings, outOfStrategy: [] };

  const always = new Set(rules.alwaysInScope.issueClasses);
  const inScope: AuditFinding[] = [];
  const outOfStrategy: OutOfStrategyEntry[] = [];

  for (const f of findings) {
    // Correctness and revenue findings are never held back, whatever the rules say.
    if (always.has(f.issueClass)) {
      inScope.push(f);
      continue;
    }

    const page = normalizePage(f.page);
    let matched: StrategyRule | null = null;

    for (const rule of rules.rules) {
      if (!rule.issueClasses.includes(f.issueClass)) continue;
      if (rule.exceptPages?.map(normalizePage).includes(page)) continue;

      if (rule.pages && rule.pages.map(normalizePage).includes(page)) {
        matched = rule;
        break;
      }
      if (rule.positionWorseThan !== undefined) {
        const pos = positions.get(page);
        // Unknown position → not classified. Never guess a page into silence.
        if (pos !== undefined && pos > rule.positionWorseThan) {
          matched = rule;
          break;
        }
      }
      // A rule with neither `pages` nor `positionWorseThan` applies to its
      // issueClasses everywhere (e.g. the content freeze).
      if (!rule.pages && rule.positionWorseThan === undefined) {
        matched = rule;
        break;
      }
    }

    if (matched) {
      outOfStrategy.push({
        findingId: f.findingId,
        page: f.page,
        issueClass: f.issueClass,
        severity: f.severity,
        summary: f.summary,
        ruleId: matched.id,
        directive: matched.directive,
        why: matched.why,
      });
    } else {
      inScope.push(f);
    }
  }

  return { inScope, outOfStrategy };
}

/** Human-readable block for the rendered report. */
export function renderOutOfStrategy(entries: OutOfStrategyEntry[], rules: StrategyRules | null): string {
  if (entries.length === 0) return '';
  const byRule = new Map<string, OutOfStrategyEntry[]>();
  for (const e of entries) {
    const list = byRule.get(e.ruleId);
    if (list) list.push(e);
    else byRule.set(e.ruleId, [e]);
  }

  const parts: string[] = [
    `## Held Back by the Current Strategy`,
    ``,
    `These findings are real and were NOT deleted — they are recorded in`,
    `\`data/audit-findings.json\` under \`outOfStrategy\`. They are withheld from the`,
    `weekly planner because the standing directive (${rules?.source ?? 'thesis.md'},`,
    `adopted ${rules?.adoptedOn ?? 'unknown'}) says this work does not pay right now.`,
    ``,
    `To act on any of them, edit \`data/strategy-rules.json\` — they return on the next audit.`,
    ``,
  ];

  for (const [ruleId, list] of byRule) {
    const first = list[0];
    parts.push(`### ${ruleId} (${list.length})`, ``, `> ${first.directive}`, ``, `**Why:** ${first.why}`, ``);
    for (const e of list) {
      parts.push(`- \`${e.findingId}\` **${e.page}** — ${e.issueClass} (${e.severity}) — ${e.summary}`);
    }
    parts.push(``);
  }
  return parts.join('\n');
}

/** page → position, from data/gsc/analysis.json opportunities. */
export function loadPositions(root: string): Map<string, number> {
  const out = new Map<string, number>();
  const path = resolve(root, 'data/gsc/analysis.json');
  if (!existsSync(path)) return out;
  try {
    // lint-architecture-allow R4 -- optional enrichment; an unreadable file must not block the audit
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as { opportunities?: Array<{ page?: string; position?: number }> };
    // Explicit, not defaulted: an analysis file with no `opportunities` key is
    // the exact shape that broke reconcileInterventions for months. Say so.
    if (!Array.isArray(raw.opportunities)) {
      console.error("[strategy-filter] data/gsc/analysis.json has no 'opportunities' array — the position rule will not classify anything.");
      return out;
    }
    for (const row of raw.opportunities) {
      if (typeof row.page === 'string' && typeof row.position === 'number') {
        out.set(normalizePage(row.page), row.position);
      }
    }
  } catch {
    console.error('[strategy-filter] could not read GSC positions — the position rule will not classify anything.');
  }
  return out;
}

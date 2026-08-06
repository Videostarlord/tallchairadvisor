/**
 * audit-findings.ts — structured, addressable audit findings
 *
 * WHY THIS EXISTS
 * The audit used to emit free markdown, and its finding IDs (C-1, H-1, …) were
 * invented by the model — renumbered from scratch every week. That made two
 * things impossible:
 *
 *   1. Retraction. "C-1 is wrong" is meaningless next Tuesday when C-1 is a
 *      different finding. A ledger needs a key that survives regeneration.
 *   2. Full delivery. strategy.ts read the report with .slice(0, 3000), so on a
 *      13,851-char report only the first critical finding reached the planner —
 *      every high and medium finding was silently discarded.
 *
 * A finding is now identified by WHAT IT IS ABOUT (page + issue class), not by
 * its position in a list. Same problem on the same page ⇒ same ID next week,
 * which is what makes retraction, suppression, and week-over-week tracking work.
 */

import { createHash } from 'crypto';

/**
 * Closed set. The model must choose from these — free-text classes would break
 * ID stability, since the ID is derived from the class.
 */
export const ISSUE_CLASSES = [
  'ctr-leak',
  'meta-missing',
  'meta-length',
  'meta-quality',
  'title-length',
  'title-quality',
  'canonical-missing',
  'canonical-wrong',
  'schema-missing',
  'schema-invalid',
  'duplicate-content',
  'cannibalization',
  'spec-error',
  'thin-content',
  'internal-linking',
  'affiliate-missing',
  'aio-suppression',
  'other',
] as const;

export type IssueClass = (typeof ISSUE_CLASSES)[number];
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface AuditFinding {
  /** sha1(page|issueClass) truncated to 12 — stable across regenerations. */
  findingId: string;
  page: string;
  issueClass: IssueClass;
  severity: Severity;
  /** One sentence: what is wrong. */
  summary: string;
  /** What to do about it, specific enough to act on. */
  recommendation: string;
  /** Compact metric context for the planner digest, e.g. "40,195 impr, pos 5.7, 0.04% CTR". */
  evidence?: string;
}

export interface AuditFindingsFile {
  generatedAt: string;
  dateRange: { start: string; end: string };
  executiveSummary: string;
  weeklyFocus: string[];
  pagesNotNeedingAction: string[];
  findings: AuditFinding[];
  /** Findings dropped because they match an entry in data/retractions.jsonl. */
  suppressed: Array<{ findingId: string; page: string; issueClass: string; retractedOn: string }>;
}

/**
 * Content-derived, deterministic. Page is normalized so /x and /x/ collide
 * (they are the same page) and absolute URLs match their path form.
 */
export function makeFindingId(page: string, issueClass: string): string {
  const path = page.replace(/^https?:\/\/[^/]+/, '');
  const normalized = path === '/' ? '/' : `/${path.replace(/^\/|\/$/g, '')}/`;
  return createHash('sha1').update(`${normalized}|${issueClass}`).digest('hex').slice(0, 12);
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function sortFindings(findings: AuditFinding[]): AuditFinding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/**
 * Compact one-line-per-finding digest for the strategy prompt.
 *
 * Replaces `auditReport.slice(0, 3000)` of prose. At ~90-130 chars per line the
 * same budget carries roughly 25-30 findings instead of five, so high and medium
 * findings reach the planner for the first time.
 */
export function renderDigest(findings: AuditFinding[], maxChars = 3000): string {
  const lines = sortFindings(findings).map(f =>
    `[${f.severity}] ${f.page} ${f.issueClass} (${f.findingId}) — ${f.summary}${f.evidence ? ` | ${f.evidence}` : ''}`,
  );
  const out: string[] = [];
  let used = 0;
  for (const line of lines) {
    if (used + line.length + 1 > maxChars) {
      out.push(`… ${lines.length - out.length} lower-severity finding(s) omitted for length`);
      break;
    }
    out.push(line);
    used += line.length + 1;
  }
  return out.join('\n');
}

const SEVERITY_HEADING: Record<Severity, string> = {
  critical: '🔴 CRITICAL',
  high: '🟠 HIGH',
  medium: '🟡 MEDIUM',
  low: '⚪ LOW',
};

/** Human-readable report, rendered FROM the structured data — never hand-parsed. */
export function renderReport(data: AuditFindingsFile): string {
  const parts: string[] = [
    `# TCA Weekly Audit Report`,
    `**Generated:** ${data.generatedAt}`,
    `**Data range:** ${data.dateRange.start} → ${data.dateRange.end}`,
    ``,
    `> Rendered from \`data/audit-findings.json\`. Do not parse this file — downstream`,
    `> agents read the JSON. Finding IDs are \`sha1(page|issueClass)\` and are stable`,
    `> week over week, so they can be retracted in \`data/retractions.jsonl\`.`,
    ``,
    `## Executive Summary`,
    ``,
    data.executiveSummary,
    ``,
  ];

  if (data.suppressed.length > 0) {
    parts.push(`## Suppressed by Retraction Ledger`, ``);
    parts.push(`These findings were raised and then dropped — each matches a retraction in \`data/retractions.jsonl\`:`, ``);
    for (const s of data.suppressed) {
      parts.push(`- \`${s.findingId}\` ${s.page} — ${s.issueClass} (retracted ${s.retractedOn})`);
    }
    parts.push(``);
  }

  parts.push(`## Issues by Severity`, ``);
  const sorted = sortFindings(data.findings);
  let currentSeverity: Severity | null = null;
  for (const f of sorted) {
    if (f.severity !== currentSeverity) {
      currentSeverity = f.severity;
      parts.push(``, `### ${SEVERITY_HEADING[f.severity]}`, ``);
    }
    parts.push(`**\`${f.findingId}\` ${f.page} — ${f.issueClass}**`, ``);
    parts.push(f.summary, ``);
    if (f.evidence) parts.push(`*Evidence:* ${f.evidence}`, ``);
    parts.push(`*Fix:* ${f.recommendation}`, ``);
  }

  if (data.findings.length === 0) parts.push(`_No findings this week._`, ``);

  parts.push(`## Week's Recommended Focus`, ``);
  data.weeklyFocus.forEach((w, i) => parts.push(`${i + 1}. ${w}`));
  parts.push(``);

  if (data.pagesNotNeedingAction.length > 0) {
    parts.push(`## Pages Not Needing Action`, ``, data.pagesNotNeedingAction.map(p => `- ${p}`).join('\n'), ``);
  }

  return parts.join('\n');
}

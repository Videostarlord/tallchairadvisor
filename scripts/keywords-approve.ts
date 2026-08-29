/**
 * keywords-approve.ts — applies lib/keyword-approval.ts to opportunities.json.
 *
 * Replaces the human who was supposed to set `approved: true` and never did:
 * the content pipeline ran for six months and shipped zero pages, not because
 * anything was broken but because this step had no owner.
 *
 * Runs between `keyword:gaps` and `keywords:push` in keywords-monthly.yml, so
 * discovery → approval → roadmap → Friday's page is one unbroken chain with no
 * human in it.
 *
 * WHAT IT WILL NOT DO: invent work. Applied to the queue as it stands today it
 * approves NOTHING, because 16 of 18 candidates are keywords the site already
 * ranks for and the other 2 are synonym-swaps of pages that already exist. A
 * month where nothing qualifies is a real answer and is recorded as one — that
 * is different from, and much better than, a month where nobody looked.
 *
 * Usage: npx tsx scripts/keywords-approve.ts [--dry-run]
 */
import { writeFileSync, renameSync, readdirSync, statSync, existsSync } from 'fs';
import { resolve, dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { judgeBatch, type ApprovalCandidate } from './lib/keyword-approval.js';
import { readValidated } from './lib/read-validated.js';
import { keywordOpportunitiesSchema, keywordOpportunitiesOptions } from './schemas/keyword-opportunities.js';
import { appendWikiLog, today } from './agents/wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OPP = resolve(ROOT, 'data/keywords/opportunities.json');
const DRY = process.argv.includes('--dry-run');

interface Opportunity extends ApprovalCandidate {
  approved: boolean;
  approval_reason?: string;
  approved_at?: string;
  pushed_at?: string;
  [k: string]: unknown;
}

/**
 * Every route the site actually serves, as `/slug/`.
 *
 * Read from src/pages rather than from the roadmap on purpose: the roadmap is
 * the thing being written to, and checking a queue against itself is how a
 * duplicate gets in.
 */
function existingSlugs(): string[] {
  const pagesDir = resolve(ROOT, 'src/pages');
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith('.astro')) continue;
      const rel = relative(pagesDir, full).replace(/\\/g, '/');
      const route = rel === 'index.astro' ? '/' : '/' + rel.replace(/\/index\.astro$/, '').replace(/\.astro$/, '') + '/';
      out.push(route);
    }
  };
  walk(pagesDir);
  return out.sort();
}

function main(): void {
  if (!existsSync(OPP)) {
    console.error(`[keywords-approve] ABORT: ${relative(ROOT, OPP)} not found — run keyword:discovery first`);
    process.exit(1);
  }
  // readValidated, not JSON.parse: this file decides what gets published, and a
  // `tca_status` that arrived malformed would fall through `!== 'ranking'` and
  // be approved. Let it throw.
  const opportunities = readValidated(OPP, keywordOpportunitiesSchema, keywordOpportunitiesOptions) as Opportunity[];
  const slugs = existingSlugs();
  console.log(`[keywords-approve] ${opportunities.length} candidate(s), ${slugs.length} existing page(s)`);

  // Already-pushed entries are settled history and are never re-judged.
  const pending = opportunities.filter((o) => o.pushed_at === undefined);
  const results = judgeBatch(pending, slugs);

  let approvedCount = 0;
  for (const { candidate, verdict } of results) {
    const target = opportunities.find((o) => o.keyword === candidate.keyword && o.pushed_at === undefined);
    if (target === undefined) continue;
    target.approved = verdict.approved;
    target.approval_reason = verdict.reason;
    target.approved_at = new Date().toISOString();
    if (verdict.approved) approvedCount++;
    console.log(`  ${verdict.approved ? 'APPROVE' : 'reject '} ${candidate.keyword.slice(0, 44).padEnd(44)} ${verdict.reason.slice(0, 90)}`);
  }

  console.log(`[keywords-approve] approved ${approvedCount} of ${pending.length} pending`);

  if (DRY) {
    console.log('[keywords-approve] --dry-run: nothing written');
    return;
  }

  // Atomic write — a half-written opportunities file would be read by
  // keywords-push seconds later in the same workflow.
  const tmp = `${OPP}.tmp`;
  writeFileSync(tmp, JSON.stringify(opportunities, null, 2) + '\n');
  renameSync(tmp, OPP);

  appendWikiLog(
    ROOT,
    `## [${today()}] keywords-approve | Automated keyword approval\n\n` +
      `- Candidates judged: ${pending.length} (of ${opportunities.length} total)\n` +
      `- **Approved: ${approvedCount}**\n` +
      `- Existing pages checked against: ${slugs.length}\n` +
      (approvedCount === 0
        ? `- Nothing qualified. This is a recorded result, not a skipped step — see \`approval_reason\` on each entry.\n`
        : results.filter((r) => r.verdict.approved).map((r) => `  - ${r.candidate.keyword} → ${r.candidate.target_slug}\n`).join('')),
  );
}

const invokedDirectly = process.argv[1] !== undefined && /keywords-approve\.ts$/.test(process.argv[1]);
if (invokedDirectly) main();

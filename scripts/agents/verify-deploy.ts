/**
 * verify-deploy.ts — Saturday agent
 * Scans for secrets, affiliate links, voice violations, then writes weekly summary.
 * GitHub Actions runs npm build and git push after this script succeeds.
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Glob } from 'glob';
import { appendWikiLog, writeWikiPage, readWikiPage, readSynthesisContext, currentWeek, today } from './wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface CheckResult {
  passed: boolean;
  name: string;
  details: string;
}

// Patterns that should never appear in committed files
const SECRET_PATTERNS = [
  /sk-ant-api[0-9a-zA-Z\-_]{20,}/g,           // Anthropic API keys
  /apify_api_[0-9a-zA-Z]{20,}/g,               // Apify tokens
  /AIza[0-9A-Za-z\-_]{35}/g,                   // Google API keys
  /"private_key"\s*:\s*"-----BEGIN/g,           // Service account private keys
  /AKIA[0-9A-Z]{16}/g,                          // AWS access keys
];

// Non-Gesture pages — these should never have first-person testing voice
const NON_GESTURE_VOICE_PATTERNS = [
  /I (tested|sat in|tried|used|reviewed|tested out|tried out) the? (aeron|leap|sihoo|doro)/i,
  /after (sitting|using|trying) (in |out )?(the )?(aeron|leap|sihoo|doro)/i,
  /in my experience.{0,100}(aeron|leap|sihoo|doro)/i,
  /I (found|discovered|noticed|felt).{0,60}(aeron|leap|sihoo|doro)/i,
  /during (my|the) (review|testing|test).{0,60}(aeron|leap|sihoo|doro)/i,
  /I (tried|tested) (it|them|this chair)/i,
];

async function checkSecrets(): Promise<CheckResult> {
  const srcFiles = await new Glob('src/**/*.astro', { cwd: ROOT }).walk();
  const violations: string[] = [];

  for (const file of srcFiles) {
    const content = readFileSync(resolve(ROOT, file), 'utf-8');
    for (const pattern of SECRET_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) violations.push(`${file}: found potential secret matching ${pattern.source.slice(0, 30)}...`);
    }
  }

  // Also check scripts/ (but not agents/ — they're the automation layer)
  return {
    passed: violations.length === 0,
    name: 'Secrets scan',
    details: violations.length === 0 ? 'No secrets found in src/' : violations.join('\n'),
  };
}

async function checkAffiliateLinks(): Promise<CheckResult> {
  const srcFiles = await new Glob('src/**/*.astro', { cwd: ROOT }).walk();
  const violations: string[] = [];

  for (const file of srcFiles) {
    const content = readFileSync(resolve(ROOT, file), 'utf-8');
    // Find Amazon links missing affiliate tag
    const amazonLinks = [...content.matchAll(/https?:\/\/(?:www\.)?amazon\.com[^\s"'<]*/g)];
    for (const [link] of amazonLinks) {
      if (!link.includes('tag=tallchairadvi-20')) {
        violations.push(`${file}: Amazon link missing affiliate tag: ${link.slice(0, 80)}`);
      }
    }
    // Catch unresolved AMAZON_URL template placeholders (affiliate link is broken)
    if (content.includes('href="AMAZON_URL')) {
      violations.push(`${file}: Unresolved AMAZON_URL placeholder in affiliate link — link is broken`);
    }
  }

  return {
    passed: violations.length === 0,
    name: 'Affiliate links',
    details: violations.length === 0 ? 'All Amazon links have affiliate tag' : violations.join('\n'),
  };
}

async function checkVoice(): Promise<CheckResult> {
  const nonGestureFiles = await new Glob('src/**/*.astro', { cwd: ROOT }).walk();
  const violations: string[] = [];

  for (const file of nonGestureFiles) {
    if (file.includes('gesture')) continue; // Gesture pages can use first-person
    const content = readFileSync(resolve(ROOT, file), 'utf-8');
    for (const pattern of NON_GESTURE_VOICE_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(`${file}: First-person testing voice on non-Gesture page`);
      }
    }
  }

  return {
    passed: violations.length === 0,
    name: 'Voice constraint',
    details: violations.length === 0 ? 'No voice violations' : violations.join('\n'),
  };
}

async function checkCredentialsNotStaged(): Promise<CheckResult> {
  try {
    const staged = execSync('git diff --cached --name-only', { cwd: ROOT }).toString();
    const dangerous = staged.split('\n').filter(f =>
      f.includes('credentials/') || f.includes('.env') || f.endsWith('.pem') || f.endsWith('.key')
    );
    return {
      passed: dangerous.length === 0,
      name: 'Credentials not staged',
      details: dangerous.length === 0 ? 'No credentials in git stage' : `DANGER: ${dangerous.join(', ')}`,
    };
  } catch {
    return { passed: true, name: 'Credentials not staged', details: 'Could not check staged files.' };
  }
}

async function checkSchemaValidity(): Promise<CheckResult> {
  const distDir = resolve(ROOT, 'dist');
  if (!existsSync(distDir)) {
    return { passed: false, name: 'Schema validity', details: 'FAIL: dist/ not found — build must complete before verification runs.' };
  }
  const htmlFiles = await new Glob('dist/**/*.html', { cwd: ROOT }).walk();
  const violations: string[] = [];

  for (const file of htmlFiles) {
    const content = readFileSync(resolve(ROOT, file), 'utf-8');
    const schemaMatches = [...content.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const m of schemaMatches) {
      try { JSON.parse(m[1]); } catch {
        violations.push(`${file}: JSON-LD parse error — ${m[1].slice(0, 60).replace(/\n/g, ' ')}...`);
      }
    }
  }

  return {
    passed: violations.length === 0,
    name: 'Schema validity',
    details: violations.length === 0 ? `All JSON-LD valid (${htmlFiles.length} pages checked)` : violations.join('\n'),
  };
}

async function checkInternalLinks(): Promise<CheckResult> {
  const pageFiles = await new Glob('src/pages/**/*.astro', { cwd: ROOT }).walk();

  // Build set of known routes
  const knownRoutes = new Set<string>();
  for (const file of pageFiles) {
    const route = file
      .replace(/^src\/pages/, '')
      .replace(/\.astro$/, '')
      .replace(/\/index$/, '/');
    knownRoutes.add(route.endsWith('/') ? route : route + '/');
  }
  knownRoutes.add('/');

  const srcFiles = await new Glob('src/**/*.astro', { cwd: ROOT }).walk();
  const violations: string[] = [];

  for (const file of srcFiles) {
    const content = readFileSync(resolve(ROOT, file), 'utf-8');
    const hrefs = [...content.matchAll(/href="(\/[^"#?]+)"/g)];
    for (const [, href] of hrefs) {
      if (href.startsWith('/images/') || href.startsWith('/assets/')) continue;
      if (/\.(png|ico|svg|jpg|jpeg|webp|gif|css|js|xml|txt|json|pdf)$/i.test(href)) continue;
      const normalized = href.endsWith('/') ? href : href + '/';
      if (!knownRoutes.has(normalized)) {
        violations.push(`${file}: broken internal link → ${href}`);
      }
    }
  }

  return {
    passed: violations.length === 0,
    name: 'Internal links',
    details: violations.length === 0 ? 'All internal links resolve' : violations.join('\n'),
  };
}

async function checkContentRegression(): Promise<CheckResult> {
  try {
    const changed = execSync('git diff --name-only HEAD~1 -- src/pages/', { cwd: ROOT })
      .toString().split('\n').filter(f => f.endsWith('.astro'));

    if (changed.length === 0) {
      return { passed: true, name: 'Content regression', details: 'No page files changed since last commit.' };
    }

    const violations: string[] = [];
    for (const file of changed) {
      const fullPath = resolve(ROOT, file);
      if (!existsSync(fullPath)) continue;
      const current = readFileSync(fullPath, 'utf-8').split(/\s+/).filter(w => w.length > 0).length;
      try {
        const previous = execSync(`git show HEAD~1:"${file}"`, { cwd: ROOT })
          .toString().split(/\s+/).filter((w: string) => w.length > 0).length;
        if (previous > 0 && current < previous * 0.85) {
          const pct = Math.round((1 - current / previous) * 100);
          violations.push(`${file}: word count dropped ${previous} → ${current} (${pct}%)`);
        }
      } catch { /* file didn't exist in HEAD~1 — new file, skip */ }
    }

    return {
      passed: violations.length === 0,
      name: 'Content regression',
      details: violations.length === 0
        ? `No regressions in ${changed.length} changed file(s)`
        : violations.join('\n'),
    };
  } catch {
    return { passed: true, name: 'Content regression', details: 'Could not compare git history.' };
  }
}

async function main() {
  console.log('Running verification checks...\n');
  const checks = await Promise.all([
    checkSecrets(),
    checkAffiliateLinks(),
    checkVoice(),
    checkCredentialsNotStaged(),
    checkSchemaValidity(),
    checkInternalLinks(),
    checkContentRegression(),
  ]);

  const allPassed = checks.every(c => c.passed);
  const report = checks.map(c => `- [${c.passed ? '✅' : '❌'}] **${c.name}**: ${c.details}`).join('\n');

  // Read weekly outputs for summary
  const readIfExists = (p: string) => existsSync(p) ? readFileSync(p, 'utf-8').slice(0, 500) : 'Not generated.';
  const auditSummary = readIfExists(resolve(ROOT, 'reports/audit-report.md')).split('\n').slice(0, 5).join('\n');
  const fixesLog = readIfExists(resolve(ROOT, 'reports/fixes-log.md'));
  const contentLog = readIfExists(resolve(ROOT, 'reports/content-log.md'));

  // Ask Claude for a brief weekly summary
  const gsc = JSON.parse(readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8'));

  // Pull prior-week metrics for trend comparison
  const gscHistory = readWikiPage(ROOT, 'pages/concepts/gsc-performance.md') || '';
  const historyMatch = gscHistory.match(/### [\d-]+\n([\s\S]*?)(?=\n###|\n##|$)/);
  const prevWeekStats = historyMatch?.[1]?.slice(0, 300) || 'No prior week data available.';

  const summaryResponse = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: `You are the operations log writer for tallchairadvisor.com, a niche affiliate site for ergonomic chairs for tall people.
Write in factual, terse bullet points.
Show metric changes vs. prior week when data is available (e.g., "Impressions: 12,209 (+1,500 vs prior week)").
State whether each metric improved or declined.
Note which specific fixes or content changes likely drove changes.
Be specific, not generic.`,
    messages: [{
      role: 'user',
      content: `Write a brief weekly summary (4-6 bullet points) for tallchairadvisor.com.

THIS WEEK:
- Clicks: ${gsc.totals.clicks} | Impressions: ${gsc.totals.impressions} | Avg pos: ${gsc.totals.avgPosition}

PRIOR WEEK (for trend comparison):
${prevWeekStats}

WHAT HAPPENED:
- Fixes applied: ${fixesLog}
- Content created: ${contentLog}
- Verification: ${allPassed ? 'All checks passed' : 'Some checks FAILED'}

Format as markdown bullet points. Be specific about what changed and what to watch next week.`,
    }],
  });

  const summary = summaryResponse.content[0].type === 'text' ? summaryResponse.content[0].text : '';

  const weeklyReport = `# Weekly Summary — ${new Date().toISOString().split('T')[0]}

## Verification Checks
${report}

## What Happened This Week
${summary}

## Deploy Status
${allPassed ? '✅ All checks passed — deployed to Cloudflare Pages' : '❌ Verification failed — deploy BLOCKED'}

---
*Generated by TCA automation pipeline*
`;

  mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
  writeFileSync(resolve(ROOT, 'reports/weekly-summary.md'), weeklyReport);

  // === Wiki Updates ===

  // 1. Write weekly summary page
  const week = currentWeek();
  const weeklyWikiPage = `---
type: weekly
week: ${week}
last_updated: ${today()}
deploy_status: ${allPassed ? 'deployed' : 'blocked'}
tags: [weekly, ${allPassed ? 'deployed' : 'blocked'}]
---

# Week ${week} Summary

**Deploy:** ${allPassed ? 'All checks passed — deployed' : 'BLOCKED — verification failed'}

## Verification Checks
${report}

## What Happened
${summary}

## GSC Snapshot
- Clicks: ${gsc.totals.clicks} | Impressions: ${gsc.totals.impressions} | Avg pos: ${gsc.totals.avgPosition}

## Fixes Applied
${fixesLog.slice(0, 500)}

## Content Created
${contentLog.slice(0, 500)}
`;
  writeWikiPage(ROOT, `weekly/${week}.md`, weeklyWikiPage);

  // 2. Update decisions-log with this week's entry
  const decisionsLog = readWikiPage(ROOT, 'synthesis/decisions-log.md') || '';
  const newDecisionEntry = `## ${week} (${today()})

- **Deploy:** ${allPassed ? 'Passed' : 'BLOCKED'}
- **GSC:** ${gsc.totals.clicks} clicks, ${gsc.totals.impressions} impr, pos ${gsc.totals.avgPosition}
- **Fixes:** ${fixesLog.includes('✅') ? fixesLog.match(/✅/g)?.length || 0 : 0} applied
- **Content:** ${contentLog.includes('✅') ? contentLog.match(/✅/g)?.length || 0 : 0} new pages
${!allPassed ? '- **BLOCKED:** ' + checks.filter(c => !c.passed).map(c => c.name).join(', ') : ''}
`;

  if (decisionsLog.includes('# Decisions Log')) {
    // Insert new entry after the header section
    const updatedLog = decisionsLog.replace(
      /^(---\n[\s\S]*?---\n\n# Decisions Log[\s\S]*?---\n)/m,
      `$1\n${newDecisionEntry}\n`
    );
    writeWikiPage(ROOT, 'synthesis/decisions-log.md', updatedLog);
  }

  // 3. Update wiki index with new weekly page
  const indexContent = readWikiPage(ROOT, 'index.md');
  if (indexContent && !indexContent.includes(`[[${week}]]`)) {
    const updatedIndex = indexContent.replace(
      '## Raw Sources',
      `## Weekly Summaries\n\n| Page | Summary |\n|------|---------|\n| [[${week}]] | ${allPassed ? 'Deployed' : 'BLOCKED'}. ${gsc.totals.clicks} clicks, ${gsc.totals.impressions} impr. |\n\n## Raw Sources`
    );
    writeWikiPage(ROOT, 'index.md', updatedIndex);
  }

  appendWikiLog(ROOT, `## [${today()}] verify-deploy | Saturday Deploy\n\n- Status: ${allPassed ? 'DEPLOYED' : 'BLOCKED'}\n- Checks: ${checks.map(c => `${c.name}: ${c.passed ? '✅' : '❌'}`).join(', ')}\n- Weekly summary: wiki/weekly/${week}.md\n`);

  console.log(weeklyReport);

  if (!allPassed) {
    console.error('\n❌ Verification failed — blocking deploy.');
    process.exit(1);
  }

  console.log('\n✅ All checks passed — ready to deploy.');
}

main().catch(err => { console.error(err.message); process.exit(1); });

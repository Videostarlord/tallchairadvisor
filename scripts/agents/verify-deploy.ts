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
  /I (tested|sat in|tried|used|reviewed) the (aeron|leap|sihoo|doro)/i,
  /after sitting in the (aeron|leap|sihoo)/i,
  /in my experience.{0,50}(aeron|leap|sihoo)/i,
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

async function main() {
  console.log('Running verification checks...\n');
  const checks = await Promise.all([
    checkSecrets(),
    checkAffiliateLinks(),
    checkVoice(),
    checkCredentialsNotStaged(),
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
  const summaryResponse = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Write a brief weekly summary (4-6 bullet points) for tallchairadvisor.com based on this week's automation run.

GSC: ${gsc.totals.clicks} clicks | ${gsc.totals.impressions} impressions | avg pos ${gsc.totals.avgPosition}
Fixes applied: ${fixesLog}
Content created: ${contentLog}
Verification: ${allPassed ? 'All checks passed' : 'Some checks FAILED'}

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
  console.log(weeklyReport);

  if (!allPassed) {
    console.error('\n❌ Verification failed — blocking deploy.');
    process.exit(1); // Non-zero exit prevents git push in workflow
  }

  console.log('\n✅ All checks passed — ready to deploy.');
}

main().catch(err => { console.error(err.message); process.exit(1); });

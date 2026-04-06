/**
 * execute-fixes.ts — Thursday agent
 * Reads weekly-plan.md, applies meta/schema/technical fixes to src/ files
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface FixTask {
  description: string;
  filePath: string;
  raw: string;
}

function parsePlan(plan: string): FixTask[] {
  const tasks: FixTask[] = [];
  const fixSection = plan.match(/## FIXES[\s\S]*?(?=## NEW CONTENT|## REWRITES|## STRATEGY|$)/)?.[0] ?? '';
  const rewriteSection = plan.match(/## REWRITES[\s\S]*?(?=## STRATEGY|$)/)?.[0] ?? '';

  const allLines = [...fixSection.split('\n'), ...rewriteSection.split('\n')];
  for (const line of allLines) {
    const match = line.match(/- \[[ x]\] (?:FIX|REWRITE): (.+?) \| .+? \| FILE: (src\/pages\/.+\.astro)/);
    if (match) {
      tasks.push({ description: match[1], filePath: match[2], raw: line });
    }
  }
  return tasks;
}

async function applyFix(task: FixTask): Promise<{ success: boolean; summary: string }> {
  const fullPath = resolve(ROOT, task.filePath);
  if (!existsSync(fullPath)) {
    return { success: false, summary: `File not found: ${task.filePath}` };
  }

  const fileContent = readFileSync(fullPath, 'utf-8');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: `You are an SEO implementation agent for tallchairadvisor.com (Astro SSG site).
Apply ONLY the requested fix — do not refactor, rename, or change anything else.
CRITICAL RULES:
- Jackson ONLY personally tested the Steelcase Gesture. Never add first-person testing voice for other chairs.
- All Amazon links must include tag=tallchairadvi-20.
- Meta descriptions: 130-155 chars. Titles: 50-60 chars.
- Schema: valid JSON-LD, no duplicate @type entries.
- Output the COMPLETE updated file content, nothing else. No explanations before or after.`,
    messages: [{
      role: 'user',
      content: `Apply this fix to the file:

FIX REQUIRED: ${task.description}

CURRENT FILE (${task.filePath}):
\`\`\`astro
${fileContent}
\`\`\`

Output the complete updated file content only. Make ONLY the requested change.`,
    }],
  });

  const updatedContent = response.content[0].type === 'text' ? response.content[0].text : '';

  // Strip any markdown code fences if Claude wrapped the output
  const cleaned = updatedContent
    .replace(/^```(?:astro|html|jsx|tsx)?\n/, '')
    .replace(/\n```$/, '')
    .trim();

  if (!cleaned || cleaned.length < 100) {
    return { success: false, summary: `Empty response for ${task.filePath}` };
  }

  writeFileSync(fullPath, cleaned);
  return { success: true, summary: `Fixed: ${task.description} in ${task.filePath}` };
}

async function main() {
  const planPath = resolve(ROOT, 'reports/weekly-plan.md');
  if (!existsSync(planPath)) {
    console.log('No weekly plan found — skipping fixes.');
    process.exit(0);
  }

  const plan = readFileSync(planPath, 'utf-8');
  const tasks = parsePlan(plan);

  if (tasks.length === 0) {
    console.log('No fix tasks in plan — skipping.');
    writeFileSync(resolve(ROOT, 'reports/fixes-log.md'), `# Fixes Log — ${new Date().toISOString().split('T')[0]}\n\nNo fixes needed this week.\n`);
    process.exit(0);
  }

  console.log(`Applying ${tasks.length} fixes...`);
  const results: string[] = [`# Fixes Log — ${new Date().toISOString().split('T')[0]}\n`];

  for (const task of tasks) {
    console.log(`  → ${task.description} (${task.filePath})`);
    const result = await applyFix(task);
    results.push(`- [${result.success ? '✅' : '❌'}] ${result.summary}`);
    if (!result.success) console.warn(`    FAILED: ${result.summary}`);
    await new Promise(r => setTimeout(r, 1000));
  }

  mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
  writeFileSync(resolve(ROOT, 'reports/fixes-log.md'), results.join('\n'));
  console.log(`\nFixes complete → reports/fixes-log.md`);
}

main().catch(err => { console.error(err.message); process.exit(1); });

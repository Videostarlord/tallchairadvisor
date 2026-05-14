/**
 * execute-fixes.ts — Thursday agent
 * Reads weekly-plan.md, applies meta/schema/technical fixes to src/ files
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { appendWikiLog, archiveToRaw, today } from './wiki-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface FixTask {
  description: string;
  whatToChange: string;
  why: string;
  filePath: string;
  raw: string;
}

function daysSinceLastEdit(filePath: string): number {
  try {
    const lastDate = execSync(
      `git log -1 --format=%ai -- "${filePath}"`, { cwd: ROOT }
    ).toString().trim();
    if (!lastDate) return Infinity;
    return Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
  } catch { return Infinity; }
}

function getGscPageData(root: string): Map<string, { impressions: number; position: number; clicks: number }> {
  const gscPath = resolve(root, 'data/gsc/latest.json');
  if (!existsSync(gscPath)) return new Map();
  try {
    const gsc = JSON.parse(readFileSync(gscPath, 'utf-8'));
    const map = new Map<string, { impressions: number; position: number; clicks: number }>();
    for (const page of gsc.pages ?? []) {
      map.set(page.page, { impressions: page.impressions ?? 0, position: page.position ?? 99, clicks: page.clicks ?? 0 });
    }
    return map;
  } catch { return new Map(); }
}

// CRITICAL: 400+ impressions, pos ≤10, 0 clicks — visible but completely failing to convert
function isCriticalPage(filePath: string, gscData: Map<string, { impressions: number; position: number; clicks: number }>): boolean {
  const slug = '/' + filePath.replace(/^src\/pages\//, '').replace(/\.astro$/, '') + '/';
  const fullUrl = `https://tallchairadvisor.com${slug}`;
  const data = gscData.get(fullUrl) ?? gscData.get(slug);
  if (!data) return false;
  return data.impressions >= 400 && data.position <= 10 && data.clicks === 0;
}

// Replace em dashes and curly quotes in the frontmatter JS block — esbuild rejects them as tokens.
// HTML template section is left untouched (em dashes are fine in HTML).
function sanitizeFrontmatter(content: string): string {
  const match = content.match(/^(---\n)([\s\S]*?)(\n---)/);
  if (!match) return content;
  const sanitized = match[2]
    .replace(/\u2014/g, '\\u2014')      // em dash
    .replace(/\u2013/g, '\\u2013')      // en dash
    .replace(/[\u2018\u2019]/g, "'")    // curly single quotes
    .replace(/[\u201C\u201D]/g, '"');   // curly double quotes
  return match[1] + sanitized + match[3] + content.slice(match[0].length);
}

function parsePlan(plan: string): FixTask[] {
  const tasks: FixTask[] = [];
  const fixSection = plan.match(/## FIXES[\s\S]*?(?=## NEW CONTENT|## REWRITES|## STRATEGY|$)/)?.[0] ?? '';
  const rewriteSection = plan.match(/## REWRITES[\s\S]*?(?=## STRATEGY|$)/)?.[0] ?? '';

  const allLines = [...fixSection.split('\n'), ...rewriteSection.split('\n')];
  for (const line of allLines) {
    const match = line.match(/- \[[ x]\] (?:FIX|REWRITE): (.+?) \| (.+?) \| (.+?) \| FILE: (src\/pages\/.+\.astro)/);
    if (match) {
      tasks.push({ description: match[1], whatToChange: match[2], why: match[3], filePath: match[4], raw: line });
    }
  }
  return tasks;
}

// ─── Targeted edit helpers ────────────────────────────────────────────────────
// Meta/title fixes only need to change 1-2 string literals on the <Layout> tag.
// Generating just those values (not the entire file) eliminates the main failure modes:
// em dashes bleeding from schema JSON into frontmatter, structural elements going missing,
// and word count regressions from Claude accidentally truncating content.

type FixType = 'meta' | 'title' | 'meta+title' | 'complex';

function classifyFix(whatToChange: string): FixType {
  const hasMeta = /meta description/i.test(whatToChange);
  const hasTitle = /title tag|shorten.*title|title.*shorten|^title\b/i.test(whatToChange);
  if (hasMeta && hasTitle) return 'meta+title';
  if (hasMeta) return 'meta';
  if (hasTitle) return 'title';
  return 'complex';
}

// Extract a Layout prop value from the HTML section of an Astro file.
function extractLayoutProp(fileContent: string, prop: 'title' | 'description'): string {
  const sep = fileContent.indexOf('\n---\n', 3);
  const html = sep !== -1 ? fileContent.slice(sep) : fileContent;
  // Find the Layout opening tag, then extract the prop within it
  const layoutMatch = html.match(/<Layout[\s\S]*?>/);
  if (!layoutMatch) return '';
  return layoutMatch[0].match(new RegExp(`${prop}="([^"]*)"`)) ?.[1] ?? '';
}

// Replace a Layout prop value in-place (HTML section only — frontmatter untouched).
function applyLayoutPropReplace(fileContent: string, prop: 'title' | 'description', newValue: string): string {
  const sep = fileContent.indexOf('\n---\n', 3);
  const prefix = sep !== -1 ? fileContent.slice(0, sep) : '';
  const html = sep !== -1 ? fileContent.slice(sep) : fileContent;
  // Find and patch only within the <Layout ...> opening tag
  const layoutMatch = html.match(/<Layout[\s\S]*?>/);
  if (!layoutMatch) return fileContent;
  // Use a replacement function (not a template string) to prevent $ in newValue from being
  // misinterpreted as a backreference pattern in the replacement string.
  const patchedTag = layoutMatch[0].replace(
    new RegExp(`(${prop}=")[^"]*(")`),
    (_, open, close) => `${open}${newValue}${close}`
  );
  return prefix + html.replace(layoutMatch[0], patchedTag);
}

async function applyTargetedFix(task: FixTask, fileContent: string, fixType: 'meta' | 'title' | 'meta+title'): Promise<string> {
  let result = fileContent;

  if (fixType === 'meta' || fixType === 'meta+title') {
    const current = extractLayoutProp(fileContent, 'description');
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: `Write a single meta description for tallchairadvisor.com.
RULES:
- 130-155 characters (count carefully — this is enforced programmatically)
- Lead with the explicit verdict, spec, or direct answer in the first 10 words
- No filler openers: "In this guide", "Learn how", "Complete", "In-depth", "Everything you need"
- ASCII characters only — no em dashes (—), en dashes (–), curly quotes, or any Unicode
- If the page covers chair specs for tall people, lead with a concrete measurement
Return ONLY the meta description text. No quotes around it. No explanation.`,
      messages: [{
        role: 'user',
        content: `Page: ${task.description}
Current meta: "${current}"
Required change: ${task.whatToChange}
Why: ${task.why}

Write the new meta description:`,
      }],
    });
    const rawMeta = (res.content[0].type === 'text' ? res.content[0].text : '').trim().replace(/^["']|["']$/g, '');
    // Encode any literal " characters so they don't break the HTML attribute value
    const newMeta = rawMeta.replace(/"/g, '&quot;');
    if (newMeta.length >= 80 && newMeta.length <= 165) {
      result = applyLayoutPropReplace(result, 'description', newMeta);
    } else {
      console.warn(`    Meta too short/long (${newMeta.length} chars) — skipping meta replacement`);
    }
  }

  if (fixType === 'title' || fixType === 'meta+title') {
    const current = extractLayoutProp(fileContent, 'title');
    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      system: `Write a title tag for tallchairadvisor.com.
RULES:
- 50-60 characters (count carefully — this is enforced programmatically)
- Primary keyword near the front
- ASCII only — no em dashes, curly quotes, Unicode, or double-quote characters
- Avoid all-caps and clickbait
Return ONLY the title text. No quotes. No explanation.`,
      messages: [{
        role: 'user',
        content: `Page: ${task.description}
Current title: "${current}"
Required change: ${task.whatToChange}
Why: ${task.why}

Write the new title (50-60 chars):`,
      }],
    });
    const newTitle = (res.content[0].type === 'text' ? res.content[0].text : '').trim().replace(/^["']|["']$/g, '');
    if (newTitle.length >= 20 && newTitle.length <= 70) {
      result = applyLayoutPropReplace(result, 'title', newTitle);
    } else {
      console.warn(`    Title too short/long (${newTitle.length} chars) — skipping title replacement`);
    }
  }

  return result;
}
// ──────────────────────────────────────────────────────────────────────────────

async function applyFix(task: FixTask, gscData: Map<string, { impressions: number; position: number; clicks: number }>): Promise<{ success: boolean; summary: string }> {
  const fullPath = resolve(ROOT, task.filePath);
  if (!existsSync(fullPath)) {
    return { success: false, summary: `File not found: ${task.filePath}` };
  }

  const fileContent = readFileSync(fullPath, 'utf-8');
  const originalWordCount = fileContent.split(/\s+/).filter(w => w.length > 0).length;

  // Cooldown guard: CRITICAL pages (400+ impr, pos ≤10, 0 clicks) use 7-day minimum.
  // All others use 14-day. Technical fixes (schema/canonical/404/etc) bypass both.
  const daysSince = daysSinceLastEdit(fullPath);
  const isTechnical = /schema|canonical|noindex|404|broken|redirect|voice|affiliate/i.test(task.description);
  const critical = isCriticalPage(task.filePath, gscData);
  const cooldownRequired = critical ? 7 : 14;
  if (daysSince < cooldownRequired && !isTechnical) {
    return {
      success: false,
      summary: critical
        ? `SKIPPED: ${task.filePath} edited ${daysSince}d ago. CRITICAL pages require 7-day minimum (too recent).`
        : `SKIPPED: ${task.filePath} edited ${daysSince}d ago. Non-technical fixes require 14-day cooldown.`,
    };
  }

  // ── Targeted edit path (meta description / title) ──────────────────────────
  // Ask Claude only for the changed values, apply them via regex.
  // This eliminates file-structure regressions, word count drops, and Unicode
  // tokens bleeding from JSON schema into frontmatter.
  const fixType = classifyFix(task.whatToChange);

  if (fixType !== 'complex') {
    const updated = await applyTargetedFix(task, fileContent, fixType);
    if (updated === fileContent) {
      return { success: false, summary: `Targeted fix produced no change in ${task.filePath} — Layout prop may not be present` };
    }
    writeFileSync(fullPath, updated);
    return { success: true, summary: `Fixed [${fixType}]: ${task.description} in ${task.filePath}` };
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ── Full-file path (schema changes, affiliate links, verdict tables) ────────
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
- FRONTMATTER ONLY: Use only ASCII characters between the --- markers. Never use em dashes (—), curly quotes, or other Unicode characters directly in the JavaScript frontmatter — use regular hyphens (-) or escape sequences instead. Em dashes in the HTML template section are fine.
- Output the COMPLETE updated file content, nothing else. No explanations before or after.`,
    messages: [{
      role: 'user',
      content: `Apply this fix to the file:

FIX REQUIRED:
- Page: ${task.description}
- What to change: ${task.whatToChange}
- Why: ${task.why}
- File: ${task.filePath}

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

  const sanitized = sanitizeFrontmatter(cleaned);

  const newWordCount = sanitized.split(/\s+/).filter(w => w.length > 0).length;
  if (newWordCount < originalWordCount * 0.85) {
    const pctDrop = Math.round((1 - newWordCount / originalWordCount) * 100);
    return {
      success: false,
      summary: `REJECTED: Word count dropped from ${originalWordCount} to ${newWordCount} (${pctDrop}% reduction). Skipping write.`,
    };
  }

  writeFileSync(fullPath, sanitized);
  return { success: true, summary: `Fixed [complex]: ${task.description} in ${task.filePath} (words: ${originalWordCount} → ${newWordCount})` };
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

  const gscData = getGscPageData(ROOT);
  console.log(`Applying ${tasks.length} fixes... (GSC data: ${gscData.size} pages loaded)`);
  const results: string[] = [`# Fixes Log — ${new Date().toISOString().split('T')[0]}\n`];

  for (const task of tasks) {
    console.log(`  → ${task.description} (${task.filePath})`);
    const result = await applyFix(task, gscData);
    results.push(`- [${result.success ? '✅' : '❌'}] ${result.summary}`);
    if (!result.success) console.warn(`    FAILED: ${result.summary}`);
    await new Promise(r => setTimeout(r, 1000));
  }

  mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
  const fixesReport = results.join('\n');
  writeFileSync(resolve(ROOT, 'reports/fixes-log.md'), fixesReport);

  // Archive fixes log and update wiki
  archiveToRaw(ROOT, 'audits', `${today()}-fixes-log.md`, fixesReport);

  const fixSummaries = tasks.map(t => `- ${t.description} → ${t.filePath}`).join('\n');
  appendWikiLog(ROOT, `## [${today()}] execute-fixes | Thursday Fixes Applied\n\n${fixSummaries}\n`);

  console.log(`\nFixes complete → reports/fixes-log.md`);
}

main().catch(err => { console.error(err.message); process.exit(1); });

/**
 * execute-content.ts — Friday agent
 * Reads weekly-plan.md, writes new Astro pages. Sets CONTENT_WRITTEN=true if pages created.
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ContentTask {
  title: string;
  keyword: string;
  slug: string;
  description: string;
}

function parsePlan(plan: string): ContentTask[] {
  const tasks: ContentTask[] = [];
  const section = plan.match(/## NEW CONTENT[\s\S]*?(?=## REWRITES|## STRATEGY|$)/)?.[0] ?? '';
  for (const line of section.split('\n')) {
    const match = line.match(/- \[ \] NEW: (.+?) \| (.+?) \| (.+?) \| (.+)/);
    if (match) {
      tasks.push({ title: match[1], keyword: match[2], slug: match[3].trim(), description: match[4] });
    }
  }
  return tasks;
}

function setEnv(key: string, value: string) {
  const ghEnv = process.env.GITHUB_ENV;
  if (ghEnv) appendFileSync(ghEnv, `${key}=${value}\n`);
  else console.log(`ENV: ${key}=${value}`);
}

// Read an example page to understand the Astro page structure
function getExamplePage(): string {
  const candidates = [
    'src/pages/review/gesture.astro',
    'src/pages/best-office-chairs.astro',
    'src/pages/correct-chair-dimensions.astro',
  ];
  for (const c of candidates) {
    const p = resolve(ROOT, c);
    if (existsSync(p)) return readFileSync(p, 'utf-8').slice(0, 3000);
  }
  return '';
}

async function writeNewPage(task: ContentTask): Promise<{ success: boolean; filePath: string; summary: string }> {
  const examplePage = getExamplePage();
  const gsc = JSON.parse(readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8'));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: `You are a content writer for tallchairadvisor.com, a niche affiliate site for ergonomic chairs for tall people (6'+).
Author: Jackson Christopher, 6'4", Mechanical Engineering senior at UC Berkeley.

CRITICAL VOICE RULES:
- Jackson ONLY personally tested the Steelcase Gesture. All other chairs: research-based voice only.
- For non-Gesture: use "tall users report", "based on specs", "the engineering reason is..."
- For Gesture only: first-person allowed — "I've used this daily", "at 6'4" I noticed..."
- NEVER write "I tested", "in my experience", "after sitting in" for non-Gesture chairs.

CONTENT RULES:
- Answer-first format (verdict in first 2 sentences)
- Use Jackson's ME background for spec analysis
- Target AI Overviews: include definition boxes, numbered lists, comparison tables
- All Amazon links: include tag=tallchairadvi-20
- Internal links to related pages on the site
- Schema: include relevant JSON-LD (BlogPosting or ItemList)
- 1200-2000 words for blog posts, 800-1200 for spec pages

OUTPUT: Complete Astro page file only. Match the structure of the example page provided.`,
    messages: [{
      role: 'user',
      content: `Write a new page for tallchairadvisor.com.

PAGE DETAILS:
- Title: ${task.title}
- Target keyword: ${task.keyword}
- Slug: ${task.slug}
- Content angle: ${task.description}

EXAMPLE PAGE STRUCTURE (match this format):
\`\`\`astro
${examplePage}
\`\`\`

SITE CONTEXT:
- Top performing pages: ${gsc.pages.slice(0, 5).map((p: any) => p.page).join(', ')}
- Affiliate tag: tag=tallchairadvi-20

Write the complete Astro page. Output the file content only.`,
    }],
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleaned = content
    .replace(/^```(?:astro|html|jsx|tsx)?\n/, '')
    .replace(/\n```$/, '')
    .trim();

  if (!cleaned || cleaned.length < 500) {
    return { success: false, filePath: '', summary: `Empty content for ${task.slug}` };
  }

  // Determine file path from slug
  const slugParts = task.slug.replace(/^\/|\/$/g, '').split('/');
  const filePath = `src/pages/${slugParts.join('/')}.astro`;
  const fullPath = resolve(ROOT, filePath);

  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, cleaned);

  return { success: true, filePath, summary: `Created: ${filePath} targeting "${task.keyword}"` };
}

async function main() {
  const planPath = resolve(ROOT, 'reports/weekly-plan.md');
  if (!existsSync(planPath)) {
    console.log('No weekly plan — skipping content.');
    process.exit(0);
  }

  const plan = readFileSync(planPath, 'utf-8');
  const tasks = parsePlan(plan);

  if (tasks.length === 0) {
    console.log('No new content in plan — skipping.');
    setEnv('CONTENT_WRITTEN', 'false');
    process.exit(0);
  }

  console.log(`Writing ${tasks.length} new pages...`);
  const results: string[] = [`# Content Log — ${new Date().toISOString().split('T')[0]}\n`];
  let anySuccess = false;

  for (const task of tasks) {
    console.log(`  → ${task.title} (${task.slug})`);
    const result = await writeNewPage(task);
    results.push(`- [${result.success ? '✅' : '❌'}] ${result.summary}`);
    if (result.success) anySuccess = true;
    await new Promise(r => setTimeout(r, 2000));
  }

  mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
  writeFileSync(resolve(ROOT, 'reports/content-log.md'), results.join('\n'));
  setEnv('CONTENT_WRITTEN', anySuccess ? 'true' : 'false');
  console.log(`\nContent complete → reports/content-log.md`);
}

main().catch(err => { console.error(err.message); process.exit(1); });

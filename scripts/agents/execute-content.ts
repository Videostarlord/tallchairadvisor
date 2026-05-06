/**
 * execute-content.ts — Friday agent
 * Reads weekly-plan.md, writes new Astro pages. Sets CONTENT_WRITTEN=true if pages created.
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { appendWikiLog, archiveToRaw, writeWikiPage, readWikiPage, today } from './wiki-utils.js';

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
      tasks.push({
        title: match[1],
        keyword: match[2].replace(/`/g, '').trim(),
        slug: match[3].replace(/`/g, '').trim(),
        description: match[4],
      });
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

function validateAstroFile(content: string): { valid: boolean; reason?: string } {
  if (!content.startsWith('---')) {
    return { valid: false, reason: 'Does not start with --- frontmatter fence' };
  }
  const frontmatterEnd = content.indexOf('\n---', 3);
  if (frontmatterEnd === -1) {
    return { valid: false, reason: 'Missing closing --- frontmatter fence' };
  }
  if (!content.includes('<Layout') || !content.includes('</Layout>')) {
    return { valid: false, reason: 'Missing <Layout> or </Layout> wrapper' };
  }
  // Catch bare English operators in JS context (the specific failure mode we hit)
  const frontmatter = content.slice(3, frontmatterEnd);
  if (/\b(and|or)\b/.test(frontmatter.replace(/"[^"]*"/g, '').replace(/'[^']*'/g, ''))) {
    return { valid: false, reason: 'Bare "and"/"or" keyword in frontmatter JS (use && / ||)' };
  }
  return { valid: true };
}

async function scoreContent(content: string, keyword: string): Promise<{ score: number; feedback: string }> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: `Score this tallchairadvisor.com page draft on 5 criteria (20pts each, 100 total):
1. Answer-first format — verdict or TL;DR in the first visible section (before any H2)
2. Target keyword present in title, H1, and opening paragraph
3. FAQPage JSON-LD schema with at least 4 questions
4. Affiliate CTA block with Amazon links containing tag=tallchairadvi-20
5. At least 3 internal links using class="link-internal"
Return only JSON: {"score": <0-100>, "feedback": "<one sentence on the biggest gap if score < 80, else 'pass'>"}`,
    messages: [{ role: 'user', content: `Keyword: "${keyword}"\n\n${content.slice(0, 5000)}` }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  try {
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    return { score: Number(parsed.score ?? 0), feedback: String(parsed.feedback ?? 'scoring failed') };
  } catch { return { score: 0, feedback: 'score parse failed' }; }
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

STRUCTURAL REQUIREMENTS — every page must include all 5:
1. VERDICT BOX: A styled div (class="bg-card border border-border rounded-lg p-5 my-8" or similar) in the first visible section stating the direct answer in 2-3 sentences. This is the element AI Overviews cite most. Do not bury it.
2. ANSWER-FIRST: The opening paragraph answers the query directly. No "In this guide we'll explore..." preamble. State the conclusion, then support it.
3. CITATION CAPSULE: One standalone paragraph (3-4 sentences, fully self-contained — no pronouns that need context) that answers the core query without surrounding text. Format it so an AI can lift it verbatim.
4. FAQ SECTION + SCHEMA: Minimum 4 FAQPage questions in JSON-LD schema AND rendered as visible H3 + paragraph pairs. Target long-tail variants of the main keyword.
5. AFFILIATE CTA BLOCK: A 2-button block (primary chair = best fit for the problem, secondary = alternative) using the card pattern from the example page. Both links must include tag=tallchairadvi-20. Required on all pain/ergonomics pages AND all review/comparison pages.

OUTPUT: Complete Astro page file only. Match the structure of the example page provided.

ASTRO SYNTAX RULES — CRITICAL (esbuild will reject the file if violated):
- The file MUST start with --- on line 1 (frontmatter fence)
- JavaScript inside --- frontmatter must use valid JS operators: && not "and", || not "or"
- All template literals must be properly closed: \${value} not \${value and other}
- String values containing apostrophes (6'4") must be in double-quoted strings or escaped
- The file MUST end with </Layout>`,
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

  const validation = validateAstroFile(cleaned);
  if (!validation.valid) {
    console.warn(`    VALIDATION FAILED for ${task.slug}: ${validation.reason}`);
    console.warn(`    First 500 chars of frontmatter: ${cleaned.slice(0, 500)}`);
    return { success: false, filePath: '', summary: `Validation failed for ${task.slug}: ${validation.reason}` };
  }

  // Quality gate: score content before writing — reject if below 80/100
  const { score, feedback } = await scoreContent(cleaned, task.keyword);
  console.log(`    Quality score: ${score}/100`);
  if (score < 80) {
    return { success: false, filePath: '', summary: `QUALITY GATE FAILED (${score}/100) for ${task.slug}: ${feedback}` };
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
    appendWikiLog(ROOT, `## [${today()}] execute-content | Friday Content Skipped\n\n- Reason: No parseable NEW CONTENT entries found in reports/weekly-plan.md\n- Ensure plan uses 4-field format: title | keyword | /slug/ | description\n`);
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
  const contentReport = results.join('\n');
  writeFileSync(resolve(ROOT, 'reports/content-log.md'), contentReport);
  setEnv('CONTENT_WRITTEN', anySuccess ? 'true' : 'false');

  // Archive and create wiki entity pages for new content
  archiveToRaw(ROOT, 'audits', `${today()}-content-log.md`, contentReport);

  for (const task of tasks) {
    const slug = task.slug.replace(/^\/|\/$/g, '');
    const entityName = slug.replace(/\//g, '-');
    const wikiPage = `---
type: entity
entity: site-page
url: /${slug}/
last_updated: ${today()}
sources: [raw/audits/${today()}-content-log.md]
tags: [page, new-content]
---

# Page: /${slug}/

**Created:** ${today()} by Friday content agent

## Details

- **Title:** ${task.title}
- **Target keyword:** ${task.keyword}
- **Content angle:** ${task.description}
- **File:** src/pages/${slug}.astro

## Performance

*No GSC data yet — page was just created.*

## Links

*To be populated after indexing.*
`;
    writeWikiPage(ROOT, `pages/site-pages/${entityName}.md`, wikiPage);
  }

  // Update wiki index with new pages
  const indexContent = readWikiPage(ROOT, 'index.md');
  if (indexContent) {
    const newEntries = tasks.map(t => {
      const slug = t.slug.replace(/^\/|\/$/g, '');
      const entityName = slug.replace(/\//g, '-');
      return `| [[${entityName}]] | New page: ${t.title}. Created ${today()}. |`;
    }).join('\n');

    if (newEntries) {
      const updatedIndex = indexContent.replace(
        '## Concept Pages',
        `${newEntries}\n\n## Concept Pages`
      );
      writeWikiPage(ROOT, 'index.md', updatedIndex);
    }
  }

  appendWikiLog(ROOT, `## [${today()}] execute-content | Friday New Content\n\n- Pages created: ${tasks.length}\n${tasks.map(t => `- ${t.title} → ${t.slug}`).join('\n')}\n`);

  console.log(`\nContent complete → reports/content-log.md`);
}

main().catch(err => { console.error(err.message); process.exit(1); });

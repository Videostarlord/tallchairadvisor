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

// Returns how many directory levels deep the slug is (determines relative import path).
// /wrist-pain-armrest-height/ → depth 1 → ../layouts/
// /review/gesture/ → depth 2 → ../../layouts/
function getImportPrefix(slug: string): string {
  const depth = slug.replace(/^\/|\/$/g, '').split('/').length;
  return '../'.repeat(depth);
}

// Compact structural template — shows every required element in its correct position.
// Uses a placeholder slug so Claude always sees <Layout ...> and </Layout> regardless of
// how long the real schema block would be in a production page.
function buildTemplate(slug: string): string {
  const prefix = getImportPrefix(slug);
  return `---
import Layout from '${prefix}layouts/Layout.astro';
import Byline from '${prefix}components/Byline.astro';

const schema = [
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": "https://tallchairadvisor.com${slug.endsWith('/') ? slug : slug + '/'}#article",
    "headline": "REPLACE WITH PAGE TITLE",
    "url": "https://tallchairadvisor.com${slug.endsWith('/') ? slug : slug + '/'}",
    "image": "https://tallchairadvisor.com/images/og-default.webp",
    "datePublished": "REPLACE WITH DATE",
    "dateModified": "REPLACE WITH DATE",
    "wordCount": 1500,
    "author": {
      "@type": "Person",
      "@id": "https://tallchairadvisor.com/author/jackson-christopher/#person",
      "name": "Jackson Christopher",
      "url": "https://tallchairadvisor.com/author/jackson-christopher/"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Tall Chair Advisor",
      "logo": { "@type": "ImageObject", "url": "https://tallchairadvisor.com/images/og-default.webp" }
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "REPLACE: Question 1?",
        "acceptedAnswer": { "@type": "Answer", "text": "REPLACE: Answer 1." }
      },
      {
        "@type": "Question",
        "name": "REPLACE: Question 2?",
        "acceptedAnswer": { "@type": "Answer", "text": "REPLACE: Answer 2." }
      },
      {
        "@type": "Question",
        "name": "REPLACE: Question 3?",
        "acceptedAnswer": { "@type": "Answer", "text": "REPLACE: Answer 3." }
      },
      {
        "@type": "Question",
        "name": "REPLACE: Question 4?",
        "acceptedAnswer": { "@type": "Answer", "text": "REPLACE: Answer 4." }
      }
    ]
  }
];
---

<Layout
  title="REPLACE WITH TITLE (50-60 chars) | Tall Chair Advisor"
  description="REPLACE WITH META DESCRIPTION (130-155 chars, verdict-first)"
  ogType="article"
  schema={schema}
>
  <!-- HEADER / HERO -->
  <header class="py-12 md:py-16 bg-secondary/30">
    <div class="container-article text-center">
      <h1 class="text-balance">REPLACE WITH H1</h1>
      <Byline name="Jackson Christopher" credentials="6'4&quot; &bull; ME, UC Berkeley" date="REPLACE DATE" />
    </div>
  </header>

  <main class="container-article py-10">

    <!-- VERDICT BOX — required, AI Overviews cite this element most -->
    <div class="bg-card border border-border rounded-lg p-5 my-8">
      <p class="font-semibold text-lg mb-2">Quick Answer</p>
      <p>REPLACE: Direct answer in 2-3 sentences. State the conclusion immediately.</p>
    </div>

    <!-- ANSWER-FIRST OPENING — no "In this guide..." preamble -->
    <p>REPLACE: Opening paragraph that states the answer directly, then explains why.</p>

    <!-- CITATION CAPSULE — standalone paragraph an AI can quote verbatim -->
    <p class="citation-capsule">REPLACE: 3-4 self-contained sentences answering the core query. No pronouns needing context. Fully standalone.</p>

    <!-- BODY SECTIONS (H2 + content) -->
    <h2>REPLACE: Section Heading</h2>
    <p>REPLACE: Body content...</p>

    <!-- AFFILIATE CTA BLOCK — required on all pain/review/comparison pages -->
    <div class="grid sm:grid-cols-2 gap-4 my-8 not-prose">
      <div class="bg-card border border-border rounded-lg p-5">
        <p class="font-semibold mb-1">REPLACE: Primary pick</p>
        <p class="text-sm text-muted-foreground mb-3">REPLACE: 1-line reason</p>
        <a href="AMAZON_URL?tag=tallchairadvi-20" class="btn-primary block text-center" target="_blank" rel="noopener">Check Price →</a>
      </div>
      <div class="bg-card border border-border rounded-lg p-5">
        <p class="font-semibold mb-1">REPLACE: Secondary pick</p>
        <p class="text-sm text-muted-foreground mb-3">REPLACE: 1-line reason</p>
        <a href="AMAZON_URL?tag=tallchairadvi-20" class="btn-secondary block text-center" target="_blank" rel="noopener">Check Price →</a>
      </div>
    </div>

    <!-- FAQ SECTION — visible H3 + paragraph pairs matching the schema above -->
    <h2>Frequently Asked Questions</h2>

    <h3>REPLACE: Question 1?</h3>
    <p>REPLACE: Answer 1.</p>

    <h3>REPLACE: Question 2?</h3>
    <p>REPLACE: Answer 2.</p>

    <h3>REPLACE: Question 3?</h3>
    <p>REPLACE: Answer 3.</p>

    <h3>REPLACE: Question 4?</h3>
    <p>REPLACE: Answer 4.</p>

  </main>
</Layout>`;
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
  if (content.includes('href="AMAZON_URL')) {
    return { valid: false, reason: 'Unresolved AMAZON_URL placeholder found in href — Claude did not replace the template CTA' };
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

const CONTENT_SYSTEM_PROMPT = `You are a content writer for tallchairadvisor.com, a niche affiliate site for ergonomic chairs for tall people (6'+).
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
- Internal links to related pages on the site using class="link-internal"
- 1200-2000 words for blog posts, 800-1200 for spec pages

STRUCTURAL REQUIREMENTS — every page must include all 5 (they will be validated programmatically):
1. VERDICT BOX: A styled div with class="bg-card border border-border rounded-lg p-5 my-8" in the first visible section. Direct answer in 2-3 sentences. Do not bury it.
2. ANSWER-FIRST: Opening paragraph answers the query directly. No "In this guide we'll explore..." preamble.
3. CITATION CAPSULE: One standalone paragraph (3-4 sentences, no pronouns needing context) that an AI can quote verbatim.
4. FAQ SECTION + SCHEMA: Minimum 4 FAQPage questions in JSON-LD schema AND as visible H3 + paragraph pairs.
5. AFFILIATE CTA BLOCK: 2-button grid (primary + secondary chair). Both links include tag=tallchairadvi-20.

ASTRO SYNTAX RULES — CRITICAL (esbuild will reject the file if violated):
- Start with --- on line 1
- JavaScript inside --- frontmatter: && not "and", || not "or"
- String values with apostrophes (6'4") must be in double-quoted strings
- The file MUST end with </Layout>
- Import paths must match the slug depth: /page/ uses ../layouts/, /review/page/ uses ../../layouts/

OUTPUT: Complete Astro page file only. No markdown fences around it. No explanation before or after.`;

async function generatePage(task: ContentTask, extraInstruction?: string): Promise<string> {
  const template = buildTemplate(task.slug);
  const gsc = JSON.parse(readFileSync(resolve(ROOT, 'data/gsc/latest.json'), 'utf-8'));

  const messages: { role: 'user' | 'assistant'; content: string }[] = [{
    role: 'user',
    content: `Write a new page for tallchairadvisor.com by filling in the structural template below.

PAGE DETAILS:
- Title: ${task.title}
- Target keyword: ${task.keyword}
- Slug: ${task.slug}
- Content angle: ${task.description}
${extraInstruction ? `\nCORRECTION NEEDED: ${extraInstruction}\n` : ''}
SITE CONTEXT — top pages for internal linking:
${gsc.pages.slice(0, 5).map((p: any) => `- ${p.page} (${p.impressions} impr)`).join('\n')}

TEMPLATE (replace every REPLACE placeholder with real content — keep all structural elements):
\`\`\`astro
${template}
\`\`\`

Write the complete Astro page. Output the file content only — no markdown fences, no explanation.`,
  }];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: CONTENT_SYSTEM_PROMPT,
    messages,
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  return raw
    .replace(/^```(?:astro|html|jsx|tsx)?\n/, '')
    .replace(/\n```$/, '')
    .trim();
}

async function writeNewPage(task: ContentTask): Promise<{ success: boolean; filePath: string; summary: string }> {
  // Attempt 1
  let cleaned = await generatePage(task);

  if (!cleaned || cleaned.length < 500) {
    return { success: false, filePath: '', summary: `Empty content for ${task.slug}` };
  }

  let validation = validateAstroFile(cleaned);

  // Attempt 2 — retry with the specific failure injected as a correction
  if (!validation.valid) {
    console.warn(`    VALIDATION FAILED (attempt 1) for ${task.slug}: ${validation.reason}. Retrying...`);
    cleaned = await generatePage(task, `The previous attempt failed validation: "${validation.reason}". Fix this specific issue in your output.`);
    if (cleaned && cleaned.length >= 500) {
      validation = validateAstroFile(cleaned);
    }
  }

  if (!validation.valid) {
    console.warn(`    VALIDATION FAILED (attempt 2) for ${task.slug}: ${validation.reason}`);
    return { success: false, filePath: '', summary: `Validation failed after 2 attempts for ${task.slug}: ${validation.reason}` };
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

  if (existsSync(fullPath)) {
    return {
      success: false,
      filePath,
      summary: `SKIPPED: ${filePath} already exists — use REWRITE in the plan to update existing pages, not NEW CONTENT`,
    };
  }

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

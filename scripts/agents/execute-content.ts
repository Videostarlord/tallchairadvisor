/**
 * execute-content.ts — Friday agent
 * Reads weekly-plan.md, writes new Astro pages. Sets CONTENT_WRITTEN=true if pages created.
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Script as VmScript } from 'vm';
import { appendWikiLog, archiveToRaw, writeWikiPage, readWikiPage, today, logCacheUsage, readSynthesisContext, withRetry } from './wiki-utils.js';
import { assertSafeToAct } from '../assert-safe-to-act.js';

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

// Sanitize frontmatter JS block — esbuild rejects curly quotes, em dashes, and unescaped apostrophes.
// HTML template section (after the closing ---) is left untouched.
function sanitizeFrontmatter(content: string): string {
  const fenceEnd = content.indexOf('\n---', 3);
  if (!content.startsWith('---') || fenceEnd === -1) return content;

  let fm = content.slice(3, fenceEnd);

  // Replace curly/typographic characters with ASCII equivalents
  fm = fm
    .replace(/[‘’]/g, "'")   // curly single quotes → straight
    .replace(/[“”]/g, '"')   // curly double quotes → straight
    .replace(/—/g, '-')           // em dash → hyphen
    .replace(/–/g, '-');          // en dash → hyphen

  // Replace bare English operators with JS equivalents, skipping string literals.
  // Split on quoted strings so only code segments are transformed.
  const replaceOutsideStrings = (s: string, pattern: RegExp, replacement: string) =>
    s.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/).map((p, i) => i % 2 === 0 ? p.replace(pattern, replacement) : p).join('');
  fm = replaceOutsideStrings(fm, /\band\b/g, '&&');
  fm = replaceOutsideStrings(fm, /\bor\b/g, '||');

  return '---' + fm + content.slice(fenceEnd);
}

async function validateAstroFile(content: string): Promise<{ valid: boolean; reason?: string }> {
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
  const frontmatter = content.slice(3, frontmatterEnd);
  const template = content.slice(frontmatterEnd + 4);
  // Catch bare English operators in JS context (the specific failure mode we hit)
  const fmCodeOnly = frontmatter
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`[^`]*`/g, '``')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\b(and|or)\b/.test(fmCodeOnly)) {
    return { valid: false, reason: 'Bare "and"/"or" keyword in frontmatter JS (use && / ||)' };
  }
  if (content.includes('href="AMAZON_URL')) {
    return { valid: false, reason: 'Unresolved AMAZON_URL placeholder found in href — Claude did not replace the template CTA' };
  }
  // Frontmatter JS syntax check — fast, specific error messages for frontmatter bugs
  // (unescaped apostrophes, unmatched parens, bad string literals, etc.).
  // Do not add regex-based syntax heuristics on top of this: heights like 6'2" and 6'4"
  // appear throughout valid frontmatter and naive apostrophe patterns reject valid files.
  try {
    const stripped = frontmatter
      .replace(/^[ \t]*import\s+[^;]+;\s*$/gm, '') // strip import statements (not valid in vm.Script)
      .trim();
    if (stripped) new VmScript(stripped);
  } catch (e: any) {
    return { valid: false, reason: `Frontmatter JS syntax error: ${e.message.split('\n')[0]}` };
  }
  // Authoritative gate: compile the WHOLE file the way the real build does
  // (Astro compiler -> esbuild). The frontmatter check above cannot see template
  // errors — e.g. a backslash-escaped quote inside a Layout attribute
  // (description="...6'0\"-6'5\"...") closes the attribute early and the rest is
  // parsed as JS, failing esbuild with 'Expected "}"'. That reaches src/pages/,
  // passes scoring, and breaks the Saturday deploy build. This gate rejects exactly
  // what the build would reject. If the toolchain can't load, skip it rather than
  // false-reject a valid page.
  try {
    const { transform } = await import('@astrojs/compiler');
    const esbuild = await import('esbuild');
    const compiled = await transform(content, { sourcemap: false });
    await esbuild.transform(compiled.code, { loader: 'js' });
  } catch (e: any) {
    const msg: string = e?.errors?.[0]?.text || e?.message || String(e);
    if (/Cannot find (module|package)|ERR_MODULE_NOT_FOUND/i.test(msg)) {
      // Astro compiler / esbuild not resolvable here — skip the extra gate.
    } else {
      let reason = `Astro/esbuild compile error: ${msg.split('\n')[0]}`;
      if (template.includes('\\"')) {
        reason += ' — likely a backslash-escaped quote (\\") in an HTML attribute; use &quot; for inch marks instead';
      }
      return { valid: false, reason };
    }
  }
  return { valid: true };
}

// Structural criteria (4 of 5, 20pts each) are mechanically verifiable — check them in
// code against the FULL page. The previous LLM scorer graded content.slice(0, 5000), but
// the CTA block and internal links always sit past char 5000 in a normal-length page, so
// 40pts were structurally unwinnable and every draft failed. See raw/content-rejected/.
function checkStructure(content: string, keyword: string): { points: number; failures: string[] } {
  const failures: string[] = [];
  let points = 0;

  // Keyword presence in title + opening content (fuzzy: significant words, not exact phrase)
  const words = keyword.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const title = (content.match(/title="([^"]*)"/i)?.[1] ?? '').toLowerCase();
  const opening = content.slice(0, 8000).toLowerCase();
  const inTitle = words.filter(w => title.includes(w)).length;
  const inOpening = words.filter(w => opening.includes(w)).length;
  if (words.length === 0 || (inTitle / words.length >= 0.5 && inOpening / words.length >= 0.75)) points += 20;
  else failures.push('target keyword words missing from title or opening content');

  const questionCount = (content.match(/"@type":\s*"Question"/g) ?? []).length;
  if (content.includes('"FAQPage"') && questionCount >= 4) points += 20;
  else failures.push(`FAQPage schema has ${questionCount} questions (need 4+)`);

  if (content.includes('tag=tallchairadvi-20')) points += 20;
  else failures.push('no affiliate link with tag=tallchairadvi-20');

  const internalLinks = (content.match(/class="link-internal"/g) ?? []).length;
  if (internalLinks >= 3) points += 20;
  else failures.push(`${internalLinks} internal links with class="link-internal" (need 3+)`);

  return { points, failures };
}

async function scoreContent(content: string, keyword: string): Promise<{ score: number; feedback: string }> {
  const structure = checkStructure(content, keyword);

  // Answer-first quality is the one criterion that needs a model judgment, and it
  // genuinely lives in the top of the page — the 5000-char excerpt is correct here.
  // The scorer is told it's an excerpt so it can't penalize what it can't see.
  let answerPoints = 15; // benefit of the doubt if the scorer call fails — structure checks carry the gate
  let answerFeedback = '';
  try {
    const response = await withRetry(() => client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `Score 0-20: does this tallchairadvisor.com page open answer-first? Full points when a verdict box or TL;DR stating the direct answer appears in the first visible section (before any H2) with no "In this guide we'll explore..." preamble. You are given only the TOP of a longer page — the excerpt may cut off mid-sentence; do not penalize anything about the ending or anything that would appear later in the page.
Return only JSON: {"points": <0-20>, "feedback": "<one sentence>"}`,
      messages: [{ role: 'user', content: `Keyword: "${keyword}"\n\n${content.slice(0, 5000)}` }],
    }));
    const raw = (response.content[0].type === 'text' ? response.content[0].text : '').replace(/```[a-z]*/g, '').trim();
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    const p = Number(parsed.points);
    if (Number.isFinite(p)) answerPoints = Math.max(0, Math.min(20, p));
    if (answerPoints < 20) answerFeedback = String(parsed.feedback ?? '');
  } catch { answerFeedback = 'answer-first scorer unavailable — defaulted to 15/20'; }

  const score = structure.points + answerPoints;
  const feedback = [...structure.failures, answerFeedback].filter(Boolean).join('; ') || 'pass';
  return { score, feedback };
}

// ─── Differentiation asset injection ────────────────────────────────────────
// Builds a per-page block of TCA's non-replicable assets (ME framing, 6'4" data,
// first-person Gesture voice, Reddit owner signals) for injection into the system prompt.
function buildDifferentiationAssets(slug: string, root: string): string {
  const isGesture = slug.includes('gesture');

  const chairIdMap: Record<string, string> = {
    gesture: 'steelcase-gesture',
    aeron: 'herman-miller-aeron',
    leap: 'steelcase-leap-plus',
    sihoo: 'sihoo-doro-s300',
  };
  const matchedKey = Object.keys(chairIdMap).find(k => slug.includes(k));
  const chairId = matchedKey ? chairIdMap[matchedKey] : null;

  let redditBlock = '';
  if (chairId) {
    const redditPath = resolve(root, `data/reddit/published/${chairId}.json`);
    if (existsSync(redditPath)) {
      try {
        const reddit = JSON.parse(readFileSync(redditPath, 'utf-8'));
        const themes = [
          ...(Array.isArray(reddit.topPositiveThemes) ? reddit.topPositiveThemes.slice(0, 2) : []),
          ...(Array.isArray(reddit.topNegativeThemes) ? reddit.topNegativeThemes.slice(0, 1) : []),
        ];
        if (themes.length > 0) {
          const ownerCount = reddit.ownerReportCounts?.confirmed ?? 0;
          redditBlock = `\n- COMMUNITY SIGNALS (from ${ownerCount} confirmed Reddit owners — attribute naturally as "tall users in r/ergonomics report..."):\n${themes.map((t: string) => `  - ${t}`).join('\n')}`;
        }
      } catch { /* missing or malformed file — skip silently */ }
    }
  }

  const gestureLine = isGesture
    ? `\n- FIRST-PERSON VOICE AUTHORIZED: This is the Gesture page. Jackson uses this chair daily. Use "I've used this at 6'4" for two years", "I noticed the lumbar support hits correctly at my height", specific first-hand observations.`
    : '';

  return `\n\nTCA DIFFERENTIATION ASSETS — inject these naturally, do not list them verbatim:
- ME BIOMECHANICS: Frame spec analysis through mechanical engineering — seat pan pressure distribution, lumbar lordosis support angle, frame rigidity under tall-user load (200+ lbs at extended lever arm), adjustment mechanism tolerances.
- ANTHROPOMETRIC ANCHOR: Jackson's 6'4" frame requires seat height ≥21", seat depth ≥17" (thigh length), lumbar height ≥20" off pan, armrests at ≥28" floor height. Tie all spec comparisons to these measurements — they are what actually matters for 6'+ users.${gestureLine}${redditBlock}`;
}

// ─── Competitive-depth quality gate ─────────────────────────────────────────
// After the structural 80/100 gate, compares TCA's draft against the top competitor
// in intelligence.json for this slug. Ratio < 70 triggers a single re-roll with
// missing sections injected. Uses content structure comparison, not GSC signals.

interface CompetitorIntelligenceFile {
  pages: {
    tcaPage: string;
    queryAnalyses: {
      crawledContent: {
        markdown: string;
        domain: string;
        wordCount: number;
      }[];
    }[];
  }[];
}

async function scoreCompetitiveDepth(
  slug: string,
  pageContent: string,
  root: string,
): Promise<{ ratio: number; missingSections: string[]; rationale: string; skipped: boolean }> {
  const intelligencePath = resolve(root, 'data/competitors/intelligence.json');
  if (!existsSync(intelligencePath)) {
    return { ratio: 100, missingSections: [], rationale: 'intelligence.json not found', skipped: true };
  }

  let intelligence: CompetitorIntelligenceFile;
  try {
    intelligence = JSON.parse(readFileSync(intelligencePath, 'utf-8'));
  } catch {
    return { ratio: 100, missingSections: [], rationale: 'intelligence.json parse failed', skipped: true };
  }

  const normalizedSlug = '/' + slug.replace(/^\/|\/$/g, '') + '/';
  const pageEntry = intelligence.pages.find(p => p.tcaPage === normalizedSlug);
  if (!pageEntry) {
    return { ratio: 100, missingSections: [], rationale: `No competitor entry for ${normalizedSlug}`, skipped: true };
  }

  // Find the editorial competitor with the most content
  let bestContent = '';
  let bestDomain = '';
  for (const analysis of pageEntry.queryAnalyses) {
    for (const c of analysis.crawledContent) {
      if (c.markdown && c.wordCount > 150 && c.markdown.length > bestContent.length) {
        bestContent = c.markdown;
        bestDomain = c.domain;
      }
    }
  }
  if (!bestContent) {
    return { ratio: 100, missingSections: [], rationale: 'No usable competitor content in intelligence.json', skipped: true };
  }

  try {
    const response = await withRetry(() => client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You are a content depth auditor comparing a TCA draft against a competitor page. Score TCA 0-100 on competitive depth. Return only JSON.`,
      messages: [{
        role: 'user',
        content: `Score TCA's draft vs competitor ${bestDomain} on:
(a) Section coverage — competitor sections missing from TCA
(b) Spec depth — specific measurements/numbers present vs absent
(c) Format edges — tables, charts, comparisons TCA has vs lacks

TCA DRAFT (first 3000 chars):
${pageContent.slice(0, 3000)}

COMPETITOR (${bestDomain}, first 2000 chars):
${bestContent.slice(0, 2000)}

Return JSON only: {"ratio": <0-100>, "missingSections": ["...", "..."], "rationale": "<one sentence>"}`,
      }],
    }));

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    return {
      ratio: Number(parsed.ratio ?? 100),
      missingSections: Array.isArray(parsed.missingSections) ? parsed.missingSections : [],
      rationale: String(parsed.rationale ?? ''),
      skipped: false,
    };
  } catch {
    return { ratio: 100, missingSections: [], rationale: 'depth score parse failed', skipped: true };
  }
}

const CONTENT_SYSTEM_PROMPT = `You are a content writer for tallchairadvisor.com.
Author: Jackson Christopher, 6'4", Mechanical Engineering senior at UC Berkeley.

SITE IDENTITY — CRITICAL:
TCA is NOT a review site. Google classifies it as a spec-verification authority for tall-user ergonomic chair fitment. The reader is a tall buyer (6'+) in the fitment verification stage — they need a number, not a story.
Every page must:
- Open with dimensional data (seat height range, seat depth, back height, weight capacity) BEFORE any prose — a spec table or verdict box is the first visible element
- State the answer in the first 2 sentences: a concrete spec, a fit verdict for a specific height, or a direct recommendation
- Frame all analysis through anthropometric fit: does this chair fit someone who is 6'X with Y" inseam?
- Use Jackson's ME background for spec analysis — seat pan pressure distribution, lumbar lordosis support angle, adjustment range tolerances
- Link to the seat depth calculator at /knee-pain-seat-depth/ on any page discussing seat depth, knee pain, or chair fit
- On spec-heavy pages, prefer data tables over prose paragraphs as the primary information structure

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
  const synthesisContext = readSynthesisContext(ROOT);

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

  const diffAssets = buildDifferentiationAssets(task.slug, ROOT);
  const response = await withRetry(() => client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 12000,
    system: [
      {
        type: 'text',
        // Cache the static rules + synthesis context — same for all tasks in a run.
        // Enables cache hits on attempt 2/3 retries and on 2nd+ tasks in a multi-task Friday run.
        text: `${CONTENT_SYSTEM_PROMPT}\n\nHISTORICAL CONTEXT — WHAT WORKS:\n${synthesisContext}`,
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        // Slug-specific differentiation assets (Gesture voice, chair Reddit data) — not cached.
        text: diffAssets,
      },
    ],
    messages,
  }));
  logCacheUsage('execute-content', response.usage, ROOT);

  if (response.stop_reason === 'max_tokens') {
    // Truncated generation — the file will be missing </Layout> and fail validation.
    // Surface the real cause so the retry correction message is accurate.
    console.warn(`    TRUNCATED: generation for ${task.slug} hit max_tokens (${response.usage.output_tokens} output tokens)`);
  }

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  return raw
    .replace(/^```(?:astro|html|jsx|tsx)?\n/, '')
    .replace(/\n```$/, '')
    .trim();
}

function markSlugFailed(root: string, slug: string, reason: string): void {
  const failedPath = resolve(root, 'data/content-failed.json');
  let failed: Record<string, { reason: string; date: string }> = {};
  if (existsSync(failedPath)) {
    try { failed = JSON.parse(readFileSync(failedPath, 'utf-8')); } catch { /* ignore */ }
  }
  failed[slug] = { reason, date: today() };
  mkdirSync(resolve(root, 'data'), { recursive: true });
  writeFileSync(failedPath, JSON.stringify(failed, null, 2));
}

async function writeNewPage(task: ContentTask): Promise<{ success: boolean; filePath: string; summary: string }> {
  // Attempt 1
  let cleaned = await generatePage(task);

  if (!cleaned || cleaned.length < 500) {
    return { success: false, filePath: '', summary: `Empty content for ${task.slug}` };
  }

  cleaned = sanitizeFrontmatter(cleaned);
  let validation = await validateAstroFile(cleaned);

  // Attempt 2 — retry with the specific failure injected as a correction
  if (!validation.valid) {
    console.warn(`    VALIDATION FAILED (attempt 1) for ${task.slug}: ${validation.reason}. Retrying...`);
    cleaned = await generatePage(task, `The previous attempt failed validation: "${validation.reason}". Fix this specific issue in your output.`);
    if (cleaned && cleaned.length >= 500) {
      cleaned = sanitizeFrontmatter(cleaned);
      validation = await validateAstroFile(cleaned);
    }
  }

  if (!validation.valid) {
    console.warn(`    VALIDATION FAILED (attempt 2) for ${task.slug}: ${validation.reason}`);
    const rejectSlug = task.slug.replace(/^\/|\/$/g, '').replace(/\//g, '-');
    if (cleaned && cleaned.length >= 500) {
      archiveToRaw(ROOT, 'content-rejected', `${today()}-${rejectSlug}-validation-fail.md`, cleaned);
    }
    markSlugFailed(ROOT, task.slug, validation.reason);
    return { success: false, filePath: '', summary: `Validation failed after 2 attempts for ${task.slug}: ${validation.reason}` };
  }

  // Quality gate: score content before writing — reject if below 80/100
  const { score, feedback } = await scoreContent(cleaned, task.keyword);
  console.log(`    Quality score: ${score}/100`);
  if (score < 80) {
    const rejectSlug = task.slug.replace(/^\/|\/$/g, '').replace(/\//g, '-');
    archiveToRaw(ROOT, 'content-rejected', `${today()}-${rejectSlug}.md`, cleaned);
    return { success: false, filePath: '', summary: `QUALITY GATE FAILED (${score}/100) for ${task.slug}: ${feedback}` };
  }

  // Competitive-depth gate: compare TCA draft against top competitor in intelligence.json.
  // Uses content structure comparison (deterministic), not GSC traffic signals.
  // Threshold 70 is a structural coverage ratio — appropriate at TCA's current traffic scale.
  const depth = await scoreCompetitiveDepth(task.slug, cleaned, ROOT);
  console.log(`    Competitive depth: ${depth.skipped ? 'skipped' : depth.ratio + '/100'} — ${depth.rationale}`);
  if (!depth.skipped && depth.ratio < 70 && depth.missingSections.length > 0) {
    const gapList = depth.missingSections.map(s => `- ${s}`).join('\n');
    const rerollInstruction = `Competitive depth score was ${depth.ratio}/100 — too low to publish. Add these sections that the top competitor has but TCA's draft is missing:\n${gapList}\nKeep all existing content. Only add the missing sections.`;
    console.log(`    Re-rolling with ${depth.missingSections.length} missing sections...`);
    const rerolledRaw = await generatePage(task, rerollInstruction);
    const rerolled = rerolledRaw ? sanitizeFrontmatter(rerolledRaw) : rerolledRaw;
    if (rerolled && rerolled.length >= 500) {
      const rerollValidation = await validateAstroFile(rerolled);
      if (rerollValidation.valid) {
        cleaned = rerolled;
        console.log(`    Re-roll accepted`);
      } else {
        console.warn(`    Re-roll validation failed (${rerollValidation.reason}) — using original`);
      }
    }
  }

  // Determine file path from slug
  const slugParts = task.slug.replace(/^\/|\/$/g, '').split('/');
  const filePath = `src/pages/${slugParts.join('/')}.astro`;
  const fullPath = resolve(ROOT, filePath);

  // Deterministic preflight — the last gate before a write. Covers BOTH task
  // sources: the weekly plan and the roadmap fallback in main(), which bypasses
  // every strategy.ts constraint and fires exactly when strategy dropped the
  // plan's NEW items. Runs before mkdirSync so a rejection leaves no directory.
  // Subsumes the previous existsSync collision check.
  const verdict = assertSafeToAct(ROOT, { kind: 'create', slug: task.slug, content: cleaned });
  if (!verdict.safe) {
    return { success: false, filePath, summary: verdict.reason! };
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
  let tasks = parsePlan(plan);

  if (tasks.length === 0) {
    // Fallback: directly load pending roadmap items if the strategy plan has no NEW tasks
    const roadmapPath = resolve(ROOT, 'data/content-roadmap.json');
    const failedPath = resolve(ROOT, 'data/content-failed.json');
    let failedSlugs: Set<string> = new Set();
    if (existsSync(failedPath)) {
      try {
        const failed = JSON.parse(readFileSync(failedPath, 'utf-8'));
        failedSlugs = new Set(Object.keys(failed));
      } catch { /* ignore */ }
    }

    if (existsSync(roadmapPath)) {
      try {
        const roadmap = JSON.parse(readFileSync(roadmapPath, 'utf-8')) as Array<{
          title: string; keyword: string; slug: string; priority: number; status: string; notes: string;
        }>;
        const fallback = roadmap
          .filter(t => (t.status === 'pending' || t.status === 'in-progress') && !failedSlugs.has(t.slug))
          .sort((a, b) => a.priority - b.priority)
          .slice(0, 2)
          .map(t => ({ title: t.title, keyword: t.keyword, slug: t.slug, description: t.notes }));
        if (fallback.length > 0) {
          console.log(`Plan had no NEW tasks — falling back to ${fallback.length} pending roadmap item(s)`);
          tasks.push(...fallback);
        }
      } catch { /* ignore */ }
    }

    if (tasks.length === 0) {
      console.log('No new content in plan or roadmap — skipping.');
      setEnv('CONTENT_WRITTEN', 'false');
      appendWikiLog(ROOT, `## [${today()}] execute-content | Friday Content Skipped\n\n- Reason: No parseable NEW CONTENT entries found in reports/weekly-plan.md and no pending roadmap items\n`);
      process.exit(0);
    }
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

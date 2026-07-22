#!/usr/bin/env node
/**
 * Build gate — fails the build if any emitted page is structurally broken.
 *
 * Why this exists: on 2026-07-20 raw LLM chat output was committed above the
 * `---` frontmatter fence in src/pages/review/leap-plus.astro. Astro silently
 * skipped the frontmatter, `astro build` reported 49 pages and zero errors, and
 * the emitted page had no <title>, no canonical, and no JSON-LD — on the site's
 * top click source. A green build is not evidence a page rendered.
 *
 * Run automatically after `npm run build`.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';

// Pages that legitimately lack some of the checks below.
const NO_CANONICAL_OK = new Set(['404.html']);

const files = globSync(`${DIST}/**/*.html`);
if (files.length === 0) {
  console.error('verify-build: no HTML found in dist/ — did the build run?');
  process.exit(1);
}

const failures = [];

for (const file of files) {
  const rel = relative(DIST, file);
  const html = readFileSync(file, 'utf8');
  const page = rel.split(sep).join('/');

  // 1. Frontmatter leak — the exact failure mode this gate was written for.
  //    If the fence was not at byte 0, Astro emits the raw source as body text.
  const head = html.slice(0, 400);
  if (/^\s*(?:<!DOCTYPE html>)?\s*(?:Looking at the file|```astro|---\s*\nimport )/i.test(head)
      || html.includes('```astro')
      || /^\s*(?:<!DOCTYPE html>)?\s*import\s+\w+\s+from\s+['"]/.test(head)) {
    failures.push(`${page}: raw source/LLM output leaked into the rendered body (frontmatter fence not at byte 0)`);
  }

  // 2. Every page must have a non-empty <title>.
  const title = html.match(/<title[^>]*>(.*?)<\/title>/is);
  if (!title || !title[1].trim()) {
    failures.push(`${page}: missing or empty <title>`);
  }

  // 3. Every page except 404 must have a canonical.
  if (!NO_CANONICAL_OK.has(page) && !/<link\s+rel=["']canonical["']/i.test(html)) {
    failures.push(`${page}: missing rel="canonical"`);
  }

  // 4. Every page must carry a meta description.
  if (!NO_CANONICAL_OK.has(page) && !/<meta\s+name=["']description["']/i.test(html)) {
    failures.push(`${page}: missing meta description`);
  }

  // 5. Content pages must emit at least one JSON-LD block, and it must parse.
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!NO_CANONICAL_OK.has(page)) {
    if (blocks.length === 0) {
      failures.push(`${page}: no JSON-LD block`);
    }
    for (const [, payload] of blocks) {
      try {
        JSON.parse(payload);
      } catch (err) {
        failures.push(`${page}: JSON-LD does not parse — ${err.message}`);
      }
    }
  }

  // 6. aggregateRating restating a single self-authored review is a
  //    review-snippet spam pattern. Removed sitewide 2026-07-21; keep it gone.
  for (const [, payload] of blocks) {
    let data;
    try { data = JSON.parse(payload); } catch { continue; }
    const stack = [data];
    while (stack.length) {
      const node = stack.pop();
      if (Array.isArray(node)) { stack.push(...node); continue; }
      if (!node || typeof node !== 'object') continue;
      if (node['@type'] === 'AggregateRating' && String(node.reviewCount) === '1') {
        failures.push(`${page}: aggregateRating with reviewCount:1 (self-serving review snippet)`);
      }
      stack.push(...Object.values(node));
    }
  }
}

if (failures.length) {
  console.error(`\nverify-build: ${failures.length} problem(s) across ${files.length} pages:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('');
  process.exit(1);
}

console.log(`verify-build: ${files.length} pages OK (title, canonical, description, JSON-LD, no frontmatter leak)`);

---
type: synthesis
last_updated: 2026-05-10
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-04-22-serp-analysis.md]
tags: [patterns, failures, lessons]
---

# What Failed (or Hasn't Worked Yet)

Fixes and approaches that didn't produce the expected result. Knowing what doesn't work is as valuable as knowing what does.

## Fixes That Haven't Moved the Needle

### 1. Comparison Table on /aeron/tall-people/ — Added but CTR still 0%
Added between Mar 30 and Apr 3. The page still has 0% CTR on 406 impressions. **Lesson:** On-page content improvements don't fix SERP clickthrough if the meta description is the problem. The user decides to click before they see the page content.

### 2. Meta Fix on /review/gesture/ — Trimmed but CTR still 0.17%
Meta went from 171→146 chars. CTR moved from ~0% to 0.17% (1 click). Marginal improvement at best. **Likely explanation:** The issue is positional (pos 10.31), not meta-related. Below position ~8, CTR improvements from meta alone are limited.

### 3. Internal Links from /review/gesture/ to New Pages — No Ranking Impact Yet
Links to shoulder-pain, under-500, sihoo, aeron-size-c all confirmed present. No measurable effect on those pages' rankings. **Caveat:** Most of those pages weren't even indexed until recently, so the links may start helping now.

## Approaches That May Be Wrong

### Over-investing in CTR Fixes for Pages Below Position 8
Three of the four CTR crisis pages are at positions 7.4–10.3. At these positions, organic CTR benchmarks are naturally 3–5% (pos 7) and 1–2% (pos 10). The 0% CTR is extreme, but some of it is statistical noise on low click volumes. **Question:** Should ranking lift take priority over meta rewrites?

### Expecting Fast Indexing
The 5 height guide pages (6-foot-3 through 6-foot-7) still had zero impressions as of Apr 3, despite sitemap priority 0.8. They were confirmed indexed by Apr 5, but the 2-week+ delay suggests Google is slow to crawl new pages from a young domain. **Lesson:** Don't plan content velocity that depends on fast indexing.

## Pipeline Failures

### Friday Agent Generated Invalid Astro Syntax (Apr 13, 2026)
Claude wrote `size-guide.astro` with a bare `and` keyword in a JavaScript expression inside the frontmatter (`Expected "}" but found "and"`). esbuild rejected the file, the build step failed, and the commit step was skipped — so no bad file was ever pushed. The content was simply lost that week.

**Root cause:** `execute-content.ts` wrote the file to disk and set `CONTENT_WRITTEN=true` before any syntax validation. The only gate was the separate build step in the workflow.

**Fix:** Added `validateAstroFile()` in `execute-content.ts` that runs before `writeFileSync`. Checks frontmatter fences, Layout wrapper, and bare English operators in JS. Also hardened the system prompt to explicitly prohibit `and`/`or` as JS operators.

**Lesson:** Never trust LLM-generated code without structural validation before writing. The build step in the workflow is a safety net, not a first-line guard. The agent itself must validate before committing to disk.

### Saturday Verify-Deploy Always Failing on Schema Check (Mar–Apr 2026)
`verify-deploy.ts` ran BEFORE `npm run build` in the committed `saturday.yml`. `checkSchemaValidity()` looks for `dist/` which doesn't exist until after the build. Every Saturday deploy was blocked by this false failure.

**Fix:** Reordered `saturday.yml` steps — build now runs first.

### Saturday Verify-Deploy Flagging Favicons as Broken Internal Links (Apr 2026)
`checkInternalLinks()` skipped `/images/` and `/assets/` paths but not root-level static files. Every `<link rel="icon" href="/favicon-32x32.png">` in Layout.astro was flagged as a broken internal link, blocking deploy.

**Fix:** Added extension-based skip rule — any href ending in `.png`, `.ico`, `.svg`, `.jpg`, etc. is not treated as an internal page link.

### 4. Verdict-First Meta as Primary CTR Fix — Wrong Diagnosis (Apr 22)

The Apr 3 audit prescribed verdict-first meta rewrites as the primary CTR lever. The Apr 22 incognito SERP audit shows the actual cause is structural SERP suppression:
- Spec queries where TCA ranks pos 7–10 → AI Overviews eating clicks (confirmed on 2 queries)
- Money queries → shopping carousels above organic results, TCA buried at pos 65–79 anyway

**Lesson:** Always check the actual SERP before prescribing a CTR fix. Meta quality is downstream of SERP layout. If an AI Overview is present, there is no meta description fix.

## Not Yet Enough Data To Judge

- **Meta description verdict-first rewrites** — 5 deployed May 7. Awaiting CTR signal (~14 days needed).
- **Height-bracket verdict table on /best-office-chairs/** — ✅ SHIPPED May 7. No AI citation data yet.
- Citation capsules (not yet implemented on any page)
- Standing desk content (not yet written)
- PAA targeting (not yet implemented)
- Height-specific page depth upgrades (C1 Gesture REWRITE + C2 Leap Plus reframe queued for upcoming weeks)

## Links

- [[what-works]] — the other side
- [[ctr-optimization]] — meta fix effectiveness unclear
- [[gsc-performance]] — data source

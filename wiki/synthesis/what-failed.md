---
type: synthesis
last_updated: 2026-04-06
sources: [raw/audits/2026-04-03-full-audit.md]
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

## Not Yet Enough Data To Judge

- Verdict-first meta descriptions (not yet implemented)
- Citation capsules (not yet implemented)
- Standing desk content (not yet written)

## Links

- [[what-works]] — the other side
- [[ctr-optimization]] — meta fix effectiveness unclear
- [[gsc-performance]] — data source

---
type: entity
entity: site-page
url: /aeron-vs-gesture/
last_updated: 2026-05-27
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-05-10-full-seo-audit.md, raw/audits/2026-05-27-full-seo-audit.md, data/gsc/latest.json]
tags: [page, comparison, ctr-issue, revenue-leak]
---

# Page: /aeron-vs-gesture/

## Current State (May 27 — GSC + full SEO audit)

| Metric | Value |
|--------|-------|
| Blog audit score | 63/100 — dropped from 82 (on-page structural issues) |
| Impressions | 385 |
| Position | 8.5 |
| CTR | **0%** (0 clicks on 385 impressions) — still unresolved |
| Meta description | ~90 chars — severely under floor (was 154, over-trimmed) |
| Schema | Article, ItemList, FAQPage, BreadcrumbList |
| Word count | ~2,200 |

## Open Issues (May 27 — CRITICAL, none fixed since May 10)

1. **CRITICAL — H1/title mismatch** — Title: "Why I Chose the Gesture" (personal verdict). H1: "Herman Miller Aeron Size C vs Steelcase Gesture" (generic spec). This is the direct cause of 0% CTR. Fix: change H1 to "Why I Chose the Steelcase Gesture Over the Aeron at 6'4"".
2. **CRITICAL — Meta ~90 chars** — Severely under floor. Needs full rewrite to 150+ chars with verdict + spec + differentiator.
3. **Quick Answer is non-verdict** — "Aeron for breathability; Gesture for armrests" doesn't deliver on personal-decision promise.
4. **All 8 internal links clustered at 90%+ of page depth** — Not contextual. Move 2–3 into body paragraphs.
5. **Both affiliate CTAs at 93% page depth** — Revenue leak. Move one CTA to after Quick Answer box.
6. **ItemList uses `url` instead of `item` on ListItem** — Schema spec violation. Fix: `"item": "URL"` not `"url": "URL"`.
7. **dateModified frozen at March 17** — Update after any fix is applied.

## Fix History

| Date | Fix | Result |
|------|-----|--------|
| 2026-04-03 | Page expanded from ~375 to ~1,400 words | Score 82/100 |
| 2026-05-27 | H1 rewritten to match title intent ("Why I Chose the Steelcase Gesture Over the Aeron at 6'4"") | CTR fix — pending GSC validation |
| 2026-05-27 | Meta rewritten to ~154 chars with verdict + spec + capacity | From ~90 chars |
| 2026-05-27 | Quick Answer headline updated to first-person verdict | Aligns with title frame |
| 2026-05-27 | ItemList `url` → `item` on both ListItems | Schema spec compliance |
| 2026-05-27 | dateModified updated to 2026-05-27 | Sitemap lastmod also updated |

## Links

- [[steelcase-gesture]] — winner in this comparison
- [[herman-miller-aeron]] — the alternative
- [[ctr-optimization]] — 0% CTR case
- [[meta-descriptions]] — verdict-first pattern
- [[affiliate-compliance]] — CTA placement issue

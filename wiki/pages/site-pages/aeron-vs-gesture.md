---
type: entity
entity: site-page
url: /aeron-vs-gesture/
last_updated: 2026-05-11
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-05-10-full-seo-audit.md, data/gsc/latest.json]
tags: [page, comparison, ctr-issue, revenue-leak]
---

# Page: /aeron-vs-gesture/

## Current State (May 11 — GSC + full SEO audit)

| Metric | Value |
|--------|-------|
| Blog audit score | 82/100 (Strong) — as of Mar audit |
| Impressions | 348 |
| Position | 8.5 |
| CTR | **0%** (0 clicks on 348 impressions) |
| Meta description | ~154 chars (borderline, rewrite queued) |
| Schema | FAQPage + BreadcrumbList |
| Word count | ~1,400 |

## Open Issues (May 10 — from full SEO audit, **none fixed yet**)

1. **H1/title mismatch** — Title: "Why I Chose the Gesture" (personal). H1: "Herman Miller Aeron Size C vs Steelcase Gesture" (generic). Searchers who click the personal-angle title hit a generic header. Explains CTR failure alongside meta.
2. **Quick Answer is non-verdict** — "Aeron for breathability; Gesture for armrests" doesn't deliver on "Why I Chose" promise. Should state Jackson's actual conclusion with rationale.
3. **0 affiliate links in first 84% of page** — Both Amazon links appear at 85–86% into the HTML. 348 impr/month, 0 clicks. Revenue leak. Add CTA after Quick Answer box.
4. **Meta rewrite queued** — Thursday W20 agent will rewrite meta to verdict-first with height bracket. *(In weekly plan 2026-05-10.)*

## Fix History

| Date | Fix | Result |
|------|-----|--------|
| 2026-04-03 | Page expanded from ~375 to ~1,400 words | Score 82/100 |
| 2026-05-[Thu] | Meta rewrite + title fix — queued Thursday W20 | Pending |

## Links

- [[steelcase-gesture]] — winner in this comparison
- [[herman-miller-aeron]] — the alternative
- [[ctr-optimization]] — 0% CTR case
- [[meta-descriptions]] — verdict-first pattern
- [[affiliate-compliance]] — CTA placement issue

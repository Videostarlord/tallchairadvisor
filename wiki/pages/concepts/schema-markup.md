---
type: concept
last_updated: 2026-04-06
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-02-schema-audit.md]
tags: [schema, json-ld, structured-data]
---

# Schema Markup

## Schema Types in Use

| Type | Used On | Notes |
|------|---------|-------|
| Product | /review/gesture/, review pages | With aggregateRating where applicable |
| Article | Most content pages | Author as Person type |
| FAQPage | Reviews, comparisons, some sub-pages | Targets FAQ rich results |
| BreadcrumbList | All pages (via Layout) | Rendered as visible breadcrumb nav |
| Person | Author schema | "Jackson Christopher" on all pages |
| Organization | About page | Site entity |
| WebPage | About page, some others | |

## Current Issues (Apr 3)

### CRITICAL: /best-office-chairs/ JSON-LD Parse Error
Duplicate `@type: "Article"` block causes the entire JSON-LD to fail parsing. Suppresses ALL rich result eligibility for the main money page.

### HIGH: AggregateRating on 3 Chair Hub Pages
`/chairs/herman-miller-aeron/`, `/chairs/steelcase-gesture/`, `/chairs/steelcase-leap-plus/` may have empty `aggregateRating: {}`. Either populate with real values or remove.

### RULE: No duplicate @type entries
Site constraint from CLAUDE.md: "no duplicate @type entries, valid JSON-LD only."

## Fix History

| Date | Fix |
|------|-----|
| 2026-03-07 | Person schema added to all review/comparison pages |
| 2026-03-07 | FAQPage schema added to comparisons and gesture review |
| 2026-03-30 | og:type fixed on 3 article pages (website→article) |

## Links

- [[best-office-chairs]] — JSON-LD parse error
- [[ai-citation-readiness]] — schema supports AI citation

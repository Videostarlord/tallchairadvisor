---
type: concept
last_updated: 2026-05-27
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-02-schema-audit.md, raw/audits/2026-05-10-full-seo-audit.md, raw/audits/2026-05-27-full-seo-audit.md]
tags: [schema, json-ld, structured-data]
---

# Schema Markup

## Schema Types in Use

| Type | Used On | Notes |
|------|---------|-------|
| Product | /review/gesture/, review pages | With aggregateRating where applicable |
| Review | /review/gesture/, /review/aeron-size-c/, /review/leap-plus/, /review/sihoo-doro-s300/ | **itemReviewed missing on all 4 — blocks rich results** |
| Article | Most content pages | Author as Person type. **@id missing site-wide.** |
| FAQPage | Reviews, comparisons, some sub-pages | Targets FAQ rich results |
| BreadcrumbList | All pages (via Layout) | Rendered as visible breadcrumb nav |
| Person | Author schema | "Jackson Christopher" on all pages |
| WebSite | index.astro | **@id missing — dangling reference** |
| Organization | About page | Site entity |
| WebPage | About page, some others | |

## Open Issues (May 27 — updated from full SEO audit)

### CRITICAL
1. **WebSite `@id` missing in index.astro** — `WebPage.isPartOf` references `#website` but WebSite block has no `@id`. Dangling entity reference. Fix: add `"@id": "https://tallchairadvisor.com/#website"` to WebSite block. *(Carried over from May 10 — still not fixed.)*
2. **HowTo schema on `/correct-chair-dimensions/` is deprecated** — Google removed HowTo from supported rich result types September 2023. Dead markup. Remove the block entirely. *(New finding, May 27.)*

### HIGH
3. **Product `@id` missing on Aeron Size C and Leap Plus** — Gesture has `@id`, the other two don't. Cross-page entity resolution fails. Fix: add `"@id": "https://tallchairadvisor.com/#product/herman-miller-aeron-size-c"` and `"https://tallchairadvisor.com/#product/steelcase-leap-plus"`.
4. **`aggregateRating reviewCount: "1"` on all three Product pages** — Star snippets are suppressed/deprioritized at reviewCount=1. Do not inflate. Accept reduced eligibility or use Review schema without aggregateRating.
5. **ItemList `url` → `item` on `/best-office-chairs/` and `/aeron-vs-gesture/`** — Google's ItemList spec requires `item` property, not `url`. Fix: `{"@type":"ListItem","position":1,"name":"...","item":"URL"}`.
6. **Article `@id` missing on all Article-typed pages** — Pattern: `"@id": "https://tallchairadvisor.com/[url]/#article"`. *(Carried over from May 10.)*

### MEDIUM
7. **Homepage WebSite missing `potentialAction` SearchAction** — Enables Sitelinks Searchbox. Low effort.
8. **`/heavy-duty-ergonomic-chairs-tall-people/` missing ItemList** — New page, compares multiple chairs, no ItemList schema.
9. **Organization logo is wide OG image** — `og-default.webp` is a landscape OG image. Schema Organization logo should be ~1:1 ratio. Affects Knowledge Panel eligibility.

### STILL OPEN FROM MAY 10 (UNRESOLVED)
- **`itemReviewed` missing from all 4 Review schema nodes** — blocks review rich results on all review pages
- **`/chairs/steelcase-gesture/index.astro` missing `datePublished`, `dateModified`, author `@id`**
- **Gesture seat depth spec error in knee-pain-seat-depth.astro FAQ** — "17.75 inches" should be "18.75 inches"

### RESOLVED
- ~~**/best-office-chairs/ JSON-LD Parse Error**~~ — ✅ FIXED 2026-05-07
- ~~**gesture review itemReviewed schema**~~ — ✅ FIXED 2026-05-25 (Gesture review rewrite)

### RULE: No duplicate @type entries
Site constraint from CLAUDE.md: "no duplicate @type entries, valid JSON-LD only."

## Fix History

| Date | Fix |
|------|-----|
| 2026-03-07 | Person schema added to all review/comparison pages |
| 2026-03-07 | FAQPage schema added to comparisons and gesture review |
| 2026-03-30 | og:type fixed on 3 article pages (website→article) |
| 2026-05-07 | /best-office-chairs/ JSON-LD parse error resolved (duplicate Article @type removed) |

## Links

- [[review-gesture]] — itemReviewed missing
- [[herman-miller-aeron]] — Product @id missing
- [[steelcase-leap-plus]] — Product @id missing
- [[ai-citation-readiness]] — schema supports AI citation

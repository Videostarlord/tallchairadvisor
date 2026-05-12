---
type: concept
last_updated: 2026-05-11
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-02-schema-audit.md, raw/audits/2026-05-10-full-seo-audit.md]
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

## Open Issues (May 10 — from full SEO audit, **NONE of these are fixed yet**)

### CRITICAL — Blocks Rich Results
1. **`itemReviewed` missing from all 4 Review schema nodes** — most likely reason review rich results aren't appearing in SERPs. Fix: add `"itemReviewed": { "@id": "https://tallchairadvisor.com/#product/[chair]" }` to Review node on gesture, aeron-size-c, leap-plus, sihoo-doro-s300. **Affects all 4 review pages.**
2. **WebSite `@id` missing in index.astro** — WebPage nodes reference `isPartOf: { "@id": "https://tallchairadvisor.com/#website" }` but the WebSite entity has no `@id`. Dangling reference. Fix: add `"@id": "https://tallchairadvisor.com/#website"` to WebSite node.
3. **Article `@id` missing on all 6 Article-typed pages** — Fix: add `"@id": "https://tallchairadvisor.com/[url]/#article"` to each.
4. **Product `@id` missing on Aeron and Leap Plus review schema** — Only Gesture has a Product `@id`. Cross-page comparison references can't resolve. Fix: add `"@id": "https://tallchairadvisor.com/#product/[chair]"` to Product nodes on those two reviews.
5. **`/chairs/steelcase-gesture/index.astro` missing `datePublished`, `dateModified`, author `@id`** — Only page that can't qualify for Article rich results.

### HIGH
6. **Gesture seat depth spec error** — `knee-pain-seat-depth.astro` FAQ states "17.75 inches" for Gesture seat depth. Correct value is **18.75 inches** (minimum of the 15.75"–18.75" range). Fix in the FAQ text.
7. **Publisher logo is OG image, not a dedicated logo asset** — Schema's `publisher.logo` should point to a dedicated logo URL, not the page OG image.

### RESOLVED
- ~~**/best-office-chairs/ JSON-LD Parse Error**~~ — ✅ FIXED 2026-05-07. Duplicate `@type: "Article"` block removed.
- ~~**AggregateRating empty `{}` on 3 chair hub pages**~~ — Status unknown as of Apr 3; needs re-verification now that audit tooling is updated.

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

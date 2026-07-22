---
type: concept
last_updated: 2026-07-22
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-02-schema-audit.md, raw/audits/2026-05-10-full-seo-audit.md, raw/audits/2026-05-27-full-seo-audit.md, raw/audits/2026-07-21-full-seo-audit.md]
tags: [schema, json-ld, structured-data]
---

# Schema Markup


## 2026-07-21 audit — structured data findings

> **STATUS 2026-07-22 — CRITICAL `aggregateRating` finding FIXED.** Removed from all 7 pages on branch `worktree-gsc-post-consolidation-analysis` (PR #1). `grep -rc aggregateRating src/pages/ dist/` returns zero sitewide. All 47 JSON-LD blocks in `dist/` re-parsed clean; all 4 `Review` nodes correctly preserved. A build gate now fails any build that reintroduces `aggregateRating` with `reviewCount:1` — see [[deploy-pipeline-integrity]]. Remaining schema items (merchant `Offer` properties, missing breadcrumb, `HowTo`) are still open.

Full audit: `raw/audits/2026-07-21-full-seo-audit.md`. Orchestrator-verified census across all 43 live pages.

**Healthy baseline:** zero JSON-LD parse errors on 43/43 (April 2026 duplicate-`@type` fix has not regressed). `Person` `@id` `https://tallchairadvisor.com/author/jackson-christopher/#person` is stable and identical across all 43 pages — the best-executed entity work on the site. All breadcrumb targets return 200 with zero redirect hops, so the July consolidation's URL repointing was done correctly.

**CRITICAL — `aggregateRating` with `reviewCount: 1` on 7 pages.** Each restates the page's single self-authored review verbatim. That is not an aggregation; it is the textbook review-snippet spam pattern and a known manual-action trigger.

| Page | Review rating | AggregateRating |
|---|---|---|
| /review/aeron-size-c/ | 4.7 | 4.7, count 1 |
| /review/leap-plus/ | 4.6 | 4.6, count 1 |
| /review/sihoo-doro-s300/ | 3.8 | 3.8, count 1 |
| /review/gesture/ | 4.5 | 4.5, count 1 |
| /chairs/herman-miller-aeron/ | — | 4.3, count 1 |
| /chairs/steelcase-leap-plus/ | — | 4.4, count 1 |
| /chairs/steelcase-gesture/ | — | 4.5, count 1 |

Remove `aggregateRating` from all 7. On `/review/gesture/` **keep** the single `Review` node — a lone genuine critic review is snippet-eligible without an aggregate wrapper.

**RULE — do NOT strip the `Review` nodes on untested chairs.** An audit agent flagged these as asserting first-hand testing; verification of the actual `reviewBody` text showed careful spec analysis with no sitting claims ("The Aeron Size C delivers exceptional breathability... the fixed 18.5" seat depth is the primary limitation"). Editorial/critic reviews of third-party products are legitimate. The defect is type-level, not text-level.

**HIGH — merchant-only `Offer` properties.** All 4 review pages declare `hasMerchantReturnPolicy` (30-day, free returns) and `shippingDetails` (free shipping) as though TCA were the seller. Remove, or nest under an `Offer` with an explicit `seller`.

**HIGH — `/office-chair-return-policy/` has no `BreadcrumbList`.** Only content page lacking it. Since `Layout.astro` L39 derives the **visible** breadcrumb nav from the schema, the page renders with no breadcrumbs. Must be added as a **top-level** array member or the Layout will not find it.

**MEDIUM — deprecated `HowTo` on 4 pages** (`/correct-chair-dimensions/`, `/how-to-adjust-chair/`, `/monitor-arm-tall-people/`, `/standing-desk-height-tall-people/`). Retired Sept 2023, renders nothing. Remove.

**MEDIUM — `FAQPage` on 42/43 pages is no longer rich-result eligible** (restricted to government/healthcare since Aug 2023). Not an error. Treat as dead payload, not an asset; do not add more. Keep the visible Q&A — that is what AI crawlers extract.

**MEDIUM — breadcrumb `name` conflicts from the July consolidation.** `/office-chairs-for-tall-people/` is labeled "Best Office Chairs" on 20 pages and "Office Chairs for Tall People" on 8. The sweep repointed `item` URLs but left `name` strings.

**Schema type census (43 pages):** FAQPage 42 · Person 42 · BreadcrumbList 41 · Organization 39 · Article 35 · AggregateRating 7 · ItemList 6 · HowTo 4 · Product 4 · Review 4 · WebPage 2 · BlogPosting 2.

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

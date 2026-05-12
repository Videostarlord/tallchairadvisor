---
type: entity
entity: site-page
url: /best-office-chairs/
last_updated: 2026-05-12
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-04-03-action-plan.md, raw/audits/2026-05-10-full-seo-audit.md, data/gsc/latest.json, data/competitors/intelligence.json]
tags: [page, money-page]
---

# Page: /best-office-chairs/

**Main money page. Primary revenue driver.**

## Current State (May 11 — GSC + full SEO audit)

| Metric | Value |
|--------|-------|
| Blog audit score | 79/100 (Acceptable, as of Mar audit — re-audit needed) |
| Impressions | 776 |
| Position | 22.5 |
| CTR | 0% (0 clicks) |
| Schema | JSON-LD parse error resolved ✅ |
| Height-Bracket Verdict Table | ✅ Present, includes Amazon affiliate links |
| `dateModified` | 2026-05-07 ✅ aligned |

## Open Issues (May 10 — from full SEO audit)

1. **Quick Picks links go to internal pages, not Amazon** — revenue leak. Quick Picks section links to `/review/` pages rather than Amazon affiliate links. Fix: each Quick Pick should have a direct Amazon CTA with `tag=tallchairadvi-20`.
2. **FTC affiliate disclosure absent from body** — footer link only. Fix: add inline disclosure near top of page. See [[affiliate-compliance]].
3. **Low position (22.5)** — shopping carousels suppress this query type. Position improvement requires topical authority growth, not meta rewrites.
4. **Re-audit content score** — score was 79/100 in March, content expanded since. Run `/blog-analyze` to confirm current score.

## AIO Suppression Status (May 12 — competitor:intelligence v2.3)

- **Query:** "best office chairs for tall people"
- **AIO detected:** Yes — TCA not cited. 12 cited URLs, 741-char passage.
- **Capsule:** Applied ✅ — after H2 "Which Chair Is Best at Your Height?" (spec-validated: 21" Aeron seat height)
- **Sentinel:** `<!-- tca-aio-capsule -->` present — future runs will not re-apply.
- **Source of truth:** `data/competitors/intelligence.json` (2026-05-12 run)

## Fix History

| Date | Change |
|------|--------|
| 2026-04-03 | JSON-LD parse error fixed (duplicate Article @type) |
| 2026-05-07 | Height-Bracket Verdict Table: Amazon affiliate links added to Top Pick + Runner-Up columns |
| 2026-05-07 | Freshness signals aligned: visible date, Byline updatedDate, schema dateModified, sitemap lastmod all set to 2026-05-07 |
| 2026-05-12 | AIO citation capsule inserted after "Which Chair Is Best at Your Height?" H2 | Spec-validated (21" seat height) |

## Links

- [[schema-markup]] — JSON-LD history
- [[ai-citation-readiness]] — verdict table is top AI Overview target
- [[affiliate-compliance]] — Quick Picks CTA + body disclosure
- [[content-gaps]] — check for remaining gaps

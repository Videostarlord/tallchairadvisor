---
type: entity
entity: site-page
url: /review/gesture/
last_updated: 2026-05-12
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-19-blog-audit.md, raw/audits/2026-05-10-full-seo-audit.md, data/gsc/latest.json, data/competitors/intelligence.json]
tags: [page, review, gesture, first-person, flagship]
---

# Page: /review/gesture/

**Flagship page. Only first-person review on the site.**

## Current State (May 11 — GSC + full SEO audit)

| Metric | Value |
|--------|-------|
| Blog audit score (May 10) | 90/100 — best content page on site |
| Impressions | 2,672 |
| Position | 8.2 |
| CTR | 0.11% (3 clicks) |
| Meta description | 146 chars ✅ |
| Schema | Product + FAQPage + BreadcrumbList + aggregateRating |
| Word count | 2,000+ |

## Open Issues (May 10 — from full SEO audit)

1. **`itemReviewed` missing from Review schema** — blocks rich results site-wide. Fix: add `"itemReviewed": { "@id": "https://tallchairadvisor.com/#product/gesture" }` to Review node. See [[schema-markup]].
2. **Single affiliate link at 85% of page** — add CTA immediately after the DIRECT ANSWER box. Revenue leak on the page with most authority.
3. **FTC affiliate disclosure absent from body** — only footer link present. Fix: add inline disclosure sentence near top of page. See [[affiliate-compliance]].
4. **Depth gap (C1)** — Only first-person page on site. Needs 3,000+ words with exact 6'4" measurements, lumbar/armrest/seat-depth experience, before/after pain data. Queued for a future weekly plan REWRITE after cooldown clears.
5. **Stale sitemap lastmod** — still at 2026-03-07. Update `astro.config.mjs` `pageLastmod` when C1 depth expansion runs.

## AIO Suppression Status (May 12 — competitor:intelligence v2.3)

- **Query:** "steelcase gesture review"
- **AIO detected:** Yes — TCA not cited. 14 cited URLs, 1,373-char passage.
- **Capsule:** Applied ✅ — after H2 "Seat Depth: Does 18.75" Actually Fit Tall Users?" (spec-validated: 18.75")
- **Sentinel:** `<!-- tca-aio-capsule -->` present — future runs will not re-apply.
- **Source of truth:** `data/competitors/intelligence.json` (2026-05-12 run)

## Fix History

| Date | Fix | Result |
|------|-----|--------|
| 2026-03-07 | Quick Answer box, FAQ section, height fit guide added | Score rose to 88 → 90 |
| 2026-03-30 | Meta trimmed 171→146 chars | ✅ Within limit |
| 2026-04-03 | Internal links to new pages confirmed present | ✅ |
| 2026-05-12 | AIO citation capsule inserted after "Seat Depth" H2 | Spec-validated (18.75") |

## Links

- [[steelcase-gesture]] — chair entity
- [[ctr-optimization]] — CTR case study
- [[schema-markup]] — itemReviewed fix needed
- [[affiliate-compliance]] — body disclosure + CTA placement
- [[internal-linking]] — needs inbound links from high-impression pages

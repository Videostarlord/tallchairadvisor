---
type: entity
entity: site-page
url: /review/gesture/
last_updated: 2026-05-25
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-19-blog-audit.md, raw/audits/2026-05-10-full-seo-audit.md, data/gsc/latest.json, data/competitors/intelligence.json]
tags: [page, review, gesture, first-person, flagship]
---

# Page: /review/gesture/

**Flagship page. Only first-person review on the site.**

## Current State (May 25 — post-rewrite)

| Metric | Value |
|--------|-------|
| Blog audit score (May 10 pre-rewrite) | 90/100 — best content page on site |
| Impressions | 2,529 |
| Position | 8.2 |
| CTR | 0.09% — primary rewrite motivation |
| Meta description | 146 chars ✅ |
| Schema | Product + FAQPage + BreadcrumbList + aggregateRating + itemReviewed ✅ |
| Word count | 3,000+ (post-rewrite) |
| sitemap lastmod | 2026-05-25 ✅ |

## Open Issues

3. **FTC affiliate disclosure absent from body** — only footer link present. Fix: add inline disclosure sentence near top of page. See [[affiliate-compliance]].

**Resolved (May 25):**
- ~~`itemReviewed` missing from Review schema~~ — fixed ✅
- ~~Single affiliate link at 85% of page~~ — CTA added after Direct Answer box ✅
- ~~Depth gap (C1)~~ — full first-person rewrite complete ✅
- ~~Stale sitemap lastmod~~ — updated to 2026-05-25 in astro.config.mjs ✅

## Key First-Person Facts (sourced from Jackson, May 25)

- Seat depth clearance at 6'4" max: **~3 finger-widths** (solidly within Cornell 2–3 guideline — NOT borderline)
- Pain before: constant lower back aches + upper back/shoulder aches, always wanting a massage
- First sit reaction: literally said "woah" out loud
- Pain improvement: back aches gone; focus/studying better because not distracted by back
- Fell asleep in the chair once during finals week — that comfortable
- Armrests: kept below desk height; mostly works on desk surface for CAD/engineering
- Armrest padding could be better — his #2 change request
- Price is his #1 complaint

**Fabricated content removed (was AI-generated, never true):**
- "First few days felt firm enough I second-guessed myself" — replaced with real account (immediate positive reaction)
- "1.5–2 finger-widths" knee clearance — replaced with real measurement (~3 fingers)

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
| 2026-05-25 | Full first-person rewrite from Jackson Q&A session. Intro rewritten with real pain story + "woah" moment. Seat depth corrected 1.5–2 → 3 fingers. Break-in story replaced (was AI-generated). Armrests section honest account. Backrest section adds pain improvement + nap story. Height guide: 6'4" no longer "borderline". Verdict updated to 4.5/5 through 6'4". CTA added after Direct Answer box. itemReviewed schema added. sitemap lastmod updated. | All 4 major open issues resolved |

## Links

- [[steelcase-gesture]] — chair entity
- [[ctr-optimization]] — CTR case study
- [[schema-markup]] — itemReviewed fix needed
- [[affiliate-compliance]] — body disclosure + CTA placement
- [[internal-linking]] — needs inbound links from high-impression pages

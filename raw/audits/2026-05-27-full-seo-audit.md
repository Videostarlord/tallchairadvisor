# Full SEO Audit — tallchairadvisor.com
**Date:** 2026-05-27
**Auditor:** 6-agent parallel audit (technical, content, schema, sitemap, performance, on-page)
**Previous audit:** 2026-05-10 (77/100)

---

## Overall SEO Health Score: 75 / 100

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 25% | 82 | 20.5 |
| Content Quality | 25% | 71 | 17.75 |
| On-Page SEO | 20% | 72 | 14.4 |
| Schema / Structured Data | 10% | 72 | 7.2 |
| Performance (CWV) | 10% | 85 | 8.5 |
| Images | 5% | 83 | 4.15 |
| AI Search Readiness | 5% | 58 | 2.9 |
| **Total** | | | **75 / 100** |

---

## Executive Summary

Site is technically clean — Cloudflare edge delivery, 43ms TTFB, all CWV estimated PASS, no crawl blocks, strong security headers. The score is held down by on-page execution gaps: 9/10 meta descriptions are under-length, the highest-impression comparison page has 0% CTR from a broken title/H1 alignment, and schema has two critical entity reference errors. Content is strong on the flagship Gesture review (88/100) but the Aeron Size C review is thin and the comparison pages are underoptimized.

**Score change vs May 10:** -2 points. The Gesture review rewrite and page additions improved content quality on those pages, but the on-page agent surfaced systemic meta description and og:type issues not previously captured.

---

## Top 5 Critical Issues

1. **`/aeron-vs-gesture/` H1/title mismatch — 0% CTR on 385 impressions** (On-Page + Content)
   Title: "Why I Chose the Gesture" (personal verdict). H1: "Herman Miller Aeron Size C vs Steelcase Gesture" (generic spec sheet). 0 clicks from 385 impressions. Every fix on this page is zero-cost since no new content is needed.

2. **Homepage WebSite schema missing `@id`** (Schema)
   `WebPage.isPartOf` references `#website` but the WebSite block has no `@id`. Google cannot link these entities. Dangling reference in Knowledge Graph.

3. **HowTo schema on `/correct-chair-dimensions/` is deprecated** (Schema)
   Google removed HowTo from supported rich result types in September 2023. Dead markup producing zero benefit.

4. **9/10 meta descriptions under 130-char floor** (On-Page)
   Homepage: 102 chars. `/aeron-vs-gesture/`: ~90 chars. `/best-office-chairs/`: 117 chars. SERP real estate is being left on the table across the entire site.

5. **`/author/jackson-christopher/` linked internally but `/author/` returns 404** (Sitemap/Technical)
   Byline component links to the author profile. Bare `/author/` path produces a 404. Crawl error risk.

---

## Top 5 Quick Wins

1. Fix `/aeron-vs-gesture/` H1 to match title intent (30 min, 0 clicks → potential CTR recovery)
2. Add `@id` to homepage WebSite schema block (5 min)
3. Remove deprecated HowTo block from `/correct-chair-dimensions/` (5 min)
4. Fix `ogType` default in Layout.astro from `"website"` to `"article"` for content pages (1 line)
5. Add preconnect hints for `clarity.ms` and `cloudflareinsights.com` in Layout.astro head (10 min)

---

## Technical SEO — 82/100

**PASS:** Security headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy), robots.txt (all AI bots allowed), canonicals (self-referencing, consistent), noindex pages (author only), URL structure (clean slugs, trailing-slash 301s), SSG/no JS rendering dependency, LCP image preloaded with fetchpriority=high.

**Issues:**
- MEDIUM: Cache-control on HTML pages is `max-age=300` (5 min) — too conservative for a static SSG. Raise to `max-age=86400` in `public/_headers`.
- MEDIUM: `/_astro/*` static assets emit duplicate headers — `immutable` + `max-age=300, must-revalidate`. A wildcard rule in `public/_headers` is colliding. Add specific `/_astro/*` rule with `max-age=31536000, immutable` only.
- MEDIUM: CSP uses `unsafe-inline` for scripts. Acceptable for now (GTM/GA inline requirement), but note for future hardening.
- LOW: Schema bundling on `/review/gesture/` — Product + FAQPage + BreadcrumbList in one JSON-LD array. Split into separate `<script>` blocks per Google's recommended pattern.

---

## Content Quality — 71/100

**Per-page scores:**
| Page | Score | Primary Issue |
|---|---|---|
| /review/gesture/ | 88 | FTC body disclosure missing |
| /shoulder-pain-tall-people/ | 84 | EMG stat not in AI-extractable callout |
| /heavy-duty-ergonomic-chairs/ | 72 | Schema wordCount stale day-1, no FAQ |
| /best-office-chairs/ | 74 | Quick Picks CTAs → internal, not Amazon (revenue leak) |
| /correct-chair-dimensions/ | 70 | Citation capsule from May 11 still not applied |
| /review/aeron-size-c/ | 67 | Thinnest review (1,746 words), no community data |
| /aeron-vs-gesture/ | 63 | Broken title/H1 frame, CTAs at 93% depth |

**Voice rule compliance:** PASS — no violations found across all 7 audited pages. Aeron Size C explicitly disclaims personal testing.

**E-E-A-T composite:** 73/100. Authoritativeness (63) is the weakest dimension — no external citations pointing to TCA, limited numbered claims outside shoulder-pain page.

**AI Citation Readiness:** 58/100. Only shoulder-pain page has properly attributed, blockquote-formatted quotable stats. The `/correct-chair-dimensions/` citation capsule (prescribed May 11) is still not live on the page.

---

## On-Page SEO — 72/100

**Title issues (4 pages):**
- `/correct-chair-dimensions/`: 72 chars (12 over) — truncates in SERP
- `/heavy-duty-ergonomic-chairs-tall-people/`: 80 chars (20 over) — hard truncation
- `/shoulder-pain-tall-people/`: 43 chars (7 under, no brand, no power word)
- `/aeron-vs-gesture/`: H1/title intent mismatch (critical CTR issue)

**Meta descriptions (9/10 failing):**
Homepage (102 chars) and /aeron-vs-gesture/ (~90 chars) are most urgent. All pages should reach 130–155 chars with a height-specific verdict, a named spec, and a differentiated value claim.

**H1/heading issues:**
- All pages have exactly one H1 — no duplicates
- `/aeron-vs-gesture/`: H1 is generic, title is personal verdict — misaligned
- `/shoulder-pain-tall-people/`: H1 is better than title; align title to H1
- H2 question ratio: 0% on 5 of 6 content pages (target 60–70%)

**Internal linking gaps:**
- `/shoulder-pain-tall-people/` — no link to `/best-office-chairs/` or `/review/gesture/`
- `/office-chairs-for-6-foot-4/` — no link to `/best-office-chairs/`
- `/aeron-vs-gesture/` — all 8 internal links clustered at 90%+ of page depth

**OG tags:**
- `og:type` defaults to `"website"` on all article/review pages — should be `"article"`. One-line fix in Layout.astro.

---

## Schema / Structured Data — 72/100

**Critical:**
- Homepage WebSite block missing `@id` — `WebPage.isPartOf` reference dangles
- HowTo schema on `/correct-chair-dimensions/` is deprecated (removed by Google Sep 2023)

**High:**
- Aeron Size C and Leap Plus Product blocks missing `@id` (Gesture has it)
- `aggregateRating reviewCount: "1"` on all three Product pages — star snippet suppression risk
- ItemList on `/best-office-chairs/` and `/aeron-vs-gesture/` uses `url` property instead of `item` on ListItem

**Medium:**
- Homepage WebSite missing `potentialAction` SearchAction (Sitelinks Searchbox opportunity)
- `/heavy-duty-ergonomic-chairs/` missing ItemList (new page, multiple chairs compared)
- All Article pages missing `@id` on Article blocks
- Organization logo is wide OG image — should be square logomark for Knowledge Panel

**Low (keep as-is):**
- FAQPage markup: Google restricted FAQ rich results for affiliate sites in Aug 2023, but markup is still parsed by AI search surfaces — worth keeping

---

## Sitemap — 72/100

**Pass:** XML valid, 42 URLs, index → sitemap-0.xml structure correct, trailing slashes consistent, no 404s in spot-check, no noindexed URLs in sitemap.

**Issues:**
- HIGH: `/author/` returns 404 — internal links via Byline component point here
- MEDIUM: 5 stale lastmod entries: `leg-pain-circulation`, `office-chair-return-policy`, `gesture-vs-leap-plus`, `chairs/steelcase-leap-plus/weight-limit`, `chairs/herman-miller-aeron/size-guide/`
- LOW: `changefreq` and `priority` deprecated tags present — remove from `serialize()` (no SEO impact, just bloat)
- LOW: `heavy-duty-ergonomic-chairs-tall-people/` in `0.3` priority bucket — should be `0.8`

---

## Performance — 85/100

**TTFB:** ~43ms across all tested pages (Cloudflare edge, `cf-cache-status: HIT`). Excellent.

**CWV Estimates:**
| Page | LCP | INP | CLS |
|---|---|---|---|
| Homepage | PASS | PASS | PASS |
| /review/gesture/ | PASS | PASS | PASS |
| /best-office-chairs/ | PASS* | PASS | PASS |

*`/best-office-chairs/` hero has `loading=lazy` + `fetchpriority=high` conflict — lazy negates the preload signal.

**Issues:**
- MEDIUM: `/_astro/*` duplicate cache-control header (`immutable` + `max-age=300` collision from `public/_headers` wildcard rule)
- MEDIUM: Missing preconnect for `https://www.clarity.ms` and `https://cloudflareinsights.com`
- LOW: `/best-office-chairs/` hero image — remove `loading=lazy` from LCP candidate
- LOW: CSS bundle 35KB — verify Brotli compression active on Cloudflare

---

## Images — 83/100

All images: WebP format, explicit width/height attributes (no CLS), LCP images preloaded. No missing alt text detected on audited pages. Primary issue: `loading=lazy` + `fetchpriority=high` conflict on `/best-office-chairs/` hero.

---

## AI Search Readiness — 58/100

Only `/shoulder-pain-tall-people/` has properly structured, attributed, AI-extractable stats (PMC5462674, MVIC percentages, Scientific Reports 2025 citation). All other pages embed specs in prose without callout formatting. The `/correct-chair-dimensions/` citation capsule (the highest-leverage AI citation fix on the site) has been prescribed since May 11 and is still not applied to the live page. Three AIO capsules are applied (gesture, best-office-chairs, leap-plus) from the May 12 GEO pipeline run.

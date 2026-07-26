---
type: entity
entity: site-page
url: /best-office-chairs/
last_updated: 2026-07-21
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-04-03-action-plan.md, raw/audits/2026-05-10-full-seo-audit.md, data/gsc/latest.json, data/competitors/intelligence.json, raw/audits/2026-07-21-post-consolidation-gsc-analysis.md]
tags: [page, money-page]
---

# Page: /best-office-chairs/

**⛔ MERGED 2026-07-04 — 301 → /office-chairs-for-tall-people/. This page no longer exists.**

The July 4 GSC verification pass (90-day data) showed this page never escaped position 45–75 on its target head terms ("best office chair(s) for tall people/person" family, ~340 impr, **0 clicks ever**) while cannibalizing /office-chairs-for-tall-people/ — both pages had near-identical titles targeting the same queries. Google attributed the head-term queries to this page but ranked it nowhere; the rival held pos 8.1 on Leap V2 brand queries. Merged: Quick Picks box, height-bracket verdict table (with corrected AIO capsule), and back-pain FAQ moved to the survivor; all internal links, nav (Header/Footer), and breadcrumb schemas repointed; 301 in `public/_redirects`; removed from sitemap config. See [[office-chairs-for-tall-people]] and decisions-log 2026-07-04 (consolidation entry).

**Post-merge status (2026-07-21, 17 days after the 301):** redirect verified live — both `/best-office-chairs/` and the no-slash variant 301 single-hop to the survivor; page absent from sitemap; no index loss sitewide. **But GSC still attributes the entire head-term family to this dead URL** at pos 40.6–68.1 with 0 clicks — no migration to the survivor yet. Normal 301 signal-consolidation latency is 2–8 weeks. As a page it contributed only ~14 impressions/day when killed, so its removal accounts for just **1.7%** of the July sitewide impression decline. Full analysis: `raw/audits/2026-07-21-post-consolidation-gsc-analysis.md`.

| Head-term query (still on this URL) | Position Jun 29 → Jul 20 | Clicks |
|---|---|---|
| best office chairs for tall people | 56.9 → 51.2 | 0 |
| best office chair for tall person | 71.6 → 68.1 | 0 |
| best office chair tall person | 72.3 → 67.2 | 0 |
| best office chairs for tall man | 47.0 → 40.6 | 0 |

Historical record below preserved as-is.

---

**Main money page. Primary revenue driver.** *(historical)*

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

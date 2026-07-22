---
type: entity
entity: site-page
url: /office-chairs-for-tall-people/
created: 2026-07-04
last_updated: 2026-07-21
sources: [data/gsc/latest.json, raw/audits/2026-07-04-affiliate-revenue-audit.md, raw/audits/2026-07-21-post-consolidation-gsc-analysis.md]
tags: [page, money-page, hub]
---

# Page: /office-chairs-for-tall-people/

**THE money hub since 2026-07-04** — crowned in the commercial-cluster consolidation. Absorbed /best-office-chairs/ (301).

## Why it was crowned (GSC verification, 90d ending Jun 29)

| Candidate | Impressions | Clicks | Position | Head-term position |
|-----------|------------|--------|----------|--------------------|
| /office-chairs-for-tall-people/ | 2,715 | 16 | 8.1 | (queries attributed to rival) |
| /best-office-chairs/ (killed) | 1,719 | 6 | 18.7 avg | **45–75 on "best office chair for tall people" family, 0 clicks ever** |

The rival page owned the head-term query association but ranked nowhere; this page had the authority (Leap V2 brand queries at pos 7.5–8.2) and the exact-match slug. Merge transfers the head terms to the authority.

## 2026-07-04 merge changes

- Title → "Best Office Chairs for Tall People 2026 (6'0"–6'7" Guide)"; H1 → "Best Office Chairs for Tall People"; verdict-lead meta
- Quick Picks box added after disclosure (3 direct Amazon ASIN links + under-500/refurb cross-link)
- Height-bracket verdict table added ("Which Chair Is Best at Your Height?" — Top Pick / Runner-Up / Fails At per bracket, from killed page)
- Broken AIO capsule replaced ("Executive-level presence…" text had wrong specs — 16-17" seat depth — now states correct thresholds)
- FAQ + FAQPage schema: added "Which office chair is best for tall people with lower back pain?" (targets 66-impr pos-49 query "best office chair for tall person with back pain")
- Affiliate links: 3 → 15
- Header/Footer nav + all breadcrumb schemas sitewide now point here

## Success metric (audit experiment 4) — REVISED 2026-07-21

**Original:** head-term family gains 3+ positions on this URL within 4 weeks of the 301 being crawled.

**Why revised:** head terms sit at positions 40.6–68.1. A 3-position gain produces zero clicks, and the rolling-average drift alone moved them 4–6 positions with nothing changing. The metric can be satisfied while delivering nothing.

**Revised metric:** any head-term query enters the **top 20**, OR the family records its **first non-zero click**. Evaluate 2026-09-01.

## Post-consolidation status (checked 2026-07-21, 17 days after 301)

**Mechanics clean, goal not yet delivered.** Redirects verified live: `/best-office-chairs/` and no-slash variant both 301 single-hop here; sitemap 43 URLs with zero killed URLs; no pages dropped from the index (GSC page count 39 → 42 → 43).

This page is stable and slightly compounding:

| Snapshot (90d) | Impressions | Clicks | Position |
|---|---|---|---|
| Jun 29 | 2,715 | 16 | 8.1 |
| Jul 06 | 2,895 | 16 | 8.1 |
| Jul 13 | 3,046 | 17 | 8.2 |
| Jul 20 | 3,233 | 18 | 8.1 |

**But no head-term migration yet.** The entire "best office chair(s) for tall people" family is still attributed to the dead `/best-office-chairs/` URL at pos 40.6–68.1, 0 clicks. This page's queries remain purely Leap V2 brand terms ("steelcase leap v2 for tall people" 69 impr pos 7.9; "leap v2 for tall people" 24 impr; "steelcase leap v2 tall person" 21 impr). Normal 301 signal-consolidation latency is 2–8 weeks — too early to call. See [[gsc-performance]] and `raw/audits/2026-07-21-post-consolidation-gsc-analysis.md`.

## Fix History

| Date | Change | Why |
|------|--------|-----|
| 2026-07-04 | Absorbed /best-office-chairs/; Quick Picks + verdict table + FAQ; title/meta/H1 rewrite; AIO capsule fix | Cannibalization consolidation (audit item 3) |
| 2026-07-21 | No page change — success metric revised to absolute threshold; post-consolidation status recorded | 3-position metric was unfalsifiable/meaningless at pos 40–70 |

## Links

- [[best-office-chairs]] — the merged-away page (historical)
- [[affiliate-performance]] — ASIN map
- [[gsc-intelligence]] — weekly position tracking

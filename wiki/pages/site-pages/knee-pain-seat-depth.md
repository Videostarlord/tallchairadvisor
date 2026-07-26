---
type: entity
entity: site-page
url: /knee-pain-seat-depth/
last_updated: 2026-07-21
sources: [raw/audits/2026-06-14-full-site-report.md, raw/audits/2026-07-21-post-consolidation-gsc-analysis.md]
tags: [page, educational, high-impression, calculator]
---

# Page: /knee-pain-seat-depth/

**Highest-impression page on the site. Educational; no chair tested. Cornell Ergonomics Rule framing.**

## ⚠️ This page's impressions are not real demand (established 2026-07-21)

**38,644 impressions (41% of all site impressions) at position 5.7 → 18 clicks. CTR 0.047%** — impossible on a normal text SERP at that position. Its queries are almost entirely anonymized long-tail; sitewide, only 2.8% of impressions carry any query attribution. Signature is consistent with zero-click informational surfacing where the answer renders in the SERP itself.

**This page drove 58.5% of the July sitewide impression decline** (−3,285 in the week ending Jul 20 vs the week prior, against a sitewide −5,614) — while its *position improved* from 6.1 → 5.7. Impressions and rankings here are decoupled; the movement is demand/SERP-surface, not a ranking loss and not caused by any site change.

**Do not treat this page's impression volume as a health signal, and do not restructure in response to it.** See [[gsc-performance]] and `raw/audits/2026-07-21-post-consolidation-gsc-analysis.md`.

Open question worth testing: whether the page can be reframed to capture *any* click share at pos 5.7, or whether the query class is structurally zero-click. Until answered, the site's real click engine is [[review-leap-plus]].

## Current State (June 14)

| Metric | Value |
|--------|-------|
| Impressions (GSC, 90d) | 12,804 — #1 on site |
| Position | ~15 (estimated) |
| CTR | Low — AIO suppression suspected |
| Schema | Article + BreadcrumbList + FAQPage (5 questions) |
| Calculator | ✅ Working as of 2026-06-14 (was broken — zero JS) |
| Internal links out | /back-pain-spine-height/, /correct-chair-dimensions/, /review/leap-plus/, /review/gesture/, /review/aeron-size-c/, /best-office-chairs-under-500/ |

## Content Summary

- Explains the Cornell Ergonomics Rule: 2–3 finger-widths clearance between seat edge and back of knee
- Popliteal pressure mechanism — why seat depth causes knee pain in tall people
- Height-based seat depth requirements: 18–19" for 6'0"–6'2", 19–20" for 6'2"–6'4", 20+" for 6'5"+
- Fixed vs adjustable seat depth explanation
- Chair comparison: Leap Plus (19.75" adj), Gesture (18.75" adj), Aeron Size C (18.5" fixed)
- 5-item FAQ schema

## Calculator (Interactive)

Height × body type → minimum seat depth + matching chairs with affiliate links. Also supports manual inseam entry.

**Logic:** depthByHeight lookup table (6 height ranges × 3 body types). Chairs filtered by `maxDepth >= minDepth`. Matching chairs shown with green border + Amazon affiliate CTA; non-matching shown greyed out.

**Status:** ✅ Working — JS bundled in Astro hoisted script.

## Fix History

| Date | Fix | Result |
|------|-----|--------|
| 2026-06-14 | File was silently truncated — last FAQ entry ("Does the Herman Miller Aeron...") and closing `</Layout>` were missing. Completed. | File integrity restored |
| 2026-06-14 | Injected full calculator JavaScript — height button → body type reveal → seat depth calculation → chair matching with affiliate links. Manual inseam path also wired. | Calculator now functional end-to-end |
| 2026-06-14 | Added contextual link to /best-office-chairs-under-500/ in "Chairs With Adequate Seat Depth" section. | Closes #1 internal link gap on site |

## Open Issues

1. **CTR unknown** — No click data available at current position. AIO may be suppressing impressions to clicks.
2. **No AIO capsule** — Cornell cluster (164 impr, 0 CTR per May GSC analysis) — candidate for AIO citation capsule. See [[ai-citation-readiness]].

## Links

- [[internal-linking]] — highest-priority inbound link gap closed (→ /best-office-chairs-under-500/)
- [[gsc-analysis-strategy]] — Cornell cluster associated with this page
- [[steelcase-leap-plus]] — top recommended chair for seat depth
- [[steelcase-gesture]] — second recommended chair

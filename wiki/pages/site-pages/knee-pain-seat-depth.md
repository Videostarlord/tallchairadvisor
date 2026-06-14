---
type: entity
entity: site-page
url: /knee-pain-seat-depth/
last_updated: 2026-06-14
sources: [raw/audits/2026-06-14-full-site-report.md]
tags: [page, educational, high-impression, calculator]
---

# Page: /knee-pain-seat-depth/

**Highest-impression page on the site. Educational; no chair tested. Cornell Ergonomics Rule framing.**

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

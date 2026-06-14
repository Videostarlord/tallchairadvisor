---
type: concept
last_updated: 2026-06-14
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-03-site-structure.md, raw/audits/2026-05-10-full-seo-audit.md]
tags: [internal-links, site-architecture]
---

# Internal Linking

## Architecture

Hub-and-spoke clusters. Each chair brand gets a hub + micro-pages. All pages reachable within 3 clicks from home. Every page should have at least 3 internal links.

## Verified Links (May 10)

| From | To | Status |
|------|-----|--------|
| /review/gesture/ | /shoulder-pain-tall-people/ | ✅ |
| /review/gesture/ | /best-office-chairs-under-500/ | ✅ |
| /review/gesture/ | /review/sihoo-doro-s300/ | ✅ |
| /review/gesture/ | /review/aeron-size-c/ | ✅ |
| /review/gesture/ | /correct-chair-dimensions/ | ✅ |
| /knee-pain-seat-depth/ | /best-office-chairs-under-500/ | ✅ 2026-06-14 |
| /aeron/tall-people/ | /review/aeron-size-c/ | ✅ |
| /aeron/tall-people/ | /correct-chair-dimensions/ | ✅ |
| /chairs/herman-miller-aeron/ | /chairs/herman-miller-aeron/size-guide/ | ✅ FIXED 2026-05-10 |
| /review/aeron-size-c/ | /chairs/herman-miller-aeron/size-guide/ | ✅ FIXED 2026-05-10 |

## Unverified / Open (May 10)

| From | To | Priority |
|------|-----|----------|
| Height guides (/6-foot-3 thru /6-foot-7/) | /correct-chair-dimensions/ | HIGH |
| /best-office-chairs/ | /best-office-chairs-under-500/ | HIGH |
| /best-office-chairs/ | /review/sihoo-doro-s300/ | HIGH |
| /aeron-vs-gesture/ | /review/aeron-size-c/ | MEDIUM |
| /correct-chair-dimensions/ | /review/gesture/ | MEDIUM |

## Open Issues (May 10 — from full SEO audit)

1. **`/standing-desk-height-tall-people/` near-orphaned** — only 1 inbound link despite priority 0.8 in sitemap. Needs links from at least 2 relevant pages (e.g. /review/gesture/, /best-office-chairs/).
2. **Aeron vs Gesture: no affiliate links in first 84% of page** — both Amazon links are at 85-86% into the HTML. Not a linking architecture issue, but a CTA placement issue. See [[aeron-vs-gesture]].

## Strategic Links Needed

- /correct-chair-dimensions/ (1,766 impr May 11) → /review/gesture/ — high-impression informational page passing authority to flagship
- /chairs/herman-miller-aeron/tall-people/ (1,379 impr) → /review/gesture/ — same rationale

## Fix History

| Date | Fix |
|------|-----|
| 2026-05-10 | /chairs/herman-miller-aeron/size-guide/ orphan resolved — inbound links added from hub + aeron-size-c review |
| 2026-06-14 | /knee-pain-seat-depth/ → /best-office-chairs-under-500/ added in "Chairs With Adequate Seat Depth" section. Closes highest-priority gap: #1 impression page (12,804 GSC) now passes link equity to hidden-star conversion page (42 sessions, 285s dwell, 5 affiliate clicks, unranked in GSC). |

## Links

- [[review-gesture]] — needs inbound authority
- [[ctr-optimization]] — internal links affect ranking which affects CTR
- [[aeron-vs-gesture]] — CTA placement open issue

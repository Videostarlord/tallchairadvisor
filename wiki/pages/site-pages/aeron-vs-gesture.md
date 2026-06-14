---
type: entity
entity: site-page
url: /aeron-vs-gesture/
last_updated: 2026-06-14
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-05-10-full-seo-audit.md, raw/audits/2026-05-27-full-seo-audit.md, data/gsc/latest.json]
tags: [page, comparison, ctr-issue, revenue-leak]
---

# Page: /aeron-vs-gesture/

## Current State (May 27 — GSC + full SEO audit)

| Metric | Value |
|--------|-------|
| Blog audit score | 63/100 — dropped from 82 (on-page structural issues) |
| Impressions | 385 |
| Position | 8.5 |
| CTR | **0%** (0 clicks on 385 impressions) — still unresolved |
| Meta description | ~90 chars — severely under floor (was 154, over-trimmed) |
| Schema | Article, ItemList, FAQPage, BreadcrumbList |
| Word count | ~2,200 |

## Open Issues (June 14)

3. **Quick Answer is non-verdict** — "Aeron for breathability; Gesture for armrests" doesn't deliver on personal-decision promise.
4. **All 8 internal links clustered at 90%+ of page depth** — Not contextual. Move 2–3 into body paragraphs.

**Resolved:**
- ~~CRITICAL — H1/title mismatch~~ — H1 rewritten to "Why I Chose the Steelcase Gesture Over the Aeron at 6'4"" (May 27) ✅
- ~~CRITICAL — Meta ~90 chars~~ — Meta rewritten twice: 154 chars with verdict+spec (May 27), then sharpened to decision-led verdict lead (Jun 14) ✅
- ~~Both affiliate CTAs at 93% depth~~ — Two-button CTA block added after Quick Answer (May 27) ✅
- ~~ItemList `url` instead of `item`~~ — Fixed (May 27) ✅
- ~~dateModified frozen~~ — Updated to 2026-05-27 (May 27) ✅

## Fix History

| Date | Fix | Result |
|------|-----|--------|
| 2026-04-03 | Page expanded from ~375 to ~1,400 words | Score 82/100 |
| 2026-05-27 | H1 rewritten to match title intent ("Why I Chose the Steelcase Gesture Over the Aeron at 6'4"") | CTR fix — pending GSC validation |
| 2026-05-27 | Meta rewritten to ~154 chars with verdict + spec + capacity | From ~90 chars |
| 2026-05-27 | Quick Answer headline updated to first-person verdict | Aligns with title frame |
| 2026-05-27 | ItemList `url` → `item` on both ListItems | Schema spec compliance |
| 2026-05-27 | dateModified updated to 2026-05-27 | Sitemap lastmod also updated |
| 2026-06-14 | Meta description rewritten again — sharpened from generic "Gesture wins on armrests" to decision-led: "At 6'4", the Gesture won — adjustable seat depth and 360° armrests outweighed the Aeron's breathability advantage." ~158 chars. Addresses 0 clicks at pos 8.5 by leading with verdict signal rather than spec listing. | Pending GSC validation |

## Links

- [[steelcase-gesture]] — winner in this comparison
- [[herman-miller-aeron]] — the alternative
- [[ctr-optimization]] — 0% CTR case
- [[meta-descriptions]] — verdict-first pattern
- [[affiliate-compliance]] — CTA placement issue

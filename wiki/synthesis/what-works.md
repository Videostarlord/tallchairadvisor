---
type: synthesis
last_updated: 2026-05-06
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-30-audit-summary.md, raw/audits/2026-05-05-weekly-audit.md]
tags: [patterns, wins, strategy]
---

# What Works

Patterns and fixes that produced measurable positive outcomes. Updated as new data comes in.

## Confirmed Wins

### Growth Trajectory (Apr → May 2026)

10. **Impression tripling in 4 weeks** — 4,443 impr (Apr 7) → 12,209 impr (May 5) on a 90-day rolling window. Position improved from 14.3 → 11.5 over the same period. This is the clearest site-level confirmation that the hub-and-spoke architecture and content strategy are working. Not a fluke — every weekly snapshot improved.

11. **First affiliate commission: $18 on May 1** — Confirms the full funnel works (impression → click → purchase). **Came from /knee-pain-seat-depth/ (corrected May 6)** — not the Gesture review as initially assumed. A problem-aware visitor (knee pain query) read the seat depth guide and clicked an embedded Amazon CTA. Validates that pain-pillar educational pages with embedded CTAs convert, not just first-person reviews. Came roughly 120 days after launch.

12. **New review pages index and rank fast** — `/review/aeron-size-c/` reached pos 7.0 with 548 impressions shortly after creation. Spec-driven research-voice reviews get picked up quickly even on a young domain when the content is specific enough.

13. **Review pages growing impression share** — `/review/gesture/` grew from 490 impr (Mar) → 581 (Apr) → 1,895 (May) while position improved from pos 10.31 → 8.4. `/review/leap-plus/` grew from 265 → 632 impr. These are commercial-intent pages on editorial SERPs — the format Google rewards on review queries.

14. **Informational pages driving volume** — `/knee-pain-seat-depth/` emerged as the #2 impression page at 1,524 impr, pos 8.8. `/correct-chair-dimensions/` grew from 532 → 1,422 impr. These aren't converting to clicks at high rates but they build topical authority and attract backlinks over time.

### Technical Fixes That Moved Numbers

1. **Sitemap priority upgrade (0.3→0.8) for height pages** — /office-chairs-for-6-foot-7/ got its first impression within days. Correlation, not proven causation, but the timing is clear.

2. **Fixing the 404 on /leap-plus/weight-limit/** — page now renders, removing a crawl error signal.

3. **og:type correction (website→article) on 3 pages** — removes technical flag.

4. **Homepage fetchpriority="high" on hero image** — CWV performance score went from 8/10 to 9/10 in audit.

### Content Changes That Showed Promise

5. **Quick Answer box + FAQ section on /review/gesture/** — page score went from ~80 to 88. Impressions grew from 490 to 581 and continued climbing to 1,895.

6. **Expanding thin comparison pages to ~1,400 words** — gesture-vs-leap-plus, aeron-vs-leap-plus, aeron-vs-gesture all went from ~375 words to full treatment. Rankings improved (aeron-vs-gesture reached pos 7.59, aeron-vs-leap-plus at 2.15% CTR — highest on site).

### Structural Decisions That Paid Off

7. **Hub-and-spoke clusters confirmed at scale** — chair sub-pages (seat-height, seat-depth, tall-people) rank independently. `/chairs/steelcase-gesture/seat-depth/` at pos 8.1 with 710 impr; `/chairs/herman-miller-aeron/tall-people/` at pos 7.3 with 1,175 impr. Both generate clicks without cannibalizing the review page.

8. **llms.txt + AI bot access** — PerplexityBot and GPTBot allowed. Sihoo review noted as "rising in AI citations."

## Patterns to Repeat

- **Spec-driven sub-pages rank fast** for long-tail queries (e.g., "steelcase gesture seat depth range inches" at pos 5.75)
- **FAQPage schema** on content pages — correlates with better rich result eligibility
- **Pain-pillar pages with embedded CTAs convert** — /knee-pain-seat-depth/ drove the first commission (May 1), not the Gesture review. Problem-aware visitor → educational page → Amazon CTA flow works. Pattern: embed 2-CTA affiliate block in every pain/ergonomics page (primary + secondary chair recommendation).
- **New page → pos 7 within weeks** — aeron-size-c proved new content indexes fast on this domain now

## What We Can't Confirm Yet

- Whether meta description rewrites improve CTR — **first real test coming May 8** (Thursday agent finally unblocked after cooldown bug fix; 5 verdict-first rewrites queued)
- Whether internal link changes affect ranking positions
- Whether citation capsules would increase AI citations
- Whether /correct-chair-dimensions/ and other informational pages convert — knee-pain proved the format works, but that page has a strong "problem → solution → buy" flow. Not all informational pages have this structure.

## Important Nuance: SERP Context Matters

The April 22 SERP audit found AI Overviews and shopping carousels as CTR suppressors. This is real — but applies to specific query types:
- **Shopping carousels:** Only on head commercial terms ("best office chair for tall people") where TCA is still buried at pos 23–25. Meta rewrites won't help there.
- **AI Overviews:** Only on specific spec queries (confirmed on 2 queries). Not confirmed on the high-impression review/comparison pages.
- **Review and comparison pages** (gesture, leap-plus, aeron-size-c) are on editorial SERPs without carousels. Meta rewrites are likely to move CTR on these. The April 22 "meta rewrites won't help" conclusion was overgeneralized beyond what the research actually checked.

## Links

- [[what-failed]] — the other side
- [[ctr-optimization]] — meta fix effectiveness (first test pending May 8)
- [[gsc-performance]] — data source

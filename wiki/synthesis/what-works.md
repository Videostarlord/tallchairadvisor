---
type: synthesis
last_updated: 2026-08-28
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-30-audit-summary.md, raw/audits/2026-05-05-weekly-audit.md]
tags: [patterns, wins, strategy]
---

# What Works

Patterns and fixes that produced measurable positive outcomes. Updated as new data comes in.

## CTA position predicts affiliate clicks better than anything else on the page (2026-08-28)

Measured across every page with GA4 sessions, joining affiliate click counts to Clarity scroll depth and the position of each page's first Amazon link.

| Page | avg scroll | 1st CTA at | affiliate clicks |
|---|---|---|---|
| `/office-chairs-for-tall-people/` | 56% | **16%** | **49** |
| `/best-office-chairs-under-500/` | 31% | 46% | 16 |
| `/best-big-and-tall-office-chairs/` | 45% | 54% | 12 |
| `/review/gesture/` | 19% | 22% | 5 |
| `/review/leap-plus/` | 48% | 79% | 3 |
| `/review/aeron-size-c/` | 7% | 91% | **0** |
| `/review/sihoo-doro-s300/` | 21% | 97% | **0** |
| `/chairs/steelcase-gesture/` | 53% | 98% | 1 |

**One page put its CTA at 16% and took 51% of the site's entire affiliate click volume.** Every page whose first CTA sat past ~60% took 0–3 clicks. Not copy, not design, not product — position.

**The clearest case: `/review/aeron-size-c/`.** 52 sessions, average scroll depth **7%**, and the only buy link at **91%** of the page. It was not underperforming. It was unreachable. Same for `/review/sihoo-doro-s300/` (97%) and `/chairs/steelcase-gesture/` (98%).

**And the homepage had no affiliate link at all** — 70 sessions/28d, the most-visited page on the site, zero monetisation.

### What was done

`src/components/BuyBox.astro` — a compact verdict + CTA card placed immediately after the Direct Answer and disclosure on 8 pages, plus a Quick Picks block on the homepage mirroring the one that already works.

**Verified by pixel measurement in a real browser, not by markup position.** Counting characters through the HTML said the CTAs were still at 34–44%; that metric is wrong, because site navigation is markup-heavy but visually short. Rendered at 1280×800 and 390×844:

| | before (markup) | after (rendered, desktop) | after (mobile) |
|---|---|---|---|
| CTA position range | 66–98% | **8–18%** | **6–13%** |
| Reachable at avg scroll | 1 of 9 | 7 of 10 | 8 of 10 |

The three still marginal (`/`, `/review/aeron-size-c/`, `/office-chairs-for-6-foot-6/`) have average scroll depths of 6–18%, which is a bounce problem rather than a placement one — a CTA cannot go above 6% of a page without sitting above the H1.

### The rule to carry forward

**Put the first affiliate CTA immediately after the Direct Answer block, never in a "Where to Buy" section at the bottom.** The Direct Answer stays first: it is the AI-citation asset and the AI Assistant channel is 4.6% of sessions and growing. A commercial box above the answer would trade a growing channel for a placement that is already good enough — the winning page renders its CTA at 8% *after* its answer box.

**Result not yet measured.** Placement is verified; the click lift is not. Compare affiliate clicks per session in the GA4 pull ~2 weeks out. See [[affiliate-performance]].

## Confirmed Wins

### Growth Trajectory (Apr → May 2026)

10. **Impression tripling in 4 weeks** — 4,443 impr (Apr 7) → 12,209 impr (May 5) on a 90-day rolling window. Position improved from 14.3 → 11.5 over the same period. This is the clearest site-level confirmation that the hub-and-spoke architecture and content strategy are working. Not a fluke — every weekly snapshot improved.

11. **First affiliate commission: $18 on May 1** — Confirms the full funnel works (impression → click → purchase). **Came from /knee-pain-seat-depth/ (corrected May 6)** — not the Gesture review as initially assumed. A problem-aware visitor (knee pain query) read the seat depth guide and clicked an embedded Amazon CTA. Validates that pain-pillar educational pages with embedded CTAs convert, not just first-person reviews. Came roughly 120 days after launch.

12. **New review pages index and rank fast** — `/review/aeron-size-c/` reached pos 7.0 with 548 impressions shortly after creation. Spec-driven research-voice reviews get picked up quickly even on a young domain when the content is specific enough.

13. **Review pages growing impression share** — `/review/gesture/` grew from 490 impr (Mar) → 581 (Apr) → 2,529 (May 10) while position improved from pos 10.31 → 8.2. `/review/leap-plus/` grew from 265 → 971 impr. These are commercial-intent pages on editorial SERPs — the format Google rewards on review queries.

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

7. **Hub-and-spoke clusters confirmed at scale** — chair sub-pages (seat-height, seat-depth, tall-people) rank independently. `/chairs/steelcase-gesture/seat-depth/` at pos 8.2 with 905 impr; `/chairs/herman-miller-aeron/tall-people/` at pos 7.4 with 1,353 impr. Both generate clicks without cannibalizing the review page.

8. **llms.txt + AI bot access** — PerplexityBot and GPTBot allowed. Sihoo review noted as "rising in AI citations."

## Patterns to Repeat

- **Spec-driven sub-pages rank fast** for long-tail queries (e.g., "steelcase gesture seat depth range inches" at pos 5.75)
- **FAQPage schema** on content pages — correlates with better rich result eligibility
- **Pain-pillar pages with embedded CTAs convert** — /knee-pain-seat-depth/ drove the first commission (May 1), not the Gesture review. Problem-aware visitor → educational page → Amazon CTA flow works. Pattern: embed 2-CTA affiliate block in every pain/ergonomics page (primary + secondary chair recommendation).
- **New page → pos 7 within weeks** — aeron-size-c proved new content indexes fast on this domain now

## What We Can't Confirm Yet

- Whether meta description rewrites improve CTR — **5 verdict-first rewrites deployed May 7** (gesture, knee-pain, aeron-size-c, gesture-hub, leap-plus-tall-people). Awaiting CTR signal — requires ~14 days of impressions to interpret.
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

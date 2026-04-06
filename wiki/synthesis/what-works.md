---
type: synthesis
last_updated: 2026-04-06
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-03-30-audit-summary.md]
tags: [patterns, wins, strategy]
---

# What Works

Patterns and fixes that produced measurable positive outcomes. Updated as new data comes in.

## Confirmed Wins

### Technical Fixes That Moved Numbers

1. **Sitemap priority upgrade (0.3→0.8) for height pages** — /office-chairs-for-6-foot-7/ got its first impression within days. Correlation, not proven causation, but the timing is clear.

2. **Fixing the 404 on /leap-plus/weight-limit/** — page now renders, removing a crawl error signal. No GSC data yet on impact.

3. **og:type correction (website→article) on 3 pages** — aligns with Google's content type expectations. No measurable impact yet but removes a technical flag.

4. **Homepage fetchpriority="high" on hero image** — CWV performance score went from 8/10 to 9/10 in audit.

### Content Changes That Showed Promise

5. **Quick Answer box + FAQ section on /review/gesture/** — page score went from ~80 to 88. Impressions grew from 490 to 581. Hard to isolate the cause, but content quality clearly isn't hurting.

6. **Comparison table on /aeron/tall-people/** — added between Mar 30 and Apr 3. No CTR improvement yet, but the page already had a meta problem so the table alone can't fix SERP clickthrough.

7. **Expanding thin comparison pages to ~1,400 words** — gesture-vs-leap-plus, aeron-vs-leap-plus, aeron-vs-gesture all went from ~375 words to full treatment. Rankings improved (aeron-vs-gesture reached pos 7.59).

### Structural Decisions That Paid Off

8. **Hub-and-spoke clusters** — chair sub-pages (seat-height, seat-depth, tall-people, weight-limit) rank independently for micro-queries. /steelcase-gesture/seat-depth/ at pos 8.61 with 171 impressions from a sub-page.

9. **llms.txt + AI bot access** — PerplexityBot and GPTBot allowed. Sihoo review noted as "rising in AI citations." Impossible to measure directly, but the access is in place.

## Patterns to Repeat

- **Spec-driven sub-pages rank fast** for long-tail queries (e.g., "steelcase gesture seat depth range inches" at pos 5.75)
- **FAQPage schema** on content pages — correlates with better rich result eligibility
- **Staggered datePublished** across pages — avoids the "all published same day" signal

## What We Can't Confirm Yet

- Whether meta description rewrites improve CTR (no before/after data yet)
- Whether internal link changes affect ranking positions
- Whether citation capsules would increase AI citations

## Links

- [[what-failed]] — the other side
- [[ctr-optimization]] — biggest unknown (verdict-first meta not yet tested)
- [[gsc-performance]] — data source

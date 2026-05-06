---
type: concept
last_updated: 2026-04-22
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-04-03-action-plan.md, raw/audits/2026-04-22-serp-analysis.md]
tags: [ctr, meta-descriptions, serp, high-priority]
---

# CTR Optimization

**The #1 bottleneck on the site.** 7,096 impressions, 19 clicks, 0.27% CTR as of Apr 20. The root cause is now diagnosed: structural SERP suppression, not meta description quality.

## Revised Diagnosis (Apr 22 — Incognito SERP Audit)

Two distinct suppression mechanisms explain the 0% CTR:

**Mechanism 1 — AI Overviews (spec/informational queries where TCA ranks pos 7–10):**
- `herman miller aeron size c height range` (pos 9, 10 impr, 0 clicks) → confirmed AI Overview
- `steelcase gesture 360 armrests description` (pos 7.8, 4 impr, 0 clicks) → confirmed AI Overview
- Google answers these fully before organic results. Meta rewrites cannot fix this.

**Mechanism 2 — Shopping Carousels (money queries where TCA is buried pos 65–79):**
- All "best office chair for tall people" variants show a product shopping carousel above the fold
- Even pos 3 organic results appear below scroll. TCA at pos 65–79 is effectively invisible.

**Conclusion:** Verdict-first meta rewrites are not the primary lever. They may help marginally on queries that escape both suppressors, but they cannot fix structural SERP layout.

## CTR Status by Page (Apr 20)

| Page | Impressions | Position | CTR | Actual Cause |
|------|------------|----------|-----|-------------|
| [[review-gesture]] | 1108 | 9.0 | 0.18% | Positional — needs ranking lift to pos 6–7 |
| /correct-chair-dimensions/ | 803 | 20.2 | 0.25% | Low position |
| [[aeron-tall-people]] | 725 | 7.3 | 0.28% | Low but not zero — some clicks landing |
| /knee-pain-seat-depth/ | 445 | 9.4 | 0% | Likely AI Overview or SERP feature |
| [[aeron-vs-gesture]] | 276 | 8.2 | 0% | Likely shopping/brand results dominating |

## What Can Actually Move CTR

1. **GEO optimization** — get cited inside AI Overviews on the spec queries (height-bracket tables, citation capsules). Converts an invisible pos-9 ranking into a presence inside the answer box.
2. **PAA targeting** — every SERP has People Also Ask boxes. 40–60 word direct-answer sections on existing pages.
3. **Ranking lift on /review/gesture/** — pos 9 → pos 6 meaningfully increases CTR even without meta changes.
4. **Schema fix on /best-office-chairs/** — parse error blocking rich results eligibility.

## What Verdict-First Meta Can Still Help

On queries that aren't suppressed by AI Overviews or shopping carousels (mostly branded/specific queries), verdict-first meta is still sound practice. But it's not the site's primary problem.

## Links

- [[meta-descriptions]] — implementation patterns
- [[aeron-tall-people]] — highest-impression page
- [[ai-citation-readiness]] — GEO fixes for AI Overview suppression
- raw/audits/2026-04-22-serp-analysis.md — full incognito SERP audit

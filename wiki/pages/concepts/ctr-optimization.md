---
type: concept
last_updated: 2026-05-10
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-04-03-action-plan.md, raw/audits/2026-04-22-serp-analysis.md, data/gsc/latest.json]
tags: [ctr, meta-descriptions, serp, high-priority]
---

# CTR Optimization

**The #1 bottleneck on the site.** 14,767 impressions, 35 clicks, 0.24% CTR as of May 10 (90-day). The root cause is structural SERP suppression for head terms; on editorial/review pages verdict-first meta rewrites are likely to help.

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

## CTR Status by Page (May 10 — from latest.json)

| Page | Impressions | Position | CTR | Actual Cause |
|------|------------|----------|-----|-------------|
| [[review-gesture]] | 2529 | 8.2 | 0.12% | Meta rewrite test ran May 7 — awaiting data signal |
| /knee-pain-seat-depth/ | 1925 | 8.6 | 0.16% | Meta rewrite test ran May 7 — awaiting data signal |
| /correct-chair-dimensions/ | 1658 | 16.1 | 0.18% | Low position — content depth is primary lever |
| [[aeron-tall-people]] | 1353 | 7.4 | 0.30% | Some clicks landing; meta rewrite ran May 7 |
| /review/leap-plus/ | 971 | 8.5 | 0.31% | Comparable to Gesture — editorial SERP, meta is actionable |
| [[aeron-vs-gesture]] | 385 | 8.5 | 0% | 0-click despite solid position — meta rewrite queued W19 |
| /best-office-chairs/ | 755 | 22.8 | 0% | Low position + shopping carousels — position is the fix |

## What Can Actually Move CTR

1. **GEO optimization** — get cited inside AI Overviews on the spec queries (height-bracket tables, citation capsules). Converts an invisible pos-9 ranking into a presence inside the answer box.
2. **PAA targeting** — every SERP has People Also Ask boxes. 40–60 word direct-answer sections on existing pages.
3. **Ranking lift on /review/gesture/** — pos 8.2 → pos 5 meaningfully increases CTR even without meta changes.
4. **Verdict-first meta rewrites on editorial pages** — 5 rewrites deployed May 7 (gesture, knee-pain, aeron-size-c, gesture-hub, leap-plus-tall-people). Awaiting CTR signal (14-day window). *Note: /best-office-chairs/ schema parse error was resolved May 7 — no longer an open blocker.*

## What Verdict-First Meta Can Still Help

On queries that aren't suppressed by AI Overviews or shopping carousels (mostly branded/specific queries), verdict-first meta is still sound practice. But it's not the site's primary problem.

## Links

- [[meta-descriptions]] — implementation patterns
- [[aeron-tall-people]] — highest-impression page
- [[ai-citation-readiness]] — GEO fixes for AI Overview suppression
- raw/audits/2026-04-22-serp-analysis.md — full incognito SERP audit

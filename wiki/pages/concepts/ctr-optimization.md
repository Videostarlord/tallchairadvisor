---
type: concept
last_updated: 2026-04-06
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-04-03-action-plan.md]
tags: [ctr, meta-descriptions, serp, high-priority]
---

# CTR Optimization

**The #1 bottleneck on the site.** ~4,100 total impressions but only 12 clicks (0.29% CTR). Three high-impression pages at positions 7–11 are converting at 0–0.5% when they should be 3–5%.

## CTR Crisis Pages (Apr 3)

| Page | Impressions | Position | CTR | Root Cause |
|------|------------|----------|-----|------------|
| [[aeron-tall-people]] | 406 | 7.4 | 0% | Meta doesn't lead with verdict |
| [[aeron-vs-gesture]] | 285 combined | 7.59 | 0% | Meta needs verdict-first rewrite |
| [[review-gesture]] | 581 | 10.31 | 0.17% | Positional (pos 10) — needs ranking lift |
| /knee-pain-seat-depth/ | 108 | 7.9 | 0% | Query intent mismatch ("knee brace" vs seat depth) |

## Pattern: Verdict-First Meta Descriptions

The key learning: tall users scanning SERPs need to see the verdict in the first few words. "Does this chair fit me at 6'4"?" must be answered before the click, paradoxically driving more clicks.

**Bad:** "At 6'0–6'6, the Aeron's fixed 18.25" seat depth is the key trade-off..."
**Good:** "Aeron Size C fits most 6'0–6'3 users; the 18.25" fixed seat depth is a problem at 6'4+."

The verdict-first pattern hasn't been A/B tested yet — it's prescribed based on CTR analysis but no results data exists. **Track outcomes after implementing.**

## What We Don't Know Yet

- Whether verdict-first meta actually improves CTR (no before/after data)
- Whether the 0% CTR pages have a snippet/rich result suppressing clicks (e.g., Google answering in the SERP)
- Whether position improvement alone would fix CTR without meta changes

## Links

- [[meta-descriptions]] — implementation patterns
- [[aeron-tall-people]] — highest-priority fix
- [[ai-citation-readiness]] — if Google is answering in SERP, citation optimization may be more valuable than CTR optimization

---
type: concept
last_updated: 2026-05-09
sources: [scripts/gsc-analyze.ts]
tags: [gsc, opportunity, scoring, prioritization]
---

# Opportunity Scoring System

## Purpose

Every page with ≥30 impressions gets an opportunity score and type. This replaces ad hoc "which page should we work on" reasoning with a deterministic priority queue.

## Opportunity Types (in priority order)

### 1. `near-p1`
- **Condition:** position 5–15 AND impressions ≥100
- **Score:** `(impressions / position) * 2`
- **Logic:** These pages are visible enough to get significant traffic if pushed into top 5. Best ROI for content depth + internal link investment.
- **Action:** Content depth upgrade + internal link building

### 2. `ctr-leak`
- **Condition:** page has ≥1 CTR leak AND position ≤10
- **Score:** `sum(leakScore) for all leaks on this page`
- **Logic:** Page ranks well but title/meta doesn't match query intent. Click recovery is fast — one meta rewrite.
- **Action:** Title/meta rewrite to match dominant query cluster intent

### 3. `content-depth`
- **Condition:** position ≥15 AND impressions ≥200
- **Score:** `impressions * 0.5`
- **Logic:** High impression volume but poor ranking = Google sees the page as relevant but not authoritative. Needs content investment.
- **Action:** Content expansion, E-E-A-T signals, more specific coverage

### 4. `affiliate-capture`
- **Condition:** buyer-intent impressions ≥50 AND page CTR <2%
- **Score:** `buyerIntentImpressions * 1.5`
- **Logic:** Commercial traffic landing on pages without clear affiliate pathways. Monetization gap.
- **Action:** Add comparison table, affiliate CTAs, pricing context

### 5. `low-signal`
- **Condition:** none of the above
- **Score:** 0
- **Action:** Monitor, do not act yet (insufficient signal)

## Priority Thresholds

| Score | Urgency | Typical action |
|-------|---------|----------------|
| >200 | Critical | Fix this week |
| 100–200 | High | Fix within 2 weeks |
| 50–100 | Medium | Queue for next sprint |
| <50 | Low | Monitor |

## Why These Formulas

The near-p1 formula `(impressions / position) * 2` captures both traffic potential (impressions) and ranking proximity (lower position = higher divisor = lower score). A page at pos 5 with 200 impr scores 80; the same page at pos 15 scores 26.7. This correctly deprioritizes pages that are far from P1 even if they have high impressions.

The affiliate-capture multiplier (1.5×) is higher than content-depth (0.5×) because commercial traffic that's already landing is revenue-ready — it just needs a conversion pathway. Content-depth pages need months of investment before payoff.

## AIO Suspects

When `aioSuspect: true` (pos ≤6, CTR <0.5%, spec/how-to query), the recommended action is different from a standard CTR leak: restructuring content with answer boxes and definition blocks to recapture post-AIO clicks, rather than a simple meta rewrite.

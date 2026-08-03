---
type: concept
last_updated: 2026-08-03
sources: [data/gsc/analysis.json]
tags: [gsc, intelligence, opportunities, ctr, weekly]
---

# GSC Weekly Intelligence Digest

**Generated 2026-08-03 by gsc-analyze.ts** | Read this before writing strategy.ts prompt.

---

## Momentum

Impressions down 3.4% WoW (4512 vs 4671), clicks down 10.5% (17 vs 19), avg position declining (0.9 spots)

---

## Top Opportunities

| Page | Type | Impressions | Position | Action |
|------|------|-------------|----------|--------|
| /knee-pain-seat-depth/ | near-p1 | 40195 impr | pos 5.7 | pos 5.7 with 40195 impr — expand content depth + internal links to push into top 5 |
| /correct-chair-dimensions/ | near-p1 | 18451 impr | pos 9.6 | pos 9.6 with 18451 impr — expand content depth + internal links to push into top 5 |
| /review/leap-plus/ | near-p1 | 12708 impr | pos 8.8 | pos 8.8 with 12708 impr — expand content depth + internal links to push into top 5 |
| /review/gesture/ | near-p1 | 8612 impr | pos 8 | pos 8.0 with 8612 impr — expand content depth + internal links to push into top 5 |
| /best-office-chairs/ | content-depth | 1766 impr | pos 17.9 | pos 17.9 with 1766 impr — content too thin or lacks E-E-A-T signals, needs depth upgrade |

---

## Critical CTR Leaks (query-level)

| Page | Query | Impr | Position | CTR (exp) | Lost clicks/wk |
|------|-------|------|----------|-----------|----------------|
| /review/leap-plus/ | "steelcase leap plus" | 1012 impr | pos 10.2 | 1.09% (exp 2%) | ~0.72/wk |
| /chairs/steelcase-gesture/weight-limit/ | "steelcase gesture weight limit" | 75 impr | pos 9.2 | 0% (exp 2.2%) | ~0.13/wk |
| /aeron-vs-leap-plus/ | "aeron plus" | 53 impr | pos 8.8 | 0% (exp 2.5%) | ~0.1/wk |
| /chairs/steelcase-gesture/seat-depth/ | "steelcase gesture seat depth" | 39 impr | pos 8.8 | 0% (exp 2.5%) | ~0.08/wk |
| /chairs/steelcase-gesture/weight-limit/ | "steelcase gesture weight" | 51 impr | pos 10.1 | 0% (exp 2%) | ~0.08/wk |

**1 AIO suspects detected** — these positions rank well but earn zero clicks, likely due to AI Overviews capturing the SERP.

---

## Affiliate Alerts

- **/best-office-chairs/** [high]: 261 buyer-intent impr | queries: best office chairs for tall people, best office chair tall person
- **/aeron-vs-gesture/** [medium]: 50 buyer-intent impr | queries: gesture vs aeron, aeron vs gesture
- **/gesture-vs-leap-plus/** [low]: 36 buyer-intent impr | queries: steelcase leap v2 vs gesture

---

## Cannibalization Risks

- **"steelcase leap plus"** [medium risk]: /review/leap-plus/ vs /chairs/steelcase-leap-plus/ vs /chairs/steelcase-leap-plus/seat-height/ vs /chairs/steelcase-leap-plus/tall-people/ (1019 impr)
- **"aeron size c"** [medium risk]: /review/aeron-size-c/ vs /chairs/herman-miller-aeron/ (267 impr)
- **"steelcase gesture weight limit"** [medium risk]: /chairs/steelcase-gesture/ vs /chairs/steelcase-gesture/weight-limit/ (79 impr)

---

## Device Split

Mobile: 26% of impressions | Mobile CTR 0.14% vs Desktop 0.32% (gap: +0.18pp)

---

## Query Entropy

**Most fragmented pages** (topic generalists, low per-cluster authority):
| Page | Entropy | Clusters | Regime |
|------|---------|----------|--------|
| /correct-chair-dimensions/ | 5.275 | 139 | fragmented |
| /best-office-chairs/ | 4.069 | 53 | fragmented |
| /best-office-chairs-under-500/ | 3.764 | 16 | fragmented |


**Most concentrated pages** (single-keyword risk):
| Page | Entropy | Clusters | Regime |
|------|---------|----------|--------|
| /chairs/herman-miller-aeron/tall-people/ | 0.162 | 2 | concentrated |
| /review/leap-plus/ | 0.657 | 4 | concentrated |
| /aeron-vs-leap-plus/ | 0.738 | 3 | concentrated |


---

## Impression Gravity (Hub Candidates)

- **/correct-chair-dimensions/**: 35 clusters, gravity score 343.8
- **/best-office-chairs/**: 21 clusters, gravity score 157.01
- **/chairs/herman-miller-aeron/**: 8 clusters, gravity score 50.17

---

## Informational → Commercial Transition Gaps

_No transition opportunities detected_

---

## AIO Action Items

**/correct-chair-dimensions/** — "cornell ergonomics chair seat height feet flat thighs parallel" [medium] (17 impr, pos 4.8)
  - Put the specific number/spec at the top of the page in a prominent answer box
  - Add a definition callout box answering the spec directly
  - Add a citation capsule: 3 sentences, no pronouns, standalone

---

## Page Velocity

| Page | Cur Pos | Prev Pos | Pos Δ | Impr Δ | Trend |
|------|---------|----------|-------|--------|-------|
| /how-to-adjust-chair/ | 24.1 | 25.7 | -1.6 | +8 | stable |
| /chairs/herman-miller-aeron/ | 20.3 | 19.4 | +0.9 | -8 | stable |
| /chairs/steelcase-leap-plus/ | 9.6 | 10.4 | -0.8 | +1 | stable |
| /pain-ergonomics/ | 29.3 | 28.6 | +0.7 | +12 | stable |
| /about/ | 8 | 8.4 | -0.4 | +3 | stable |

---

## Content Gap vs Competitors

| TCA Page | Query | TCA Position | Competitor | Impressions | Severity |
|----------|-------|-------------|------------|-------------|----------|
| /correct-chair-dimensions/ | "ergonomic chair dimensions" | pos 19.1 | dimensions.com pos 2 | 59 impr | medium |

---

## Raw Intelligence File

Full structured data (ranked queues, all clusters): `data/gsc/analysis.json`

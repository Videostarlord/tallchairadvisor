---
type: concept
last_updated: 2026-07-13
sources: [data/gsc/analysis.json]
tags: [gsc, intelligence, opportunities, ctr, weekly]
---

# GSC Weekly Intelligence Digest

**Generated 2026-07-13 by gsc-analyze.ts** | Read this before writing strategy.ts prompt.

---

## Momentum

Impressions down 4.2% WoW (11845 vs 12370), clicks up 5% (21 vs 20), avg position stable

---

## Top Opportunities

| Page | Type | Impressions | Position | Action |
|------|------|-------------|----------|--------|
| /knee-pain-seat-depth/ | near-p1 | 36167 impr | pos 5.8 | pos 5.8 with 36167 impr — expand content depth + internal links to push into top 5 |
| /correct-chair-dimensions/ | near-p1 | 15718 impr | pos 9.6 | pos 9.6 with 15718 impr — expand content depth + internal links to push into top 5 |
| /review/leap-plus/ | near-p1 | 11373 impr | pos 8.8 | pos 8.8 with 11373 impr — expand content depth + internal links to push into top 5 |
| /review/gesture/ | near-p1 | 8802 impr | pos 8 | pos 8.0 with 8802 impr — expand content depth + internal links to push into top 5 |
| /best-office-chairs/ | content-depth | 1947 impr | pos 17.9 | pos 17.9 with 1947 impr — content too thin or lacks E-E-A-T signals, needs depth upgrade |

---

## Critical CTR Leaks (query-level)

| Page | Query | Impr | Position | CTR (exp) | Lost clicks/wk |
|------|-------|------|----------|-----------|----------------|
| /review/leap-plus/ | "steelcase leap plus" | 855 impr | pos 10.3 | 1.17% (exp 2%) | ~0.55/wk |
| /chairs/steelcase-gesture/seat-depth/ | "steelcase gesture seat depth range inches" | 27 impr | pos 4.1 | 0% (exp 8%) | ~0.17/wk ⚠ AIO |
| /chairs/steelcase-gesture/seat-depth/ | "steelcase gesture seat depth adjustment range inches" | 45 impr | pos 6.2 | 0% (exp 4%) | ~0.14/wk |
| /chairs/steelcase-gesture/weight-limit/ | "steelcase gesture weight limit" | 50 impr | pos 9.7 | 0% (exp 2.2%) | ~0.09/wk |
| /gesture-vs-leap-plus/ | "steelcase gesture vs leap v2" | 37 impr | pos 12.6 | 0% (exp 2%) | ~0.06/wk |

**2 AIO suspects detected** — these positions rank well but earn zero clicks, likely due to AI Overviews capturing the SERP.

---

## Affiliate Alerts

- **/best-office-chairs/** [high]: 291 buyer-intent impr | queries: best office chairs for tall people, best office chair for tall person
- **/gesture-vs-leap-plus/** [high]: 217 buyer-intent impr | queries: steelcase gesture vs leap, steelcase leap vs gesture
- **/aeron-vs-gesture/** [medium]: 52 buyer-intent impr | queries: gesture vs aeron, aeron vs gesture

---

## Cannibalization Risks

- **"steelcase leap plus"** [medium risk]: /review/leap-plus/ vs /chairs/steelcase-leap-plus/ vs /chairs/steelcase-leap-plus/seat-height/ vs /chairs/steelcase-leap-plus/tall-people/ vs /images/leap-plus-hero.webp (867 impr)
- **"aeron size c"** [medium risk]: /review/aeron-size-c/ vs /chairs/herman-miller-aeron/ (206 impr)
- **"steelcase leap v2 for tall people"** [medium risk]: /office-chairs-for-tall-people/ vs /best-office-chairs/ vs /chairs/steelcase-leap-plus/tall-people/ (70 impr)

---

## Device Split

Mobile: 23% of impressions | Mobile CTR 0.17% vs Desktop 0.28% (gap: +0.11pp)

---

## Query Entropy

**Most fragmented pages** (topic generalists, low per-cluster authority):
| Page | Entropy | Clusters | Regime |
|------|---------|----------|--------|
| /correct-chair-dimensions/ | 5.164 | 116 | fragmented |
| /best-office-chairs/ | 4.008 | 52 | fragmented |


**Most concentrated pages** (single-keyword risk):
| Page | Entropy | Clusters | Regime |
|------|---------|----------|--------|
| /chairs/herman-miller-aeron/tall-people/ | 0.131 | 2 | concentrated |
| /review/leap-plus/ | 0.456 | 3 | concentrated |
| /aeron-vs-leap-plus/ | 0.643 | 3 | concentrated |


---

## Impression Gravity (Hub Candidates)

- **/correct-chair-dimensions/**: 32 clusters, gravity score 309.2
- **/best-office-chairs/**: 22 clusters, gravity score 166.63

---

## Informational → Commercial Transition Gaps

_No transition opportunities detected_

---

## AIO Action Items

**/chairs/steelcase-gesture/seat-depth/** — "steelcase gesture seat depth range inches" [medium] (27 impr, pos 4.1)
  - Put the specific number/spec at the top of the page in a prominent answer box
  - Add a definition callout box answering the spec directly
  - Add a citation capsule: 3 sentences, no pronouns, standalone

**/correct-chair-dimensions/** — "cornell ergonomics chair seat height feet flat thighs parallel" [medium] (16 impr, pos 4.8)
  - Put the specific number/spec at the top of the page in a prominent answer box
  - Add a definition callout box answering the spec directly
  - Add a citation capsule: 3 sentences, no pronouns, standalone

---

## Page Velocity

| Page | Cur Pos | Prev Pos | Pos Δ | Impr Δ | Trend |
|------|---------|----------|-------|--------|-------|
| /how-to-adjust-chair/ | 29.8 | 31.3 | -1.5 | +9 | stable |
| /best-office-chairs/ | 18.1 | 18.7 | -0.6 | +127 | stable |
| /chairs/herman-miller-aeron/ | 18.8 | 19.3 | -0.5 | +5 | stable |
| /about/ | 7.5 | 8 | -0.5 | +10 | rising |
| /chairs/steelcase-leap-plus/ | 11.2 | 10.8 | +0.4 | +15 | stable |

---

## Content Gap vs Competitors

_No content gaps detected — either intelligence.json has no competitorKeywords yet, or all competitor top-3 queries are ranked outside TCA position 10-50_

---

## Raw Intelligence File

Full structured data (ranked queues, all clusters): `data/gsc/analysis.json`

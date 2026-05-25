---
type: concept
last_updated: 2026-05-25
sources: [data/gsc/analysis.json]
tags: [gsc, intelligence, opportunities, ctr, weekly]
---

# GSC Weekly Intelligence Digest

**Generated 2026-05-25 by gsc-analyze.ts** | Read this before writing strategy.ts prompt.

---

## Momentum

Impressions down 8.8% WoW (3683 vs 4038), clicks down 18.2% (9 vs 11), avg position declining (0.9 spots)

---

## Top Opportunities

| Page | Type | Impressions | Position | Action |
|------|------|-------------|----------|--------|
| /review/gesture/ | near-p1 | 4801 impr | pos 7.9 | pos 7.9 with 4801 impr — expand content depth + internal links to push into top 5 |
| /knee-pain-seat-depth/ | near-p1 | 3484 impr | pos 8.4 | pos 8.4 with 3484 impr — expand content depth + internal links to push into top 5 |
| /office-chairs-for-tall-people/ | content-depth | 1232 impr | pos 15.7 | pos 15.7 with 1232 impr — content too thin or lacks E-E-A-T signals, needs depth upgrade |
| /best-office-chairs/ | content-depth | 1096 impr | pos 21.9 | pos 21.9 with 1096 impr — content too thin or lacks E-E-A-T signals, needs depth upgrade |
| /review/leap-plus/ | near-p1 | 2203 impr | pos 8.1 | pos 8.1 with 2203 impr — expand content depth + internal links to push into top 5 |

---

## Critical CTR Leaks (query-level)

| Page | Query | Impr | Position | CTR (exp) | Lost clicks/wk |
|------|-------|------|----------|-----------|----------------|
| /office-chairs-for-tall-people/ | "leadership equipment for tall people" | 68 impr | pos 3.9 | 0% (exp 12%) | ~0.63/wk |
| /chairs/steelcase-gesture/seat-depth/ | "steelcase gesture seat depth range inches" | 38 impr | pos 4.3 | 0% (exp 8%) | ~0.24/wk ⚠ AIO |
| /chairs/steelcase-gesture/seat-depth/ | "steelcase gesture seat depth adjustment range inches" | 49 impr | pos 6.1 | 0% (exp 4%) | ~0.15/wk |
| /knee-pain-seat-depth/ | "cornell ergonomics chair seat depth two fingers behind knee" | 77 impr | pos 7.6 | 0% (exp 3%) | ~0.18/wk |
| /knee-pain-seat-depth/ | "cornell ergonomics chair seat depth two fingers behind knees" | 62 impr | pos 8.1 | 0% (exp 2.5%) | ~0.12/wk |

**1 AIO suspects detected** — these positions rank well but earn zero clicks, likely due to AI Overviews capturing the SERP.

---

## Affiliate Alerts

- **/review/gesture/** [high]: 285 buyer-intent impr | queries: steelcase knee brace review, steelcase gesture review
- **/best-office-chairs/** [medium]: 183 buyer-intent impr | queries: best office chairs for tall people, best office chair for tall person
- **/gesture-vs-leap-plus/** [medium]: 109 buyer-intent impr | queries: steelcase gesture vs leap, steelcase leap vs gesture

---

## Cannibalization Risks

- **"steelcase leap plus"** [medium risk]: /review/leap-plus/ vs /chairs/steelcase-leap-plus/seat-height/ vs /chairs/steelcase-leap-plus/ vs /chairs/steelcase-leap-plus/tall-people/ (148 impr)
- **"best office chair for tall person"** [medium risk]: /best-office-chairs/ vs /office-chairs-for-tall-people/ (84 impr)
- **"best office chairs for tall people"** [medium risk]: /best-office-chairs/ vs /office-chairs-for-tall-people/ (52 impr)

---

## Device Split

Mobile: 23% of impressions | Mobile CTR 0.59% vs Desktop 0.09% (gap: -0.5pp)

---

## Query Entropy

**Most fragmented pages** (topic generalists, low per-cluster authority):
| Page | Entropy | Clusters | Regime |
|------|---------|----------|--------|
| /correct-chair-dimensions/ | 4.655 | 60 | fragmented |
| /office-chairs-for-tall-people/ | 3.783 | 32 | fragmented |


**Most concentrated pages** (single-keyword risk):
| Page | Entropy | Clusters | Regime |
|------|---------|----------|--------|
| /chairs/steelcase-gesture/seat-depth/ | 0.431 | 5 | concentrated |
| /chairs/steelcase-leap-plus/ | 0.678 | 3 | concentrated |
| /chairs/herman-miller-aeron/tall-people/ | 0.911 | 6 | concentrated |


---

## Impression Gravity (Hub Candidates)

- **/correct-chair-dimensions/**: 21 clusters, gravity score 165.96
- **/review/gesture/**: 16 clusters, gravity score 135.63
- **/office-chairs-for-tall-people/**: 18 clusters, gravity score 128.1
- **/best-office-chairs/**: 18 clusters, gravity score 125.99
- **/aeron-vs-gesture/**: 10 clusters, gravity score 63.63
- **/chairs/steelcase-gesture/**: 8 clusters, gravity score 50.99

---

## Informational → Commercial Transition Gaps

_No transition opportunities detected_

---

## AIO Action Items

**/chairs/steelcase-gesture/seat-depth/** — "steelcase gesture seat depth range inches" [medium] (38 impr, pos 4.3)
  - Put the specific number/spec at the top of the page in a prominent answer box
  - Add a definition callout box answering the spec directly
  - Add a citation capsule: 3 sentences, no pronouns, standalone

---

## Page Velocity

| Page | Cur Pos | Prev Pos | Pos Δ | Impr Δ | Trend |
|------|---------|----------|-------|--------|-------|
| /standing-desk-height-tall-people/ | 15.3 | 17 | -1.7 | +33 | rising |
| /office-chairs-for-tall-people/ | 18.6 | 20.1 | -1.5 | +107 | rising |
| /how-to-adjust-chair/ | 33.7 | 32.8 | +0.9 | +1 | stable |
| /best-office-chairs/ | 21.9 | 22.4 | -0.5 | +85 | stable |
| /chairs/herman-miller-aeron/ | 14.6 | 14.1 | +0.5 | +28 | stable |

---

## Content Gap vs Competitors

| TCA Page | Query | TCA Position | Competitor | Impressions | Severity |
|----------|-------|-------------|------------|-------------|----------|
| /review/gesture/ | "steelcase gesture review" | pos 44.7 | btod.com pos 2 | 24 impr | high |
| /best-office-chairs/ | "office chairs for tall people" | pos 45 | thehumansolution.com pos 3 | 16 impr | high |

---

## Raw Intelligence File

Full structured data (ranked queues, all clusters): `data/gsc/analysis.json`

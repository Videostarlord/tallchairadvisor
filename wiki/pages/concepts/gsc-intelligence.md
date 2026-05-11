---
type: concept
last_updated: 2026-05-11
sources: [data/gsc/analysis.json]
tags: [gsc, intelligence, opportunities, ctr, weekly]
---

# GSC Weekly Intelligence Digest

**Generated 2026-05-11 by gsc-analyze.ts** | Read this before writing strategy.ts prompt.

---

## Momentum

Impressions down 1.2% WoW (3231 vs 3271), clicks up 16.7% (7 vs 6), avg position stable

---

## Top Opportunities

| Page | Type | Impressions | Position | Action |
|------|------|-------------|----------|--------|
| /correct-chair-dimensions/ | content-depth | 1766 impr | pos 15.8 | pos 15.8 with 1766 impr — content too thin or lacks E-E-A-T signals, needs depth upgrade |
| /review/gesture/ | near-p1 | 2729 impr | pos 8.2 | pos 8.2 with 2729 impr — expand content depth + internal links to push into top 5 |
| /knee-pain-seat-depth/ | near-p1 | 2027 impr | pos 8.6 | pos 8.6 with 2027 impr — expand content depth + internal links to push into top 5 |
| /best-office-chairs/ | content-depth | 777 impr | pos 22.5 | pos 22.5 with 777 impr — content too thin or lacks E-E-A-T signals, needs depth upgrade |
| /chairs/herman-miller-aeron/tall-people/ | near-p1 | 1379 impr | pos 7.4 | pos 7.4 with 1379 impr — expand content depth + internal links to push into top 5 |

---

## Critical CTR Leaks (query-level)

| Page | Query | Impr | Position | CTR (exp) | Lost clicks/wk |
|------|-------|------|----------|-----------|----------------|
| /chairs/steelcase-gesture/seat-depth/ | "steelcase gesture seat depth range inches" | 28 impr | pos 4.1 | 0% (exp 8%) | ~0.17/wk ⚠ AIO |
| /knee-pain-seat-depth/ | "cornell ergonomics chair seat depth two fingers behind knee" | 68 impr | pos 7.8 | 0% (exp 3%) | ~0.16/wk |
| /chairs/steelcase-gesture/seat-depth/ | "steelcase gesture seat depth adjustment range inches" | 36 impr | pos 6.1 | 0% (exp 4%) | ~0.11/wk |
| /knee-pain-seat-depth/ | "cornell ergonomics chair seat depth two fingers behind knees" | 57 impr | pos 8.4 | 0% (exp 2.5%) | ~0.11/wk |
| /knee-pain-seat-depth/ | "cornell ergonomics chair seat depth 2 inches behind knees" | 35 impr | pos 9.8 | 0% (exp 2.2%) | ~0.06/wk |

**1 AIO suspects detected** — these positions rank well but earn zero clicks, likely due to AI Overviews capturing the SERP.

---

## Affiliate Alerts

- **/review/gesture/** [high]: 238 buyer-intent impr | queries: steelcase knee brace review, steelcase knee brace review 2026
- **/best-office-chairs/** [medium]: 123 buyer-intent impr | queries: best office chairs for tall people, best office chair for tall person
- **/gesture-vs-leap-plus/** [medium]: 81 buyer-intent impr | queries: steelcase gesture vs leap, steelcase leap vs gesture

---

## Cannibalization Risks

- **"best office chair for tall person"** [medium risk]: /best-office-chairs/ vs /office-chairs-for-tall-people/ (68 impr)
- **"steelcase leap plus"** [medium risk]: /review/leap-plus/ vs /chairs/steelcase-leap-plus/seat-height/ vs /chairs/steelcase-leap-plus/ vs /chairs/steelcase-leap-plus/tall-people/ (65 impr)
- **"steelcase gesture seat height range"** [medium risk]: /chairs/steelcase-gesture/ vs /chairs/steelcase-gesture/seat-depth/ vs /chairs/steelcase-gesture/seat-height/ vs /review/gesture/ (44 impr)

---

## Device Split

Mobile: 10% of impressions | Mobile CTR 0.5% vs Desktop 0.22% (gap: -0.28pp)

---

## Query Entropy

**Most fragmented pages** (topic generalists, low per-cluster authority):
| Page | Entropy | Clusters | Regime |
|------|---------|----------|--------|
| /correct-chair-dimensions/ | 4.508 | 51 | fragmented |


**Most concentrated pages** (single-keyword risk):
| Page | Entropy | Clusters | Regime |
|------|---------|----------|--------|
| /chairs/steelcase-gesture/seat-depth/ | 0.452 | 4 | concentrated |
| /chairs/steelcase-leap-plus/ | 0.774 | 3 | concentrated |
| /knee-pain-seat-depth/ | 0.843 | 8 | concentrated |


---

## Impression Gravity (Hub Candidates)

- **/correct-chair-dimensions/**: 18 clusters, gravity score 134.58
- **/review/gesture/**: 17 clusters, gravity score 134.5
- **/best-office-chairs/**: 18 clusters, gravity score 119.8
- **/office-chairs-for-tall-people/**: 16 clusters, gravity score 104.75
- **/review/leap-plus/**: 9 clusters, gravity score 62.57
- **/aeron-vs-gesture/**: 10 clusters, gravity score 62.19
- **/chairs/steelcase-gesture/**: 8 clusters, gravity score 48.58

---

## Informational → Commercial Transition Gaps

_No transition opportunities detected_

---

## AIO Action Items

**/chairs/steelcase-gesture/seat-depth/** — "steelcase gesture seat depth range inches" [medium] (28 impr, pos 4.1)
  - Put the specific number/spec at the top of the page in a prominent answer box
  - Add a definition callout box answering the spec directly
  - Add a citation capsule: 3 sentences, no pronouns, standalone

---

## Page Velocity

| Page | Cur Pos | Prev Pos | Pos Δ | Impr Δ | Trend |
|------|---------|----------|-------|--------|-------|
| /correct-chair-dimensions/ | 16.1 | 16.1 | 0 | 0 | stable |
| /review/gesture/ | 8.2 | 8.2 | 0 | 0 | stable |
| /knee-pain-seat-depth/ | 8.6 | 8.6 | 0 | 0 | stable |
| /best-office-chairs/ | 22.8 | 22.8 | 0 | 0 | stable |
| /chairs/herman-miller-aeron/tall-people/ | 7.4 | 7.4 | 0 | 0 | stable |

---

## Raw Intelligence File

Full structured data (ranked queues, all clusters): `data/gsc/analysis.json`

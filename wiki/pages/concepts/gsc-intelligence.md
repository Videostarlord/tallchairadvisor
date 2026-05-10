---
type: concept
last_updated: 2026-05-10
sources: [data/gsc/analysis.json]
tags: [gsc, intelligence, opportunities, ctr, weekly]
---

# GSC Weekly Intelligence Digest

**Generated 2026-05-10 by gsc-analyze.ts** | Read this before writing strategy.ts prompt.

---

## Momentum

Trend data unavailable (requires 14+ daily data points)

---

## Top Opportunities

| Page | Type | Impressions | Position | Action |
|------|------|-------------|----------|--------|
| /correct-chair-dimensions/ | content-depth | 1422 impr | pos 16.7 | pos 16.7 with 1422 impr — content too thin or lacks E-E-A-T signals, needs depth upgrade |
| /review/gesture/ | near-p1 | 1895 impr | pos 8.4 | pos 8.4 with 1895 impr — expand content depth + internal links to push into top 5 |
| /best-office-chairs/ | content-depth | 694 impr | pos 23.2 | pos 23.2 with 694 impr — content too thin or lacks E-E-A-T signals, needs depth upgrade |
| /knee-pain-seat-depth/ | near-p1 | 1524 impr | pos 8.8 | pos 8.8 with 1524 impr — expand content depth + internal links to push into top 5 |
| /chairs/herman-miller-aeron/tall-people/ | near-p1 | 1175 impr | pos 7.3 | pos 7.3 with 1175 impr — expand content depth + internal links to push into top 5 |

---

## Critical CTR Leaks (query-level)

| Page | Query | Impr | Position | CTR (exp) | Lost clicks/wk |
|------|-------|------|----------|-----------|----------------|
| /review/gesture/ | "steelcase knee brace review" | 91 impr | pos 7.3 | 0% (exp 3%) | ~0.21/wk |
| /review/gesture/ | "steelcase knee brace review 2026" | 18 impr | pos 3.5 | 0% (exp 12%) | ~0.17/wk |
| /chairs/steelcase-gesture/seat-depth/ | "steelcase gesture seat depth range inches" | 23 impr | pos 4.2 | 0% (exp 8%) | ~0.14/wk ⚠ AIO |
| /chairs/steelcase-gesture/seat-depth/ | "steelcase gesture seat depth adjustment range inches" | 31 impr | pos 6 | 0% (exp 4%) | ~0.1/wk ⚠ AIO |
| /knee-pain-seat-depth/ | "cornell ergonomics chair seat depth two fingers behind knee" | 55 impr | pos 8 | 0% (exp 2.5%) | ~0.11/wk |

**2 AIO suspects detected** — these positions rank well but earn zero clicks, likely due to AI Overviews capturing the SERP.

---

## Affiliate Alerts

- **/review/gesture/** [medium]: 182 buyer-intent impr | queries: steelcase knee brace review, steelcase knee brace review 2026
- **/best-office-chairs/** [medium]: 113 buyer-intent impr | queries: best office chairs for tall people, best office chair for tall person
- **/office-chairs-for-tall-people/** [medium]: 75 buyer-intent impr | queries: best office chair for tall people, best office chair for tall person

---

## Cannibalization Risks

- **"best office chair for tall person"** [medium risk]: /best-office-chairs/ vs /office-chairs-for-tall-people/ (65 impr)
- **"steelcase leap plus"** [medium risk]: /review/leap-plus/ vs /chairs/steelcase-leap-plus/seat-height/ vs /chairs/steelcase-leap-plus/ vs /chairs/steelcase-leap-plus/tall-people/ (52 impr)
- **"best office chairs for tall people"** [medium risk]: /best-office-chairs/ vs /office-chairs-for-tall-people/ (37 impr)

---

## Device Split

_Device data unavailable — requires new gsc-pull run_

---

## Query Entropy

**Most fragmented pages** (topic generalists, low per-cluster authority):
| Page | Entropy | Clusters | Regime |
|------|---------|----------|--------|
| /correct-chair-dimensions/ | 4.436 | 48 | fragmented |


**Most concentrated pages** (single-keyword risk):
| Page | Entropy | Clusters | Regime |
|------|---------|----------|--------|
| /chairs/steelcase-gesture/seat-depth/ | 0.425 | 3 | concentrated |
| /knee-pain-seat-depth/ | 0.52 | 7 | concentrated |
| /office-chairs-for-tall-people | 0.544 | 2 | concentrated |


---

## Impression Gravity (Hub Candidates)

- **/review/gesture/**: 15 clusters, gravity score 113.2
- **/best-office-chairs/**: 17 clusters, gravity score 111.22
- **/correct-chair-dimensions/**: 15 clusters, gravity score 108.9
- **/office-chairs-for-tall-people/**: 15 clusters, gravity score 95.18
- **/review/leap-plus/**: 8 clusters, gravity score 51.59
- **/chairs/steelcase-gesture/**: 8 clusters, gravity score 47.61
- **/aeron-vs-gesture/**: 8 clusters, gravity score 46.82

---

## Informational → Commercial Transition Gaps

_No transition opportunities detected_

---

## AIO Action Items

**/chairs/steelcase-gesture/seat-depth/** — "steelcase gesture seat depth adjustment range inches" [medium] (31 impr, pos 6)
  - Put the specific number/spec at the top of the page in a prominent answer box
  - Add a definition callout box answering the spec directly
  - Add a citation capsule: 3 sentences, no pronouns, standalone

**/chairs/steelcase-gesture/seat-depth/** — "steelcase gesture seat depth range inches" [medium] (23 impr, pos 4.2)
  - Put the specific number/spec at the top of the page in a prominent answer box
  - Add a definition callout box answering the spec directly
  - Add a citation capsule: 3 sentences, no pronouns, standalone

---

## Page Velocity

_Insufficient history — activates after 2+ Monday runs_

---

## Raw Intelligence File

Full structured data (ranked queues, all clusters): `data/gsc/analysis.json`

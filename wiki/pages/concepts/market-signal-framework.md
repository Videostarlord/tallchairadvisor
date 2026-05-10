---
type: concept
last_updated: 2026-05-09
sources: [scripts/gsc-analyze.ts, data/gsc/history/]
tags: [market, signals, velocity, trends, aio]
---

# Market Signal Framework

## Purpose

Detects early signals of search market movement: intent shifts, seasonal emergence, SERP format changes (AIO), and topic acceleration. These signals inform content investment decisions 4–8 weeks before they show up in traffic.

## Signal Types

### 1. Velocity Signals (implemented)

Computed from `dailyTrend[]` in `latest.json`.

| Signal | Threshold | Action |
|--------|-----------|--------|
| Impression velocity >20% WoW | Growing topic | Prioritize content depth on ranking pages |
| Click velocity >30% WoW | Traffic accelerating | Don't touch — let it compound |
| Position declining >1 spot WoW | Competitive pressure | Investigate SERP competitors |
| Position declining >2 spots WoW | Algorithm or competitor change | Urgent content review |

### 2. AIO Suppression Signals (implemented)

Detected via `aioSuspect` flag in `ctrLeaks[]`:
- Position ≤6 (good rank)
- CTR <0.5% (no clicks despite visibility)
- Query contains spec/how-to/definition terms (AIO-prone SERP)

**TCA-specific AIO risk terms:** seat depth rule, armrest height formula, monitor height formula, Cornell ergonomics, posture angle, lumbar support position, ergonomic angle

**Response strategy:** Add answer boxes with specific numbers, definition callouts, and structured citation capsules (3–4 sentences, no pronoun dependency) to survive post-AIO SERP.

### 3. Seasonal Intent Emergence (planned)

Uses `data/gsc/history/` 16-week archive. A query cluster is "emerging" if:
- Appears in current week's `pageQueries` but not in 4-week-ago snapshot
- OR current week impressions > 2× the prior 4-week average

**TCA seasonal patterns (hypothesized):**
- September: "home office chair" spikes (back-to-school, remote work setup)
- January: "ergonomic chair" spikes (new year health goals)
- May: "standing desk tall people" (spring office resets)

### 4. Query Entropy Analysis (planned)

For each page, compute Shannon entropy over its `pageQueries` CTR distribution:
```
H = -sum(p_i * log2(p_i)) for each query's share of total impressions
```
- **High entropy** = many queries, each low volume = thin topical authority; page is a topic generalist
- **Low entropy** = one dominant query = single-keyword concentration risk

High entropy pages are candidates for topical depth investment. Low entropy pages are at risk if their dominant keyword shifts.

### 5. Impression Gravity (planned)

Pages that accumulate impressions across many distinct query fingerprints (≥10 unique clusters) are "topical hubs." These should be prioritized for internal link building as spokes, since Google already sees them as broad topic authorities.

### 6. Informational → Commercial Transition (planned)

Detects pages where:
- Current dominant intent = informational (how/why/what queries)
- But the cluster also contains a commercial variant (best/buy/vs)
- AND the commercial variant has impressions but 0 clicks

Signal: users are researching at this page. The content should add a comparison section or verdict box to capture the commercial intent that's already present in the SERP.

## Current Market State (as of May 2026)

- **AIO risk:** High for spec/measurement queries (Cornell ergonomics, seat depth formula, armrest height)
- **Velocity:** Impressions growing ~15% monthly (W16→W18 trend)
- **Seasonal outlook:** No known seasonal spike window in May
- **Top risk:** CTR rate at 0.24% — below industry average of 1.5% for affiliate sites; primary bottleneck is intent mismatch, not ranking

## Integration

Market signals flow into `strategy.ts` via `gscAnalysis.executiveSummary` fields and the `gsc-intelligence.md` wiki digest. The strategy agent is prompted to treat AIO suspects and velocity signals as higher priority than static position rankings.

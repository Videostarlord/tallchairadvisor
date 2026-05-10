---
type: concept
last_updated: 2026-05-09
sources: [raw/gsc/gsc-2026-05-09.json]
tags: [gsc, analysis, strategy, pipeline, query-clustering]
---

# GSC Analysis Strategy

## The Problem

`gsc-pull.ts` collects rich GSC data every Monday. Almost none of it is used.

| Data collected | Who reads it | What they use |
|---|---|---|
| `pages` (46 rows) | audit.ts, strategy.ts, competitor-monitor.ts | impressions + position to prioritize pages |
| `queries` (200 rows) | nobody | — |
| `pageQueries` (427 rows) | nobody | — |
| `totals` | verify-deploy.ts, strategy.ts | site-wide click/impression counts |

**The queries and pageQueries arrays — the most actionable signal in the data — are never read.**

Additionally, these dimensions are not collected at all:
- **Device** (`['device']`, `['page', 'device']`) — mobile vs. desktop CTR split
- **Date** (`['date']`) — week-over-week velocity and trend detection

## Why It Matters: Three Concrete Examples

### Example 1: Cornell Cluster (highest-leverage fix on the site)

Page-level view (what agents see):
```
/knee-pain-seat-depth/ | 1,524 impr | pos 8.8 | 0.13% CTR | 2 clicks
```
→ Claude suggests "improve the meta description." Generic, no direction.

Query-level view (what agents don't see):
```
"cornell ergonomics chair seat depth two fingers behind knee"     55 impr | pos 8.0 | 0 CTR
"cornell ergonomics chair seat depth two fingers behind knees"    53 impr | pos 8.3 | 0 CTR
"cornell ergonomics chair seat depth 2 inches behind knees"      28 impr | pos 10.2 | 0 CTR
"cornell ergonomics chair seat depth 2-3 fingers behind knees"   17 impr | pos 11.0 | 0 CTR
"cornell ergonomics chair seat depth 2-3 fingers behind knee"     9 impr | pos 10.0 | 0 CTR
"cornell ergonomics chair seat pan depth 2-3 fingers..."          2 impr | pos 10.0 | 0 CTR
Combined: 164 impressions | avg pos 8.9 | 0 clicks
```

**Diagnosis:** Title "Seat Depth & Knee Pain: The Fix for Tall People" mismatches intent. Searchers want the Cornell measurement rule specifically, not a pain-fix framing. Title doesn't contain "Cornell" or "2-3 fingers" anywhere. Fix: add "Cornell Ergonomics" to the title. One word, likely unlocks 5-10 clicks/week.

### Example 2: AIO Pattern (diagnostic only reachable with query data)

Page-level view:
```
/chairs/steelcase-gesture/seat-depth/ | 710 impr | pos 8.1 | 0.14% CTR | 1 click
```
→ Claude suggests "optimize meta description." Wrong diagnosis.

Query-level view:
```
"steelcase gesture seat depth range inches"            23 impr | pos 4.2 | 0 CTR
"steelcase gesture seat depth adjustment range inches" 31 impr | pos 6.0 | 0 CTR
```

**Diagnosis:** Title already says `Steelcase Gesture Seat Depth Range: 15.75"–18.75"` — it's a perfect title for this query. Position 4–6 with zero clicks is the AI Overview pattern (AIO shows the spec above organic results, consuming all clicks). Fix is restructuring content as a direct-answer box for AIO citation, not a meta rewrite. Completely different fix than page-level data suggests.

### Example 3: Intent Mismatch on High-Impression Page

Page-level view:
```
/review/gesture/ | 1,895 impr | pos 8.4 | 0.16% CTR | 3 clicks
```
→ Claude sees a healthy review page, maybe suggests "expand word count."

Query-level view:
```
"steelcase knee brace review"      91 impr | pos 7.3 | 0 CTR
"steelcase knee brace review 2026" 18 impr | pos 3.5 | 0 CTR
Combined: 109 impressions — searchers specifically want knee support info
```

**Diagnosis:** Review meta mentions "seat depth, armrests, back height" — no mention of knee support. 109 impressions from people specifically searching for knee-bracing info, who see a generic review title and don't click. Fix: add "knee support" to meta description. The 109 impressions are invisible at page level (diluted into 1,895 total).

---

## Planned Solution: `gsc-analyze.ts`

New script to run Monday after `gsc-pull.ts` as an additional step in `monday.yml`.

### What it does

1. **Query clustering** — Groups `pageQueries` rows by normalized intent (strip stop words, stem variants). Sums impressions across variants. Produces ranked list of intent clusters per page.

2. **CTR leak identification** — For each cluster: `impressions > 20, position ≤ 15, CTR = 0`. Sorted by impressions. Includes the specific query text so Claude knows what intent the page is failing to signal.

3. **AIO pattern detection** — Flags clusters where `position ≤ 6, CTR = 0, query contains spec-type terms` (numbers, model names, dimensions). These need content restructuring, not meta rewrites.

4. **Device split** (once `gsc-pull.ts` is expanded) — Pages where mobile CTR > 2× desktop or vice versa. Signals either mobile-first SERP features or intent divergence by device.

5. **Week-over-week velocity** (once date dimension added) — Top 5 pages gaining or losing impressions fastest. Early signal before position data catches up.

### Output

- `data/gsc/analysis.json` — Machine-readable structured analysis
- `wiki/pages/concepts/gsc-analysis-strategy.md` — This page, updated weekly with current findings (the "Current Analysis" section below)
- Agents that benefit: `strategy.ts` (reads this page via `readConceptContext()`), `audit.ts` (can be updated to also read it)

### Where it fits in Monday workflow

```yaml
- name: Pull GSC data
  run: npx tsx scripts/gsc-pull.ts

- name: Analyze GSC data          # NEW
  run: npx tsx scripts/gsc-analyze.ts
```

---

## Current Analysis (2026-05-09)

*This section will be overwritten by `gsc-analyze.ts` on each Monday run once built. Until then, manually maintained.*

### Top CTR Leaks (query-level, not visible to any current agent)

| Page | Query cluster | Combined impr | Avg pos | CTR | Diagnosis |
|------|--------------|--------------|---------|-----|-----------|
| `/knee-pain-seat-depth/` | Cornell ergonomics seat depth (6 variants) | 164 | 8.9 | 0% | Intent mismatch — title says "pain fix", queries want Cornell rule |
| `/review/gesture/` | Steelcase knee brace review (2 variants) | 109 | 6.2 | 0% | Meta doesn't mention knee support |
| `/chairs/steelcase-gesture/seat-depth/` | Gesture seat depth range inches (2 variants) | 54 | 5.1 | 0% | AIO pattern — content restructure needed, not meta |
| `/chairs/herman-miller-aeron/tall-people/` | Aeron size C height range | 12 | 9.3 | 0% | Title may not include "size C" explicitly |

### AIO Patterns Confirmed

- `/chairs/steelcase-gesture/seat-depth/` — pos 4.2 for "steelcase gesture seat depth range inches" → 0 CTR
- `/chairs/steelcase-gesture/seat-depth/` — pos 3.5 for "steelcase gesture seat depth adjustment range inches" → 0 CTR (spec pages are consistently AIO-suppressed)

### Recommended Fix Priority This Week

1. `/knee-pain-seat-depth/` — add "Cornell Ergonomics" to title or H1 (highest confirmed yield)
2. `/review/gesture/` — add "knee support" to meta description
3. `/chairs/steelcase-gesture/seat-depth/` — add direct-answer box at page top for AIO slot

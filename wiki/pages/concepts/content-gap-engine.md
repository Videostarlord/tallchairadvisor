---
type: concept
last_updated: 2026-05-10
sources: [scripts/competitor-intelligence.ts, scripts/gsc-analyze.ts]
tags: [content, gaps, competitors, keywords]
---

# Content Gap Engine

## Purpose

Identifies content gaps where TCA is outranked or underperforming vs competitors. Two layers: internal (GSC-based) and external (SERP + competitor crawl).

## Layer 1 — Internal Gap Detection (gsc-analyze.ts)

Runs Monday. Detects:
1. **Pages with buyer-intent queries but no affiliate CTAs** (`affiliateOpportunities[]`)
2. **CTR leak clusters** — ranks well but content doesn't convert the specific query intent
3. **Cannibalization conflicts** — same query ranking from 2+ TCA pages

Output: `data/gsc/analysis.json`

## Layer 2 — Competitor Gap Detection (competitor-intelligence.ts — LIVE as of May 2026)

Runs monthly on-demand via `npm run competitor:intelligence`. Full 4-layer pipeline:

1. **Query selection** — page-role-aware triple (primary / supporting / strategic) from GSC + strategic injections
2. **SERP fetch** — SerpAPI top-10 results, lane-classified (editorial / retailer / brand / community). 250 credits/month free tier, ~23/run.
3. **Crawl** — Firecrawl fetches editorial competitors, 30-day cache. 500 pages/month free tier.
4. **Gap analysis** — Claude compares TCA page content vs competitor content with role-specific prompts

**v3 improvements (May 10):**
- `FindingType` taxonomy: `absence_claim | structure_claim | depth_claim | spec_gap`
- `classifyFindingType()` — deterministic fallback classifier (Claude's JSON validated against it)
- Structured section extraction — `parseSections()` + `buildSectionManifest()` prepends full H1-H3 manifest before content budget; model cannot infer section absence from truncated excerpts
- Coverage-confidence filter: `absence_claim` and `spec_gap` downgraded at <90% TCA coverage; `depth_claim` and `structure_claim` always trusted

Output: `data/competitors/intelligence.json` — `strategy.ts` reads `synthesizedGaps` (trusted-only)

## Integration with strategy.ts

`strategy.ts` filters to `g.trusted !== false` and surfaces gaps per TCA page with coverage context. Drives FIX, REWRITE, and NEW CONTENT tasks in the weekly plan.

## Deferred

**Competitor word count floor (Codex Finding 3):** Gaps from thin competitor pages (<300 words) may be low quality. Requires adding `competitorWordCount` to `GapFinding` and a floor filter in `strategy.ts` formatter. Not yet implemented.

## Known TCA Content Gaps (as of May 2026)

| Topic | Gap Type | Evidence | Priority |
|-------|----------|----------|----------|
| Standing desk height for tall people | Missing page | High CPC, no TCA content | High |
| Shoulder pain + ergonomic chair | Missing page | Jackson's real experience | High |
| Office chair return policy | Missing page | btod.com capturing, queued for Friday | High |
| Gesture vs Leap Plus spec table | Depth gap | No structured comparison table, queued REWRITE | High |
| Sihoo Doro S300 review | Missing page | Rising in AI citations | Medium |

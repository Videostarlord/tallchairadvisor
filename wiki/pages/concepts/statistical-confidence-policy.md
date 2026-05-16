---
type: concept
last_updated: 2026-05-15
sources: [wiki/pages/concepts/ctr-optimization.md, wiki/pages/concepts/gsc-analysis-strategy.md, wiki/pages/concepts/gsc-intelligence.md, wiki/pages/concepts/systems-architecture-audit-2026-05-13.md]
tags: [gsc, statistics, confidence, prioritization, policy]
---

# Statistical Confidence Policy

**Purpose:** tell audit and strategy agents how to use low-volume GSC data without over-claiming certainty. TCA does not have enough traffic for fine-grained causal inference on most weekly changes. The correct use of this data is **small, reversible prioritization bets**, not strong claims of proof.

## Operating Rule

- Use low-volume data for **diagnosis and prioritization**, not certainty.
- Trust **90-day page impressions + average position** more than week-over-week CTR swings.
- Trust **query clusters** more than single queries.
- Only act on low-volume signals when there is a **clear mechanism** and the proposed change is **cheap and reversible**.
- Do **not** treat entropy, gravity, or small weekly click deltas as strong evidence at current traffic.

## Confidence Tiers

### High confidence
- Page-level pattern with large denominator: roughly **1000+ impressions over 90 days**
- Or repeated query-cluster pattern with persistent mismatch across multiple close variants
- Mechanism is direct and visible in the SERP or page copy
- Safe for substantive FIX or REWRITE prioritization

### Medium confidence
- Query cluster with roughly **75-100+ combined impressions**
- Position is consistently strong enough to matter, usually **top 10**
- Multiple semantically equivalent variants point to the same diagnosis
- Safe for low-cost title, meta, answer-box, or section-order tests

### Low confidence
- Single query under **30 impressions**
- Small WoW movement in clicks or CTR
- Abstract derived metrics without corroborating page/query evidence
- Keep on watchlist; do not let this alone drive a complex rewrite

## Decision Rules for Agents

1. **Single-query under 30 impressions**: watchlist only unless supported by a stronger sibling pattern.
2. **Cluster over 75-100 impressions with clear intent mismatch**: actionable for cheap edits.
3. **Page over 1000 impressions and pos 5-15**: real opportunity even if click counts are still small.
4. **AIO diagnosis** requires more than low CTR. The page should already match the literal query well, rank strongly, and still earn near-zero clicks.
5. **Outcome claims** should wait for time and denominator. Do not say a fix "worked" from one short window or one-click movement.

## TCA-Specific Examples

- **Cornell cluster**: `/knee-pain-seat-depth/` shows a repeated Cornell-intent cluster with meaningful combined impressions. This is not proof, but it is enough for a cheap title/H1 test because the intent mismatch is explicit.
- **Gesture seat-depth spec queries**: strong-rank, low-click spec queries are more plausibly AIO suppression than bad metadata when the title already matches the query language.
- **Review pages with 1000+ impressions**: these are large enough to prioritize, but not large enough for confident attribution from tiny weekly CTR shifts.

## What To Ignore At Current Scale

- Fine-grained week-over-week click changes
- One-off single-query anomalies
- Entropy/gravity as standalone decision drivers
- Strong causal language without post-fix waiting time

## Implementation Guidance

- `strategy.ts` should treat this page as a policy override on top of `gsc-intelligence.md`.
- `audit.ts` should use this page to downgrade speculative findings and avoid overconfident language.
- If a future agent emits confidence labels, use `high / medium / low` based on the thresholds above.

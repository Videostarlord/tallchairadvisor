# GSC Intelligence Audit
Model: CODEX
Timestamp: 2026-05-09T19-30-17-0700

## Bottom Line
The GSC system is promising, but it is not professional-grade yet.

It is halfway between:
- a smart manual analyst's scratchpad
- and a serious internal SEO intelligence platform

Right now it looks more advanced than it actually is.

## Facts
- Raw GSC pull file: `data/gsc/latest.json`
- Current raw file date: `2026-05-04`
- Current analysis file date: `2026-05-10`
- Current raw file does not include `deviceSplit` or `dailyTrend`
- Current analysis therefore has:
  - `deviceIntelligence: null`
  - `siteTrend: null`
  - `pageVelocity: null` or unusable
- Query caps in `scripts/gsc-pull.ts`:
  - queries: 200
  - page-query rows: 500
- No pagination exists in current pull logic.

## Audit Against Requested Intelligence Capabilities

| Capability | Exists? | Quality | Notes |
|---|---|---|---|
| Query clustering | Yes | Weak-medium | 3-token fingerprint heuristic |
| Semantic grouping | Partial | Weak | no true entity model |
| Entity relationships | No | Weak | brand term matching only |
| Trend acceleration | Intended | Not active in current data | raw file missing daily rows |
| Week-over-week movement | Intended | Not active in current data | same issue |
| Device divergence | Intended | Not active in current data | same issue |
| Buyer intent detection | Yes | Weak-medium | keyword term list |
| CTR leakage detection | Yes | Medium | useful, but polluted by bad query classification |
| Monetization opportunity scoring | Yes | Weak-medium | no revenue or click event layer |
| Content gap detection | Partial | Weak | mainly inferred from internal signals |
| Intent progression mapping | Yes | Weak | simplistic how/why term logic |
| Internal linking intelligence | No meaningful engine | Weak | recommendation logic not present |

## The Best Evidence Of The Problem
`data/gsc/analysis.json` currently identifies this as the biggest CTR leak:

`/review/gesture/ | "steelcase knee brace review" | 91 impr | pos 7.3 | 0% CTR`

That is the smoking gun.

This tells you:
- the system has no negative keyword / entity sanity layer
- the system is willing to rank nonsense highly because the heuristic math says so
- downstream agents are therefore being fed polluted priorities

This is exactly what fake sophistication looks like:
- ranked output
- clean JSON
- multiple scoring layers
- bad semantic judgment

## What Is Real And Useful
- Canonical URL duplicates can be detected from GSC page and page-query data.
- Query-level leakage is much better than page-level leakage alone.
- Cluster thinking is directionally right.
- AIO-suspect logic is directionally useful for spec pages.
- Opportunity queues are better than purely ad hoc weekly planning.

## What Is Fake Precision
- `expectedCTR(position)` as a universal benchmark without SERP feature context, device context, or query class adjustments.
- `intent_value` multipliers that imply more certainty than the underlying query interpretation deserves.
- `gravityScore`, `entropy`, and `transitionOpportunity` outputs when the raw data is already row-capped and partially stale.

## Ignored Signals
- search appearance
- branded vs unbranded split by entity, not just term match
- landing-page cannibalization after canonical normalization
- page freshness versus ranking movement
- internal link anchor distribution
- affiliate click yield
- revenue by query cluster
- PAA / AIO / shopping feature prevalence by keyword family

## Overengineered Logic
- entropy
- impression gravity
- intent transitions
- AIO recommendations

These are not useless ideas. They are just premature relative to the raw data quality.

## Underengineered Logic
- canonical normalization
- pagination
- completeness validation
- negative keyword filtering
- entity disambiguation
- monetization event tracking

## Professional-Grade Architecture Recommendation

### Layer 1: Raw acquisition
Files:
- `scripts/gsc-pull.ts`
- raw archive under `raw/gsc/`

Requirements:
- paginate to API limits
- validate row counts before overwrite
- store exact extraction metadata
- always write canonicalized and raw variants separately

### Layer 2: Normalized warehouse
Represent as structured files or lightweight local DB tables:
- `pages_daily`
- `queries_daily`
- `page_queries_daily`
- `devices_daily`
- `search_appearance_daily`

Normalization requirements:
- canonical URL normalization
- slash/no-slash merge
- query cleanup
- entity tagging
- query family tagging

### Layer 3: Intelligence services
Outputs should be narrow and trustworthy:
- CTR leak queue
- near-page-1 queue
- cannibalization queue
- monetization queue
- internal linking queue
- content gap queue

### Layer 4: Human-readable compression
One weekly digest should answer:
- what moved
- what is leaking
- what is rising
- what is cannibalizing
- what is monetizable now
- what should be ignored as noise

## Recommended Scoring System

### Opportunity confidence first
Before ranking impact, score confidence:
```text
confidence =
  data_freshness_score *
  canonical_cleanliness_score *
  entity_match_score *
  query_volume_score
```

If confidence is low, do not create an action item.

### Opportunity score second
```text
opportunity =
  normalized_impressions *
  rank_proximity_weight *
  monetization_weight *
  confidence
```

### Junk filter examples
```text
if query contains brand term but product entity != office chair topic:
  suppress from action queue

if page variants collapse to same canonical:
  merge before scoring

if raw pull age > 72 hours:
  mark analysis stale
```

## Internal Linking Intelligence Recommendation
Add a small deterministic engine:
- for each page with high impressions and pos 5-20
- find parent hub
- find missing comparison links
- find missing spec/support links
- output 3-5 specific source -> target recommendations

## Monetization Intelligence Recommendation
Add event tracking for:
- Amazon outbound clicks by page
- CTA position
- anchor text
- device

Then compute:
- outbound CTR per page
- outbound CTR per query family
- conversion-proxy delta after CTA changes

## Assumptions
- GSC will remain the primary in-house search data source.

## Hypotheses
- A cleaner, smaller intelligence system will outperform the current broader but noisier one.

## Recommendations
1. Freeze new intelligence modules until raw acquisition and normalization are trustworthy.
2. Add canonical normalization and junk-query suppression before any further scoring work.
3. Treat current `analysis.json` as a prioritization aid, not as an action authority.
4. Build monetization and internal-link intelligence before adding more abstract metrics.

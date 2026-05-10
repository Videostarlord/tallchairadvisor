---
type: concept
last_updated: 2026-05-09
sources: [scripts/gsc-analyze.ts]
tags: [gsc, clustering, intent, queries]
---

# Query Clustering System

## Purpose

Groups the 427 `pageQueries` rows into semantic families so agents see "the Cornell ergonomics cluster (6 variants, 164 impr, 0 CTR)" rather than 6 separate rows of noise.

## Algorithm

1. Normalize each query: lowercase, remove punctuation, strip stopwords, keep tokens ≥3 chars
2. Take the first 3 significant tokens, sort alphabetically → 3-gram fingerprint
3. Group all rows sharing a fingerprint into a bucket
4. Keep buckets with ≥2 members OR ≥30 impressions (singleton high-volume queries)
5. Score each cluster by: `(1 / avgPosition) * totalImpressions * intentValue`

## Intent Value Weights

| Intent Type | Multiplier | Detection Terms |
|-------------|-----------|-----------------|
| buyer | 3.0× | best, buy, vs, review, price, worth, alternative, affordable |
| brand | 2.0× | steelcase, herman miller, gesture, aeron, leap, sihoo, doro |
| spec | 1.5× | height, seat, depth, width, dimensions, weight limit, inches |
| informational | 1.0× | (default) |

## Known TCA Cluster Families (as of May 2026)

| Cluster | Representative Query | Type | Notes |
|---------|---------------------|------|-------|
| Cornell ergonomics | "cornell ergonomics seat depth" | informational | 6 variants, 164 impr, 0 CTR — title mismatch |
| Gesture knee support | "steelcase gesture knee brace support" | brand+spec | 2 variants, 109 impr, 0 CTR — AIO suspect |
| Gesture seat depth | "steelcase gesture seat depth adjustment" | spec | 2 variants, 54 impr, 0 CTR — AIO suspect |
| Aeron size C | "herman miller aeron size c height range" | brand+spec | Missing "size C" in title |
| Tall people chair | "best office chair tall person" | buyer | Primary money cluster |

## Cannibalization Detection

A cluster is `cannibalized: true` when 2+ pages appear in its `pages[]` array. High-risk when the ranking positions are within 5 spots of each other (means Google is confused about which page to show).

## Output

Each cluster in `analysis.json` contains:
```json
{
  "fingerprint": "chair-ergonomics-tall",
  "representativeQuery": "best ergonomic chair for tall people",
  "queries": ["ergonomic chair tall person", "best chair tall people"],
  "pages": ["/best-office-chairs/"],
  "totalImpressions": 245,
  "totalClicks": 3,
  "avgPosition": 8.4,
  "clusterCTR": 1.22,
  "intentType": "buyer",
  "cannibalized": false,
  "opportunityScore": 87.3
}
```

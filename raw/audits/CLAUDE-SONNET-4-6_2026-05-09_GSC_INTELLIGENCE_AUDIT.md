# GSC Intelligence Audit
**Auditor:** CLAUDE-SONNET-4-6 | **Date:** 2026-05-09 | **Mode:** Read-only forensic audit

---

## Intelligence Architecture Overview

The GSC intelligence system consists of two scripts:

1. **gsc-pull.ts** — collects 6 data dimensions from GSC API
2. **gsc-analyze.ts** — 7 primary modules + 4 phase-2 modules → analysis.json

This is the most technically sophisticated component of the TCA system and is genuinely well-designed. Assessment below is at a professional SEO intelligence standard.

---

## Module-by-Module Analysis

### Module 1: CTR Leak Detector ✅ WORKING (partially)

**Logic:** For each page+query with ≥15 impressions and position ≤20, compare actual CTR vs. expected CTR benchmark (industry curve). Score = CTR gap × impressions × intent weight.

**Evidence from analysis.json:**
- Top leak: /review/gesture/ — "steelcase knee brace review" — 91 impr, pos 7.3, 0% CTR. LeakScore 8.2.
- AIO suspects: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches" — pos 4.2, 0% CTR — correctly flagged as AIO.

**Issues:**
1. The expected CTR curve uses desktop industry benchmarks. Mobile CTR at position 7 is ~1.5-2.5%, not 3%. This inflates expected CTR for mobile-heavy queries and over-scores some leaks.
2. The 15-impression minimum threshold is correct for statistical validity at current scale but will need raising to 50+ as traffic grows.
3. "steelcase knee brace review" at 91 impressions is not a TCA target keyword — this is likely branded search for a different Steelcase product (the Gesture chair is sometimes called "gesture" but "knee brace" refers to a different Steelcase product). This CTR leak is unfixable by TCA — the searchers want a different product. The system doesn't detect this mismatch.

**Professional assessment:** CTR leak detection is 80% correct. Add a check for keyword-page relevance mismatch (query intent vs. page topic) to avoid acting on irrelevant query traffic.

---

### Module 2: Query Intent Clusterer ✅ WORKING

**Logic:** Normalize queries (lowercase, remove stopwords, take first 3 stems), cluster by fingerprint, compute opportunity score = (1/avgPosition) × totalImpressions × intentWeight.

**Issues:**
1. Fingerprint approach is coarse. "steelcase gesture seat depth inches" and "gesture chair depth dimensions" normalize to different fingerprints but are semantically identical. True semantic clustering (embedding-based) would produce better clusters.
2. Intent weights (buyer=3.0, brand=2.0, spec=1.5, info=1.0) are reasonable but not validated against TCA's actual conversion data. The first commission came from a spec-intent query (Cornell rule), not a buyer-intent query — suggesting spec-intent may be underweighted.
3. No cluster naming or human-readable summary. Clusters are identified by fingerprints like "gesture-seat-depth" — useful for debugging but not for strategy agent consumption.

**Professional assessment:** Useful clustering at current scale. Will need embedding-based approach at 10x traffic.

---

### Module 3: Opportunity Scorer ✅ WORKING

**Logic:** Classify each page as near-p1 (pos 5-15, ≥100 impr), ctr-leak (has leaks, pos ≤10), content-depth (pos ≥15, ≥200 impr), affiliate-capture (≥50 buyer impr, CTR <2%), or low-signal.

**Evidence from analysis.json:** Shows correctly structured opportunities.

**Issues:**
1. The "near-p1" window is pos 5-15. This is correct for high-volume sites. For TCA at current scale, any page in pos 5-20 with ≥100 impressions is a near-p1 candidate — the window should be wider.
2. Opportunity score formula for near-p1 is `(impressions / position) × 2`. This means a page at pos 5 with 100 impr scores the same as pos 10 with 200 impr. The incentive is to push for lower position pages, not higher-impression ones. Consider weighting by impressions more heavily.
3. "affiliate-capture" is triggered at ≥50 buyer-intent impressions with CTR <2%. This is correct directionally but CTR <2% is a very loose threshold — nearly all TCA pages have CTR <2% (site average is 0.24%).

**Professional assessment:** Classification logic is sound. Threshold tuning needed as traffic grows.

---

### Module 4: Cannibalization Detector ✅ WORKING

**Logic:** Normalize queries, find queries where ≥2 pages appear in pageQueries with ≥15 total impressions.

**Evidence:** No high-risk cannibalization detected in current analysis. This is correct — TCA's hub-and-spoke architecture prevents most cannibalization.

**Issues:**
1. Position spread threshold (high risk = spread <5, medium = spread ≥5) is arbitrary. A 4-position spread between pos 3 and pos 7 may or may not represent cannibalization depending on the query.
2. No suggestion for resolution — the detector flags but doesn't recommend consolidation or canonical adjustment.

**Professional assessment:** Working correctly and finding nothing to fix — which is the right answer for TCA's current architecture.

---

### Module 5: Affiliate Opportunity Detector ✅ WORKING

**Logic:** Sum buyer-intent impressions per page. Flag as high (≥200), medium (≥50), low (<50).

**Evidence from analysis.json:** At least some pages are flagged with buyer intent impressions above threshold (per strategy.ts integration).

**Issues:**
1. "Buyer intent" is detected by exact-match of terms: "best, buy, vs, review, alternative, worth, price, cheap, under $, affordable, budget, top." This misses queries like "which Steelcase chair is better for tall people" (has buyer intent but none of the terms) and over-includes "review" queries (which may be research, not purchase intent).
2. No CTA verification — the module flags pages with buyer intent impressions but doesn't check whether those pages actually have affiliate CTA blocks. A page could have 500 buyer-intent impressions and no CTA.

**Professional assessment:** Intent detection is a proxy, not ground truth. Combine with CTA audit for true affiliate readiness scoring.

---

### Module 6: Site Trend / Velocity ❌ CURRENTLY NULL

**Status:** `siteTrend: null` in current analysis.json.

**Logic (when working):** Compare impressions and positions of last 7 days vs. prior 7 days using dailyTrend array. Requires ≥14 data points.

**Likely cause of null:** Either `gsc.dailyTrend` is empty/undefined in latest.json, or the array has fewer than 14 rows. Both are solvable.

**What TCA is missing:** Week-over-week momentum signal. The wiki/synthesis pages manually tracked this (impressions tripling Apr→May) but the automated detection is offline.

**Fix:** Verify dailyTrend is populated in latest.json. If so, lower threshold to 7 days.

---

### Module 7: Device Intelligence ❌ CURRENTLY NULL

**Status:** `deviceIntelligence: null` in current analysis.json.

**Logic (when working):** Compare mobile vs. desktop CTR across all pages. Flag pages where mobile CTR is less than 50% of desktop CTR.

**What TCA is missing:** Identification of pages that are ranking well but not converting on mobile. For a product that people research on desktop but discover on mobile, this split matters.

**Fix:** Same root cause as siteTrend. Verify deviceSplit array is populated in latest.json.

---

### Phase-2 Modules (All 4 Active)

| Module | Status | Usefulness at Current Scale |
|--------|--------|---------------------------|
| Query Entropy | Active | Low — not enough queries per page for meaningful entropy |
| Impression Gravity | Active | Low — no hub candidates (needs ≥8 clusters) |
| Intent Transitions | Active | Medium — correctly identifies info→commercial gaps |
| AIO Recommendations | Active | High — correctly flags spec query AIO suspects |

The AIO recommendations module is the most immediately useful Phase-2 module. It correctly identifies that /chairs/steelcase-gesture/seat-depth/ is an AIO suspect and recommends: "Put the specific number/spec at the top of the page in a prominent answer box." This is the right prescription.

---

## What Professional-Grade GSC Intelligence Would Add

For comparison, here is what a professional SEO intelligence platform would layer on top of what TCA has:

| Feature | TCA Has | Professional Tier Has |
|---------|---------|----------------------|
| CTR leak detection | ✅ Yes | ✅ Yes + position trend |
| Query clustering | ✅ Fingerprint-based | Embedding-based semantic clustering |
| Cannibalization | ✅ Yes | Yes + canonical recommendation |
| Competitor keyword overlap | ❌ No | SERP ranking data per keyword |
| Featured snippet tracking | ❌ No | Snippet presence/absence per query |
| Backlink data | ❌ No | Domain authority + referring pages |
| Revenue attribution | ❌ No | Session-level conversion tracking |
| Search appearance types | ❌ No | Rich result presence tracking |
| Seasonal patterns | ❌ No | Year-over-year demand modeling |
| Content gap vs. SERP | ❌ No | "You're not ranking for X but should be" |

**TCA has ~60% of what professional platforms provide for the data types it does collect.** The gap is primarily in SERP-side data (competitor rankings, featured snippets, rich results) that requires external APIs.

---

## Recommended GSC Intelligence Upgrades (Priority Order)

**Priority 1 (This week):** Fix siteTrend and deviceIntelligence null output. These are already built — they just need to return data.

**Priority 2 (This month):** Add a SERP spot-check for the top 10 TCA keywords using SerpAPI or ValueSERP. ~$0.001/query × 10 keywords × 4/month = negligible cost. Integrate into Monday pipeline.

**Priority 3 (Next quarter):** Add country dimension to gsc-pull.ts. Add search appearance dimension. Both are available from the GSC API and require minimal code changes.

**Priority 4 (When traffic 5x's):** Replace fingerprint clustering with embedding-based semantic clustering. The infrastructure is correct; only the clustering algorithm needs upgrading.

**Do NOT add:** DataForSEO full crawl, rank tracking for 500+ keywords, or server-side analytics — these are overengineered for TCA's current scale and would add significant cost without proportional insight.

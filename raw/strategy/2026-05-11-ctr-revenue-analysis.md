# CTR Root Cause Analysis & Revenue Projection
**Date:** 2026-05-11  
**Session:** Manual conversation — Jackson asked for revenue projection and CTR fix options  

---

## Revenue Projection (Automation-Only, No Manual Changes)

### Baseline (May 2026)
- Clicks (90-day rolling): 35 → ~12/month
- CTR: 0.23%
- EPC (earnings per click): $0.51 ($18 commission / 35 clicks)
- Monthly run rate: ~$6/month
- Revenue to date: $18 (1 commission, May 1 — /knee-pain-seat-depth/)

### Scenarios

| Scenario | Driver | Monthly (Dec 2026) | Jun–Dec Total |
|----------|--------|--------------------|---------------|
| Conservative | Growth stalls, CTR flat, CTA fixes delayed | $10–15/mo | $60–100 |
| Base | 2x impressions, 1.5x CTR from meta rewrites, CTA fixes deploy | $20–30/mo | $120–200 |
| Optimistic | New pain-pillar pages convert, CTA fully fixed, CTR lifts on editorial | $50–80/mo | $250–450 |

**Most likely: $100–250 cumulative through end of 2026.**

### Known Revenue Leaks (highest priority, already in queue)
- /aeron-vs-gesture/: 385 impr, pos 8.5, 0 CTAs in first 84% → 0 affiliate clicks
- /review/gesture/: Single CTA at 85% of page — most visitors exit before reaching it
- /best-office-chairs/: Quick Picks links to internal review pages, not Amazon

### What Reaches $100+/month
Requires at least one of:
1. Ranking lift on /review/gesture/ (pos 8.2 → pos 4-5)
2. Breaking into a non-suppressed query cluster (top-5, no AIO/carousel)
3. /shoulder-pain-tall-people/ — Jackson's real experience, zero competition, proven conversion pattern

---

## CTR Root Cause Diagnosis

### Cause A: AI Overview Suppression (~80% of problem)
Pages at pos 7–10 with >30 impressions and <0.3% CTR are AIO-suppressed.
- Google answers the spec/informational query inline → no organic click is possible
- Confirmed examples: "herman miller aeron size c height range" (pos 9, 0 CTR), "steelcase gesture 360 armrests description" (pos 7.8, 0 CTR)
- AIO suspect pattern: pos 4-10 on spec queries, 0 CTR, no seasonal variation
- AIO suspect pages: /chairs/steelcase-gesture/seat-depth/, /chairs/herman-miller-aeron/tall-people/

### Cause B: Shopping Carousel Burial (~15% of problem)
- Commercial terms ("best office chair for tall people") show product carousels above fold
- TCA at pos 22–25 is effectively invisible — meta rewrites don't help
- Fix: domain authority / link building over 12–18 months

### Cause C: Editorial Page Under-Optimization (~5% of problem)
- /review/gesture/ (pos 8.2, 0.12% CTR), /review/leap-plus/ (pos 8.5, 0.31% CTR), /aeron-vs-gesture/ (pos 8.5, 0% CTR)
- These pages are on editorial SERPs without AIO/carousels — meta rewrites DO help here
- May 7 verdict-first rewrites deployed, awaiting signal

---

## Automation Recommendations

### Priority 1: geo-optimize.ts (new script, monthly)
Addresses Cause A — AIO suppression.

**What it does:**
1. Detects AIO-suppressed pages from analysis.json (pattern: pos 5–15, >30 impr, <0.3% CTR)
2. Queries SerpAPI for the AI Overview block on top 2–3 queries per affected page
3. Claude analyzes what citation format the AI Overview used (which source it cited, what passage structure)
4. Rewrites the specific page section to add a 40–60 word standalone citation capsule matching the format
5. Outputs structured fix tasks for execute-fixes.ts to apply

**Cost:** $0–2/month additional, within existing SerpAPI quota (250 credits/month)
**Build time:** 3–5 hours
**Expected impact:** High — converts AIO-invisible impressions into AIO citations

**Full build spec:** `wiki/pages/concepts/geo-optimize-plan.md`

### Priority 2: SERP-Aware Title Comparison (upgrade to audit.ts)
Addresses Cause C — editorial pages.

**What it does:**
Before flagging a meta rewrite, pulls top-5 organic titles for the primary query via SerpAPI.
Identifies the click-pattern in winning titles (brackets, numbers, height-specific angle).
Generates a title that matches the winning SERP pattern while differentiating on height specificity.
Replaces the current generic "verdict-first" approach with SERP-matched optimization.

**Cost:** ~5 SerpAPI credits per page checked, well within quota
**Build time:** 2–3 hours
**Expected impact:** Medium — improves editorial CTR signal quality

### What NOT to buy
No SEO agency cheaply fixes the AIO or carousel problem. Specifically:
- Link building: $100–400/quality link, 10–20 links minimum = $1,000–8,000 + months. Not a 2026 play.
- Fiverr SEO gigs: No legitimate service can insert content into Google AIs Overview. The fix is content structure.
- Meta optimization services: Workflow already does this — no agency would outperform what's built.

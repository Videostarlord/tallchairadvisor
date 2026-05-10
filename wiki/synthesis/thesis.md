---
type: synthesis
last_updated: 2026-05-10
sources: [raw/strategy/2026-03-seo-strategy.md, raw/audits/COMBINED_2026-05-09_MASTER_AUDIT.md]
tags: [thesis, strategy, big-picture]
---

# Strategic Thesis

**Last revised:** 2026-05-10

## The Bet

TallChairAdvisor.com can become the #1 resource for height-specific office chair ergonomics by owning a sub-niche that no competitor explicitly targets: "does this chair fit someone who is 6'X?"

**Why it works:**
1. Underserved demand — real search volume, few authoritative answers
2. High purchase intent — $700–$2,000 chairs, careful research
3. Spec-driven content — verifiable numbers resist AI displacement
4. No incumbent — BTOD does weight, Tall.Life does lifestyle, nobody does height-specific chair fit

## Current State (May 10, 2026)

- **GSC:** ~14,767 impressions, 35 clicks, ~0.24% CTR (90-day, May 10)
- **Pages:** ~46 content pages indexed
- **Revenue:** $18 first commission May 1 — Gesture review converting
- **Automation:** Full weekly cycle live (Mon–Sat). All agents committed to main.
- **Intelligence pipeline:** `competitor-intelligence.ts` v3 live — structured extraction, FindingType taxonomy, confidence-aware gap filtering. Monthly cadence.
- **Strategy enforcement:** All plan constraints in code — cooldown, impression threshold, file ref validity, conditional language, FIX+REWRITE overlap, max-5-FIX cap.

## Infrastructure Status (as of May 10)

| Component | Status |
|-----------|--------|
| gsc-pull.ts + gsc-analyze.ts | Live — runs Monday |
| competitor-monitor.ts | Live — lightweight Monday scan |
| competitor-intelligence.ts v3 | Live — monthly deep analysis |
| strategy.ts enforcement | Live — 5 constraints code-enforced |
| execute-fixes.ts | Live — Thursday |
| execute-content.ts | Live — Friday |
| verify-deploy.ts | Live — Saturday |
| index-monitor.ts | Live — Monday |

**Infrastructure work is complete. Focus shifts entirely to content.**

## What Needs to Happen Next (Priority Order — May 10)

### 1. Execute this week's plan (Thu/Fri/Sat)
Queued in `reports/weekly-plan.md` after enforcement:
- **FIX:** /aeron-vs-gesture/ meta (348 impr, 0 CTR, pos 8.5)
- **FIX:** /chairs/herman-miller-aeron/tall-people/ — AIO passage anchors + canonical check
- **FIX:** /correct-chair-dimensions/ — restructure "5 Mistakes" as "5 Tall-Chair Measurement Rules"
- **NEW:** /office-chair-return-policy/ — btod.com competitor gap, high purchase-anxiety query
- **REWRITE:** /gesture-vs-leap-plus/ — add spec comparison table

### 2. Run competitor:intelligence again after next plan cycle
Next run will benefit from v3 improvements (section manifest, FindingType tags). Schedule for ~June 10.

### 3. Content depth on Gesture review
304 impr at pos 1, 8.33% CTR vs 35% expected. C1 from audit — REWRITE queued for a future week after cooldown clears.

### 4. Leap Plus "almost bought" reframe
/review/leap-plus/ at pos 9.3 with 632 impressions. C2 from audit. "I almost bought this — here's the spec analysis" narrative. Future week.

### 5. Shoulder pain + standing desk content
Jackson's real experience anchors both. Zero-competition keywords. After current fixes ship.

### 6. Competitor word count floor (Codex Finding 3)
Add `competitorWordCount` to `GapFinding`, floor filter in `strategy.ts`. Small build, deferred until post-content push.

## What Could Change This Thesis

- **If Thursday meta rewrites don't lift CTR on review pages:** Revisit whether editorial SERPs are also suppressed by features not visible in Apr 22 audit.
- **If Gesture review CTR doesn't improve after depth expansion:** First-person voice may not be the only variable — AIO may be eating traffic on brand queries too.
- **If commission revenue stays at one-off level:** Shift content priority toward more first-person pages.

## Links

- [[what-works]] — evidence base for strategy
- [[what-failed]] — counter-evidence
- [[content-gap-engine]] — gap detection architecture
- [[gsc-intelligence-system]] — GSC pipeline reference
- [[workflow-system-reference]] — full automation architecture
- [[decisions-log]] — week-by-week decision history

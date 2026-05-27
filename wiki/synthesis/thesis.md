---
type: synthesis
last_updated: 2026-05-23 (priority order rewritten; spec-first fitment frame set; Gesture rewrite protocol documented)
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
- **LLM infrastructure direction:** Broad RunPod migration deferred. If cost optimization is needed, Anthropic Batch is the first path to investigate for non-urgent read-only jobs.

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

The only approved infra follow-up is lightweight **Anthropic Batch** research for non-urgent analysis steps. A broader RunPod migration is backlog-only until it beats Batch on real TCA prompt packs without adding meaningful ops burden.

## What Needs to Happen Next (Priority Order — May 23)

> **Strategic frame (updated May 23):** TCA is not a review site. Google already classifies it as a spec-verification authority for tall buyers. Every page should lead with dimensional data before prose. The identity is: *fitment verification tool for tall buyers who need spec confirmation before a $1,000+ purchase.* See [[semantic-intent-analysis]] for full evidence base.

### 0. ~~Build `geo-optimize.ts`~~ — DONE (2026-05-11)
AIO suppression logic is integrated into `competitor-intelligence.ts` v2.3. SERP cache live. 3 capsules applied. See [[geo-optimize-plan]].

### 1. Gesture review full rewrite — HIGHEST PRIORITY
**2,529 impr, pos 8.2, 0.09% CTR — worst CTR-to-impression ratio on the site.**

This is a **manual session only** — not suitable for the Friday automation agent. The page requires Jackson's real first-person body data that no agent can fabricate.

**Session protocol:**
1. Claude asks Jackson a series of prompting questions about his personal experience with the Gesture at 6'4" (seat depth feel, lumbar position, armrest height, how long it took to dial in, what hurt before vs. after, specific measurements he's noticed, etc.)
2. Jackson answers in his own words
3. Claude writes the entire rewritten page in first-person voice from those answers

**Do not start this rewrite without going through the question → answer → write sequence.** The first-person data is the entire differentiator.

### 2. Defragment `/correct-chair-dimensions/`
1,986 impr, pos 15.6, entropy 4.419 (52 query clusters — highest on site). Generic furniture sizing content is draining the tall-user fitment signal. Fix: remove or subordinate generic content, reframe title/intro to explicitly signal anthropometric fitment for tall users. Automation-eligible (Thursday/Friday agent).

### 3. Add spec tables to height-specific pages
`/office-chairs-for-6-foot-3/` through `/office-chairs-for-6-foot-7/` are sitting at pos 7–10 with near-zero CTR. Pattern from highest-CTR pages: specific measurement = clicks. Add a spec table (seat height range, seat depth range, weight capacity per chair) before any prose on each page. Automation-eligible.

### 4. Build seat depth calculator on `/knee-pain-seat-depth/`
TCA is the canonical web reference for the Cornell seat depth rule — 8+ query variants route to this page. A calculator (input: height → output: seat depth range + matching chairs with affiliate links) converts an informational moat into a conversion engine. **Manual build required** — vanilla JS in an Astro `<script>` tag, no new dependencies needed. Estimated: 2–3 hour session.

### 5. Weight capacity guide for tall heavy users (new page)
"Best heavy duty ergonomic chairs for tall people" at pos 14 with zero dedicated content. Leap Plus 500 lb capacity queries confirming. No competitor owns this. Research-voice page — automation-eligible.

### 6. Leap Plus "almost bought" reframe
/review/leap-plus/ at pos 9.3 with 632 impressions. "I almost bought this — here's the spec analysis" narrative. Automation-eligible after cooldown clears.

### 7. Shoulder pain + standing desk content
Jackson's real experience anchors both. Zero-competition keywords. After items 1–3 ship.

### Deferred
- SERP-aware title comparison in `audit.ts` (2–3 hours, low urgency)
- Competitor word count floor in `strategy.ts` (small build, post-content push)

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

# TCA Weekly Audit Report
**Generated:** 2026-05-16T01:51:28.156Z
**Data range:** 2026-02-15 → 2026-05-16

# TCA Site Audit Report
**Date:** 2026-05-15 (current week)
**Scope:** 21 pages | 90-day window

---

## 1. Executive Summary

The site has grown impressively — 17,877 impressions vs. 14,767 in the prior audit (+21%), and 41 clicks vs. 35 — but CTR remains structurally broken at **0.23%**, essentially flat against the 0.24% baseline. Position has improved to 10.7 from 11.5, meaning the site is ranking *closer to the fold* but converting those rankings almost not at all into clicks. The core problem is a cluster of **8 pages sitting at position 4.9–9.0 with zero clicks**, several of which are confirmed or likely AI Overview victims; these need to be triaged by suppression mechanism before meta rewrites are invested. The one actionable lever this week is the `/office-chairs-for-6-foot-4/` page: **position 4.9, 232 impressions, 0 clicks** — that is not an AI Overview problem, that is a title/meta failure and it is the single highest-priority fix on the site.

---

## 2. Critical CTR Leaks
*Position ≤ 10, 0 clicks — sorted by impression volume*

| Page | Pos | Impr | CTR | Suppression Diagnosis |
|---|---|---|---|---|
| `/review/gesture/` | 7.9 | 3,343 | 0.09% | Not zero — 3 clicks, but 0.09% at 3K impr is structural leak |
| `/chairs/steelcase-gesture/seat-depth/` | 8.2 | 1,037 | 0.10% | Mixed: one query confirmed AIO (pos 4.2), second query likely meta failure |
| `/chairs/steelcase-leap-plus/tall-people/` | 8.5 | 567 | 0% | Likely meta failure — generic title on head terms |
| `/chairs/steelcase-gesture/` | 9.0 | 504 | 0% | Likely meta failure + content thin |
| `/aeron-vs-gesture/` | 8.6 | 410 | 0% | Meta/title mismatch with query intent |
| `/office-chairs-for-6-foot-4/` | 4.9 | 232 | 0% | **No AIO excuse at pos 4.9 — pure meta/title failure** |
| `/fit-guides/` | 8.2 | 224 | 0% | Category page — weak title, no value proposition |
| `/chairs/steelcase-leap-plus/seat-height/` | 8.8 | 446 | 0.22% | Near-zero; title has spec inconsistency (see Critical issues) |

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

**C-1: `/office-chairs-for-6-foot-4/` — Position 4.9, 232 impressions, 0 clicks**

This is the most damning single data point in the audit. Position 4.9 is above the fold on most screens. There is no AI Overview explanation — AI Overviews typically suppress position 7–10 informational queries, not position 5 commercial/comparison queries with a specific height modifier. The title and meta are failing to signal value to the searcher.

*Current title (56 chars):* `Best Office Chair for 6'4" | Tall Chair Advisor`
*Current meta (157 chars):* `At 6'4", the Leap Plus is the safest default: 22.5" seat height, 19.75" depth. Full comparison with Gesture and Aeron — height-by-height verdict.`

**Problems:**
- Title uses brand name sitewide suffix, wasting 20 chars of prime space at position 4.9 where the title is the CTA
- Meta buries the verdict structure ("full comparison... height-by-height verdict") in a way that sounds like a table of contents, not a payoff
- "Safest default" is passive; searcher at 6'4" wants confident specificity

**Fix — Rewrite title:**
```
Best Office Chair for 6'4": Leap Plus vs Gesture (2026)
```
*(57 chars — keeps year signal, drops generic suffix, names the comparison explicitly)*

**Fix — Rewrite meta (target 140–150 chars):**
```
At 6'4", you need 22"+ seat height and 19"+ depth. Leap Plus clears both. Gesture almost does. Aeron doesn't. Exact specs here.
```
*(130 chars — verdict-first, spec-driven, creates curiosity gap on "almost")*

---

**C-2: `/chairs/steelcase-leap-plus/seat-height/` — Spec Inconsistency in Title**

*Current title:* `Steelcase Leap Plus Seat Height: 15.5"–22.5" Range`
*Current meta:* `Steelcase Leap Plus seat height: 15.5"–20.5" range (5" adjustment).`

The **title says 22.5" ceiling; the meta says 20.5" ceiling.** These are different numbers for the same spec. This is a trust and accuracy problem: if a searcher reads the SERP snippet, they see a contradiction before clicking. Whichever figure is correct must be consistent across both. The Steelcase Leap Plus official spec is **15.5"–20.5"** (standard cylinder); 22.5" is only achievable with an aftermarket extended gas cylinder. 

**Fix:** Audit the actual Steelcase spec sheet. If 20.5" is the OEM ceiling:
- Title: `Steelcase Leap Plus Seat Height: 15.5"–20.5" Range` *(50 chars)*
- Meta: `Leap Plus seat height adjusts 15.5"–20.5" (5" range). At 6'3"+, here's whether that ceiling is enough — and the extended cylinder option.` *(140 chars)*

If 22.5" is achievable via extended cylinder, the page needs a content section explaining this explicitly, and both title and meta should acknowledge the distinction, not present it ambiguously.

---

**C-3: `/review/gesture/` — E-E-A-T Boundary Violation Risk in Meta**

*Current meta (158 chars):* `Independent review by a 6'4" owner. Seat depth, armrests, back height verdict for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.`

**Historical context flag:** Per site rules, Jackson has *only personally tested the Steelcase Gesture*. This meta is technically correct — the Gesture review can use first-person voice. However, the meta is 158 chars, which is **3 chars over the 155-char ceiling** and risks truncation at the exact point where "who it doesn't" appears, cutting the payoff.

**Fix — Trim to 150 chars:**
```
Reviewed by a 6'4" owner. Seat depth, armrests, back height verdict for 6'1"–6'7". Who the Gesture fits — and who should skip it.
```
*(131 chars — cleaner truncation point, "skip it" is more decisive than "doesn't")*

**Also:** CTR of 0.09% at 3,343 impressions (the highest-impression page on the site) is the largest absolute click-volume loss. Even moving from 0.09% to 0.5% CTR = ~17 additional clicks per 90 days, roughly doubling site-wide clicks. This page deserves a dedicated SERP title test.

**Fix — Test alternate title (currently 55 chars, at ceiling):**
```
Steelcase Gesture Review: Is It Worth It at 6'4"? (2026)
```
*(57 chars — question format increases CTR on review queries per standard SERP testing data)*

---

### 🟠 HIGH

---

**H-1: `/chairs/steelcase-gesture/seat-depth/` — AIO Triage Required Before Meta Investment**

Query `"steelcase gesture seat depth range inches"` at **pos 4.2 with 0 clicks** is a confirmed AI Overview per the SERP analysis framework. Meta rewrites on this query will not recover clicks — the AIO is absorbing them. However, the second query `"steelcase gesture seat depth adjustment range inches"` at pos 6.1 with 0 clicks is *not* confirmed as AIO and represents a recoverable leak.

**Fix (two-part):**
1. Do not invest in meta rewrite targeting the AIO query. Flag it as permanently suppressed.
2. Rewrite meta to serve the pos-6.1 query — specifically "adjustment" signals the user wants the *how*, not just the number:

*Current meta (132 chars):* `Gesture seat depth: 15.75"–18.75" (3" range). Fits 6'0"–6'4"; at 6'4"+ use full extension. How to adjust it.`

*Rewrite (targeting "adjustment" intent):*
```
How to adjust Gesture seat depth: slide the lever, set to 15.75"–18.75". At 6'4", you want full extension. Step-by-step with fit check.
```
*(137 chars — leads with the action verb "how to adjust", answers the intent directly)*

---

**H-2: `/aeron-vs-gesture/` — E-E-A-T Boundary Violation in Title and Meta**

*Current title:* `Aeron vs Gesture at 6'4": Why I Chose the Gesture`
*Current meta:* `At 6'4", I chose Gesture over Aeron.`

**This is the highest-risk page on the site for the E-E-A-T policy.** The first-person "I chose" framing is only valid because Jackson personally owns and tested the Gesture. However, this framing implies Jackson also personally evaluated the Aeron in direct comparison — which is not documented as a tested chair. A reader (or Google evaluator) could reasonably interpret "why I chose" as implying hands-on comparison of both chairs. 

**Fix:** Reframe as spec-driven comparison with the personal purchase as context, not proof of Aeron evaluation:

*Title:*
```
Aeron vs Gesture for Tall Users: Spec Verdict (2026)
```
*(52 chars)*

*Meta:*
```
Seat depth 18.75" (Gesture) vs 18.25" fixed (Aeron). At 6'4", that 0.5" gap matters. Armrest and back height comparison — which spec wins.
```
*(140 chars — removes first-person claim, leads with the differentiating spec)*

**Note:** If the page body also uses first-person to imply Aeron was personally tested, that content must be audited and corrected.

---

**H-3: `/best-office-chairs/` — Position 22.4, 877 Impressions, 0 Clicks: Content Depth Emergency**

This is the money page. "Best office chairs for tall people" is the highest-value head term on the site. Position 22.4 means it's on page 2-3 of results — essentially invisible. At 877 impressions it's being *crawled and indexed* on those queries, which confirms Google sees it as relevant but not authoritative enough.

Per the historical context: impression tripling came from hub-and-spoke architecture working. This page should be the hub. A page at pos 22.4 with 877 impressions on the exact head term is evidence that the hub itself is the weak link.

**Fix (content, not meta):**
- This page needs a full content depth upgrade before meta changes matter
- Minimum: height-by-height recommendation table (5'10"–6'7"+), explicit spec comparison for top 3 chairs, FAQ schema targeting "which chair for [height]" queries
- Internal links from all spoke pages should terminate here
- The meta is acceptable and doesn't need rewriting until position improves

---

**H-4: `/chairs/steelcase-leap-plus/tall-people/` — 567 Impressions, Position 8.5, 0 Clicks**

Top queries are head terms: `steelcase leap plus | steelcase leap tall | leap plus` — these are brand/product queries, not spec queries. A user searching "steelcase leap plus" is likely in early research mode and expecting a page that immediately answers "is this right for me."

*Current title:* `Leap Plus Fit Guide for Tall People | Tall Chair Advisor`
*Current meta (156 chars):* `Steelcase Leap Plus fit analysis for tall users 6'0-6'7+. 22.5-in seat height, 4-in adjustable seat depth, height-by-height breakdown, and who it fits best.`

**Problem:** The meta lists features without leading with the verdict. "Fit analysis" and "height-by-height breakdown" are descriptions of what the page contains, not answers to what the searcher wants to know.

**Fix — Rewrite meta (verdict-first):**
```
Leap Plus fits most tall users 6'0–6'7: 22.5" seat height, 4" adjustable depth. At 6'7+, it's borderline. Who it fits and who should look elsewhere.
```
*(151 chars — opens with a verdict, adds specificity at the tall end, creates decision-relevant tension)*

**Note:** The 22.5" seat height figure must be validated against C-2 above. If the OEM spec is 20.5", this is an additional data integrity problem.

---

### 🟡 MEDIUM

---

**M-1: `/knee-pain-seat-depth/` — Query Cluster Leak on High-Intent Educational Queries**

Three query variants of the Cornell ergonomics rule are leaking: 76 + 58 + 37 = **171 impressions, 0 clicks** across the cluster. These are not head terms — they're specific, research-phrased queries from users who know the Cornell two-finger rule. A user typing "cornell ergonomics chair seat depth two fingers behind knee" is highly research-intent and will click on a page that signals it goes deeper than a Wikipedia summary.

*Current meta (144 chars):* `Seat edge pressure on the back of your knees is the cause. Here's how to measure the right seat depth for your height and which chairs reach it.`

**Problem:** The meta doesn't mention Cornell or the two-finger rule, meaning the query keyword isn't echoed in the snippet. Google may bold the matching terms in the meta — but if the meta doesn't contain them, there's nothing to bold, reducing visual salience.

**Fix — Rewrite meta:**
```
The Cornell two-finger rule: seat edge should clear 2" behind your knees. At 6'2+, most chairs fail this. Measurement method and chairs that pass.
```
*(147 chars — echoes the query terms, states the rule, creates problem-awareness tension)*

---

**M-2: `/correct-chair-dimensions/` — Position 15.6, Thin Content Signal**

Top queries (`average dimensions of person sitting | office chair dimensions`) are generic informational queries. Position 15.6 indicates Google is indexing this page but not trusting it as authoritative on the topic. The title is borderline at 60 chars.

**Fix:** This page needs content depth work more than meta work. Specifically:
- Add a height-segmented table (e.g., "If you are 6'0"–6'2", you need: seat height X, seat depth Y, back height Z")
- Add citations to ergonomics standards (BIFMA, ANSI, Cornell) — these are E-E-A-T signals for a spec-driven page
- Meta is acceptable; don't rewrite until position improves

---

**M-3: `/gesture-vs-leap-plus/` — Position 13.7, Meta Truncation**

*Current meta (165 chars):* `Seat depth (18.75" vs 19.75"), back height, and armrest comparison for users 6'0"–6'6". Which one wins depends on your exact height — verdict inside.`

At 165 chars this is **10 chars over the 155-char ceiling** and will truncate before "verdict inside," cutting the payoff phrase.

**Fix — Trim:**
```
Seat depth (18.75" vs 19.75"), back height,
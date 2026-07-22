---
type: concept
last_updated: 2026-07-22
sources: [raw/audits/2026-07-21-full-seo-audit.md]
tags: [eeat, trust, fabrication, voice-rules, ftc, content-quality]
---

# Content Integrity

> **STATUS 2026-07-22 — C3 and C4 FIXED** on branch `worktree-gsc-post-consolidation-analysis` (PR #1). All fabricated first-hand claims and cross-page measurement contradictions below have been corrected in source and verified in `dist/`. The sections are kept as the historical record and as the rule set. Verification: `grep -rn "at least three weeks\|34-inch inseam\|3–4 week break-in" src/ dist/` returns nothing; the Gesture Direct Answer capsule no longer contradicts its body.

Tracking of false first-hand claims and cross-page factual drift. Established by the 2026-07-21 full SEO audit, which found that the May 2026 fabrication cleanup **corrected the Gesture review but never propagated to the pages that had copied it**.

## The governing constraint

Jackson has personally sat in **one chair: the Steelcase Gesture**. Every other chair — Aeron Size C, Leap Plus, Sihoo Doro S300, all budget chairs — is spec-and-community analysis only. See CLAUDE.md voice rules.

## ✅ FIXED 2026-07-22 — `/about/` fabricated testing protocol

`src/pages/about.astro` L184, under H3 **"3. Extended daily use — minimum 3 weeks"**:

> "I use every primary review chair as my main seat for at least three weeks of normal daily use before writing a final evaluation."

The **same page** at L141 says:

> "Hands-on daily use: Steelcase Gesture (personal chair, 2+ years). All other chairs evaluated through manufacturer specifications... **not personal sit-testing**."

Also live on that page: measuring every chair "using a digital caliper and tape measure" (L163–167), pain-tracking across all chairs (L191–192), "reviews... grounded in physical measurements, extended real-world use" (L147–148), "When I test recline..." (L226).

**This is the E-E-A-T authority page, linked sitewide.** A rater reading top-to-bottom hits the fabricated protocol (§155–194) before the honest disclaimer buried in a bullet at §141. Verified live via curl 2026-07-21.

**Fixed as prescribed.** §"How I Evaluate Chairs" now opens by stating the one-chair constraint before any framework, and the six steps are labeled by track: "1. Dimensional analysis (all chairs)", "3. Extended daily use — Steelcase Gesture only", "4. Pain-point tracking (Steelcase Gesture)". The caliper claim and the "minimum 3 weeks" H3 are gone. The lede at L147 no longer claims "physical measurements, extended real-world use" across all reviews.

## ✅ FIXED 2026-07-22 — the 6'4" measurement contradiction

Two live pages give the same author, same body, same chair two irreconcilable measurements:

| Page | Inseam | Knee clearance | Verdict |
|---|---|---|---|
| `/review/gesture/` (corrected May 2026) | **32"** | **~3 finger-widths** | "not a borderline fit, a comfortable one" |
| `/office-chairs-for-6-foot-4/` (never updated) | **34"** | **1.5–2 finger-widths** | "right at the lower threshold of comfort" |

~~The stale figures survive in five places on the 6'4" page~~ **(all corrected)** — **including inside FAQPage JSON-LD at line 49**, which is served directly to Google and AI engines. Lines: 49, 211, 214, 228, 326. Also L416 claims "first-hand fit notes at 6'4"" for a list that includes the Aeron and Leap Plus.

**`/review/gesture/` also contradicts itself.** Its Direct Answer capsule (L181) still reads *"At 6'4", seat depth is a borderline fit"* while the body says the opposite four times (L374, 416, 432, 459). **That capsule is exactly the block AI Overviews extract** — so the site risks self-contradicting inside a single AI Overview.

## ✅ FIXED 2026-07-22 — the retracted "break-in period" fabrication

The Gesture review explicitly retracted it (L126, L486: *"I felt a difference from the very first sit — there was no skeptical adjustment period"*). It survives as asserted fact on four other pages:

- `shoulder-pain-tall-people.astro:273` — *"Some of that was the break-in period on the chair itself."*
- `review/leap-plus.astro:116` — **in FAQ schema**: *"the Steelcase Gesture, which users typically describe as noticeably firm for the first 3–4 weeks"*
- `review/leap-plus.astro:282, :322` — *"the Gesture's 3–4 week break-in"*
- `gesture-vs-leap-plus.astro:277` — *"expect a 3–4 week break-in period"*

## ✅ FIXED 2026-07-22 — invented measurement on an untested chair

`chairs/steelcase-leap-plus/index.astro:203–204`, under H3 **"Setup Notes at 6'4" (32" Inseam)"**:

> "Seat depth at 19.75" maximum **gives me a clean 2-finger clearance behind the knee**."

A body-contact measurement on a chair never sat in. Same failure class as the May 2026 Gesture fabrication. This page also has **no Byline** and no `author` schema.

**Fixed as prescribed.** H3 is now "Spec Analysis at 6'4" (32" Inseam)" and the paragraph opens "I don't own this chair, so the numbers below are derived from published specs..." with the clearance stated as a calculation. **Still open: this page has no Byline and no `author` schema.**

## Tenure contradictions

| Claim | Location |
|---|---|
| Gesture owned "2+ years" | `about.astro:141`, `author/jackson-christopher/index.astro:122` |
| Gesture owned "close to a year" | `review/gesture.astro:39, :243, :404` |
| "Research tenure: 6+ years" | `about.astro:140` |
| "started systematically researching chairs in 2019" | `index.astro:145` |

Seven years of chair research from a current undergraduate senior strains plausibility and edges toward the claim CLAUDE.md forbids. **Recommend dropping the tenure number entirely.**

## ✅ Pages that handle the constraint correctly — use as the template

- `review/aeron-size-c.astro:191` — *"I haven't personally sat in the Aeron — my analysis is spec-driven and community-informed, not first-hand."*
- `review/sihoo-doro-s300.astro:175, :211` — *"This is a research-based analysis — I own the Steelcase Gesture, not the S300."*
- `aeron-vs-gesture.astro:316` — *"I own the Gesture — I haven't personally sat in the Aeron."*
- `review/leap-plus.astro:196` — *"was my second-choice finalist... I came close to buying it"*

Reddit quotes on `chairs/herman-miller-aeron/index.astro` and `aeron-vs-gesture.astro` are properly attributed blockquotes, not author voice — no issue.

## RULE for future sessions

**When a fabrication is corrected on one page, grep the whole repo for the fabricated figure and fix every copy in the same commit.** The May 2026 Gesture cleanup did not do this, and eight months later the retracted claims are still live on four pages and inside two JSON-LD blocks. Factual drift between pages is a Sept 2025 QRG "factual inaccuracy" flag and is detectable by any rater who reads two pages.

**The site is otherwise clean on AI-content markers** — 8 benign AI-phrase hits across 49 files, zero *delve/tapestry/seamless/game-changer*, burstiness median sd 13.1 (healthy human range). The risk here is factual drift, not style.

## Links

- [[review-gesture]] — the corrected source of truth
- [[affiliate-compliance]] — FTC disclosure gaps found in the same audit
- [[deploy-pipeline-integrity]] — the build-side counterpart of the silent-failure class
- [[content-quality-scores]]


## Correction applied 2026-07-22 — the biomechanics were also inverted

Reconciling the numbers exposed a second defect: `/office-chairs-for-6-foot-4/` had the physics backwards. Clearance is thigh length minus seat depth, so a **longer** femur at the same standing height produces **more** clearance, not less. The page claimed the opposite ("users with longer thigh proportions will find it tighter") and framed the Leap Plus's extra inch as *increasing* clearance from 1.5 to 2.5–3 finger-widths, when a deeper seat necessarily *reduces* it.

Swapping the numbers alone would have left an incoherent argument, so the passages were rewritten to the correct model: at 6'4"/32" inseam the Gesture gives ~3 finger-widths — inside the Cornell guideline at its **shallow** end — and the Leap Plus's extra inch moves that toward ~2, carrying more of the thigh rather than freeing more space. The failure mode at this height is an under-supported thigh, not popliteal compression. The same inverted causality was corrected on `gesture-vs-leap-plus.astro`.

**RULE:** when correcting a measurement, re-derive the argument it supports. A number swap that leaves the reasoning inverted produces a page that is factually accurate and logically wrong.

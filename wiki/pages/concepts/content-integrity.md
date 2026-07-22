---
type: concept
last_updated: 2026-07-21
sources: [raw/audits/2026-07-21-full-seo-audit.md]
tags: [eeat, trust, fabrication, voice-rules, ftc, content-quality]
---

# Content Integrity

Tracking of false first-hand claims and cross-page factual drift. Established by the 2026-07-21 full SEO audit, which found that the May 2026 fabrication cleanup **corrected the Gesture review but never propagated to the pages that had copied it**.

## The governing constraint

Jackson has personally sat in **one chair: the Steelcase Gesture**. Every other chair — Aeron Size C, Leap Plus, Sihoo Doro S300, all budget chairs — is spec-and-community analysis only. See CLAUDE.md voice rules.

## 🔴 LIVE — `/about/` publishes a fabricated testing protocol

`src/pages/about.astro` L184, under H3 **"3. Extended daily use — minimum 3 weeks"**:

> "I use every primary review chair as my main seat for at least three weeks of normal daily use before writing a final evaluation."

The **same page** at L141 says:

> "Hands-on daily use: Steelcase Gesture (personal chair, 2+ years). All other chairs evaluated through manufacturer specifications... **not personal sit-testing**."

Also live on that page: measuring every chair "using a digital caliper and tape measure" (L163–167), pain-tracking across all chairs (L191–192), "reviews... grounded in physical measurements, extended real-world use" (L147–148), "When I test recline..." (L226).

**This is the E-E-A-T authority page, linked sitewide.** A rater reading top-to-bottom hits the fabricated protocol (§155–194) before the honest disclaimer buried in a bullet at §141. Verified live via curl 2026-07-21.

**Fix:** rewrite §"How I Evaluate Chairs" (L155–212) into two explicitly labeled tracks — "Hands-on: Steelcase Gesture" and "Spec + community analysis: everything else." Delete the "minimum 3 weeks" H3 and the caliper claim, or scope both to the Gesture by name.

## 🔴 LIVE — the 6'4" measurement contradiction

Two live pages give the same author, same body, same chair two irreconcilable measurements:

| Page | Inseam | Knee clearance | Verdict |
|---|---|---|---|
| `/review/gesture/` (corrected May 2026) | **32"** | **~3 finger-widths** | "not a borderline fit, a comfortable one" |
| `/office-chairs-for-6-foot-4/` (never updated) | **34"** | **1.5–2 finger-widths** | "right at the lower threshold of comfort" |

The stale figures survive in five places on the 6'4" page — **including inside FAQPage JSON-LD at line 49**, which is served directly to Google and AI engines. Lines: 49, 211, 214, 228, 326. Also L416 claims "first-hand fit notes at 6'4"" for a list that includes the Aeron and Leap Plus.

**`/review/gesture/` also contradicts itself.** Its Direct Answer capsule (L181) still reads *"At 6'4", seat depth is a borderline fit"* while the body says the opposite four times (L374, 416, 432, 459). **That capsule is exactly the block AI Overviews extract** — so the site risks self-contradicting inside a single AI Overview.

## 🔴 LIVE — the retracted "break-in period" fabrication propagated

The Gesture review explicitly retracted it (L126, L486: *"I felt a difference from the very first sit — there was no skeptical adjustment period"*). It survives as asserted fact on four other pages:

- `shoulder-pain-tall-people.astro:273` — *"Some of that was the break-in period on the chair itself."*
- `review/leap-plus.astro:116` — **in FAQ schema**: *"the Steelcase Gesture, which users typically describe as noticeably firm for the first 3–4 weeks"*
- `review/leap-plus.astro:282, :322` — *"the Gesture's 3–4 week break-in"*
- `gesture-vs-leap-plus.astro:277` — *"expect a 3–4 week break-in period"*

## 🔴 LIVE — invented measurement on an untested chair

`chairs/steelcase-leap-plus/index.astro:203–204`, under H3 **"Setup Notes at 6'4" (32" Inseam)"**:

> "Seat depth at 19.75" maximum **gives me a clean 2-finger clearance behind the knee**."

A body-contact measurement on a chair never sat in. Same failure class as the May 2026 Gesture fabrication. This page also has **no Byline** and no `author` schema.

**Fix:** reframe the H3 as "Spec Analysis at 6'4"" and convert to a derived figure ("a 19.75" maximum against a 19"–19.75" seated thigh length yields roughly 2 finger-widths by calculation"). Add a Byline.

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

---
type: concept
last_updated: 2026-09-01 (the AIO share of the diagnosis is now MEASURABLE and has never been measured — see [[aio-citation-tracking]])
sources: [raw/audits/2026-04-03-full-audit.md, raw/strategy/2026-04-03-action-plan.md, raw/audits/2026-04-22-serp-analysis.md, data/gsc/latest.json]
tags: [ctr, meta-descriptions, serp, high-priority]
---

# CTR Optimization

**The #1 bottleneck on the site.** 14,767 impressions, 35 clicks, 0.24% CTR as of May 10 (90-day). The root cause is structural SERP suppression for head terms; on editorial/review pages verdict-first meta rewrites are likely to help.

## ⚠ 2026-09-01 — THE AIO SHARE OF THIS DIAGNOSIS HAS NEVER BEEN OBSERVED

**Read before quoting the 80% figure below.** It comes from a one-off incognito
SERP check in April 2026 and a shape-based inference, and the whole GEO capsule
programme was built on it. Nothing has looked at a SERP since.

The pipeline's `aioSuspect` flag is inference and says so: `gsc-analyze.ts` sets it
from the SHAPE of a leak — good position, far fewer clicks than the position curve
predicts. That cannot distinguish an AI Overview from a product carousel, a PAA
stack, a video block, or a title that does not earn its impressions. **Four
problems, four different fixes, and the site has spent months building for one of
them.**

`scripts/aio-track.ts` now observes it weekly and includes a control group of
queries nobody suspects, so the rate has something to be high *against*. Built
2026-09-01, **zero observations so far** — do not cite it as evidence until at
least two runs agree. See [[aio-citation-tracking]].

The link-building paragraph further down still stands, and its conclusion was
acted on rather than reversed: `/chair-specs/` publishes the spec registry as a
citable CC BY 4.0 dataset, which is the $0 version of the $1,000–8,000 spend that
paragraph correctly declined. See [[chair-specs-dataset]].

---

## Revised Diagnosis (Apr 22 — Incognito SERP Audit)

Two distinct suppression mechanisms explain the 0% CTR:

**Mechanism 1 — AI Overviews (spec/informational queries where TCA ranks pos 7–10):**
- `herman miller aeron size c height range` (pos 9, 10 impr, 0 clicks) → confirmed AI Overview
- `steelcase gesture 360 armrests description` (pos 7.8, 4 impr, 0 clicks) → confirmed AI Overview
- Google answers these fully before organic results. Meta rewrites cannot fix this.

**Mechanism 2 — Shopping Carousels (money queries where TCA is buried pos 65–79):**
- All "best office chair for tall people" variants show a product shopping carousel above the fold
- Even pos 3 organic results appear below scroll. TCA at pos 65–79 is effectively invisible.

**Conclusion:** Verdict-first meta rewrites are not the primary lever. They may help marginally on queries that escape both suppressors, but they cannot fix structural SERP layout.

## CTR Status by Page (May 10 — from latest.json)

| Page | Impressions | Position | CTR | Actual Cause |
|------|------------|----------|-----|-------------|
| [[review-gesture]] | 2529 → **8415** | 8.2 → **8.0** | 0.12% → **0.12%** | **The May 7 verdict-first rewrite did nothing.** Impressions 3.3×'d, CTR did not move. Re-rewritten 2026-08-09 on a different thesis — see below |
| /knee-pain-seat-depth/ | 1925 | 8.6 | 0.16% | Meta rewrite test ran May 7 — awaiting data signal |
| /correct-chair-dimensions/ | 1658 | 16.1 | 0.18% | Low position — content depth is primary lever |
| [[aeron-tall-people]] | 1353 | 7.4 | 0.30% | Some clicks landing; meta rewrite ran May 7 |
| /review/leap-plus/ | 971 | 8.5 | 0.31% | Comparable to Gesture — editorial SERP, meta is actionable |
| [[aeron-vs-gesture]] | 385 | 8.5 | 0% | 0-click despite solid position — meta rewrite queued W19 |
| /best-office-chairs/ | 755 | 22.8 | 0% | Low position + shopping carousels — position is the fix |

## Verdict-first did not work on /review/gesture/ (2026-08-09)

The May 7 rewrite was verdict-first, lever #5 below. Three months and **8,415 impressions** later, CTR is **0.12% — unchanged**, at a position that also barely moved (8.2 → 8.0). The impression base tripled, so this is not a small-sample result any more.

**The read: verdict-first is table stakes, not differentiation.** Every aggregator on that SERP also leads with a verdict. A snippet that competes on the same axis as eight competitors cannot win on that axis; it has to compete on an axis they cannot enter.

The 2026-08-09 rewrite therefore leads with **ownership** — `I'm 6'4" and Use It Daily` in the title, a measured knee clearance and a pain outcome in the meta. Not a better verdict, a *different kind of claim*: the one thing on this SERP that a spec-scraper cannot fabricate. This is the site's only first-person-tested page, so this test cannot be replicated elsewhere — but if it moves CTR, it argues that **first-hand-evidence signals in the snippet** beat verdict phrasing on review SERPs, which changes what the remaining research-based pages should lead with (community data, ME spec analysis) instead of another verdict.

Baseline to beat: **0.12% at pos 8.0, 8,415 impressions.** Next GSC pull is the readout.

## What Can Actually Move CTR

1. **GEO optimization** — the #1 lever. Now integrated into `competitor-intelligence.ts` v2.1. Detects AIO suppression per page, generates citation capsules, writes to `reports/geo-optimize-tasks.md`. **See: [[geo-optimize-plan]].**
2. **SERP-aware title comparison** (upgrade to `audit.ts`) — before writing a meta rewrite, pull top-5 competitor titles on that SERP and match the winning pattern. Replaces generic verdict-first with SERP-specific optimization. Build time: 2–3 hours.
3. **PAA targeting** — every SERP has People Also Ask boxes. 40–60 word direct-answer sections on existing pages.
4. **Ranking lift on /review/gesture/** — pos 8.2 → pos 5 meaningfully increases CTR even without meta changes.
5. **Verdict-first meta rewrites on editorial pages** — 5 rewrites deployed May 7 (gesture, knee-pain, aeron-size-c, gesture-hub, leap-plus-tall-people). Awaiting CTR signal (14-day window). *Note: /best-office-chairs/ schema parse error was resolved May 7 — no longer an open blocker.*

## What NOT to Buy

No SEO agency or service fixes the AIO/carousel CTR problem cheaply:
- **Link building agencies**: Quality links cost $100–400 each, need 10–20 = $1,000–8,000 minimum. 12–18 month play, not 2026.
- **Fiverr SEO gigs**: No service can insert content into a Google AI Overview — that's purely a content structure problem.
- **Meta optimization services**: The workflow already does this; no agency outperforms what's built.

## What Verdict-First Meta Can Still Help

On queries that aren't suppressed by AI Overviews or shopping carousels (mostly branded/specific queries), verdict-first meta is still sound practice. But it's not the site's primary problem.

## Links

- [[geo-optimize-plan]] — full build spec for AIO suppression fix (Priority 1)
- [[meta-descriptions]] — implementation patterns
- [[aeron-tall-people]] — highest-impression page
- [[ai-citation-readiness]] — GEO score 76/100, citation capsules missing site-wide
- raw/audits/2026-04-22-serp-analysis.md — full incognito SERP audit
- raw/strategy/2026-05-11-ctr-revenue-analysis.md — revenue projection + CTR root cause analysis

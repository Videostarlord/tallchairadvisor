---
type: concept
name: systems-architecture-audit-2026-05-13
description: Systems-level architecture audit of the TCA autonomous SEO stack. Original score 5.5/10 (2026-05-13). All engineering items implemented. 1 item deferred (Batch API). Remaining open: 4 content pages (strategy agent task).
last_updated: 2026-05-15
---

# TCA Autonomous SEO Stack — Systems Architecture Audit

**Raw audit:** `raw/audits/2026-05-13-systems-architecture-audit.md`
**Audit date:** 2026-05-13 | **Implementation status verified:** 2026-05-15 (code audit, no wiki consulted)

---

## Overall Score: 5.5/10 (at time of audit)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Code quality / engineering rigor | 8/10 | Cache architectures, enforcement logic, wiki memory, AIO pipeline all well-built |
| Strategic intelligence | 4/10 | Can't discover new territory, no attribution, no competitive difficulty model |
| Business viability | 3/10 | ~$20-60/month API cost vs. cents/week in revenue |

**Path to 8/10:** upstream keyword research + fix attribution + 5 priority content pages + prompt caching. None require architectural rewrites.

---

## Core Problem (Unchanged)

**Mismatch between system sophistication and data scale.** 7 clicks/week, 3,231 weekly impressions at audit time. Entropy analysis, gravity scoring, velocity signals, and per-query CTR curves are statistically meaningless at this volume. This resolves only with traffic growth — no code fix applies.

---

## Implementation Status — All Audit Findings

### Priority 1 — Upstream Keyword Research
**STATUS: FULLY IMPLEMENTED 2026-05-15**

Scripts existed since post-audit. CI wiring completed 2026-05-15:
- `scripts/keyword-discovery.ts` — already in `keywords-monthly.yml`
- `scripts/keyword-gap-discovery.ts` — added to `keywords-monthly.yml` as a second step after discovery (same DATAFORSEO env vars + sandbox toggle). Monthly cadence is correct — weekly DataForSEO spend would be uneconomical at current scale.
- Both scripts run on the 1st of each month (scheduled) or via `workflow_dispatch` with `sandbox=true` default.

---

### Priority 2 — Fix Attribution Tracker
**STATUS: INFRASTRUCTURE COMPLETE — file not yet populated**

`scripts/agents/wiki-utils.ts` (lines 148–299) implements the full attribution pipeline:
- `appendIntervention()` — writes to `data/interventions.jsonl` at fix-time (interventionType, page, slug, appliedDate, targetMetric, beforeMetric)
- `reconcileInterventions()` — called from `audit.ts` line 62. Matches entries against GSC history snapshots ≥14 days post-fix, computes deltaPercent and confidence (none/low/medium/high using arithmetic, not LLM)
- `loadRecentOutcomes()` — reads 90-day window
- `formatOutcomesForPrompt()` — renders structured table injected into strategy.ts prompt

`data/interventions.jsonl` does not yet exist — no fixes have run since this infrastructure was added. The file will be created when execute-fixes.ts next successfully applies a fix. The machinery is correct and wired end-to-end.

---

### Priority 3 — Decouple Data Commits from Code Commits
**STATUS: IMPLEMENTED 2026-05-15**

`[skip cd]` added to git commit messages in Monday, Tuesday, Wednesday, and keywords-monthly workflows. Cloudflare Pages skips builds on these data-only commits. Saturday's push to main remains intentional (the deploy). Thursday/Friday push to staging, not main, so no Cloudflare trigger applies.

---

### Priority 4 — Niche Expansion Topic Injection
**STATUS: IMPLEMENTED**

`data/content-roadmap.json` exists with 4 entries (shoulder-pain priority 1, standing-desk-height priority 2, sihoo-doro-s300 priority 3, best-chairs-under-500 priority 4 — all `status: "pending"`).

`scripts/agents/strategy.ts` reads it at lines 224–234, filters to `status === 'pending'`, sorts by priority, takes top 2, and injects them into the NEW CONTENT section of the plan. Manual priority queue is now visible to the automation.

---

### Priority 5 — Structured Outcome Tracking (replaces prose synthesis)
**STATUS: IMPLEMENTED**

`interventions.jsonl` schema with deterministic confidence scoring replaces narrative what-works/what-failed as the primary outcome signal. Strategy.ts includes a structured INTERVENTION OUTCOMES section with a reading guide explaining sign conventions, confidence thresholds, and what delta directions mean. The prose synthesis pages remain but are secondary context.

---

### Severity 1 — Statistical Noise at Current Volume
**STATUS: OPEN — not a code problem**

Entropy analysis, hub candidate detection, and gravity scoring still run on sub-significance data. No code change applies. Resolves only with traffic growth to 30,000+ weekly impressions.

---

### Severity 2 — No Content Refresh / Decay Detection
**STATUS: IMPLEMENTED — dormant until July 2026**

`detectDecayingPages()` in `gsc-analyze.ts` (line 832+) detects 8+ consecutive weeks of position decline. `decayAlerts` written to `data/gsc/analysis.json`. Strategy.ts reads it (line 239) and injects into the DECAYING PAGES prompt section (line 427). Decay-flagged pages bypass the 14-day cooldown. Requires 9+ weekly history snapshots — activates approximately July 2026.

---

### Severity 2 — Internal Linking Not Implemented
**STATUS: IMPLEMENTED**

`gsc-analyze.ts` lines 1327–1352 scan all `.astro` files, build an inbound link map, and write underlinked high-impression pages (threshold: 3 inbound links) to `data/gsc/link-audit.json`. Strategy.ts reads this at lines 241–246 and injects `linkGaps` into the INTERNAL LINK GAPS prompt section, which generates FIX tasks.

---

### Severity 2 — Strategy Agent Plans from Unstable Signals
**STATUS: IMPLEMENTED 2026-05-15**

`computeIntentWeightAdjustments()` added to `scripts/agents/wiki-utils.ts`. Reads `data/interventions.jsonl`, groups reconciled CTR entries (medium/high confidence) by intent type, computes average delta, and returns multipliers (capped 0.5x–2.0x). `gsc-analyze.ts` loads adjustments at startup and applies them in `classifyIntent()`. `execute-fixes.ts` now stores `intentType` on every intervention entry (looked up from `latest.json` pageQueries). Requires ≥3 reconciled entries per intent type before any adjustment fires — no-op until data accumulates. The fundamental low-volume noise problem is unaddressed (see Severity 1).

---

### Severity 3 — No Cross-Day Error Propagation / DAG Enforcement
**STATUS: IMPLEMENTED 2026-05-15**

Pipeline-status check added to `thursday.yml` and `friday.yml` (same guard logic as tuesday.yml/wednesday.yml). Thursday reads `data/pipeline-status.json` directly (checks out main). Friday fetches it from `origin/main` via `git show origin/main:data/pipeline-status.json > /tmp/pipeline-status.json` since Friday runs on the staging branch. Both exit 1 with a GitHub Actions error annotation if Monday's status is not "success".

---

### Severity 3 — Git Used as Event Bus
**STATUS: IMPLEMENTED 2026-05-15**

Thursday and Friday workflows now produce two commits per run:
1. **Code commit** (`src/` only) — `"fix: Thursday SEO fixes…"` / `"content: New pages…"` — intentional, no skip tag
2. **Data commit** (`reports/`, `raw/`, `wiki/`) — `"[skip cd] data: Thursday wiki + reports…"` — skips Cloudflare build

Friday failure path (no content written) also tagged `[skip cd]` since it contains no `.astro` changes.

Monday/Tuesday/Wednesday already had `[skip cd]`. Saturday's deploy commit is data-only but intentionally triggers Cloudflare (the production deploy) — unchanged.

---

### Severity 3 — AIO Capsule Injection Heading-Text-Dependent
**STATUS: PARTIALLY FIXED**

`applyCapsuleToPage()` in `competitor-intelligence.ts` lines 699–704 adds a first-H2 fallback: when the target heading is component-rendered (not raw HTML), it inserts after the first `<h2>` in the file instead of returning heading-not-found. The sentinel comment `<!-- tca-aio-capsule -->` prevents double-insertion on future runs.

**Fallback path added 2026-05-15:** `generateFallbackCapsule()` added to `scripts/competitor-intelligence.ts`. When `aio.passageText.length < 50`, instead of immediately marking `pending-passage-text`, the script now attempts a Haiku call using TCA's own page content to synthesize a GEO capsule. On success, the task enters the normal `generated` → `applied` flow (status logged as `fallback-applied`). The 3 stuck pages will resolve on the next competitor-intelligence run. If Haiku fails to produce a valid capsule, the entry still falls through to `pending-passage-text`.

---

### Severity 3 — Voice Constraint Regex Under-Specified
**STATUS: IMPLEMENTED 2026-05-15**

6 brand-anchor-free patterns added to `NON_GESTURE_VOICE_PATTERNS` in `verify-deploy.ts`. New patterns catch: "the chair impressed me", "I've found it superior/comfortable/excellent", "after sitting/using in/it/the chair", "I've been using this/it daily/for", "my experience with this/the chair", "I noticed/found/felt while/when sitting/using". Applied to non-Gesture pages only (same exclusion logic unchanged).

---

### Severity 3 — Quality Gate Not Calibrated to Competitive Depth
**STATUS: IMPLEMENTED 2026-05-15**

`scoreCompetitiveDepth(slug, pageContent, root)` added to `execute-content.ts`. Called after the structural 80/100 gate. Reads `data/competitors/intelligence.json`, matches by `tcaPage === normalizedSlug`, picks the editorial competitor with the most content. Haiku call scores TCA draft 0–100 on section coverage, spec depth, and format edges vs. competitor. Ratio < 70 triggers a single re-roll with missing sections injected via `generatePage()`. Re-roll uses original if Astro validation fails. Gate skips gracefully when no competitor data exists for the slug. Threshold 70 is structural (not traffic-derived) — appropriate at current scale per [[statistical-confidence-policy]].

---

## Prompt Caching Status

**Audit claim:** "No prompt caching used anywhere in the codebase."
**Current status (verified 2026-05-15):**

| Agent | Cache Status |
|-------|-------------|
| `audit.ts` | ✅ `cache_control: { type: 'ephemeral' }` added (line 103) |
| `strategy.ts` | ✅ `cache_control: { type: 'ephemeral' }` on system prompt (line 363) — covers thesis, what-works, what-failed, outcomes, decisions, concept context |
| `execute-fixes.ts` | ✅ DONE 2026-05-15 — all 3 call sites (meta, title, full-file) converted to array format with cache_control |
| `verify-deploy.ts` | ✅ DONE 2026-05-15 — system prompt converted to array format with `cache_control: { type: 'ephemeral' }` |
| `competitor-intelligence.ts` | ✅ DONE 2026-05-15 — analyzeGaps() static preamble extracted to system field; capsule call also has static system prompt. Cache hits across loop iterations. |

---

## Data Pipeline — Module 6 Status

**Audit claim:** "Module 6 is commented out — dead code advertising a missing feature."
**Current status:** Fixed. `gsc-analyze.ts` line 766 shows Module 6 is now "Content Gap vs Competitors," implemented via `detectContentGaps()` called at line 1235. Results in `analysis.json` and injected into strategy.ts prompt at line 402.

---

## Saturday Regression Check — Baseline Fix

**Audit claim:** "Compares HEAD~1 — misses the actual pre-week baseline."
**Current status:** Fixed. `getWeekStartBaseline()` in `verify-deploy.ts` (lines 194–224) finds the oldest commit since last Monday, walks back one parent to get the true pre-week baseline. Edge case documented: Sunday re-run returns prior-week Monday (8 days ago) — acceptable.

---

## Content Roadmap Status (Priority Content Queue)

Items from CLAUDE.md that were invisible to automation — now tracked in `data/content-roadmap.json`:

| Priority | Title | Status |
|----------|-------|--------|
| 1 | Shoulder Pain from Office Chair (Tall People) | pending |
| 2 | Standing Desk Height for Tall People | pending |
| 3 | Sihoo Doro S300 Review for Tall People | pending |
| 4 | Best Office Chairs Under $500 for Tall People | pending |

Strategy agent pulls top 2 pending topics each week as NEW CONTENT candidates.

---

## Scalability Ceilings (Unchanged)

| Component | Current | Ceiling |
|-----------|---------|---------|
| Wiki context injection | ~40 pages, flat string concat | ~80 pages before token overflow |
| Competitor intelligence crawl | 8 pages × 3 queries | ~30 pages before Firecrawl budget |
| GSC index monitor | ~20 pages, ~20s | ~100 pages hits daily GSC quota |
| Content generation | variable | 4+ pages/week, no per-run cost tracking |

---

## Monetization Gaps (Unchanged)

- No affiliate conversion data from DataForSEO or GA4 aggregate (GA4 click events exist per-click but not aggregated)
- No CTA A/B testing — button text/placement set once at generation, never revisited
- No commission rate weighting — $1,500 Gesture page treated identically to $200 budget chair
- Affiliate link validator (`verify-deploy.ts` line 69) scans only `src/**/*.astro` — misses links inside imported components

---

## Open Items Priority Ranked (as of 2026-05-15)

| Priority | Item | Effort | Status |
|----------|------|--------|--------|
| 1 | Wire keyword-discovery.ts into Monday's GitHub Actions workflow | Low | ✅ DONE — added to keywords-monthly.yml 2026-05-15 |
| 2 | Add `cache_control: { type: 'ephemeral' }` to execute-fixes.ts system prompt | Low | ✅ DONE — all 3 call sites 2026-05-15 |
| 3 | Write the 4 content-roadmap.json entries (let strategy agent assign them) | Medium | ❌ OPEN — content task, strategy agent's job |
| 4 | Decouple data commits from code commits | Medium | ✅ DONE — Thu/Fri split into code commit + [skip cd] data commit 2026-05-15 |
| 5 | Cross-day DAG error propagation (failed Monday should block Wednesday) | Medium | ✅ DONE — thursday.yml + friday.yml checks added 2026-05-15 |
| 6 | Add cache_control to competitor-intelligence.ts | Low | ✅ DONE — analyzeGaps refactored + capsule call 2026-05-15 |
| 7 | Fix voice regex — remove anchor-keyword dependency | Low | ✅ DONE — 6 brand-anchor-free patterns added 2026-05-15 |
| 8 | Competitive-depth quality gate in execute-content.ts | Low-Med | ✅ DONE — scoreCompetitiveDepth() + re-roll 2026-05-15 |
| 9 | Explicit differentiation asset injection in content generation prompt | Low | ✅ DONE — buildDifferentiationAssets() 2026-05-15 |
| 10 | Anthropic Batch for audit.ts and strategy.ts | Low | ⏸ DEFERRED — not a one-liner; needs submit+poll split |

---

## Claude Assessment — 2026-05-15

**Context:** This assessment was written after a full-context code audit, wiki review, and comparison with an external Gemini evaluation that had minimal system context.

### System State (Honest Read)

The architecture is genuinely well-built relative to where it was 6 weeks ago. The 14-bug fix cycle, the GSC intelligence layer, competitor-intelligence.ts, and the enforcement hardening have turned a fragile pipeline into a defensible one. The remaining open items are incremental, not structural.

The ceiling right now is not engineering — it is content volume and affiliate revenue. The system is running at ~$20–60/month API cost against roughly $6–20/month revenue. That inversion won't flip through more pipeline work. It flips when C1 (Gesture review depth expansion) ships and starts compounding. Every hour on infrastructure at this stage is an opportunity cost against that.

### What Gemini Got Right (With Context)

**Algorithmic mirroring is a real risk.** competitor-intelligence.ts feeds SerpAPI → Firecrawl → strategy in a closed loop. If TCA's content converges toward what's ranking, it loses its differentiation moat over time. TCA's moat is specifically: (1) ME biomechanics framing — competitors don't offer spec analysis backed by mechanical engineering; (2) 6'4" first-hand anthropometric data; (3) Gesture first-person testing. None of these are explicitly scored in the quality gate. The 80/100 blog-analyze gate measures structural completeness — not whether the generated page outputs something a competitor could not write.

**The validation layer gap is real but smaller than Gemini framed it.** The voice check, overwrite guard, and quality gate already form a partial validation layer. What's missing is competitive-depth scoring — a second Haiku call after generation that loads the #1 competitor page from intelligence.json for that slug and scores TCA's draft on differential value (sections TCA has that competitor lacks; specs covered; format edges like tables, calculators, measurements). A page that scores 80/100 structurally but covers only 60% of what the #1 competitor covers should not ship. This is item 8 above.

**The "Quality Auditor before deploy" concept Gemini prescribed** — this translates concretely to: in execute-content.ts, after the existing Haiku quality gate call, add a second call that ingests the competitor content for that keyword from intelligence.json and returns a competitive depth ratio (0–100). If ratio < 70, inject the missing sections as a re-roll prompt rather than failing silently. Low effort, high defense against mirroring.

### What Gemini Got Wrong

**"Integrate a proprietary knowledge base"** — already exists. analysis.json, interventions.jsonl, content-roadmap.json, and the wiki are TCA's proprietary knowledge layer. The DataForSEO keyword discovery scripts give it upstream coverage competitors can't reverse-engineer from the SERP.

**"Behavioral intelligence UX loop"** — the GSC intelligence layer (detectCTRLeaks, AIO pattern detection, link audit, decay detection) is exactly this loop. What's absent is Clarity scroll-depth correlation, which is a nice-to-have, not a structural gap.

**"Multi-site site_identity.yaml"** — valid architecture for a future portfolio, wrong layer for TCA right now. Belongs in niche-incubator, not here.

### Three New Items Added to Open Items Table

**Item 8 — Competitive-depth quality gate:** ✅ IMPLEMENTED 2026-05-15. `scoreCompetitiveDepth()` added to execute-content.ts. Haiku call after structural 80/100 gate. Ratio < 70 triggers single re-roll with missing sections injected. Graceful skip when no intelligence.json entry exists for slug.

**Item 9 — Differentiation asset injection:** ✅ IMPLEMENTED 2026-05-15. `buildDifferentiationAssets(slug, root)` added to execute-content.ts. Injects ME biomechanics framing, 6'4" anthropometric anchor (seat height ≥21", seat depth ≥17", lumbar ≥20", armrests ≥28"), Gesture first-person voice authorization, and Reddit owner signals (reads data/reddit/published/<chairId>.json). Appended to system prompt in generatePage().

**Item 10 — Anthropic Batch for audit.ts and strategy.ts:** ⏸ DEFERRED. The audit called this a "one-line client change" but Batch API is async — results arrive via poll, not in the same call. audit.ts and strategy.ts write results immediately for downstream workflow steps. Switching requires splitting workflows into submit + retrieve steps (Medium effort). Deferred until prompt caching savings (items 1/2/6) are measured and cost still exceeds $60/month.

---

## Sustainability Risks (Unchanged)

1. **API cost exceeds affiliate revenue** — ~$20-60/month vs. cents/week. Prompt caching reduces this; Anthropic Batch (see [[runpod-migration-proposal]]) is the next cost-reduction path.
2. **AIO expansion** continues suppressing CTR on review/comparison queries.
3. **Single-author E-E-A-T ceiling** — Gesture review is the only first-person differentiating asset. Research-based pages compete on depth, not experience.

---

## Related Pages

- [[workflow-system-reference]] — current operational setup
- [[gsc-intelligence-system]] — GSC pipeline architecture
- [[gsc-performance]] — current traffic numbers
- [[keyword-opportunities]] — DataForSEO keyword discovery output
- [[dataforseo-reference]] — API reference for keyword discovery scripts
- [[affiliate-compliance]] — conversion gaps
- [[thesis]] — strategic priorities
- [[decisions-log]] — action log

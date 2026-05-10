# TCA Master Audit — Combined & Adjudicated
**Synthesized from:** CLAUDE-SONNET-4-6 (11 files) + CODEX (12 files)
**Adjudicator:** CLAUDE-SONNET-4-6 | **Date:** 2026-05-09

---

## System Design Constraints — Read Before Evaluating

**Jackson will not write any content manually.** All content production — including /review/gesture/, the Leap Plus reframe, and any new pages — must be produced by agents. This is a hard constraint, not a gap to close.

**The system is intentionally designed with no human in the loop.** Fully autonomous Mon–Sat execution without manual review gates is the explicit design goal, not an oversight. Both original auditors flagged "no human review before execution" as a risk; this document acknowledges the risk but does not recommend adding manual gates. The correct response to automation risk is better data quality, better validation, and better guardrails — not human checkpoints.

Any recommendation in this document that says "Jackson writes this" or "add a manual review gate" is **overridden by these constraints** and should be read as "the agent system must solve this."

---

## Overall Verdict

**Adjusted overall score: 6/10** (Claude said 7, Codex said 4)

The niche thesis is real and correct. The architecture pattern — raw/wiki/data separation, GSC-driven intelligence, week-over-week agent memory — is the right approach. But both auditors overstated their position. Claude's 7/10 is too generous because it missed real data integrity problems. Codex's 4/10 is too harsh because it recommends gutting a system that has a fixable bug problem, not a design problem. The truth: a well-architected system with real execution brittleness, two critical bugs, and a data layer that is weaker than the intelligence layer built on top of it.

---

## High Confidence — Both Auditors Agree

These findings have full agreement and should be treated as certain.

### 1. Friday force-push bug (CRITICAL — fix before next Friday)
Both auditors flagged this independently as the highest-risk item in the system.

`friday.yml`: when `CONTENT_WRITTEN != 'true'`, the workflow runs `git push origin HEAD:main --force`. This can overwrite main with whatever state the CI runner has — potentially stale or partial state.

**Fix:** Change `git push origin HEAD:main --force || true` to `git push origin HEAD:staging || true`

### 2. siteTrend and deviceIntelligence are null
Both auditors confirmed. Codex added the specific diagnosis Claude missed: **the raw `data/gsc/latest.json` file does not contain `deviceSplit` or `dailyTrend` keys at all.** The code expects them; the file doesn't have them. Code and data are describing different pipeline generations. This is a format mismatch, not just a threshold issue.

**Fix:** Re-run `npm run gsc:pull` and verify what keys are actually written. If the API call is failing silently for those dimensions, fix the API call. If the arrays exist but are too small, lower the minimum threshold from 14 to 7 in `gsc-analyze.ts`.

### 3. Competitor intelligence is theater
Both: 3/10. Claude's metaphor ("page diffing") and Codex's ("metadata-only, low-signal") agree. Fetching 5 competitor HTML files and asking Claude "what are our top 3 gaps?" produces generic recommendations that look authoritative and aren't.

**Fix:** Either (a) integrate SerpAPI/ValueSERP for real keyword ranking data, or (b) reduce competitor-monitor to monthly cadence and clearly mark its output as "supporting evidence, not intelligence."

### 4. No human review gate before Thursday execution
Both auditors flagged this as a risk. **However, fully autonomous execution is an explicit design constraint of this system.** Manual review gates are not an acceptable fix.

The correct response is: strengthen the strategy.ts plan validation logic so the plan format contract is machine-verifiable before execution, and improve the data quality feeding into it so bad plans are less likely to be generated. The risk is real — the fix must be automated.

### 5. Voice constraint enforcement is too narrow
Both flagged. The 3 regex patterns in `verify-deploy.ts` miss natural first-person phrasing. "I tried out the Aeron" passes all three.

**Fix:** Expand patterns (see Claude's ACTION_PLAN for specific regex).

### 6. Reddit data is stale and disconnected
Both auditors: last run March 2026, ~7 weeks stale. Additionally, the published Reddit summaries are NOT fed to the strategy or content agents — they only appear in the RedditInsights component. This means the actual community research data is unused by the intelligence pipeline.

**Fix:** Add `npm run reddit:all` to Monday workflow. Also inject published Reddit JSON into strategy.ts context.

### 7. GSC wiki concept page sprawl
Both auditors flagged 3–7 overlapping GSC concept pages in `wiki/pages/concepts/`. Agents reading multiple stale or overlapping pages get confused context.

**Fix:** Merge into one auto-updated `gsc-current.md` and one static `gsc-architecture.md`. Delete the rest.

### 8. Content quality gate is structural, not semantic
Both flagged. A page passes 80/100 by having the right HTML structure, keyword in H1, 4 FAQs, 2 affiliate links, 3 internal links — regardless of whether the content is accurate, on-voice, or E-E-A-T genuine. Haiku with 200 max_tokens cannot evaluate substance.

---

## Where I Side With Codex Over Claude

These are findings Codex caught that Claude missed or understated.

### 9. Smart quotes in execute-fixes.ts (CRITICAL — check before next Thursday)
Codex flagged literal Unicode smart quotes (`"` / `"`) in executable TypeScript code at `scripts/agents/execute-fixes.ts` lines 64–67. Claude missed this entirely.

Smart quotes in JavaScript/TypeScript strings break the code. If this is confirmed, the Thursday fix executor is currently broken or producing wrong output silently.

**Action:** Open the file, inspect lines 60–70 for Unicode quote characters, replace with ASCII double quotes.

### 10. URL canonical pollution in GSC analysis
Codex identified that `data/gsc/latest.json` and `data/gsc/analysis.json` contain both slash and no-slash variants of the same URLs:
- `/office-chairs-for-tall-people/` AND `/office-chairs-for-tall-people`
- `/review/gesture/` AND `/review/gesture`
- `/aeron-vs-gesture/` AND `/aeron-vs-gesture`

Claude missed this. These duplicates create fake cannibalization, split opportunity scoring, and inflate CTR leak scores by dividing impressions across two "pages" that are actually one. This is a data integrity issue that corrupts everything downstream.

**Fix:** Add canonical URL normalization (always enforce trailing slash) in `gsc-analyze.ts` before any scoring logic runs.

### 11. Raw pull and analysis.json are out of sync
Codex caught this; Claude missed it. `data/gsc/latest.json` is dated May 4, 2026. `data/gsc/analysis.json` is dated May 10, 2026. The analysis was re-run without a fresh pull — meaning the intelligence layer looks current but reasons over 6-day-old data.

**Fix:** Add a freshness guard in `gsc-analyze.ts`: if `latest.json` is more than 72 hours old, warn and log before generating new analysis.

### 12. Relative canonical on author page
Codex confirmed via live site inspection. `src/pages/author/jackson-christopher/index.astro` passes `canonical="/about/"` — a relative URL. The Layout.astro normally resolves canonicals to absolute URLs, but when an explicit prop is passed, the absolute resolution is bypassed. The live page renders `<link rel="canonical" href="/about/">` — a relative canonical, which is technically invalid.

Additionally: the author page is simultaneously `noindex`, canonicalized to `/about/`, AND included in the live sitemap. Three contradictory signals on one URL.

**Fix:** Remove author page from sitemap (`astro.config.mjs`). Fix the canonical to be absolute or remove it and let Layout.astro handle it.

### 13. Freshness signal inconsistency across key pages
Codex audited actual page files and found multi-signal drift on `best-office-chairs.astro`:
- Visible text: `Last reviewed: March 2026`
- `Byline updatedDate="2026-03-17"`
- Schema `dateModified`: `2026-05-07`
- Sitemap `lastmod`: `2026-05-07`

Four different dates for one page. Claude flagged CLAUDE.md staleness but not this per-page metadata inconsistency.

**Fix:** Establish a single source of truth. When `pageLastmod` is updated in `astro.config.mjs`, also update the `Byline updatedDate` prop and the schema `dateModified` on the same page. These should always match.

### 14. Size-guide page has no inbound links
Codex confirmed via site graph analysis: `/chairs/herman-miller-aeron/size-guide/` exists in the sitemap, has no `lastmod`, and receives zero internal links from other pages (rg search found only self-references). This is orphaned content.

Claude mentioned the sub-page architecture is working in general but didn't audit the size-guide specifically.

**Fix:** Either add inbound links from `/review/aeron-size-c/` and the aeron chair page, or noindex it until it's properly integrated.

### 15. L3/L5 intent overlap: /office-chairs-for-tall-people/ vs /best-office-chairs/
Codex explicitly identified that both pages target similar buyer intent and route into the same product set. They're not the same query but the page roles are blurry. Claude mentioned `/office-chairs-for-tall-people/` being buried at pos 24.9 but didn't diagnose the overlap with `/best-office-chairs/`.

**Fix:**
- `/office-chairs-for-tall-people/`: Reposition as L2/L3 fit framework (measurement system, height-bracket logic, lighter product density)
- `/best-office-chairs/`: Own the L5 shortlist (rankings, purchase intent, comparison table)

### 16. SESSION-SUMMARY.md and MANUAL-TODOS.md are stale and misleading
Codex caught that `SESSION-SUMMARY.md` describes GA4 as hardcoded in Layout.astro, but the current file uses `PUBLIC_GA_MEASUREMENT_ID`. `MANUAL-TODOS.md` says llms.txt still needs to be added, but `public/llms.txt` already exists. These files are near the operational root and look authoritative.

Claude caught that CLAUDE.md lists "Write /shoulder-pain-tall-people/" as a to-do but the page already exists. Same category of stale documentation.

**Fix:** Archive `SESSION-SUMMARY.md` and `MANUAL-TODOS.md` to `raw/misc/`. Update CLAUDE.md to mark completed items as done.

---

## Where I Side With Claude Over Codex

These are findings where Claude's assessment is more accurate or more actionable.

### 17. The Cornell cluster is the highest-yield click opportunity
Claude identified this specifically: `/knee-pain-seat-depth/` has 165 impressions at avg pos 8 on "cornell ergonomics chair seat depth" queries, all at 0% CTR. The title "Seat Depth & Knee Pain: The Fix for Tall People" doesn't match the searcher intent.

Codex didn't identify specific CTR opportunities at this level of precision. Claude's instruction — change title to include "Cornell Ergonomics Rule," add a verdict box with the exact rule text — is correct and actionable.

**Estimated yield:** 3–8 additional clicks/week on a confirmed impression cluster. Highest ROI of any single edit on the site.

### 18. The automation layer should be fixed, not gutted
Codex recommends deleting auto-edit from index-monitor.ts and making execute-fixes and execute-content "manual approval only." This overcorrects — and is incompatible with the system's explicit no-human-in-the-loop design. The Friday force-push is a specific bug. The smart quotes in execute-fixes are a specific bug. These are fixable without demolishing the pipeline.

Claude's "keep + fix" approach is correct. The exception where Codex is right: index-monitor's auto-edit path should be guarded heavily (voice check before write, no full-file rewrites). Making execute-content a "draft generator only" would eliminate the system's core purpose. The answer is better guardrails, not a human gate.

### 19. The cooldown system is well-designed
Claude gave this 9/10. Codex barely mentions it. The 7-day (critical) / 14-day (others) edit cooldown with bypass for technical fixes is a genuine, non-obvious safety design that prevents thrashing pages on noisy signals. This is one of the better-engineered components.

### 20. /aeron-vs-leap-plus/ is working — don't touch it
Claude explicitly flagged this: 2.15% CTR, best CTR on site. Codex didn't mention it. Leave it alone.

### 21. The Gesture review is the highest-leverage content investment
Both auditors recommend first-person depth expansion: 3,000+ words with exact dimensions experienced at 6'4", lumbar placement for tall spines, before/after back/shoulder pain data. **Jackson will not write this manually.** The agent must produce this using the Gesture-specific first-person voice rules, the published Reddit owner insights, and manufacturer spec data. The CLAUDE.md voice constraint (first-person testing voice is permitted on Gesture pages) allows this. The content quality gate must be calibrated to actually evaluate substance for this page, not just structure.

---

## Adjusted Component Scores

| Component | Claude | Codex | Adjusted | Key Reason for Adjustment |
|-----------|--------|-------|----------|--------------------------|
| gsc-pull.ts | 8 | 5 | **6** | Codex found no pagination, canonical pollution, no completeness guard — Claude missed all three |
| gsc-analyze.ts | 9 | 4 | **6** | Knee brace smoking gun + URL canonical pollution = real architecture flaw, not just threshold tuning. But rewrite is too harsh — augment with normalization + junk filter |
| audit.ts | 8 | 6 | **7** | Claude's assessment mostly right; stale input concern valid |
| strategy.ts | 9 | 8 | **8** | Both agree: high value, format validation weak, needs human gate |
| execute-fixes.ts | 8 | 6 | **5** | Smart quotes bug at lines 64-67 (Codex) + full-file rewrite risk (both) = current reliability unknown |
| execute-content.ts | 8 | 5 | **5** | Force-push bug (CRITICAL) + shallow quality gate. Architecture is right; bugs must be fixed before score rises |
| competitor-monitor.ts | 3 | 4 | **3** | Both agree: low signal, theater output |
| index-monitor.ts | 7 | 3 | **5** | Auto-edit before strategy cycle is a real design flaw; Codex overcorrects by saying delete; right answer is guard heavily |
| verify-deploy.ts | 8 | 7 | **8** | Agreement; expand voice patterns |
| wiki system | 8 | 5 | **6** | Codex found more concept sprawl than Claude counted; both agree on direction |
| Reddit pipeline | 6 | 5 | **6** | Agreement: keep, schedule, inject into agent context |
| Content quality gate | 6 | — | **5** | Structure over substance is a confirmed problem |
| Voice constraint system | 6 | — | **5** | Too narrow; 3 patterns miss natural phrasing |
| Cooldown system | 9 | — | **9** | Well-designed, keep as-is |
| Site architecture (L0–L5) | 7 | 6 | **6** | Codex found real L3/L5 overlap Claude missed |

---

## Adjusted Overall System Scores

| Category | Claude | Codex | Adjusted | Notes |
|----------|--------|-------|----------|-------|
| Strategic clarity | 8 | 6 | **7** | Niche is right; content voice rules are exceptional |
| Technical architecture | 8 | 5 | **6** | Good pattern; real execution brittleness |
| Agent reliability | 7 | 3 | **5** | Smart quotes bug + force-push bug + no human gate = not reliable right now |
| SEO quality | 7 | 6 | **6** | Author page issues, freshness drift, L3/L5 overlap found by Codex |
| Data intelligence | 7 | 4 | **5** | URL pollution + out-of-sync pull/analysis + null modules = real data problems |
| Content quality | 7 | 6 | **6** | Review pages are genuinely good; agent content has structural but not semantic quality |
| Monetization readiness | 5 | 5 | **5** | One commission, correct pattern, no click attribution |
| Scalability | 7 | 3 | **5** | Row caps + canonical pollution + doc sprawl = real scalability ceiling |
| Risk control | 6 | 2 | **4** | Force-push + smart quotes + no human gate = high operational risk right now |
| **Overall system quality** | **7** | **4** | **6** | Good architecture, fixable bugs, real data layer debt |

---

## Priority Action Plan (Synthesized)

Ordered by: (1) risk elimination, (2) data integrity, (3) revenue impact, (4) simplification.

### Week 1 — Fix Before Next Automated Run

| # | Action | File | Effort |
|---|--------|------|--------|
| F1 | Patch Friday force-push bug | `.github/workflows/friday.yml` | 5 min |
| F2 | Inspect execute-fixes.ts lines 64-67 for smart quotes | `scripts/agents/execute-fixes.ts` | 15 min |
| F3 | Strengthen strategy.ts plan output validation (machine-verifiable before execution) | `scripts/agents/strategy.ts` | 1–2 hrs |
| F4 | Check what keys latest.json actually contains (deviceSplit, dailyTrend) | `data/gsc/latest.json` | 10 min |

### Week 1 — High-Yield SEO (Do Manually, Don't Wait for Agent)

| # | Action | File | Effort |
|---|--------|------|--------|
| S1 | Cornell cluster fix: title + H1 + verdict box | `src/pages/knee-pain-seat-depth.astro` | 30 min |
| S2 | Fix author page: remove from sitemap + fix canonical | `astro.config.mjs` + author page | 20 min |
| S3 | Fix freshness drift on 2-3 key pages | `best-office-chairs.astro` + `pageLastmod` in astro.config.mjs | 30 min |

### Week 2 — Data Integrity

| # | Action | File | Effort |
|---|--------|------|--------|
| D1 | Add URL canonical normalization (trailing slash) before GSC analysis scoring | `scripts/gsc-analyze.ts` | 2–3 hrs |
| D2 | Add freshness guard to gsc-pull.ts (don't overwrite with stale/partial data) | `scripts/gsc-pull.ts` | 1 hr |
| D3 | Lower siteTrend threshold from 14 to 7 days | `scripts/gsc-analyze.ts` line 369 | 5 min |
| D4 | Add junk query filter (entity mismatch suppression) to CTR leak detector | `scripts/gsc-analyze.ts` | 2 hrs |

### Week 2 — Agent Safety

| # | Action | File | Effort |
|---|--------|------|--------|
| A1 | Add voice check to index-monitor.ts fix output before writing | `scripts/agents/index-monitor.ts` | 1 hr |
| A2 | Expand voice violation patterns in verify-deploy.ts | `scripts/agents/verify-deploy.ts` | 30 min |
| A3 | Archive failed drafts before discarding (to raw/content-rejected/) | `scripts/agents/execute-content.ts` | 30 min |

### Week 3 — Content Investment

All content is agent-produced. No manual writing.

| # | Action | Effort |
|---|--------|--------|
| C1 | Agent writes /review/gesture/ depth expansion (3,000+ words, first-person Gesture voice, Reddit data injected, spec sourced) — calibrate quality gate to evaluate substance not just structure | 2–3 hrs agent time |
| C2 | Agent rewrites /review/leap-plus/ opening with "I almost bought this" narrative frame | 1 hr agent time |
| C3 | Agent rewrites /office-chairs-for-tall-people/ as fit framework (lighter product density) and /best-office-chairs/ as shortlist | 2 hrs agent time |
| C4 | Add internal links to /chairs/herman-miller-aeron/size-guide/ from review and aeron hub pages, or noindex it | 30 min |

### Month 2 — System Simplification

| # | Action |
|---|--------|
| M1 | Merge overlapping GSC concept wiki pages into 2 (auto-updated + static architecture) |
| M2 | Archive SESSION-SUMMARY.md and MANUAL-TODOS.md |
| M3 | Disable competitor-monitor.ts — replaced entirely by SERP API + Firecrawl pipeline (I1) |
| M4 | Add Reddit pipeline to Monday workflow |
| M5 | Build /office-chairs-for-tall-people/ cornerstone (2,500+ words) |

### Month 2 — Intelligence Upgrades

| # | Action |
|---|--------|
| I1 | Build SERP API → Firecrawl → gap analysis pipeline (see architecture below) — replaces competitor-monitor entirely |
| I2 | Inject Reddit published data into strategy.ts agent context |
| I3 | Add affiliate click events to GA4 (outbound click tracking per page and CTA position) |
| I4 | Add pagination to gsc-pull.ts for page+query rows |

#### I1 Detail: Competitor Intelligence Architecture (SERP API + Firecrawl)

The current competitor-monitor is being replaced, not patched. The new pipeline runs in three sequential stages — **the order is non-negotiable**:

**Stage 1 — SERP API (SerpAPI / ValueSERP)**
Query Google for TCA's top 20 target keywords. Returns the full results page: who ranks #1–10, what pages they are, whether there's an AI Overview, featured snippets, or other SERP features. This answers "which competitor pages are actually beating TCA" — something the current system has no visibility into because it monitors 5 manually-chosen URLs regardless of whether those URLs even rank.

Output: `data/competitors/serp-YYYY-MM.json` — ranked competitor page list per keyword.

**Stage 2 — Firecrawl (targeted, not broad)**
Takes the Stage 1 output and crawls only the pages that are actually outranking TCA. Not 5 fixed URLs. Not full site crawls. Specific pages identified by SERP position. Extracts full content: all heading structure, FAQ sections, spec tables, comparison tables, word count, internal links, schema types.

This is what gives the pipeline substance. Knowing a competitor ranks #2 for "best office chair for tall people" is useful. Knowing their page has a 12-row height-bracket comparison table, covers 8 chairs, answers the Cornell seat depth rule explicitly in an FAQ, and is 3,400 words — that is actionable gap analysis.

Output: `data/competitors/content-YYYY-MM.json` — full structured content per ranked page.

**Stage 3 — Claude gap analysis**
Fed both Stage 1 (who ranks, at what position, with what SERP features) and Stage 2 (what that content actually contains), Claude produces a specific content gap report: topics TCA doesn't cover that ranking pages do, spec data missing from TCA pages, structural elements (tables, FAQ formats) that appear on ranking pages but not on TCA. This replaces the current "here are 8 H2 headings, what are our gaps?" with real comparative analysis.

Output: fed directly into `strategy.ts` as the competitor context block.

**Why SERP API must come before Firecrawl:**
Without Stage 1, Firecrawl crawls the wrong pages. The current competitor-monitor's core failure is not that it reads pages too shallowly — it's that it might be crawling pages that don't even rank for TCA's target keywords. Expensive, detailed data about the wrong pages is worse than cheap, shallow data, because it looks authoritative and isn't.

**Cadence:** Monthly, not weekly. SERP rankings don't shift fast enough to justify weekly crawls. Run on the 1st of each month. Cost: ~$1–3/month at current keyword volume.

**Do not build this until the data integrity fixes (D1–D4) are complete.** Running a sophisticated intelligence pipeline on top of URL-polluted, format-mismatched foundational data produces sophisticated noise.

---

## What Each Auditor Got Right That the Other Didn't

### Codex-only catches (high value findings Claude missed):
- Smart quotes in execute-fixes.ts lines 64-67 (critical reliability defect)
- Trailing slash URL duplication polluting GSC analysis
- Raw pull and analysis.json out of sync by 6 days
- Relative canonical on author page bypassing Layout.astro normalization
- Freshness signal inconsistency (visible date vs schema vs sitemap)
- Size-guide page is an orphan with no inbound links
- L3/L5 role overlap between the two commercial head pages
- SESSION-SUMMARY.md and MANUAL-TODOS.md are operationally misleading
- reports/weekly-plan.md is from April while everything else is May
- Monday workflow mixes data collection with autonomous production code edits (conceptual design flaw)

### Claude-only catches (high value findings Codex missed):
- Cornell cluster (165 impressions, pos 8, 0% CTR) — most actionable single SEO opportunity
- "Steelcase knee brace review" is for a different product — content can't capture it
- Cooldown system design is genuinely good (Codex ignored)
- /aeron-vs-leap-plus/ at 2.15% CTR is working — don't touch it
- Page velocity will auto-activate after second Monday (no code change needed)
- Word count regression protection (15% floor) is a real safety rail
- Specific Gesture review content brief (dimensions, armrests at 6'4", before/after pain data)
- AIO recommendations module is the most immediately useful phase-2 module

---

## What Both Got Wrong

**Codex overcorrected on the automation question.** Recommending "delete auto-edit from index-monitor, manual-only for execute-fixes and execute-content" treats fixable bugs as architectural failures. The system's design is correct. The implementation has two critical bugs and a data quality problem. Fix those — don't gut the system.

**Claude was too optimistic on overall score.** 7/10 doesn't account for: two active critical bugs (one unpatched for how long?), a data layer that's weaker than the intelligence built on top of it, and real technical SEO issues (author page, freshness drift, orphaned page) that affect rankings and crawl trust. 6/10 is more accurate.

---

## What To Stop Doing (Both Agree)
1. Running weekly plan execution without a human review gate
2. Pretending the intelligence layer is trustworthy enough to drive live code changes automatically (until URL normalization and junk filtering are in place)
3. Running competitor-monitor.ts at all — disable it; it is replaced by the SERP API + Firecrawl pipeline (monthly cadence, real ranking data, full page content)
4. Displaying March Reddit data in May without re-running the pipeline

## What To Double Down On (Both Agree)
1. The niche
2. Pain pages with CTA conversion pattern (first commission confirmed it)
3. gsc-analyze.ts as the intelligence core — fix the data quality feeding it, not the architecture
4. /review/gesture/ first-person depth — agent-produced using first-person Gesture voice rules with Reddit and spec data injected; the quality gate must evaluate substance
5. The raw/wiki/data separation pattern — keep it, simplify the concept pages within it

---

## Files That Need Immediate Human Review

1. `tall-chair-advisor/.github/workflows/friday.yml` — force-push bug (5-minute fix)
2. `tall-chair-advisor/scripts/agents/execute-fixes.ts` lines 64-67 — possible smart quotes in executable code
3. `tall-chair-advisor/data/gsc/latest.json` — check if deviceSplit and dailyTrend keys exist
4. `tall-chair-advisor/reports/weekly-plan.md` — is this from April? Confirm what the actual current plan is
5. `tall-chair-advisor/src/pages/author/jackson-christopher/index.astro` + `astro.config.mjs` — author page sitemap/canonical contradiction

---
type: log
---

## [2026-06-14] manual | Quick Picks affiliate links + pipeline bugs fixed

- Fixed /best-office-chairs/ Quick Picks: chair name links now go to Amazon affiliate URLs (tag=tallchairadvi-20) instead of internal review pages. "full review →" internal links added alongside each pick.
- Fixed execute-content.ts validateAstroFile: string-stripping regex upgraded to handle escaped quotes inside JSON strings. Root cause of repeated shoulder-pain-tall-people validation failures.
- Fixed execute-content.ts scoreContent: markdown code fence stripping added before JSON.parse. Root cause of quality gate FAILED (0/100) on standing-desk-height-tall-people.


## [2026-06-14] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 17 (top leak: /knee-pain-seat-depth/ — "cornell ergonomics office chair seat depth 2 inches behind knees")
- Opportunities: 30 actionable
- AIO suspects: 8
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions up 49.8% WoW (9162 vs 6117), clicks up 92.9% (27 vs 14), avg position stable
- Query entropy: 2 fragmented pages
- Hub candidates: 4
- Transition opportunities: 0
- AIO recommendations: 8
- Page velocity: 34 pages
- Link audit: 0 high-impression pages with < 3 inbound links


## [2026-06-14] gsc-pull | GSC Data Pull

- Period: 2026-03-16 → 2026-06-14 (90 days)
- Pages: 40 | Queries: 200 | PageQuery pairs: 500
- Device rows: 55 | Daily trend rows: 89
- Clicks: 108 | Impressions: 42738 | Avg pos: 9.2


## [2026-06-13] verify-deploy | Saturday Deploy

- Status: DEPLOYED
- Checks: Secrets scan: ✅, Affiliate links: ✅, Voice constraint: ✅, Credentials not staged: ✅, Schema validity: ✅, Internal links: ✅, Content regression: ✅
- Weekly summary: wiki/weekly/2026-W24.md


## [2026-06-11] execute-fixes | Thursday Fixes Applied

- /office-chairs-for-6-foot-4/ → src/pages/office-chairs-for-6-foot-4.astro
- /knee-pain-seat-depth/ → src/pages/knee-pain-seat-depth.astro


## [2026-06-10] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-06-10-weekly-plan.md
- 2 fixes, 0 rewrites, 2 new pages (5 tasks dropped by enforcement)
- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation
- Decay alerts injected: 0 (none — threshold requires 9+ snapshots)
- Link gaps injected: 0 high-impression underlinked pages
- Roadmap items force-injected: 2


## [2026-06-09] audit | Weekly Site Audit

- Pages audited: 20
- Clicks: 55 | Impressions: 23105
- Full report archived to raw/audits/2026-06-09-weekly-audit.md


## [2026-06-06] verify-deploy | Saturday Deploy

- Status: DEPLOYED
- Checks: Secrets scan: ✅, Affiliate links: ✅, Voice constraint: ✅, Credentials not staged: ✅, Schema validity: ✅, Internal links: ✅, Content regression: ✅
- Weekly summary: wiki/weekly/2026-W23.md


## [2026-06-04] execute-fixes | Thursday Fixes Applied

- /aeron-vs-gesture/ → src/pages/aeron-vs-gesture.astro
- /knee-pain-seat-depth/ → src/pages/knee-pain-seat-depth.astro


## [2026-06-03] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-06-03-weekly-plan.md
- 1 fixes, 1 rewrites, 2 new pages (7 tasks dropped by enforcement)
- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation
- Decay alerts injected: 0 (none — threshold requires 9+ snapshots)
- Link gaps injected: 0 high-impression underlinked pages
- Roadmap items force-injected: 2


## [2026-06-02] audit | Weekly Site Audit

- Pages audited: 20
- Clicks: 55 | Impressions: 23105
- Full report archived to raw/audits/2026-06-02-weekly-audit.md


### 2026-06-01 — keyword-discovery.ts run
- Seeds: GSC=12, Competitor=6, Deduped=16
- Estimated cost: $0.0201 (1 task)
- Keywords returned from DataForSEO: 11
- After filter: 11 keywords pass (KD ≤ 35, vol ≥ 50, non-navigational)
- Opportunities written: 11 (gap=0, targeting=0, ranking=11)
- Mode: production
## [2026-05-28] manual | Content pipeline fixed — 4 bugs resolved, full autonomy restored

- **Root cause diagnosis:** weekly plan had been stuck at May 16 (12 days stale). Strategy agent threw when enforcement dropped all FIX tasks (pages on cooldown after manual edits). Content agent failed `/wrist-pain-armrest-height/` twice due to JS comment validation bug — never committed fix that was sitting in local working tree.
- **Fix 1 — Validation bug:** `validateAstroFile()` now strips JS single-line comments (`//`), block comments, and template literals before checking for bare `and`/`or`. Was producing false validation failures on Claude output containing natural-language comments in frontmatter.
- **Fix 2 — Roadmap fallback:** `execute-content.ts` falls back to top-2 pending `data/content-roadmap.json` items when the strategy plan has zero NEW tasks. Content runs every Friday regardless of what the LLM chose to schedule.
- **Fix 3 — Failure tracking:** Double-validation-fail now archives rejected draft to `raw/content-rejected/` AND writes `data/content-failed.json` keyed by slug. Strategy skips failed slugs permanently until manually cleared.
- **Fix 4 — Mandatory roadmap injection:** `strategy.ts` post-processes every generated plan with `injectMandatoryRoadmapItems()` — deterministically force-injects top-2 pending roadmap items not already in plan, not already live, not in failed list. LLM can no longer bypass queued topics.
- **Fix 5 — Auto-populate roadmap:** New `scripts/roadmap-sync.ts` clusters 225 competitor keyword gaps by topic (wide-seat, big-and-tall, back-pain, armrest, standing-desk, budget, sihoo, gaming, wide) and promotes new page opportunities to `data/content-roadmap.json`. Runs every Monday after competitor intelligence (added to monday.yml with `continue-on-error: true`).
- **Immediate run:** `roadmap-sync` ran and added 3 new items — `/wide-seat-office-chairs-tall-people/` (8,940/mo), `/best-big-and-tall-office-chairs/` (5,100/mo), `/office-chair-lower-back-pain-tall-people/` (100/mo high-intent). Roadmap now has 7 pending items.
- **Commit:** `84e5678` + `b63deaa` pushed to main.

## [2026-05-27] automated | Full SEO audit — 6 agents, 75/100

- **Score: 75/100** (vs 77/100 on May 10). Drop driven by on-page agent surfacing systemic meta-description under-length (9/10 pages under 130 chars — execute-fixes.ts over-trimmed previously over-limit metas) and og:type defaulting to "website" across all content pages.
- **Raw files:** `raw/audits/2026-05-27-full-seo-audit.md`, `raw/audits/2026-05-27-action-plan.md`
- **Category scores:** Technical 82, Content 71, On-Page 72, Schema 72, Performance 85, Images 83, AI Search 58
- **Critical findings:** (1) `/aeron-vs-gesture/` H1/title mismatch — 0% CTR on 385 impressions still unresolved; (2) Homepage WebSite schema missing @id — dangling entity reference; (3) HowTo schema on `/correct-chair-dimensions/` deprecated since Sep 2023
- **High findings:** 9/10 meta descriptions under-length; `/correct-chair-dimensions/` citation capsule still not applied; title truncation on 2 pages; ItemList `url`→`item` bug; `/author/` 404; Aeron Size C review thin (1,746 words); Quick Picks CTAs on money page routing to internal not Amazon
- **Wiki updates:** `schema-markup`, `aeron-vs-gesture`, `meta-descriptions` all ingested
- **Performance:** All CWV estimated PASS, TTFB 43ms, Cloudflare edge cache active

## [2026-05-27] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-05-27-weekly-plan.md
- 1 fixes, 0 rewrites, 1 new pages (5 tasks dropped by enforcement)
- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation
- Decay alerts injected: 0 (none — threshold requires 9+ snapshots)
- Link gaps injected: 0 high-impression underlinked pages

## [2026-05-26] manual | Content push — 7 pages updated, 1 new page

- **`/correct-chair-dimensions/`** defragmented: title/H1/subtitle rewritten to anthropometric fitment framing; dimensional requirements table moved to top (before intro prose); generic 3-paragraph "Why Standard Specs Fail" section cut to 1 tight paragraph; dateModified updated
- **5 height-specific pages** (6'3"–6'7") each received a 6-column spec table (seat height range, seat depth, back height, weight capacity, fit verdict) as the first element inside `.prose-tca`, before any prose or quick-answer box
- **New page `/heavy-duty-ergonomic-chairs-tall-people/`** created: research-voice, targets "best heavy duty ergonomic chairs for tall people"; two-problem frame (weight capacity ≠ tall-user fit); Leap Plus as only mainstream solution; honest Aeron warning (350 lbs); Amazon affiliate links; FAQPage schema
- Build: clean, 47 pages
- Thesis items #2, #3, #5 marked DONE

## [2026-05-25] manual | Gesture review full first-person rewrite

- Full rewrite from Jackson Q&A session — all fabricated voice content replaced with real first-hand data
- Key corrections: seat depth clearance 1.5–2 fingers → 3 fingers (solidly within Cornell guideline, not borderline); break-in story (entirely AI-generated, never true) → immediate positive reaction on first sit
- New first-person content added: "woah" moment on first sit; pain before (constant lower back + upper back/shoulder aches, always wanting a massage); nap in the chair during finals week; honest armrests account (mostly works on desk for CAD, armrest padding could be better); price as #1 complaint
- Height verdict updated: 6'4" is now "good fit" (was "borderline/judgment call"); cutoff moved to 6'5"+
- Schema: `itemReviewed` added to Review node (was blocking rich results)
- Revenue: CTA button added immediately after Direct Answer box (was only at 85% page scroll)
- sitemap lastmod updated to 2026-05-25 in astro.config.mjs
- Build: clean, 46 pages
- Wiki entity updated: wiki/pages/site-pages/review-gesture.md

## [2026-05-23] manual | Strategic direction session + wiki updated

- Frame set: TCA is spec-first fitment authority for tall buyers, not a review site
- No rebranding needed; no page consolidation needed
- Priority order updated in `wiki/synthesis/thesis.md`
- Gesture review rewrite flagged as manual-only: Claude asks prompting questions → Jackson answers → Claude writes full first-person page from answers. Do not auto-generate.
- Seat depth calculator flagged as manual build (vanilla JS, no new deps, 2–3 hrs)
- Automation items: /correct-chair-dimensions/ defrag, spec tables on height pages, weight capacity guide, Leap Plus reframe
- GitHub Actions failures this week: API credits exhausted between Mon and Tue (May 19). Thu succeeded via DAG guard. Node.js bumped 20→24 across all 7 workflows (committed a5f6ed7).
- Decisions logged in `wiki/synthesis/decisions-log.md`

## [2026-05-22] manual | GSC Semantic Intent Analysis

- 7-part deep analysis of what Google believes TCA's semantic identity is
- Finding: Google classifies TCA as spec-verification authority for tall-user fitment, not a review site
- Top signal: dimensional/spec intent dominates (~4,200 impr) over transactional intent (~300 impr)
- Key moat identified: Cornell seat depth cluster (280+ impr, ~8 query variants) — TCA is the canonical web reference
- Critical weakness: /correct-chair-dimensions/ entropy 4.419 (52 clusters) draining authority
- Top opportunity: Gesture review rewrite with Jackson's 6'4" body measurements as lead
- Raw report: raw/audits/2026-05-22-semantic-intent-analysis.md
- Wiki page: wiki/pages/concepts/semantic-intent-analysis.md
## [2026-05-25] index-monitor | Indexing Health Check

- Pages inspected: 46
- Indexed: 33 | Issues: 13 | Fixed: 0
- Sitemap resubmitted: true
- Issues: https://tallchairadvisor.com/404/ (wait), https://tallchairadvisor.com/affiliate-disclosure/ (wait), https://tallchairadvisor.com/contact/ (wait), https://tallchairadvisor.com/leg-pain-circulation/ (wait), https://tallchairadvisor.com/office-chair-return-policy/ (wait), https://tallchairadvisor.com/privacy-policy/ (noindex), https://tallchairadvisor.com/author/jackson-christopher/ (wait), https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height/ (wait), https://tallchairadvisor.com/chairs/herman-miller-aeron/size-guide/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/weight-limit/ (wait), https://tallchairadvisor.com/chairs/steelcase-leap-plus/weight-limit/ (wait)


## [2026-05-25] competitor-intelligence v2.5 | Strategic Run

- Pages: 8 | Queries: 24 | Crawls: 29 (18 cached)
- High-priority gaps: 2
- AIO tasks: 7 generated | 2 applied to src/pages/ (1 fallback) | 0 rejected (spec mismatch) | 0 pending passage text
- 8 pages analyzed × up to 3 queries each. 29 URLs crawled (18 cache hits). 2 high-priority gaps. Top editorial outrankers: btod.com, forbes.com, thehumansolution.com.


## [2026-05-25] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 16 (top leak: /office-chairs-for-tall-people/ — "leadership equipment for tall people")
- Opportunities: 28 actionable
- AIO suspects: 1
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions down 8.8% WoW (3683 vs 4038), clicks down 18.2% (9 vs 11), avg position declining (0.9 spots)
- Query entropy: 2 fragmented pages
- Hub candidates: 6
- Transition opportunities: 0
- AIO recommendations: 1
- Page velocity: 34 pages
- Link audit: 0 high-impression pages with < 3 inbound links


## [2026-05-25] gsc-pull | GSC Data Pull

- Period: 2026-02-24 → 2026-05-25 (90 days)
- Pages: 46 | Queries: 200 | PageQuery pairs: 500
- Device rows: 56 | Daily trend rows: 89
- Clicks: 55 | Impressions: 23105 | Avg pos: 10.5


## [2026-05-23] verify-deploy | Saturday Deploy

- Status: DEPLOYED
- Checks: Secrets scan: ✅, Affiliate links: ✅, Voice constraint: ✅, Credentials not staged: ✅, Schema validity: ✅, Internal links: ✅, Content regression: ✅
- Weekly summary: wiki/weekly/2026-W21.md


## [2026-05-21] execute-fixes | Thursday Fixes Applied

- /best-office-chairs/ → src/pages/best-office-chairs.astro


## [2026-05-18] index-monitor | Indexing Health Check

- Pages inspected: 46
- Indexed: 33 | Issues: 13 | Fixed: 0
- Sitemap resubmitted: true
- Issues: https://tallchairadvisor.com/404/ (wait), https://tallchairadvisor.com/affiliate-disclosure/ (wait), https://tallchairadvisor.com/contact/ (wait), https://tallchairadvisor.com/leg-pain-circulation/ (wait), https://tallchairadvisor.com/office-chair-return-policy/ (wait), https://tallchairadvisor.com/privacy-policy/ (noindex), https://tallchairadvisor.com/author/jackson-christopher/ (wait), https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height/ (wait), https://tallchairadvisor.com/chairs/herman-miller-aeron/size-guide/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/weight-limit/ (wait), https://tallchairadvisor.com/chairs/steelcase-leap-plus/weight-limit/ (wait)


## [2026-05-18] competitor-intelligence v2.5 | Strategic Run

- Pages: 8 | Queries: 24 | Crawls: 6 (54 cached)
- High-priority gaps: 5
- AIO tasks: 2 generated | 0 applied to src/pages/ (0 fallback) | 1 rejected (spec mismatch) | 1 pending passage text
- 8 pages analyzed × up to 3 queries each. 6 URLs crawled (54 cache hits). 5 high-priority gaps. Top editorial outrankers: btod.com, forbes.com, thehumansolution.com.


## [2026-05-18] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 15 (top leak: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches")
- Opportunities: 25 actionable
- AIO suspects: 1
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions up 25% WoW (4038 vs 3231), clicks up 57.1% (11 vs 7), avg position stable
- Query entropy: 3 fragmented pages
- Hub candidates: 6
- Transition opportunities: 0
- AIO recommendations: 1
- Page velocity: 33 pages
- Link audit: 0 high-impression pages with < 3 inbound links


## [2026-05-18] gsc-pull | GSC Data Pull

- Period: 2026-02-17 → 2026-05-18 (90 days)
- Pages: 46 | Queries: 200 | PageQuery pairs: 500
- Device rows: 56 | Daily trend rows: 89
- Clicks: 46 | Impressions: 19437 | Avg pos: 10.6


## [2026-05-16] verify-deploy | Saturday Deploy

- Status: DEPLOYED
- Checks: Secrets scan: ✅, Affiliate links: ✅, Voice constraint: ✅, Credentials not staged: ✅, Schema validity: ✅, Internal links: ✅, Content regression: ✅
- Weekly summary: wiki/weekly/2026-W20.md


## [2026-05-16] verify-deploy | Saturday Deploy

- Status: DEPLOYED
- Checks: Secrets scan: ✅, Affiliate links: ✅, Voice constraint: ✅, Credentials not staged: ✅, Schema validity: ✅, Internal links: ✅, Content regression: ✅
- Weekly summary: wiki/weekly/2026-W20.md


## [2026-05-16] execute-fixes | Thursday Fixes Applied

- /best-office-chairs/ → src/pages/best-office-chairs.astro


## [2026-05-16] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-05-16-weekly-plan.md
- 0 fixes, 1 rewrites, 1 new pages (5 tasks dropped by enforcement)
- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation
- Decay alerts injected: 0 (none — threshold requires 9+ snapshots)
- Link gaps injected: 0 high-impression underlinked pages


## [2026-05-16] audit | Weekly Site Audit

- Pages audited: 20
- Clicks: 41 | Impressions: 17877
- Full report archived to raw/audits/2026-05-16-weekly-audit.md


## [2026-05-16] index-monitor | Indexing Health Check

- Pages inspected: 46
- Indexed: 33 | Issues: 13 | Fixed: 0
- Sitemap resubmitted: true
- Issues: https://tallchairadvisor.com/404/ (wait), https://tallchairadvisor.com/affiliate-disclosure/ (wait), https://tallchairadvisor.com/contact/ (wait), https://tallchairadvisor.com/leg-pain-circulation/ (wait), https://tallchairadvisor.com/office-chair-return-policy/ (wait), https://tallchairadvisor.com/privacy-policy/ (noindex), https://tallchairadvisor.com/author/jackson-christopher/ (wait), https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height/ (wait), https://tallchairadvisor.com/chairs/herman-miller-aeron/size-guide/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/weight-limit/ (wait), https://tallchairadvisor.com/chairs/steelcase-leap-plus/weight-limit/ (wait)


## [2026-05-16] competitor-intelligence v2.5 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 2 (54 cached)
- High-priority gaps: 3
- AIO tasks: 4 generated | 1 applied to src/pages/ (1 fallback) | 0 rejected (spec mismatch) | 0 pending passage text
- 8 pages analyzed × up to 3 queries each. 2 URLs crawled (54 cache hits). 3 high-priority gaps. Top editorial outrankers: btod.com, forbes.com, thehumansolution.com.


## [2026-05-16] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 14 (top leak: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches")
- Opportunities: 25 actionable
- AIO suspects: 1
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions down 1.3% WoW (3605 vs 3654), clicks down 11.1% (8 vs 9), avg position stable
- Query entropy: 3 fragmented pages
- Hub candidates: 7
- Transition opportunities: 0
- AIO recommendations: 1
- Page velocity: 33 pages
- Link audit: 0 high-impression pages with < 3 inbound links


## [2026-05-16] gsc-pull | GSC Data Pull

- Period: 2026-02-15 → 2026-05-16 (90 days)
- Pages: 46 | Queries: 200 | PageQuery pairs: 500
- Device rows: 55 | Daily trend rows: 88
- Clicks: 41 | Impressions: 17877 | Avg pos: 10.7


## [2026-05-16] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 14 (top leak: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches")
- Opportunities: 25 actionable
- AIO suspects: 1
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions down 1.3% WoW (3605 vs 3654), clicks down 11.1% (8 vs 9), avg position stable
- Query entropy: 3 fragmented pages
- Hub candidates: 7
- Transition opportunities: 0
- AIO recommendations: 1
- Page velocity: 33 pages
- Link audit: 0 high-impression pages with < 3 inbound links


## [2026-05-16] gsc-pull | GSC Data Pull

- Period: 2026-02-15 → 2026-05-16 (90 days)
- Pages: 46 | Queries: 200 | PageQuery pairs: 500
- Device rows: 55 | Daily trend rows: 88
- Clicks: 41 | Impressions: 17877 | Avg pos: 10.7


## [2026-05-16] verify-deploy | Saturday Deploy

- Status: DEPLOYED
- Checks: Secrets scan: ✅, Affiliate links: ✅, Voice constraint: ✅, Credentials not staged: ✅, Schema validity: ✅, Internal links: ✅, Content regression: ✅
- Weekly summary: wiki/weekly/2026-W20.md


## [2026-05-16] execute-fixes | Thursday Fixes Applied

- /office-chairs-for-tall-people/ → src/pages/office-chairs-for-tall-people.astro
- /review/leap-plus/ → src/pages/review/leap-plus.astro
- /correct-chair-dimensions/ → src/pages/correct-chair-dimensions.astro


## [2026-05-15] systems-architecture-audit | 7 open items implemented

Phase 1 (quick wins):
- `execute-fixes.ts` — cache_control added to all 3 call sites (meta, title, full-file). ~40% token cost reduction on Thursday runs.
- `competitor-intelligence.ts` — analyzeGaps() refactored: static system preamble extracted to `system` field with cache_control; capsule call also gets static system prompt with cache_control. Cache hits across loop (multiple queries × pages per run).
- `execute-content.ts` — `buildDifferentiationAssets(slug, root)` added. Injects ME biomechanics framing, 6'4" anthropometric anchor, Gesture first-person voice authorization, Reddit owner signals (reads data/reddit/published/<chairId>.json). Called in generatePage() — appended to cached system prompt.
- `verify-deploy.ts` — 6 brand-anchor-free patterns added to NON_GESTURE_VOICE_PATTERNS. Catches generic first-person testing voice without requiring a chair brand name in the match.

Phase 2 (structural):
- `keywords-monthly.yml` — `npm run keyword:gaps` step added after keyword discovery. Monthly cadence; `keyword:gaps` script already existed in package.json.
- `thursday.yml` — DAG pipeline-status check added (same guard logic as tuesday/wednesday).
- `friday.yml` — DAG pipeline-status check added. Friday checks out staging, so check reads from `origin/main` via `git show origin/main:data/pipeline-status.json`.
- `execute-content.ts` — `scoreCompetitiveDepth(slug, content, root)` added. Haiku call after structural 80/100 gate. Reads intelligence.json, finds competitor entry by slug, scores TCA draft 0-100. Ratio < 70 triggers single re-roll with missing sections injected. Re-roll falls back to original if Astro validation fails.

Phase 3 deferred: data commit decoupling (use [skip cd] approach when ready), Batch API (async architecture change — not a one-liner; measure caching savings first).
Open content tasks: shoulder-pain-tall-people, standing-desk-height, sihoo-doro-s300, best-chairs-under-500 — strategy agent's job.

## [2026-05-15] competitor-intelligence v2.2 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 22 (37 cached)
- High-priority gaps: 1
- AIO tasks: 4 generated | 0 applied to src/pages/ | 1 rejected (spec mismatch) | 3 pending passage text
- 8 pages analyzed × up to 3 queries each. 22 URLs crawled (37 cache hits). 1 high-priority gaps. Top editorial outrankers: btod.com, forbes.com, thehumansolution.com.

## [2026-05-15] wiki | Statistical confidence policy added

- Added concept page: `wiki/pages/concepts/statistical-confidence-policy.md`
- Indexed the page in `wiki/index.md`
- Updated `scripts/agents/strategy.ts` to load `statistical-confidence-policy` in `readConceptContext()`
- Updated `scripts/agents/audit.ts` to load `statistical-confidence-policy` in `readConceptContext()`
- Purpose: prevent overconfident causal claims from low-volume GSC data; prefer query clusters, 90-day denominators, and cheap reversible tests


## [2026-05-15] Claude assessment | Architecture eval + 3 new open items added

- Evaluated external Gemini architecture review (limited context) against full TCA system knowledge
- Added `## Claude Assessment — 2026-05-15` section to `wiki/pages/concepts/systems-architecture-audit-2026-05-13.md`
- Added 3 new items to the Open Items Priority Ranked table (items 8–10):
  - **Item 8** — Competitive-depth quality gate in execute-content.ts (Haiku call vs. #1 competitor from intelligence.json, 70% depth threshold, re-roll with gaps injected)
  - **Item 9** — Explicit differentiation asset injection in content generation prompt (ME background, 6'4" measurements, Gesture first-hand voice, Reddit community data)
  - **Item 10** — Anthropic Batch for audit.ts and strategy.ts (50% cost reduction, no architecture change, fixes API cost > revenue inversion)
- Summary conclusion: system ceiling is content (C1 Gesture expansion), not infrastructure. Mirroring risk is real but addressable with items 8+9 without a new agent.

## [2026-05-15] manual code audit | Architecture audit implementation status verified

- Read all scripts in `scripts/` and `scripts/agents/` against every finding in `raw/audits/2026-05-13-systems-architecture-audit.md`
- **5 of 10 audit priority items confirmed implemented:** keyword-discovery.ts + keyword-gap-discovery.ts, interventions.jsonl pipeline (wiki-utils.ts), data/content-roadmap.json, formatOutcomesForPrompt(), detectDecayingPages(), internal link audit (gsc-analyze.ts → link-audit.json), prompt caching in audit.ts + strategy.ts, getWeekStartBaseline() in verify-deploy.ts, Module 6 content gap detection
- **5 items still open:** keyword scripts not in Monday CI, execute-fixes.ts uncached, no cross-day DAG enforcement, git-as-event-bus unresolved, voice regex still anchor-keyword-dependent
- **Wiki updated:**
  - `wiki/pages/concepts/systems-architecture-audit-2026-05-13.md` — full rewrite with per-finding implementation status. Now source of truth.
  - `wiki/pages/concepts/audit-implementation-2026-05-10.md` — archived notice added, superseded by above
  - `wiki/pages/concepts/audit-2026-05-10-seo.md` — archived snapshot notice added
  - `wiki/synthesis/decisions-log.md` — 2026-W20 May 15 entry with implementation summary
  - `wiki/index.md` — audit rows updated; raw sources note updated

## [2026-05-15] keyword-gap discovery | True keyword gaps analysis

- Added concept page: `wiki/pages/concepts/true-keyword-gaps.md`
- Source snapshot: `data/keywords/true-gaps.json` and `data/keywords/raw/2026-05-15T16-05-29-competitor-ranked-keywords.json`
- Current run: 23 competitor pages analyzed, 302 ranked-keyword rows, 40 removed because TCA already ranks, 225 grouped true gaps remain
- Main interpretation: strongest missed territory is big-and-tall / wide / heavy-user commercial adjacency; dimensions / seat-depth is the secondary educational depth lane

### 2026-05-15 — keywords-push run
- Approved+unpushed: 1, deduplicated out: 0
- Pushed to content-roadmap.json: 1
- Keywords pushed: desk chair for tall person

### 2026-05-15 — keywords-push run
- Approved+unpushed: 1, deduplicated out: 0
- Pushed to content-roadmap.json: 1
- Keywords pushed: desk chair for tall person

## [2026-05-15] wiki | DataForSEO reference ingested

- Added raw source snapshot: `raw/misc/2026-05-15-dataforseo-v3-reference.md`
- Added concept page: `wiki/pages/concepts/dataforseo-reference.md`
- Captured official DataForSEO V3 auth model, TCA-priority API families, and the current `keyword-discovery.ts` contract
- Indexed the new page in `wiki/index.md` so future agents can find it before modifying any DataForSEO integration

### 2026-05-15 — keyword-discovery.ts run
- Seeds: GSC=9, Competitor=0, Deduped=9
- Estimated cost: $0.0201 (1 task)
- Keywords returned from DataForSEO: 7
- After filter: 7 keywords pass (KD ≤ 35, vol ≥ 50, non-navigational)
- Opportunities written: 7 (gap=0, targeting=0, ranking=7)
- Mode: production

### 2026-05-15 — keyword-discovery.ts run
- Seeds: GSC=9, Competitor=0, Deduped=9
- Estimated cost: $0.0201 (1 task)
- Keywords returned from DataForSEO: 2
- After filter: 0 keywords pass (KD ≤ 35, vol ≥ 50, non-navigational)
- Opportunities written: 0 (gap=0, targeting=0, ranking=0)
- Mode: sandbox

### 2026-05-15 — keyword-discovery.ts run
- Seeds: GSC=9, Competitor=0, Deduped=9
- Estimated cost: $0.0201 (1 task)
- Keywords returned from DataForSEO: 7
- After filter: 7 keywords pass (KD ≤ 35, vol ≥ 50, non-navigational)
- Opportunities written: 7 (gap=0, targeting=0, ranking=7)
- Mode: production

### 2026-05-15 — keyword-discovery.ts run
- Seeds: GSC=9, Competitor=0, Deduped=9
- Estimated cost: $0.0201 (1 task)
- Keywords returned from DataForSEO: 2
- After filter: 0 keywords pass (KD ≤ 35, vol ≥ 50, non-navigational)
- Opportunities written: 0 (gap=0, targeting=0, ranking=0)
- Mode: sandbox

### 2026-05-15 — keyword-discovery.ts run
- Seeds: GSC=9, Competitor=0, Deduped=9
- Estimated cost: $0.0201 (1 task)
- Keywords returned from DataForSEO: 2
- After filter: 0 keywords pass (KD ≤ 35, vol ≥ 50, non-navigational)
- Opportunities written: 0 (gap=0, targeting=0, ranking=0)
- Mode: sandbox

### 2026-05-15 — keyword-discovery.ts run
- Seeds: GSC=9, Competitor=0, Deduped=9
- Estimated cost: $0.0201 (1 task)
- Keywords returned from DataForSEO: 2
- After filter: 0 keywords pass (KD ≤ 35, vol ≥ 50, non-navigational)
- Opportunities written: 0 (gap=0, targeting=0, ranking=0)
- Mode: sandbox

### 2026-05-15 — keyword-discovery.ts run
- Seeds: GSC=9, Competitor=0, Deduped=9
- Estimated cost: $0.0201 (1 task)
- Keywords returned from DataForSEO: 2
- Mode: sandbox

## [2026-05-15] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 13 (top leak: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches")
- Opportunities: 24 actionable
- AIO suspects: 1
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions down 1.2% WoW (3231 vs 3271), clicks up 16.7% (7 vs 6), avg position stable
- Query entropy: 1 fragmented pages
- Hub candidates: 7
- Transition opportunities: 0
- AIO recommendations: 1
- Page velocity: 33 pages
- Link audit: 0 high-impression pages with < 3 inbound links


## [2026-05-15] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 13 (top leak: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches")
- Opportunities: 24 actionable
- AIO suspects: 1
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions down 1.2% WoW (3231 vs 3271), clicks up 16.7% (7 vs 6), avg position stable
- Query entropy: 1 fragmented pages
- Hub candidates: 7
- Transition opportunities: 0
- AIO recommendations: 1
- Page velocity: 33 pages


## [2026-05-15] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 13 (top leak: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches")
- Opportunities: 24 actionable
- AIO suspects: 1
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions down 1.2% WoW (3231 vs 3271), clicks up 16.7% (7 vs 6), avg position stable
- Query entropy: 1 fragmented pages
- Hub candidates: 7
- Transition opportunities: 0
- AIO recommendations: 1
- Page velocity: 33 pages


## [2026-05-14] audit | Cloudflare custom-domain cache investigation

- Raw snapshot: `raw/audits/2026-05-14-cloudflare-cache-investigation.md`
- Pages origin verified clean: deployment URLs serve `Cache-Control: public, max-age=300, must-revalidate` and the wildcard Clarity CSP
- Custom domain verified divergent: `tallchairadvisor.com` serves cached HTML with `CF-Cache-Status: HIT` and `Cache-Control: public, max-age=3600, must-revalidate`
- Fresh query-string variants fetch the newest deployment immediately, then become cached on repeat request
- Conclusion: stale HTML/CSP is persisting at the Cloudflare custom-domain zone cache layer, not in Pages origin

## [2026-05-14] audit | Microsoft Clarity diagnosis

- Raw snapshot: `raw/audits/2026-05-14-clarity-diagnosis.md`
- GitHub `main` verified: Clarity snippet present in `src/layouts/Layout.astro`; `_headers` includes `www.clarity.ms` but not `scripts.clarity.ms`
- Live production issue: homepage `/` serves stale CSP without Clarity hosts, while sampled content pages serve a newer CSP variant
- Bootstrap check: `https://www.clarity.ms/tag/wqec7ap5fe` loads a second-stage script from `https://scripts.clarity.ms/0.8.64/clarity.js` and pings `https://c.clarity.ms/c.gif`
- Conclusion: Clarity failure is caused by CSP/header mismatch, not by the project ID or missing snippet

## [2026-05-13] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-05-13-weekly-plan.md
- 2 fixes, 1 rewrites, 2 new pages (3 tasks dropped by enforcement)
- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation

## [2026-05-13] audit | Systems-Level Architecture Audit

- Raw snapshot: `raw/audits/2026-05-13-systems-architecture-audit.md`
- Wiki concept page: `wiki/pages/concepts/systems-architecture-audit-2026-05-13.md`
- Overall score: 5.5/10 (code 8/10, strategic intelligence 4/10, business viability 3/10)
- Core finding: sound engineering, wrong data scale — statistical signals meaningless at 7 clicks/week
- Top 5 priorities: (1) keyword research pipeline, (2) fix attribution tracker, (3) content-roadmap.json for manual queue, (4) prompt caching (-40% cost), (5) decouple data/code commits
- Estimated API cost: $20-60/month vs cents/week revenue — unsustainable until traffic grows

## [2026-05-13] tracking | Microsoft Clarity added

- Script injected into `src/layouts/Layout.astro` `<head>` (tag ID: `wqec7ap5fe`)
- Uses `is:inline` to pass through Astro's bundler untouched
- Build verified clean (45 pages, 0 errors). Cache purged from Cloudflare dashboard. Network tab confirmed `clarity.ms/tag/wqec7ap5fe` loads on page visit.
- Wiki updated: `workflow-system-reference.md` — Site Analytics & Tracking table added

## [2026-05-12] audit | Weekly Site Audit

- Pages audited: 20
- Clicks: 35 | Impressions: 15417
- Full report archived to raw/audits/2026-05-12-weekly-audit.md

## [2026-05-11] workflow evaluation | Manual pipeline audit

- Raw output: `raw/audits/2026-05-11-workflow-evaluation.md`
- Overall: 7.5/10
- 3 high issues: no API retry (H1), wiki entities created for failed content tasks (H2), no human review gate (H3)
- 4 medium issues: no prompt caching (M1), Thursday force-push race condition (M2), no failure notifications (M3), fragile wiki index update (M4)
- 2 low issues: SerpAPI budget tracking (L1), voice check pattern maintenance (L2)
- Quick wins: H2 fix (execute-content.ts:384), H1 retry in verify-deploy.ts, M1 prompt caching in strategy.ts
- Findings ingested into `wiki/pages/concepts/workflow-system-reference.md` — Known Issues table added

## [2026-05-11] Wiki sync — geo-optimize marked complete

- `thesis.md` Priority 0 updated: "Build geo-optimize.ts" → DONE. v2.3 integrated into competitor-intelligence.ts.
- `wiki/index.md` geo-optimize-plan row updated to reflect completion state.
- `geo-optimize-plan.md` status block updated: 3 capsules applied, 3 pending (page_token), SERP cache live.
- No code changes. Wiki-only sync to align recorded state with actual codebase.

## [2026-05-12] competitor-intelligence v2.2 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 5 (40 cached)
- High-priority gaps: 2
- AIO tasks: 6 generated | 0 applied to src/pages/ | 0 rejected (spec mismatch) | 0 pending passage text
- 8 pages analyzed × up to 3 queries each. 5 URLs crawled (40 cache hits). 2 high-priority gaps. Top editorial outrankers: btod.com, thehumansolution.com, forbes.com.


## [2026-05-12] competitor-intelligence v2.2 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 0 (45 cached)
- High-priority gaps: 2
- AIO tasks: 6 generated | 0 applied to src/pages/ | 0 rejected (spec mismatch) | 3 pending passage text
- 8 pages analyzed × up to 3 queries each. 0 URLs crawled (45 cache hits). 2 high-priority gaps. Top editorial outrankers: btod.com, thehumansolution.com, forbes.com.


## [2026-05-12] competitor-monitor | Competitor Scan

- Monitored: 5 pages (5 live, 0 dead)
- Gaps found: 3
- Summary: Our core problem is a mismatch between impression volume and content quality: we're visible enough to earn thousands of impressions on review and informational pages but too thin and schema-poor to convert them into clicks or rankings that matter. The single highest-leverage move this week is expanding the Gesture review — 2,672 impressions at position 8.2 with 0.11% CTR is a near-miss screaming for richer content and structured data. In parallel, rescuing /office-chairs-for-tall-people/ from page 2 with a depth-and-schema overhaul secures our flagship keyword before a competitor like Tall.Life decides to do the same job better.


## [2026-05-12] index-monitor | Indexing Health Check

- Pages inspected: 45
- Indexed: 33 | Issues: 12 | Fixed: 0
- Sitemap resubmitted: true
- Issues: https://tallchairadvisor.com/404/ (wait), https://tallchairadvisor.com/affiliate-disclosure/ (wait), https://tallchairadvisor.com/contact/ (wait), https://tallchairadvisor.com/leg-pain-circulation/ (wait), https://tallchairadvisor.com/privacy-policy/ (noindex), https://tallchairadvisor.com/author/jackson-christopher/ (wait), https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height/ (wait), https://tallchairadvisor.com/chairs/herman-miller-aeron/size-guide/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/weight-limit/ (wait), https://tallchairadvisor.com/chairs/steelcase-leap-plus/weight-limit/ (wait)


## [2026-05-12] competitor-intelligence v2.2 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 0 (45 cached)
- High-priority gaps: 1
- AIO tasks: 6 generated | 2 applied to src/pages/ | 0 rejected (spec mismatch) | 3 pending passage text
- 8 pages analyzed × up to 3 queries each. 0 URLs crawled (45 cache hits). 1 high-priority gaps. Top editorial outrankers: btod.com, thehumansolution.com, forbes.com.


## [2026-05-12] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 13 (top leak: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches")
- Opportunities: 24 actionable
- AIO suspects: 1
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions down 1.2% WoW (3231 vs 3271), clicks up 16.7% (7 vs 6), avg position stable
- Query entropy: 1 fragmented pages
- Hub candidates: 7
- Transition opportunities: 0
- AIO recommendations: 1
- Page velocity: 33 pages


## [2026-05-12] competitor-intelligence v2.2 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 15 (30 cached)
- High-priority gaps: 0
- AIO tasks: 6 generated | 3 applied to src/pages/ | 0 rejected (spec mismatch) | 3 pending passage text
- 8 pages analyzed × up to 3 queries each. 15 URLs crawled (30 cache hits). 0 high-priority gaps. Top editorial outrankers: btod.com, thehumansolution.com, forbes.com.


## [2026-05-12] competitor-intelligence v2.2 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 5 (44 cached)
- High-priority gaps: 0
- AIO tasks: 6 generated | 0 applied to src/pages/ | 0 rejected (spec mismatch) | 6 pending passage text
- 8 pages analyzed × up to 3 queries each. 5 URLs crawled (44 cache hits). 0 high-priority gaps. Top editorial outrankers: btod.com, thehumansolution.com, ergo.human.cornell.edu.


## [2026-05-12] competitor-intelligence v2.1 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 0 (49 cached)
- High-priority gaps: 2
- AIO capsule tasks: 4 → reports/geo-optimize-tasks.md
- 8 pages analyzed × up to 3 queries each. 0 URLs crawled (49 cache hits). 2 high-priority gaps. Top editorial outrankers: btod.com, thehumansolution.com, ergo.human.cornell.edu.


## [2026-05-12] competitor-intelligence v2.1 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 22 (27 cached)
- High-priority gaps: 2
- AIO capsule tasks: 0 → reports/geo-optimize-tasks.md
- 8 pages analyzed × up to 3 queries each. 22 URLs crawled (27 cache hits). 2 high-priority gaps. Top editorial outrankers: btod.com, thehumansolution.com, ergo.human.cornell.edu.


## [2026-05-11] strategy | Niche validation framework evaluation filed

Manual strategy note added for the "is this niche dead / how do I test niches faster?" question. Conclusion: the common mistake is treating early revenue as the validation signal on young domains. The durable model separates demand validation, distribution validation, and monetization validation. TCA is **not dead**: 15,417 impressions, 35 clicks, avg position 11, first commission already recorded. Faster expansion path is adjacent tall-workstation revenue streams on the current audience graph, not more fresh domains yet. Added raw source: `raw/strategy/2026-05-11-niche-validation-evaluation.md`. Added concept page: `wiki/pages/concepts/niche-validation-framework.md`. Updated `wiki/index.md`.

## [2026-05-11] analysis | CTR root cause + revenue projection + next build queued

Revenue projection (automation-only, no manual changes): $100–250 cumulative through end of 2026, ~$20–30/month run rate by Dec. CTR problem diagnosed as 80% AI Overview suppression (structural, meta rewrites don't fix it), 15% carousel burial (requires link building), 5% editorial page meta (already being fixed). Next automation build queued: `geo-optimize.ts` — monthly script that fetches live AI Overview content via SerpAPI and rewrites target page sections as citation capsules to get TCA cited inside the AIO. Full spec: `wiki/pages/concepts/geo-optimize-plan.md`. Secondary build: SERP-aware title comparison in `audit.ts`. No external service buys fix this.

## [2026-05-11] decision | Reddit pipeline permanently closed

Reddit/Apify pipeline marked CLOSED by Jackson. It was a one-time run; data is archived in `data/reddit/` and `raw/reddit/`. No schedule, no strategy.ts integration, no future mention unless explicitly requested.

## [2026-05-11] codebase-audit | Full automation codebase audit — truth vs wiki

Comprehensive read of every automation script, GitHub Actions workflow, and current reports to verify wiki accuracy.

**KEY FINDING: I3 (GA4 affiliate click tracking) is ALREADY IMPLEMENTED — wiki was wrong**
- `src/layouts/Layout.astro` contains a full `gtag('event', 'affiliate_click', {...})` implementation
- Fires on click/auxclick on any element with `data-affiliate-cta="true"`; deduped within 750ms
- All affiliate CTAs in src/pages/ carry `data-affiliate-cta`, `data-affiliate-program`, `data-cta-position` attributes
- The May 10 audit listed this as "NOT YET IMPLEMENTED" — that was incorrect. Code predated the audit.
- Updated: `wiki/pages/concepts/audit-implementation-2026-05-10.md` (I3 section now shows ALREADY IMPLEMENTED)

**KEY FINDING: affiliate-compliance.md disclosure status was overstated**
- May 10 audit claimed "6 pages missing FTC body disclosure" and wiki repeated this without verification
- Source-file check of 4 named pages found all 4 have inline `<strong>Disclosure:</strong>` blocks in page body
- `/review/gesture/` (line 184), `/aeron-vs-gesture/` (line 110), `/best-office-chairs/` (line 124), `/review/leap-plus/` (line 170)
- Remaining 2 pages (/, /knee-pain-seat-depth/, etc.) were NOT checked — status is now "unverified" not "missing"
- Updated: `wiki/pages/concepts/affiliate-compliance.md` with corrected per-page status table

**CONFIRMED: Items genuinely not implemented**
- I2 — GSC pagination: `gsc-pull.ts` uses fixed `rowLimit` with no token-based continuation loop. Confirmed absent.
- I4 — GSC wiki concept page consolidation: gsc-performance, gsc-intelligence, gsc-intelligence-system, gsc-analysis-strategy all exist as separate pages. Confirmed not consolidated.
- C1 — /review/gesture/ depth expansion: no REWRITE task in current weekly plan. Confirmed deferred.
- C2 — /review/leap-plus/ reframe: not in current weekly plan. Confirmed deferred.
- C3 — role differentiation office-chairs-for-tall-people vs best-office-chairs: confirmed deferred.
- Anthropic Batch: no usage anywhere in scripts/. Confirmed not implemented. Still on research backlog.

**CONFIRMED: competitor-intelligence.ts fully activated in monday.yml**
- monday.yml step 3 is `npx tsx scripts/competitor-intelligence.ts` (not competitor-monitor.ts)
- competitor-monitor.ts still exists but is NOT in monday.yml — it runs as manual only
- competitor-intelligence.ts is the active Monday agent for competitor analysis
- Updated: `wiki/pages/concepts/workflow-system-reference.md` Monday row corrected

**CONFIRMED: Phase 2 modules live in gsc-analyze.ts**
- Query entropy, impression gravity, intent transitions, AIO recommendations, page velocity all implemented
- These were absent from workflow-system-reference.md description
- Updated: `wiki/pages/concepts/workflow-system-reference.md` gsc-analyze description expanded

**Current cycle state (from reports/)**
- Last weekly-plan.md: 2026-05-10, 5 FIX + 1 NEW + 2 REWRITE tasks
- Last audit-report.md: generated 2026-05-09T23:52Z (data range through 2026-05-04)
- Last fixes-log.md: 2026-05-07 (9 successful fixes)
- Last weekly-summary.md: 2026-05-02 (Week of April 30 summary — no content published that week)
- index-monitor.md: 2026-05-11, 33/45 pages indexed, 12 with issues (all NEUTRAL/wait or noindex on intentional pages)
- GSC latest.json: 2026-05-11, 35 clicks, 15,417 impr, pos 11 (90-day)
- analysis.json: 2026-05-11, 24 actionable opportunities, 13 CTR leaks, site momentum flat

**wiki/index.md**: updated last_updated field

## [2026-05-11] wiki-maintenance | Full wiki ingest — May 10 SEO audit findings

Ingested all outstanding findings from the 2026-05-10 full SEO audit into living entity and concept pages. Previous state: audit snapshot pages existed but entity/concept pages had not been updated since Apr 6.

**Pages updated:**
- `wiki/pages/concepts/schema-markup.md` — added 7 critical open issues (itemReviewed ×4, WebSite @id, Article @id, Product @id ×2, gesture hub missing dates, spec error 17.75→18.75, publisher logo). Marked best-office-chairs JSON-LD fix as resolved.
- `wiki/pages/concepts/internal-linking.md` — marked size-guide orphan as fixed (May 10), added standing-desk near-orphan as open issue.
- `wiki/pages/concepts/meta-descriptions.md` — added 4 over-limit metas (aeron-size-c 166, leap-plus 170, gesture-vs-leap-plus 165, standing-desk 161). Added H1/title mismatch for aeron-vs-gesture.
- `wiki/pages/concepts/ai-citation-readiness.md` — updated GEO score 71→76/100, added AIO passage-anchor gap (tall-people), AIO suspect (seat-depth), AIO restructure needed.
- `wiki/pages/concepts/content-gaps.md` — added /office-chair-return-policy/ (Friday W20 plan). Corrected standing desk status: exists but near-orphaned, not unwritten.
- `wiki/pages/concepts/affiliate-compliance.md` — **NEW PAGE**. FTC body disclosure missing on 6 pages. Revenue leak CTA issues on 3 pages.
- `wiki/pages/site-pages/aeron-vs-gesture.md` — updated to May 11 metrics (348 impr, 8.5, 0%), H1/title mismatch, Quick Answer non-verdict, 0 CTAs in 84%.
- `wiki/pages/site-pages/aeron-tall-people.md` — updated to May 11 metrics (1,379 impr, 7.4, 0.29%), Meta fix logged (May 7), passage-anchor fix queued.
- `wiki/pages/site-pages/review-gesture.md` — updated to May 11 metrics (2,672 impr, 8.2, 0.11%), added schema/CTA/disclosure open issues.
- `wiki/pages/site-pages/best-office-chairs.md` — updated to May 11 metrics (776 impr, 22.5, 0%), Quick Picks CTA issue, FTC gap.
- `wiki/pages/site-pages/correct-chair-dimensions.md` — updated to May 11 metrics (1,766 impr, 15.8, 0.17%), restructure queued, spec error check needed.
- `wiki/pages/chairs/steelcase-gesture.md` — updated all GSC numbers, added schema issues, C1 status.
- `wiki/pages/chairs/herman-miller-aeron.md` — updated all GSC numbers, meta fix history, schema issues.
- `wiki/pages/chairs/steelcase-leap-plus.md` — updated all GSC numbers, schema issues, CRITICAL threshold on /tall-people/.
- `wiki/index.md` — added affiliate-compliance page.

**Root cause of staleness:** Audit snapshot files (audit-implementation-2026-05-10.md, audit-2026-05-10-seo.md) were written correctly but findings were never pushed back into the living entity/concept pages. Going forward: every audit ingest must update the affected entity/concept pages, not just write a snapshot file.

## [2026-05-11] decision | RunPod migration moved to backlog / soft reject

- Updated `wiki/pages/concepts/runpod-migration-proposal.md` status from UNDER CONSIDERATION to BACKLOG / soft rejected for TCA automation
- Reason: follow-up 24GB vs 48GB Qwen3-32B-AWQ benchmarks showed 48GB is not economical for the same model, and the benchmark harness was synthetic rather than TCA-shaped
- New default research path: investigate Anthropic Batch for non-urgent read-only jobs before considering any second inference provider
- Updated `wiki/index.md`, `wiki/synthesis/decisions-log.md`, and `wiki/synthesis/thesis.md` to reflect the decision

## [2026-05-11] manual note | Indexing Submission Gap Identified

- Gap: `verify-deploy.ts` has no URL submission step after Cloudflare deploy
- New pages are found passively via sitemap — can take days to weeks for Google to discover
- Likely contributing to 11 "URL is unknown to Google" entries in indexing-health
- Fix needed: add GSC Indexing API call in `verify-deploy.ts` post-deploy, targeting URLs written by `execute-content.ts`
- Logged in `wiki/pages/concepts/indexing-health.md` under Known Gap

## [2026-05-11] index-monitor | Indexing Health Check

- Pages inspected: 45
- Indexed: 33 | Issues: 12 | Fixed: 0
- Sitemap resubmitted: false
- Issues: https://tallchairadvisor.com/404/ (wait), https://tallchairadvisor.com/affiliate-disclosure/ (wait), https://tallchairadvisor.com/contact/ (wait), https://tallchairadvisor.com/leg-pain-circulation/ (wait), https://tallchairadvisor.com/privacy-policy/ (noindex), https://tallchairadvisor.com/author/jackson-christopher/ (wait), https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height/ (wait), https://tallchairadvisor.com/chairs/herman-miller-aeron/size-guide/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people/ (wait), https://tallchairadvisor.com/chairs/steelcase-gesture/weight-limit/ (wait), https://tallchairadvisor.com/chairs/steelcase-leap-plus/weight-limit/ (wait)


## [2026-05-11] competitor-intelligence v2 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 23 (23 cached)
- High-priority gaps: 0
- 8 pages analyzed × up to 3 queries each. 23 URLs crawled (23 cache hits). 0 high-priority gaps. Top editorial outrankers: btod.com, thehumansolution.com, forbes.com.


## [2026-05-11] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 13 (top leak: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches")
- Opportunities: 24 actionable
- AIO suspects: 1
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions down 1.2% WoW (3231 vs 3271), clicks up 16.7% (7 vs 6), avg position stable
- Query entropy: 1 fragmented pages
- Hub candidates: 7
- Transition opportunities: 0
- AIO recommendations: 1
- Page velocity: 33 pages


## [2026-05-11] gsc-pull | GSC Data Pull

- Period: 2026-02-10 → 2026-05-11 (90 days)
- Pages: 46 | Queries: 200 | PageQuery pairs: 475
- Device rows: 55 | Daily trend rows: 89
- Clicks: 35 | Impressions: 15417 | Avg pos: 11


## [2026-05-11] index-monitor | Indexing Health Check

- Pages inspected: 45
- Indexed: 0 | Issues: 45 | Fixed: 0 — NOTE: all failures were API errors (wrong API client bug, now fixed)
- Sitemap resubmitted: false


## [2026-05-11] competitor-monitor | Competitor Scan (old script — replaced by competitor-intelligence.ts)

- Monitored: 5 pages (5 live, 0 dead)
- Gaps found: 3
- Note: This was the legacy competitor-monitor.ts. monday.yml now wired to competitor-intelligence.ts.


## [2026-05-11] gsc-analyze | GSC Intelligence Analysis (ran on stale May 10 data — gsc:pull skipped bug, now fixed)

- CTR leaks: 12 (top leak: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches")
- Opportunities: 23 actionable
- AIO suspects: 2
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions up 29.1% WoW (3582 vs 2774), clicks up 125% (9 vs 4), avg position stable
- Query entropy: 1 fragmented pages
- Hub candidates: 7
- Transition opportunities: 0
- AIO recommendations: 2
- Page velocity: n/a (insufficient history)

## [2026-05-10] research | RunPod + Local Model Migration Proposal

- **Status:** 🟡 UNDER CONSIDERATION — not approved, not implemented. Jackson reviewing with other LLMs before any decision.
- **Trigger:** Manual `/seo-audit` run on 2026-05-09 revealed issues the automated weekly workflow never caught (security headers, robots.txt, sitemap gaps, schema structure errors). Prompted evaluation of whether the automation intelligence layer can be improved and/or made cheaper.
- **Claude API baseline established:** $85–136/year across full weekly cycle (execute-fixes.ts 3 calls/fix × 3–5 fixes/week is the dominant cost, not the intelligence agents).
- **Core proposal:** Replace intelligence agent Claude calls with Gemma 4 31B (GPQA 84.3%, exceeds Sonnet 75.4%) on RunPod 24GB serverless ($35.57/yr at 1hr/wk). Keep Claude API for execute-content.ts (page writing).
- **New architecture explored:** "Sunday Intelligence Pod" — single weekly pod run loads model once, runs all intelligence agents sequentially (no repeated cold starts), commits output to git. Mon–Fri workflows become dumb executors reading pre-computed intelligence.
- **New capabilities identified:** GSC query embedding/clustering, semantic competitor gap analysis (vs. current structural-only), full-site quality matrix (all 50 pages, not top 20), Reddit automation reconnected to strategy, content brief pre-generation.
- **Models benchmarked:** Qwen3 series, DeepSeek-R1/V3 series, Gemma 4 series, Kimi K2 series, Llama 3.1/3.3, Phi-4, Mistral Small 3.1. Full table in raw document.
- **Not viable for single GPU:** Kimi K2 (1T params), DeepSeek-R1 full (671B), Llama 3.1 405B — all require 370–550GB VRAM.
- **Raw document:** `raw/strategy/2026-05-10-runpod-migration-proposal.md`
- **Wiki page:** `wiki/pages/concepts/runpod-migration-proposal.md`

## [2026-05-10] seo-audit | Full SEO Audit (77/100)

- **6-specialist parallel audit:** technical (84), content (74), schema (71), sitemap (83), performance (90), visual/mobile (74)
- **New critical findings:** `itemReviewed` missing from all 4 Review schema nodes (likely blocking rich results); affiliate disclosure absent from body on 6 pages (FTC compliance); WebSite `@id` dangling reference; `/chairs/steelcase-gesture/` missing datePublished/dateModified; Gesture seat depth spec error in knee-pain FAQ (17.75"→18.75")
- **New high findings:** Aeron vs Gesture has 0 affiliate links in first 84% of page (explains 348 impr / 0 click); H1/title mismatch on aeron-vs-gesture; Quick Answer is non-verdict; Gesture review single affiliate link at 85%; Best Office Chairs Quick Picks links to internal pages not Amazon; Product @id missing on Aeron + Leap Plus reviews
- **New medium findings:** 5 height pages have zero images; image Cache-Control conflict (immutable + must-revalidate); 4 meta descriptions over 160 chars; standing-desk near-orphaned (1 inbound link); stale sitemap lastmod; deprecated priority/changefreq on all 40 sitemap URLs
- **Performance is excellent:** 90/100 — CF-Cache HIT, brotli, HTTP/3, CLS ~0, LCP estimated 1.2–1.8s
- **Raw report:** `raw/audits/2026-05-10-full-seo-audit.md`
- **Wiki page:** `wiki/pages/concepts/audit-2026-05-10-seo.md`

## [2026-05-10] bug fix | mergeCanonicalDuplicates pageQuery key fix

- **Root cause found:** `mergeCanonicalDuplicates()` keyed on `normalizeUrl(page)` for pageQuery rows, collapsing all 46 queries on `/review/gesture/` into one entry. Summed impressions (303) and min position (1) propagated to `ctrLeaks` — producing a false top leak ("steelcase gesture review", 304 impr, pos 1) when actual raw values are 12 impr, position 49.9.
- **Fix:** Added `keyFn` param to `mergeCanonicalDuplicates`. `pageQueries` call now keys on `page|query`. `page` field preserved as `normalizeUrl(row.page)` regardless of key strategy.
- **Re-ran:** `npm run gsc:analyze` — output clean. "steelcase gesture review" absent from ctrLeaks (correctly filtered). Top leaks now reflect real data: Cornell seat-depth queries on `/knee-pain-seat-depth/` and AIO suspects on `/chairs/steelcase-gesture/seat-depth/`.
- **Wiki updated:** `gsc-intelligence-system.md` (bug history section), `decisions-log.md` (new entry + corrected stale data reference).

## [2026-05-10] gsc-analyze | GSC Intelligence Analysis (post-fix)

- CTR leaks: 18 (top leak: /chairs/steelcase-gesture/seat-depth/ — "steelcase gesture seat depth range inches", AIO suspect)
- Opportunities: 33 actionable
- AIO suspects: 2
- Affiliate alerts: 1 high-urgency
- Site momentum: Impressions up 29.1% WoW (3582 vs 2774), clicks up 125% (9 vs 4), avg position stable
- Cannibalization: 18 conflicts
- AIO recommendations: 2
- Page velocity: n/a (insufficient history)


## [2026-05-10] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 12 (top leak: /chairs/steelcase-gesture/seat-depth/|steelcase gesture seat depth range inches — "steelcase gesture seat depth range inches")
- Opportunities: 23 actionable
- AIO suspects: 2
- Affiliate alerts: 0 high-urgency
- Site momentum: Impressions up 29.1% WoW (3582 vs 2774), clicks up 125% (9 vs 4), avg position stable
- Query entropy: 0 fragmented pages
- Hub candidates: 0
- Transition opportunities: 0
- AIO recommendations: 2
- Page velocity: n/a (insufficient history)


## [2026-05-10] wiki | Continuity sweep — contradictions resolved + log deduped

- **thesis.md:** Clarified "304 impr at pos 1, 8.33% CTR" as query-level data for "steelcase gesture review" query — not page-level (page is 2,529 impr, pos 8.2, 0.12% CTR)
- **ctr-optimization.md:** Updated site-wide numbers to May 10 (14,767 impr, 35 clicks), refreshed per-page CTR table, removed stale /best-office-chairs/ schema error claim (resolved May 7), noted meta rewrites ran May 7 (awaiting signal)
- **content-gaps.md:** Marked height-bracket verdict table as DONE (added May 7 with affiliate links)
- **ai-citation-readiness.md:** Marked height-bracket verdict table as DONE; updated last_updated
- **what-works.md:** Updated gesture review (1,895 → 2,529 impr), gesture/seat-depth (710 → 905 impr), updated meta test status from "coming May 8" → "deployed May 7, awaiting signal"
- **what-failed.md:** Updated "Not Yet Enough Data" section — verdict table shipped, meta test ran, C1/C2 queued for upcoming weeks
- **log.md:** Removed 11 duplicate test-run entries from May 10 (5 strategy plans + 6 competitor-intelligence v2 runs that were dev iterations)
- **MEMORY.md:** Confirmed stale `currentDate: 2026-05-10` entry already absent from disk
- **One potential data flag to investigate:** gsc-intelligence.md CTR leak table shows "steelcase gesture review" at 304 impr × 8.33% CTR ≈ 25 clicks, but page-level shows 3 total clicks. May be GSC sampling divergence between page+query dimension vs page dimension. Worth checking analysis.json directly.

## [2026-05-10] wiki | Data corrections — gesture GSC numbers + competitor-intelligence activation

- Corrected /review/gesture/ data across audit-implementation C1, review-gesture entity page, and wiki index. The figure "304 impr at pos 1 / 8.33% CTR" was unverified narrative from the audit doc — actual latest.json: 2,529 impr, pos 8.2, 3 clicks, 0.12% CTR
- Updated wiki index with current numbers for all site-page entries (from latest.json, May 10)
- Corrected SerpAPI free tier: 250 credits/month (not 100) across workflow-system-reference, audit-implementation, decisions-log
- Updated competitor-intelligence I1 status from "ACTIVATION REQUIRED" to "ACTIVATED" — SERP_API_KEY + FIRECRAWL_API_KEY confirmed in .env and GitHub secrets

## [2026-05-10] wiki | workflow-system-reference updated

- Added `gsc-analyze.ts` to Monday's workflow step (was missing — monday.yml runs it immediately after gsc-pull.ts)
- Updated Data Flow diagram to show Monday: pull → analyze → intelligence
- Added `gsc-analyze.ts` agent description to "What Each Agent Does"
- Updated `strategy.ts` description to document `enforcePlanConstraints()` post-generation enforcement
- Updated GitHub Secrets table to add optional `SERP_API_KEY` + `FIRECRAWL_API_KEY` for competitor-intelligence.ts
- Updated manual running commands to include all Monday steps + monthly competitor intelligence

## [2026-05-10] strategy | Autonomous enforcement hardening

- **Cooldown in code:** `getPagesOnCooldown()` builds a 14-day git-log Set. `enforcePlanConstraints()` drops any FIX/REWRITE for a page in that Set unless the task contains a technical keyword (schema, canonical, noindex, 404, etc.)
- **Impression threshold in code:** Non-technical FIX tasks for pages with <300 impressions are dropped. GSC lookup via `lookupImpressions()` (analysis.json opportunities → ctrLeaks → latest.json pages).
- **Bad file refs → hard drop:** Was `console.warn` (plan saved anyway). Now dropped in enforcement — same handling as duplicate slugs.
- **Conditional language → hard drop:** Tasks containing "verify before executing", "only if... cooldown", "if page is still", etc. are dropped. Strategy must decide, not defer to execution.
- **FIX+REWRITE overlap → REWRITE dropped:** If a page appears in both FIXES and REWRITES, REWRITE is dropped to prevent conflicting edits.
- **Max 5 FIX tasks → enforced:** Tasks beyond the cap are dropped (not silently generated).
- **DROPPED TASKS section appended to plan:** Enforcement log appears in archived plan for debugging without affecting execution.
- **Zero-valid-tasks check moved to post-enforcement:** Previous check ran on raw Claude output; now checks after all drops — correct failure mode.
- **Validated against current plan:** Would correctly drop 3 tasks (/fit-guides/ 178 impr, /seat-depth/ 101 impr, /knee-pain/ REWRITE with conditional language).

## [2026-05-10] competitor-intelligence v3 | Structured Extraction + Finding Type Classification

- **BUILT — structured section extraction:** `extractTcaContent()` now parses the page into named sections via `parseSections()` and prepends a `[SECTION MANIFEST]` listing every H1–H3 heading with its character count and attributes (table/faq/cta). The manifest is always emitted in full before the content budget is consumed — model can no longer infer "section X is absent" from a truncated excerpt. Resolves the gesture 61% coverage false-positive class structurally.
- **BUILT — formal finding type taxonomy:** `FindingType = 'absence_claim' | 'structure_claim' | 'depth_claim' | 'spec_gap'`. Added to `RawGapFinding` + `GapFinding` interfaces. `classifyFindingType()` provides deterministic classification; Claude's JSON output is validated against it and corrected when invalid.
- **UPGRADED — confidence filter:** `applyConfidenceFilter()` now uses `f.findingType` instead of regex ABSENCE_PATTERNS. Also downgrades `spec_gap` under low coverage (missing-table claims are absence-adjacent). `depth_claim` and `structure_claim` pass through at any coverage level.
- **UPGRADED — analyzeGaps prompt:** Asks Claude to supply `findingType` in JSON. Claude classification is preferred if valid; deterministic fallback runs otherwise. Two-layer validation.

## [2026-05-10] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-05-10-weekly-plan.md
- 5 fixes, 1 new page, 2 rewrites
- Intelligence source: competitor-intelligence v2 with coverage-confidence filter (trusted-only gaps)
- Key changes vs. prior iteration: coverage-aware downgrade filter eliminated gesture warranty false positive; unknown-editorial now last-resort only; 7 high-priority trusted gaps across 8 pages

## [2026-05-10] competitor-intelligence v2 | Strategic Run

- Pages: 8 | Queries: 23 | Crawls: 20 (34 cached)
- High-priority gaps: 7 trusted (after coverage-confidence filter)
- Coverage-confidence filter added: two-band downgrade (<70% hard, 70–90% soft) for absence claims
- Unknown-editorial demoted to last-resort (only backfills when zero known editorial sources)
- gesture false positive eliminated (61% coverage, hard-downgrade zone)


## [2026-05-10] session | Built competitor-intelligence.ts (I1)

- New script: `scripts/competitor-intelligence.ts` — 3-stage pipeline (SerpAPI → Firecrawl → Claude Sonnet)
- `package.json`: added `competitor:intelligence` script
- `.env`: added empty `SERP_API_KEY` and `FIRECRAWL_API_KEY` placeholders
- Audit tracker (I1): marked BUILT — activation requires adding API keys to .env + GitHub secrets
- Decisions log updated

## [2026-05-10] session | Next-steps execution (friday.yml fix + weekly plan update)

- Fixed friday.yml: added `ref: staging` to checkout step — Friday now reads current plan from staging, not stale main
- Fixed friday.yml: added `Warn if no content written` step — `CONTENT_WRITTEN=false` now surfaces as GitHub Actions warning (was silent green)
- Updated `reports/weekly-plan.md` for week of 2026-05-10: C1 (Gesture depth expansion REWRITE), C2 (Leap Plus reframe REWRITE), + shoulder pain new content
- Updated `wiki/pages/concepts/audit-implementation-2026-05-10.md`: Friday branch bug marked FIXED
- Deferred for future session: C3 L3/L5 differentiation, I1 SERP API + Firecrawl pipeline

## [2026-05-10] session | Combined Audit Implementation

- Source: `raw/audits/COMBINED_2026-05-09_MASTER_AUDIT.md` (adjudicated 6/10, 21 findings)
- Full status: `wiki/pages/concepts/audit-implementation-2026-05-10.md`
- Bugs fixed: friday.yml force-push (main→staging), strategy.ts hard error on malformed plan
- Data restored: gsc:pull --force → deviceSplit (53 rows) + dailyTrend (88 rows); siteTrend + deviceIntelligence non-null
- Data integrity: URL canonical normalization, freshness guards, junk query filter in CTR leak detector
- Agent safety: voice check in index-monitor.ts before write, 6-pattern voice detection (was 3), failed draft archival
- SEO: author page removed from sitemap + canonical fixed; best-office-chairs.astro dates aligned; knee-pain-seat-depth Cornell title + verdict box; size-guide de-orphaned (2 inbound links)
- Build: 45 pages, zero errors. Commit pushed to main.
- Deferred: C1 Gesture depth, C2 Leap Plus reframe, C3 L3/L5 differentiation, I1 SERP API pipeline

## [2026-05-10] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 18 (top leak: /review/gesture/ — "steelcase gesture review")
- Opportunities: 23 actionable
- AIO suspects: 2
- Affiliate alerts: 2 high-urgency
- Site momentum: Impressions up 29.1% WoW (3582 vs 2774), clicks up 125% (9 vs 4), avg position stable
- Query entropy: 0 fragmented pages
- Hub candidates: 0
- Transition opportunities: 0
- AIO recommendations: 2
- Page velocity: n/a (insufficient history)


## [2026-05-10] gsc-pull | GSC Data Pull

- Period: 2026-02-09 → 2026-05-10 (90 days)
- Pages: 46 | Queries: 200 | PageQuery pairs: 465
- Device rows: 53 | Daily trend rows: 88
- Clicks: 35 | Impressions: 14767 | Avg pos: 11.1


## [2026-05-10] wiki-cleanup | Workspace Root Cleanup

- Moved 5 files from `AUDIT/` → `raw/audits/` (agent-logic-audit, blind-spots-and-errors, next-claude-prompt, optimization-plan, system-overview)
- Moved `AUTOMATION-SYSTEM.md` → `raw/strategy/2026-04-06-automation-system.md`
- Deleted empty `Untitled.md`
- Moved `Incognito Searches/` screenshots → `raw/assets/incognito-searches-2026-04-22/`
- Workspace root now clean: CLAUDE.md, SCHEMA.md symlink, wiki/ symlink, raw/ symlink, tall-chair-advisor/, .claude/, .obsidian/

## [2026-05-10] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 11 (top leak: /review/gesture/ — "steelcase knee brace review")
- Opportunities: 23 actionable
- AIO suspects: 2
- Affiliate alerts: 0 high-urgency
- Site momentum: n/a
- Query entropy: 1 fragmented pages
- Hub candidates: 7
- Transition opportunities: 0
- AIO recommendations: 2
- Page velocity: n/a (insufficient history)


## [2026-05-10] gsc-analyze | GSC Intelligence Analysis

- CTR leaks: 11 (top leak: /review/gesture/ — "steelcase knee brace review")
- Opportunities: 23 actionable
- AIO suspects: 2
- Affiliate alerts: 0 high-urgency
- Site momentum: n/a


## [2026-05-09] manual-session | GSC Data Gap Analysis + gsc-analyze.ts Decision

- **AUDIT FINDING — GSC data is severely underused:** `gsc-pull.ts` collects pages (46), queries (200), page+query combos (427), and totals. But agents only read: `pages` sorted by impressions (audit.ts), `pages.slice(0,5)` (strategy.ts), `totals` only (verify-deploy.ts). The 200 queries and 427 page+query rows are pulled every Monday and read by zero agents.
- **AUDIT FINDING — Device dimension not collected at all:** No mobile/desktop/tablet breakdown exists in `data/gsc/latest.json`. The GSC API supports `['device']` and `['page', 'device']` dimensions but `gsc-pull.ts` doesn't request them.
- **AUDIT FINDING — No date-dimension data:** No week-over-week trend or velocity detection. The API supports `['date']` dimension for 16+ weekly data points but it's not pulled.
- **CONCRETE EXAMPLE — Cornell cluster invisible to all agents:** Query-level data reveals a cluster of 6 intent-identical variants of "cornell ergonomics chair seat depth [two fingers / 2-3 fingers / 2 inches] behind knees" driving 165 combined impressions at pos 8–10 on `/knee-pain-seat-depth/` with 0 CTR. No agent has ever seen this because they don't read `pageQueries`. Diagnosis: page title "Seat Depth & Knee Pain: The Fix for Tall People" misses the Cornell intent — a one-word title change (add "Cornell ergonomics") would likely unlock these clicks. Agents currently see this page as "1,524 impr, pos 8.8, 0.13% CTR" with no query context.
- **CONCRETE EXAMPLE — AIO diagnosis from pos 4.2 with 0 CTR:** `/chairs/steelcase-gesture/seat-depth/` ranks pos 4.2 for "steelcase gesture seat depth range inches" (23 impr, 0 CTR). Title already contains the spec numbers — this is NOT a title/meta problem. Pattern = AI Overview consuming the answer above organic results. Fix is content restructuring for AIO citation, not a meta rewrite. Without query-level analysis no agent would reach this conclusion.
- **CONCRETE EXAMPLE — Knee brace intent mismatch on /review/gesture/:** "steelcase knee brace review" drives 91 impr at pos 7.3 + "steelcase knee brace review 2026" drives 18 impr at pos 3.5, both 0 CTR. Review meta mentions "seat depth, armrests, back height" — no mention of knee support. A single meta description update would likely unlock these clicks.
- **DECISION — Build gsc-analyze.ts:** New script to run on Monday after `gsc-pull.ts`. Groups query variants into intent clusters, identifies CTR leaks with intent context, flags device divergence, surfaces AIO patterns (high position + 0 CTR with spec queries), writes structured analysis to `wiki/pages/concepts/gsc-analysis-strategy.md` and `data/gsc/analysis.json`. Strategy agent on Wednesday auto-reads the wiki page via `readConceptContext()` — no other agent changes needed.
- **DECISION — Expand gsc-pull.ts:** Add `['device']`, `['page', 'device']`, and `['date']` dimensions to Monday pull. Enables mobile/desktop CTR split and week-over-week velocity analysis.
- See new concept page: `wiki/pages/concepts/gsc-analysis-strategy.md`

## [2026-05-09] manual-session | Full System Audit (AUDIT/ folder)

- **Full system audit performed:** Spawned comprehensive audit agent to review entire codebase, all agent scripts, wiki, strategy files, workflow files, and prompts.
- **5 audit documents created in `/AUDIT/`:**
  - `TCA_SYSTEM_OVERVIEW.md` — plain-English system description
  - `TCA_BLIND_SPOTS_AND_ERRORS.md` — all discovered issues and funnel violations
  - `TCA_AGENT_LOGIC_AUDIT.md` — agent-by-agent analysis with prompt improvements
  - `TCA_OPTIMIZATION_PLAN.md` — 20 items prioritized Critical/High/Medium
  - `TCA_NEXT_CLAUDE_PROMPT.md` — self-contained prompt for next implementation session
- **Key findings from audit:** Homepage routes L0→L5 in 2 clicks (skips educational funnel). `/office-chairs-for-tall-people/` and `/best-office-chairs/` cannibalizing same head term. Friday agent could overwrite existing pages (now fixed). AMAZON_URL placeholder undetectable by affiliate checker (now fixed). `pageLastmod` in astro.config.mjs manually maintained with no agent updating it.

## [2026-05-09] manual-session | Pipeline Bug Fixes (8 fixes from system audit)

- **FIX 1 — audit.ts regex:** Meta description regex changed from `(.*?)` to `([^"]*)`. The lazy quantifier stopped at apostrophes in content like `6'4"`, truncating descriptions and causing false audit flags.
- **FIX 2 — execute-content.ts overwrite guard:** `writeNewPage()` now checks `existsSync(fullPath)` before writing. If the file exists, returns a SKIPPED result instead of silently overwriting. Prevents strategy agent duplicate-slug prescriptions from destroying live pages.
- **FIX 3 — execute-content.ts + verify-deploy.ts AMAZON_URL guard:** Added check for unresolved `href="AMAZON_URL` placeholder in both `validateAstroFile()` (execute-content.ts) and `checkAffiliateLinks()` (verify-deploy.ts). Catches cases where Claude doesn't replace the template CTA — previously these passed the affiliate link check because `AMAZON_URL` isn't an amazon.com URL.
- **FIX 4 — competitor-monitor.ts gap deduplication:** `## Recent Competitor Gaps` section is now fully replaced on each Monday run instead of prepended to. Previous logic prepended new rows without removing old ones, causing unbounded growth and duplicate gap rows.
- **FIX 5 — strategy.ts plan validation:** Added `countParsedItems()` after Claude call. If plan has section headers but zero parseable tasks (wrong pipe count, renamed section), a WARNING is logged with first 1000 chars of the raw plan for manual review. Silent empty plans no longer commit without warning.
- **FIX 6 — verify-deploy.ts summary system prompt:** Saturday Claude call now has a system prompt (factual, terse, trend-aware) and passes prior-week GSC metrics from `gsc-performance.md` historical snapshots. Previous call had no system prompt and no trend context — produced generic output.
- **FIX 7 — .claude/agents/tca-audit.md memory path:** Corrected path from `/Downloads/Claude TCA Workspace/.claude/agent-memory/tca-seo-strategist/` to `/Downloads/Claude-Projects/PROJECTS/Claude TCA Workspace/.claude/agent-memory/tca-audit/`. Old path was wrong directory AND wrong agent name.
- **FIX 8 — .claude/agents/tca-audit.md regex syntax:** Two Python regex examples had `["\'\]` (misplaced backslash before `]`) — this made the character class unterminated, producing a runtime `re.error`. Fixed to `["\']\s+` on lines 37, 38, and 49.

## [2026-05-09] audit | Weekly Site Audit

- Pages audited: 20
- Clicks: 29 | Impressions: 12209
- Full report archived to raw/audits/2026-05-09-weekly-audit.md


## [2026-05-09] manual-session | Saturday Workflow Bug Fixes (GSC data + main overwrite)

- **BUG FIXED — Saturday agent reading stale GSC data:** Saturday workflow checked out `staging`, then ran all agents (verify-deploy.ts reads `data/gsc/latest.json`). But Monday's GSC pull commits to `main`, not staging. If staging was behind main, agents ran with week-old GSC data. Fix: added a merge step immediately after checkout — `git fetch origin main && git merge origin/main` — before `npm ci`, build, or any agent runs. Agents now always get the latest GSC data.
- **BUG FIXED — Saturday force-push overwriting manual main fixes:** Saturday used `git push origin HEAD:main --force-with-lease` to deploy staging → main. Manual fixes pushed directly to main (without going through staging) were silently overwritten on next Saturday run. Fix: removed force push. The upfront merge of origin/main into staging means staging is always a superset of main — regular push works without force.
- **Commit pushed:** `7319a40` on `main`. Change: `.github/workflows/saturday.yml` (+8 lines, net).

## [2026-05-09] manual-session | Agent Reliability Audit + Deep Fixes

- **Full audit performed:** Reviewed all 6 agent scripts, all 6 workflow files, wiki accuracy, and GSC data vs. wiki claims. Cross-referenced this week's run history (Mon–Sat) against actual outputs.
- **Root causes identified and fixed across 5 files:**
  1. `execute-fixes.ts` — Added targeted edit mode for meta/title changes. Now generates only the changed value (1-2 sentences) and applies it via regex to the `<Layout>` tag. Full-file rewrite path kept for complex changes (schema, affiliate links, verdict tables). This eliminates em-dash bleed, structural regressions, and word count drops for the most common fix type. Also added `&quot;` encoding for generated values.
  2. `execute-content.ts` — Replaced truncated 3000-char example page (which cut off before `<Layout>`) with a purpose-built compact template showing all structural elements in correct position. Added `getImportPrefix()` to calculate correct `../layouts/` depth from slug. Added one retry: validation failure reason is injected back and generation retried once before giving up.
  3. `strategy.ts` — Fixed REWRITE format template: was showing 3 pipe-separated fields, parser requires 4. All REWRITE tasks were silently dropped. Fixed template comment to show correct 4-field format.
  4. `thursday.yml` — Added per-file build rollback: if build fails, grep the error output for the failing `.astro` file, roll back just that file to HEAD, log it in fixes-log.md, retry build. Other successful fixes still commit.
  5. `wiki/index.md` — Updated stale entity summaries. /review/gesture/ was at "581 impr, pos 10.31" (March data) — actually 1895 impr, pos 8.4. Aeron tall-people "0% CTR crisis" — actually 3 clicks (0.26% CTR). Total impressions "4,106" — actually 12,209.
- **What's true vs. false in wiki confirmed:** `wiki/pages/concepts/gsc-performance.md` is current (updated by Tuesday audit agent). Only `wiki/index.md` summary row text was stale — fixed.
- **$20/month API cost question answered:** Full weekly cycle costs ~$3–5/month in API calls. Well under $20. A second Claude Pro account is a chat interface with no automation capability — GitHub Actions + API is the correct architecture.

## [2026-05-07] manual-session | Thursday Build Failure Recovery + Weekly Plan Execution

- **Root cause:** Thursday workflow's `execute-fixes.ts` wrote a Claude-generated version of `knee-pain-seat-depth.astro` containing an em dash (U+2014) in a JavaScript expression context inside the HTML template. esbuild rejected it as `Unexpected "—"` at line 103, col 245. CI failed before the commit step — repo was clean.
- **Agent hardened:** Added `sanitizeFrontmatter()` to `execute-fixes.ts` — strips em dashes, en dashes, and curly quotes from the frontmatter JS block (replaces with `—`/`–`/ASCII) before writing. HTML template section untouched. Also added a system prompt rule explicitly prohibiting Unicode in frontmatter.
- **All 5 weekly-plan Thursday tasks applied manually:**
  - `/review/gesture/` redirect — already in `_redirects`, no change needed
  - `/aeron-vs-gesture/` redirect — already in `_redirects`, no change needed
  - `/review/aeron-size-c/` meta → verdict-first (removed "In-depth" filler)
  - `/chairs/steelcase-gesture/` meta → verdict-first spec hook
  - `/knee-pain-seat-depth/` title 72→48 chars, meta answer-first
- **Rewrite task applied:** `/best-office-chairs/` Height-Bracket Verdict Table — added Amazon affiliate links (tag=tallchairadvi-20) to all chair names in Top Pick + Runner-Up columns
- **`dateModified` + sitemap `pageLastmod`** updated to 2026-05-07 for all 4 touched pages
- **Pushed to main:** commit `2ecc8a9`

## [2026-05-06] manual-session | Pipeline Repair + Trajectory Review

- **First commission logged:** $18 on May 1 from Amazon. Gesture review is the source. Full funnel confirmed.
- **GSC synced:** Local workspace was 12 commits behind remote. Pulled all agent commits from Apr 27 – May 6. Current state: 12,209 impr, 29 clicks, pos 11.5 (90-day).
- **Thursday cooldown bug found and fixed:** Shallow clone (`fetch-depth:1`) caused `git log -1` to always return today's date → every file permanently "edited 0d ago" → 14-day cooldown never cleared → 3 weeks of zero fixes. Fix committed: `fetch-depth: 0` added to thursday.yml.
- **Friday silent failure diagnosed and fixed:** Markdown backticks in strategy-agent-generated slugs (e.g. `` `/slug/` ``) corrupted file paths → pages written to invalid locations → `CONTENT_WRITTEN=false` → 3 weeks of zero content. Fix: strip backticks in `parsePlan()`. Added validation logging + always-commit content-log on failure.
- **SERP suppression conclusions reassessed:** April 22 finding still valid in scope (carousels on head terms, AI Overviews on 2 specific spec queries). But "meta rewrites won't help" was overgeneralized — does not apply to review/comparison pages on editorial SERPs. Thursday meta fixes are correct.
- **Wiki updated:** `what-works.md` (major post-April update), `thesis.md` (current state + revised priorities), `decisions-log.md` (W19 entry).

## [2026-05-06] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-05-06-weekly-plan.md
- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation


## [2026-05-05] audit | Weekly Site Audit

- Pages audited: 20
- Clicks: 29 | Impressions: 12209
- Full report archived to raw/audits/2026-05-05-weekly-audit.md


## [2026-05-04] competitor-monitor | Competitor Scan

- Monitored: 5 pages (5 live, 0 dead)
- Gaps found: 3
- Summary: Our core problem is a mismatch between decent ranking positions and near-zero CTR, driven by generic title tags, missing schema, and under-built content that cannot compete with ChairsFX or Wirecutter on depth. The immediate highest-ROI actions are schema + title rewrites on already-ranking pages (Gesture review, knee-pain guide) to harvest impressions we are already earning, followed by a full rebuild of the /office-chairs-for-tall-people/ cornerstone page to break out of page 2. A new /big-and-tall-office-chairs/ page captures adjacent commercial intent that BTOD owns by default, simply because we have no competing URL indexed for it.


## [2026-05-04] gsc-pull | GSC Data Pull

- Period: 2026-02-03 → 2026-05-04 (90 days)
- Pages: 46 | Queries: 200
- Clicks: 29 | Impressions: 12209 | Avg pos: 11.5


## [2026-05-02] verify-deploy | Saturday Deploy

- Status: DEPLOYED
- Checks: Secrets scan: ✅, Affiliate links: ✅, Voice constraint: ✅, Credentials not staged: ✅, Schema validity: ✅, Internal links: ✅, Content regression: ✅
- Weekly summary: wiki/weekly/2026-W18.md


## [2026-04-30] execute-fixes | Thursday Fixes Applied

- /review/leap-plus/ → src/pages/review/leap-plus.astro
- /knee-pain-seat-depth/ → src/pages/knee-pain-seat-depth.astro
- /chairs/steelcase-leap-plus/tall-people/ → src/pages/chairs/steelcase-leap-plus/tall-people.astro
- /back-pain-spine-height/ → src/pages/back-pain-spine-height.astro


## [2026-04-29] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-04-29-weekly-plan.md
- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation


## [2026-04-28] audit | Weekly Site Audit

- Pages audited: 20
- Clicks: 23 | Impressions: 8455
- Full report archived to raw/audits/2026-04-28-weekly-audit.md


## [2026-04-27] competitor-monitor | Competitor Scan

- Monitored: 5 pages (5 live, 0 dead)
- Gaps found: 3
- Summary: Tallchairadvisor.com has a real visibility asset — nearly 5,000 monthly impressions spread across its top pages — but is failing to convert that exposure into clicks due to weak title/meta copy, thin content relative to competitors, and missing structured data across all high-impression pages. The single highest-leverage move this week is fixing the Gesture review and the dimensions guide, which together account for 2,339 impressions and are sitting within 3–10 positions of a page-1 breakthrough. The pillar page at position 30 is a structural problem that, once addressed, should lift rankings across the entire tall-people chair keyword cluster through improved topical authority.


## [2026-04-27] gsc-pull | GSC Data Pull

- Period: 2026-01-27 → 2026-04-27 (90 days)
- Pages: 45 | Queries: 200
- Clicks: 23 | Impressions: 8455 | Avg pos: 12.6


## [2026-04-25] verify-deploy | Saturday Deploy

- Status: DEPLOYED
- Checks: Secrets scan: ✅, Affiliate links: ✅, Voice constraint: ✅, Credentials not staged: ✅, Schema validity: ✅, Internal links: ✅, Content regression: ✅
- Weekly summary: wiki/weekly/2026-W17.md


## [2026-04-23] execute-fixes | Thursday Fixes Applied

- /knee-pain-seat-depth/ → src/pages/knee-pain-seat-depth.astro
- /review/aeron-size-c/ → src/pages/review/aeron-size-c.astro
- /back-pain-spine-height/ → src/pages/back-pain-spine-height.astro
- /chairs/steelcase-leap-plus/tall-people/ → src/pages/chairs/steelcase-leap-plus/tall-people.astro


## [2026-04-22] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-04-22-weekly-plan.md
- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation


## [2026-04-22] manual-session | SERP Incognito Audit + CTR Root Cause Diagnosis

- **Method:** 18 incognito screenshots across zero-CTR page-1 queries and money queries from gsc-2026-04-20.json
- **Confirmed AI Overviews:** `herman miller aeron size c height range` (pos 9) + `steelcase gesture 360 armrests description` (pos 7.8) — both 0% CTR explained
- **Shopping carousel suppression confirmed:** All "best office chair for tall people" variants have product carousels above organic results. TCA buried at pos 65–79 with no path to clicks even if it ranked pos 5.
- **BTOD dominates video carousels** on nearly every SERP. TCA has no video presence. (Jackson declined YouTube.)
- **Reddit appears organically** in product SERPs (r/OfficeChairs visible on Leap Plus queries).
- **CTR diagnosis revised:** Root cause is structural SERP suppression (AI Overviews + carousels), not meta descriptions. Verdict-first meta hypothesis was wrong as a primary fix.
- **Priority order updated:** GEO → height-specific page depth → PAA targeting → schema fix → Reddit
- **Raw audit saved:** `raw/audits/2026-04-22-serp-analysis.md`
- **Wiki pages updated:** ctr-optimization.md, ai-citation-readiness.md, what-failed.md, thesis.md


## [2026-04-21] audit | Weekly Site Audit

- Pages audited: 20
- Clicks: 19 | Impressions: 7096
- Full report archived to raw/audits/2026-04-21-weekly-audit.md


## [2026-04-20] manual-session | Index Monitor Agent Added

- **New script:** `scripts/agents/index-monitor.ts` — Monday indexing health check
- **Inspects:** All pages in `src/pages/**/*.astro` via GSC URL Inspection API
- **Diagnoses:** noindex tags, robots.txt blocks, soft-404s, thin content, not-yet-crawled pages
- **Fixes:** Unintentional noindex, wrong canonical, schema parse errors (code-level only)
- **Re-indexes:** Resubmits sitemap via GSC Sitemaps API after any fix (best available programmatic signal)
- **Writes:** `reports/index-monitor.md`, `wiki/pages/concepts/indexing-health.md`, archives to `raw/audits/`
- **Wired into:** `monday.yml` (runs after GSC pull + competitor scan), committed with `src/` so fixes ship to main
- **Strategy integration:** `indexing-health` concept page now included in Wednesday strategy context
- **Also fixed:** `reports/weekly-plan.md` height-bracket table moved to REWRITES; wrist pain page re-queued with correct 4-field format in NEW CONTENT
- **Also fixed:** `execute-content.ts` now writes wiki log even when tasks.length === 0; `strategy.ts` prompt clarifies NEW CONTENT = new .astro files only, slug required

## [2026-04-20] competitor-monitor | Competitor Scan

- Monitored: 5 pages (5 live, 0 dead)
- Gaps found: 3
- Summary: Your core problem is a CTR and depth gap, not a crawlability or indexing issue — you have pages ranking on page 1 or near it that are failing to earn clicks because titles, meta descriptions, and content depth do not signal tall-person specificity the way competitors signal it with long-form, schema-rich, benefit-led pages. The three gaps above are ordered by combined impact potential: the Gesture review is a fast CTR fix on an already high-ranking page, the office-chairs-for-tall-people pillar page is your highest-intent head term and needs a full rebuild to escape page 3, and the dimensions page is a sleeper asset with 800+ impressions that a single reframing and schema addition could push into a top-5 informational ranking. Closing all three this week also builds internal link equity between your hub (office-chairs-for-tall-people) and your spokes (individual chair reviews), which compounds ranking benefit across the entire site.


## [2026-04-20] gsc-pull | GSC Data Pull

- Period: 2026-01-20 → 2026-04-20 (90 days)
- Pages: 44 | Queries: 200
- Clicks: 19 | Impressions: 7096 | Avg pos: 13.2


## [2026-04-18] verify-deploy | Saturday Deploy

- Status: DEPLOYED
- Checks: Secrets scan: ✅, Affiliate links: ✅, Voice constraint: ✅, Credentials not staged: ✅, Schema validity: ✅, Internal links: ✅, Content regression: ✅
- Weekly summary: wiki/weekly/2026-W16.md


## [2026-04-17] execute-fixes | Thursday Fixes Applied

- /review/aeron-size-c/ → src/pages/review/aeron-size-c.astro
- /chairs/steelcase-gesture/ → src/pages/chairs/steelcase-gesture/index.astro
- /knee-pain-seat-depth/ → src/pages/knee-pain-seat-depth.astro


## [2026-04-15] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-04-15-weekly-plan.md
- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation


## [2026-04-14] audit | Weekly Site Audit

- Pages audited: 20
- Clicks: 12 | Impressions: 5590
- Full report archived to raw/audits/2026-04-14-weekly-audit.md


## [2026-04-13] manual-session | CI Pipeline Repair + New Content

- **New page:** `/chairs/herman-miller-aeron/size-guide/` created manually (Friday agent generated invalid syntax — `and` as JS operator in frontmatter)
- **execute-content.ts:** Added `validateAstroFile()` pre-write validation + hardened system prompt
- **saturday.yml:** Fixed step order (build before verify), fetch-depth: 0, staging→main push
- **verify-deploy.ts:** Fixed favicon false positive in internal link check
- **package.json + lint-content.mjs:** Committed missing lint:content script
- **thursday.yml + friday.yml:** Added lint:content step, push to staging not main
- **Committed stashed Thursday agent fixes:** Voice fixes across 5 height pages, Header.astro dropdown accessibility, index.astro voice fix, Aeron seat depth spec correction
- **Wiki updated:** decisions-log.md, what-failed.md, workflow-system-reference.md, new size-guide entity page, index.md

## [2026-04-13] verify-deploy | Saturday Deploy

- Status: DEPLOYED
- Checks: Secrets scan: ✅, Affiliate links: ✅, Voice constraint: ✅, Credentials not staged: ✅, Schema validity: ✅, Internal links: ✅, Content regression: ✅
- Weekly summary: wiki/weekly/2026-W16.md


## [2026-04-13] competitor-monitor | Competitor Scan

- Monitored: 5 pages (5 live, 0 dead)
- Gaps found: 0
- Summary: Analysis unavailable.


## [2026-04-13] gsc-pull | GSC Data Pull

- Period: 2026-01-13 → 2026-04-13 (90 days)
- Pages: 37 | Queries: 200
- Clicks: 12 | Impressions: 5590 | Avg pos: 13.6


## [2026-04-09] execute-fixes | Thursday Fixes Applied

- /chairs/herman-miller-aeron/tall-people/ → src/pages/chairs/herman-miller-aeron/tall-people.astro
- /review/leap-plus/ → src/pages/review/leap-plus.astro
- /review/gesture/ → src/pages/review/gesture.astro


## [2026-04-08] strategy | Weekly Plan Generated

- Plan archived to raw/strategy/2026-04-08-weekly-plan.md
- Wiki context used: thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation


## [2026-04-07] audit | Weekly Site Audit

- Pages audited: 20
- Clicks: 10 | Impressions: 4443
- Full report archived to raw/audits/2026-04-07-weekly-audit.md


# Wiki Log

Chronological record of wiki operations. Append new entries at the top.

---

## 2026-04-07 — Saved system architecture GPT blindspot audit

- Saved external audit report to `raw/audits/2026-04-07 - system architecture GPT Blindspot findings.md`
- Scope: site architecture, shipped content, automation workflow, deploy gate assumptions, verification gaps
- Key outcome: identified critical mismatch between documented Saturday deploy gate and actual every-push Cloudflare deploy behavior

---

## 2026-04-06 — gsc-pull.ts wiki update + Claude Code hook

- **`scripts/gsc-pull.ts`**: now updates `wiki/pages/concepts/gsc-performance.md` immediately after every pull (same history preservation format as `audit.ts`). Guard: skips if `last_updated` is already today — means audit already ran and is authoritative. No double-writes.
- **`.claude/settings.json`**: created with `UserPromptSubmit` hook that injects `wiki/index.md` as `additionalContext` on every Claude Code prompt. Enforces the "read wiki index first" rule automatically.
- **`wiki/pages/concepts/workflow-system-reference.md`**: updated `gsc-pull.ts` entry to reflect new wiki update behavior.

---

## 2026-04-06 — Created workflow-system-reference.md

- Created `wiki/pages/concepts/workflow-system-reference.md` — operational reference for the weekly agent cycle, GitHub Actions, scripts, data flow, and Obsidian vault layout
- Updated `wiki/index.md`: clarified `system-setup-guide` is human-only reference; added pointer to new workflow reference page

---

## 2026-04-06 — Ingested gsc-2026-04-06.json

- Source: `raw/gsc/gsc-2026-04-06.json` (90-day window, Jan 6–Apr 6)
- Updated: `wiki/pages/concepts/gsc-performance.md` with full page rankings, new observations
- Key new signals: /back-pain-spine-height/ pos 9.9 (CTR target), /knee-pain-seat-depth/ +70 impr, /standing-desk-height-tall-people/ first impression

---

## [2026-04-06] Automation Blind Spot Fixes

**Operation:** Hardened 6 automation agents against 7 GPT-identified blind spots.

**Changes made:**
- `data/competitors/config.json` — 5 new verified competitor URLs (replaced RTINGS + Ergonomic Trends + OfficechairPicks)
- `scripts/agents/competitor-monitor.ts` — added `dead: boolean` tracking; dead URLs filtered from Claude prompt, logged in wiki
- `scripts/agents/execute-fixes.ts` — added word count guard (reject if <85% of original) + 14-day cooldown on non-technical fixes
- `scripts/agents/strategy.ts` — added `getRecentlyEditedPages()` and injected edit cadence rules + impression thresholds into Claude prompt
- `scripts/agents/audit.ts` — replaced wholesale gsc-performance.md overwrite with history-preserving append (max 8 snapshots)
- `scripts/agents/verify-deploy.ts` — added `checkSchemaValidity()`, `checkInternalLinks()`, `checkContentRegression()` to deploy gate
- `src/pages/chairs/steelcase-leap-plus/index.astro` — fixed last voice violation ("every other chair I tested seriously")
- Edit cadence policy documented in `wiki/pages/concepts/content-gaps.md`

**Wiki pages updated:** decisions-log.md, log.md, content-gaps.md

## [2026-04-06] agent-integration | Automation Agents Wired to Wiki

**Operation:** Updated all 6 automation agents + GSC pull script to read from and write to the wiki

**Why:** The agents were generating reports into `reports/` and forgetting everything each week. The Wednesday strategy agent only saw last week's raw data — no historical patterns, no record of what worked or failed. This meant the agents could (and would) re-suggest fixes that already failed, miss patterns across weeks, and start from scratch every cycle.

**What changed:**

1. **New shared library: `scripts/agents/wiki-utils.ts`**
   - Provides `readWikiIndex()`, `readWikiPage()`, `writeWikiPage()`, `appendWikiLog()`, `archiveToRaw()`, `readSynthesisContext()`, `readConceptContext()`
   - All agents import from this — single source of truth for wiki paths

2. **Monday (gsc-pull.ts + competitor-monitor.ts)**
   - Archives GSC JSON to `raw/gsc/gsc-YYYY-MM-DD.json` (immutable history)
   - Archives competitor data to `raw/competitors/`
   - Updates `wiki/pages/concepts/competitor-landscape.md` with new gaps
   - Appends to wiki log

3. **Tuesday (audit.ts)**
   - Reads wiki concept pages (CTR patterns, meta status, schema issues) as historical context for Claude prompt
   - Reads synthesis pages (what-works, what-failed) so audit can compare against prior findings
   - Archives audit report to `raw/audits/`
   - Rewrites `wiki/pages/concepts/gsc-performance.md` with fresh metrics from the audit

4. **Wednesday (strategy.ts) — THE BIG WIN**
   - Before generating the plan, reads: thesis.md, what-works.md, what-failed.md, decisions-log.md, ctr-optimization.md, content-gaps.md, internal-linking.md, ai-citation-readiness.md
   - All of this goes into the Claude prompt as "WIKI CONTEXT" sections
   - Claude now sees compiled multi-week history, not just last week's raw report
   - Explicitly told: "Do NOT re-suggest fixes that are already in the decisions log unless there's new evidence"
   - Archives plan to `raw/strategy/`

5. **Thursday (execute-fixes.ts)**
   - Logs all applied fixes to wiki log with file paths
   - Archives fixes-log to `raw/audits/`

6. **Friday (execute-content.ts)**
   - Creates a new `wiki/pages/site-pages/<slug>.md` entity for each page written
   - Updates `wiki/index.md` with new page entries
   - Archives content-log to `raw/audits/`

7. **Saturday (verify-deploy.ts)**
   - Writes `wiki/weekly/YYYY-WNN.md` with full week recap
   - Updates `wiki/synthesis/decisions-log.md` with week's entry (deploy status, GSC metrics, fix count, content count)
   - Updates wiki index with weekly summary link
   - Appends to wiki log

8. **All 6 GitHub Actions workflows**
   - Commit steps now include `raw/` and `wiki/` in `git add` so wiki persists across CI runs

9. **wiki/ and raw/ moved into the git repo**
   - Were at workspace root (outside git) — CI couldn't access them
   - Now at `tall-chair-advisor/wiki/` and `tall-chair-advisor/raw/`
   - Symlinks at workspace root for Obsidian browsing
   - Astro build verified — `wiki/` and `raw/` are completely ignored (Astro only reads `src/`)

**Build verification:** `npm run build` → 44 pages built successfully, zero interference from wiki/raw directories.

**Efficiency gain:** The Wednesday strategy agent goes from ~4KB of context (last week's raw report) to ~15KB of compiled, cross-referenced knowledge spanning all prior weeks. Every other agent now leaves a paper trail in the wiki that compounds over time.

---

## [2026-04-06] competitor-monitor | Competitor Scan

- Monitored: 5 pages (5 live, 0 dead)
- Gaps found: 3
- Summary: Your site is generating meaningful impression volume across several high-intent pages but converting almost none of it into clicks, pointing to three compounding problems: under-built content on your most-searched money page, absent structured data that suppresses CTR even at solid positions, and an incomplete chair-specific sub-page architecture for the Aeron that leaves affiliate traffic on the table. The highest-ROI move this week is a combined content expansion and schema implementation sprint on /office-chairs-for-tall-people/ and /review/gesture/, as these two pages alone account for nearly 1,000 impressions with a combined 2 clicks. Closing the Aeron dimension content gap is the medium-term structural fix that will compound your topical authority and support the comparison pages already showing early ranking signals.


## [2026-04-06] gsc-pull | GSC Data Pull

- Period: 2026-01-06 → 2026-04-06 (90 days)
- Pages: 36 | Queries: 200
- Clicks: 10 | Impressions: 4443 | Avg pos: 14.3


## [2026-04-06] initial-build | Wiki Created from Existing Data

**Operation:** Full wiki initialization from ~35 existing workspace files

**What was done:**
- Created 3-layer structure: `raw/` (immutable sources), `wiki/` (LLM-maintained), `SCHEMA.md` (operating rules)
- Moved all existing files into `raw/` organized by type (gsc, audits, strategy, reddit, misc, assets)
- Built 4 chair entity pages from audit/strategy data
- Built 5 site-page entity pages for highest-priority pages
- Built 9 concept pages covering all major topics
- Built 4 synthesis pages (what-works, what-failed, thesis, decisions-log)
- Created index.md and this log

**Sources ingested:**
- FULL-AUDIT-REPORT.md (Apr 3) — primary source for current state
- ACTION-PLAN.md (Apr 3) — prescribed fixes
- AUDIT_SUMMARY.md (Mar 30) — prior audit baseline
- blog-audit-report.md (Mar 19) — content quality scores
- SEO-STRATEGY.md (Mar 2026) — strategic framework + KPI targets
- COMPETITOR-ANALYSIS.md (Mar 2026) — competitor profiles + keyword gaps
- SITE-STRUCTURE.md (Mar 2026) — architecture principles
- SESSION-CONTEXT.md (Mar 7) — chair specs, component patterns
- tallchairadvisor-geo-analysis.md (Mar 16) — GEO readiness scores
- 11 GSC data exports (Mar 7 – Apr 3)
- 7 additional SEO audit snapshots (Mar 2 – Mar 19)

**Pages created:** 22 wiki pages total
**Next:** Configure Obsidian, then begin weekly ingest cycle

## [2026-05-09] wiki-cleanup | Audit Files Relocated to Correct Position

- Moved 24 files from workspace-root `AUDIT/` → `raw/audits/` (correct location per CLAUDE.md rules)
- Files moved: 11 CLAUDE-SONNET-4-6 audit files, 12 CODEX audit files, 1 COMBINED master audit
- Removed now-empty `AUDIT/` directory from workspace root
- Workspace root is now clean of audit artifacts
- Master audit: `raw/audits/COMBINED_2026-05-09_MASTER_AUDIT.md` — adjudicated findings from both models, adjusted scores, SERP API + Firecrawl competitor intelligence architecture documented

## [2026-05-15] strategy | Niche Incubator Plan Filed

- Reviewed existing context: `niche-validation-framework`, `dataforseo-reference`, `workflow-system-reference`, `system-setup-guide`, and `runpod-migration-proposal`
- Conclusion: the adjacent project should be a **separate repo / directory** from `tall-chair-advisor/`
- Added raw strategy note: `raw/strategy/2026-05-15-niche-incubator-plan.md`
- Added concept page: `wiki/pages/concepts/niche-incubator-system.md`
- Defined required verdict states: `DO NOT BUILD`, `HOLD / NEEDS REVIEW`, `BUILD INSIDE AN EXISTING SITE`, `BUILD AS A NEW-SITE MVP`
- Recommendation: build the verdict engine first, then the blueprint/site generator second

## [2026-05-15] systems-architecture-audit | remaining open items implemented

- `verify-deploy.ts` — system prompt converted to array format with `cache_control: { type: 'ephemeral' }`. Follows same pattern as all other agents.
- `.github/workflows/monday.yml` / `tuesday.yml` / `wednesday.yml` / `keywords-monthly.yml` — `[skip cd]` prepended to git commit messages. Cloudflare Pages now skips builds on data-only commits. Saturday push to main remains intentional.
- `scripts/competitor-intelligence.ts` — `generateFallbackCapsule()` added. When AIO passage < 50 chars, Haiku synthesizes a capsule from TCA's own page content instead of immediately failing to `pending-passage-text`. Status `fallback-applied` added to AIOTask union. The 3 stuck pages (knee-pain-seat-depth, aeron/tall-people, gesture/seat-depth) will resolve on next competitor-intelligence run.
- `scripts/agents/wiki-utils.ts` — `IntentType` exported; `intentType?: IntentType` added to `InterventionEntry`; `computeIntentWeightAdjustments()` added — aggregates reconciled CTR outcomes by intent type (≥3 entries required), returns multipliers (0.5x–2.0x cap).
- `scripts/gsc-analyze.ts` — loads weight adjustments at startup via `computeIntentWeightAdjustments(ROOT)`; `classifyIntent()` now applies multipliers to base weights (buyer:3.0, brand:2.0, spec:1.5).
- `scripts/agents/execute-fixes.ts` — `getSlugIntentMap()` added; `intentType` passed to `appendIntervention()` on every fix. Intent type derived from primary pageQuery in `latest.json`.
- Batch API for audit.ts/strategy.ts: kept deferred — single-call scripts, overhead not justified. Existing caching covers cost reduction.

## [2026-05-15] git-event-bus | Decouple code + data commits in Thursday/Friday workflows

- `thursday.yml` — split single "Commit fixes + wiki updates" into two steps: (1) `git add src/` → `"fix: Thursday SEO fixes…"`, (2) `git add reports/ raw/ wiki/` → `"[skip cd] data: Thursday wiki + reports…"`. Push moved to data step.
- `friday.yml` (success path) — same split: (1) `git add src/` → `"content: New pages…"`, (2) `git add reports/ raw/ wiki/` → `"[skip cd] data: Friday wiki + reports…"`.
- `friday.yml` (failure path) — already data-only (no `src/`); added `[skip cd]` to commit message.
- Saturday unchanged — deploy commit is data-only and intentionally triggers Cloudflare (production deploy).
- All seven weekly workflows now use `[skip cd]` on every data-only commit. Code commits (Thu/Fri `src/` changes) remain untagged and trigger Cloudflare staging builds as intended.

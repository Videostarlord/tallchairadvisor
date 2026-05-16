---
type: concept
last_updated: 2026-05-15
sources: [raw/audits/COMBINED_2026-05-09_MASTER_AUDIT.md]
tags: [audit, fixes, backlog, status, archived]
archived: true
superseded_by: systems-architecture-audit-2026-05-13
---

> **ARCHIVED — 2026-05-15**
> This page tracked the May 10, 2026 combined audit (CLAUDE-SONNET-4-6 + CODEX, 21 findings).
> For current system architecture status — what's implemented, what's open, and what's still needed — read **[[systems-architecture-audit-2026-05-13]]** instead. That page was verified against actual code on 2026-05-15 and is the authoritative source of truth.
> Content below is preserved for historical reference. The C1/C2/C3 content items (Gesture expansion, Leap Plus reframe, role differentiation) remain valid open tasks tracked in `data/content-roadmap.json`.

# Audit Implementation Status — May 10, 2026 [ARCHIVED]

Source audit: `raw/audits/COMBINED_2026-05-09_MASTER_AUDIT.md`
Adjudicated 6/10 overall. Two auditors (CLAUDE-SONNET-4-6 + CODEX), 21 findings. This page tracks implementation status of every action item.

---

## DONE — Implemented 2026-05-10

### F1 — friday.yml force-push bug (CRITICAL)
**Status: FIXED**
- File: `.github/workflows/friday.yml` line 55
- Was: `git push origin HEAD:main --force || true` on the `CONTENT_WRITTEN != 'true'` failure path
- Now: `git push origin HEAD:staging --force || true`
- Why: Failure path was overwriting main with whatever partial state the CI runner had. This ran every Friday that content generation failed.

### F2 — execute-fixes.ts smart quotes
**Status: CONFIRMED NON-ISSUE**
- Codex flagged Unicode curly quotes at lines 64-67 as a bug. Inspection showed they are intentional: they are the search patterns inside regex character classes `['']/g` and `[""]/g` that replace curly quotes with ASCII equivalents. The function is correct sanitization logic, not a bug.

### F3 — Restore deviceSplit + dailyTrend in latest.json
**Status: FIXED**
- Root cause: latest.json was from a partial/failed pull that wrote the object without calling the device and date API dimensions. `gsc-pull.ts` always wrote both (lines 179-180) — the file was just stale.
- Fix: ran `npm run gsc:pull -- --force`. Now 53 device rows + 88 daily trend rows present.
- `siteTrend` and `deviceIntelligence` confirmed non-null in analysis.json after re-run.

### F4 — siteTrend threshold 14 → 7 days
**Status: FIXED**
- File: `scripts/gsc-analyze.ts` line 368
- Changed `dailyTrend.length < 14` to `dailyTrend.length < 7`
- Why: 90-day pull gives 88 daily rows — well above either threshold — but this future-proofs shorter pull windows and activates the module sooner on new sites.

### D1 — URL canonical normalization in gsc-analyze.ts
**Status: FIXED**
- Added `normalizeUrl()` and `mergeCanonicalDuplicates()` functions to `scripts/gsc-analyze.ts`
- Applied to `gsc.pages`, `gsc.pageQueries`, and `gsc.deviceSplit` before any scoring logic runs
- Effect: `/gesture/` and `/gesture` are now merged into one entry with summed clicks/impressions and the better position. Eliminates phantom cannibalization and split opportunity scores from trailing-slash duplicates.

### D2 — Freshness guard in gsc-pull.ts
**Status: FIXED**
- Added to `scripts/gsc-pull.ts`: skips API call if `latest.json` is less than 72 hours old
- Also added `--force` flag to bypass guard when a fresh pull is explicitly needed
- Why: Prevents redundant API calls on re-runs. Also surfaces the "you're running this unnecessarily" case explicitly.

### D3 — Freshness warning in gsc-analyze.ts
**Status: FIXED**
- Added to `scripts/gsc-analyze.ts` main(): warns to console if `latest.json` is more than 72 hours old before generating analysis
- Non-blocking — warns and continues. Prevents silent reasoning-over-stale-data.

### D4 — Junk query filter in CTR leak detector
**Status: FIXED**
- Added `JUNK_PATTERNS` array and `isJunkQuery()` filter to `detectCTRLeaks()` in `scripts/gsc-analyze.ts`
- Patterns: `knee brace`, `wheelchair`, `standing desk mat`, `neck brace`
- Why: "Steelcase knee brace review" is a different product entirely. Including it in CTR leak scoring inflates leak scores and sends the strategy agent chasing unrannable queries.

### A1 — Voice check in index-monitor.ts
**Status: FIXED**
- Added voice violation check in `fixPage()` function before `writeFileSync()` in `scripts/agents/index-monitor.ts`
- Non-Gesture pages: if the fixed content matches any of the 6 voice patterns, returns `{ fixed: false, summary: 'voice violation detected' }` without writing
- Uses same expanded pattern set as A2

### A2 — Expand voice patterns in verify-deploy.ts
**Status: FIXED**
- File: `scripts/agents/verify-deploy.ts`
- Was: 3 patterns — missed "I tried out the Aeron", "I found", "during my review", generic "I tested it"
- Now: 6 patterns covering all common first-person testing variants
- New patterns: `I (found|discovered|noticed|felt)`, `during (my|the) (review|testing|test)`, `I (tried|tested) (it|them|this chair)`, broader after/sitting variants

### A3 — Archive failed drafts in execute-content.ts
**Status: FIXED**
- File: `scripts/agents/execute-content.ts`
- When quality gate fails (score < 80), content is now archived to `raw/content-rejected/YYYY-MM-DD-{slug}.md` before discarding
- Why: Previously lost — no way to inspect why a draft failed or recover partial work for debugging

### S1 — Author page: sitemap + canonical
**Status: FIXED**
- `astro.config.mjs`: added `/author/jackson-christopher/` to `sitemapExcludedPaths`
- `src/pages/author/jackson-christopher/index.astro`: removed `canonical="/about/"` prop (was relative URL, technically invalid; Layout.astro now derives absolute canonical automatically)
- Verified: author page is absent from built `dist/sitemap-0.xml`
- Why: Page was simultaneously noindex, canonicalized to /about/, AND in sitemap — three contradictory signals. Now it's noindex + correctly absent from sitemap.

### S2 — Freshness drift on best-office-chairs.astro
**Status: FIXED**
- File: `src/pages/best-office-chairs.astro`
- Was: visible text "Last reviewed: March 2026" + `updatedDate="2026-03-17"` — both mismatched schema `dateModified: 2026-05-07` and sitemap `lastmod: 2026-05-07`
- Now: visible text "Last reviewed: May 2026" + `updatedDate="2026-05-07"` — all four signals aligned

### S3 — Cornell cluster: title + H1 + verdict box on knee-pain-seat-depth
**Status: FIXED**
- File: `src/pages/knee-pain-seat-depth.astro`
- Title: "Seat Depth & Knee Pain: The Fix for Tall People" → "Cornell Ergonomics Rule: Seat Depth & Knee Pain for Tall People"
- H1: "Knee Pain from Office Chair Seat Depth (Tall People Guide)" → "The Cornell Ergonomics Rule for Seat Depth (What Tall People Get Wrong)"
- Added verdict box with the Cornell rule definition (2–3 finger-widths clearance, 18–20" seat depth for tall users)
- Why: 165 impressions at avg pos 8 on "cornell ergonomics seat depth" queries with 0% CTR. Title didn't match searcher intent (they want the Cornell rule, not a "fix"). Highest-yield single SEO edit on the site.

### S4 — size-guide orphan page
**Status: FIXED**
- Added inbound link from `src/pages/chairs/herman-miller-aeron/index.astro` — new card in the "Detailed Guides" grid
- Added inbound link from `src/pages/review/aeron-size-c.astro` — new entry in the "Compare With" section
- Page now has 2 inbound links. Was completely orphaned (zero inbound links from any other page).

### P1 — Harden strategy.ts plan validation
**Status: FIXED**
- File: `scripts/agents/strategy.ts`
- Was: `console.warn()` when zero parseable tasks found — logged a warning but still wrote a broken weekly-plan.md
- Now: writes debug output to `reports/plan-debug-malformed.md`, logs to wiki, then throws a hard error — weekly-plan.md is never written if the plan is malformed
- Why: execute-fixes.ts and execute-content.ts would silently run against a broken plan and do nothing. Now the failure is explicit and the pipeline halts cleanly.

---

## URGENT — New Bug Identified by Codex

### Friday agent reads stale weekly plan + green-but-empty runs

**Status: FIXED 2026-05-10**

**Root cause chain (Codex, confirmed via GitHub Actions logs):**
1. Wednesday generates a new plan and pushes to `staging`
2. Friday checked out `main` (no `ref: staging`) — reads previous Saturday's plan, not Wednesday's new one
3. Stale plan fails Layout validation → `CONTENT_WRITTEN=false` → publish steps skipped → silent green run

**Fixes applied:**
- `friday.yml`: Added `ref: staging` to `actions/checkout@v4` step. Friday now reads from staging (same as saturday.yml line 17).
- `friday.yml`: Added "Warn if no content written" step — `echo "::warning::CONTENT_WRITTEN=false..."` so future failures surface visibly in GitHub Actions.
- `fetch-depth: 0` was already present; no change needed there.

**Note:** The earlier force-push fix (F1, main→staging on failure path) was unrelated — that fixed *where* Friday pushes. This fixes *which branch Friday reads from*.

---

## NOT YET IMPLEMENTED — Remaining from Combined Audit

### C1 — /review/gesture/ depth expansion
**Priority: HIGHEST content investment**
- Audit finding: Only first-person authority page on the site. Currently thin. Per latest.json (May 2026): 2,529 impressions, pos 8.2, 3 clicks, 0.12% CTR. Note: prior "304 impr at pos 1 / 8.33% CTR" figure in the original audit doc was unverified — does not match GSC data.
- Required: 3,000+ words, first-person Gesture voice, exact 6'4" measurements (lumbar placement, armrest height, seat depth experience), before/after back/shoulder pain data
- Constraint: Must be agent-produced via execute-content.ts REWRITE task. Quality gate must evaluate substance not just structure for this specific page.
- Action needed: Add as REWRITE task in next weekly plan with expanded quality gate instructions.

### C2 — /review/leap-plus/ reframe
**Priority: Medium**
- Reframe opening with "I almost bought this — here's the spec analysis that drove my decision toward the Gesture" narrative
- Action needed: Add as REWRITE task in next weekly plan

### C3 — /office-chairs-for-tall-people/ vs /best-office-chairs/ L3/L5 role differentiation
**Priority: Medium**
- `/office-chairs-for-tall-people/` (pos 24.9) should be repositioned as L2/L3 fit framework — measurement system, height-bracket logic, lighter product density
- `/best-office-chairs/` should own L5 shortlist — rankings, purchase intent, comparison table
- Currently both target similar buyer intent with blurry role separation
- Action needed: Two REWRITE tasks in a future weekly plan

### I1 — SERP API + Firecrawl competitor intelligence pipeline
**Status: BUILT + ACTIVATED 2026-05-10**
- New script: `scripts/competitor-intelligence.ts`
- Run: `npm run competitor:intelligence` (manual/monthly cadence)
- Stage 1 — SerpAPI: for each top `near-p1`/`content-depth` keyword in `analysis.json`, fetch real SERP results and find URLs outranking TCA's actual position (not hardcoded competitors)
- Stage 2 — Firecrawl: crawl only those outranking URLs for full content (markdown), not just HTML metadata
- Stage 3 — Claude Sonnet: generate specific gap findings per TCA page vs outrankers
- Outputs: `data/competitors/intelligence.json`, `raw/competitors/YYYY-MM-DD-intelligence.json`, updates wiki competitor-landscape page
- Cost controls: max 8 keywords/run, max 12 competitor URLs/run, ~$1–3/month
- **Activated:** `SERP_API_KEY` and `FIRECRAWL_API_KEY` configured in `.env` and GitHub Actions secrets. SerpAPI: 250 credits/month free tier (~23/run). Firecrawl: 500 pages/month free tier.

### I2 — Add pagination to gsc-pull.ts
**Priority: Low**
- Current pull uses fixed `rowLimit` (pages: 500, queries: 200) with no pagination
- At current site scale this is not hitting limits, but will need fixing as the site grows past ~500 pages or ~200 ranking queries
- Action needed: Add token-based continuation loop to each API call when `rowLimit` rows returned exactly

### I3 — Affiliate click tracking in GA4
**Status: ALREADY IMPLEMENTED — confirmed 2026-05-11 codebase audit**
- `src/layouts/Layout.astro` contains a full `gtag('event', 'affiliate_click', {...})` implementation in the site-wide script block
- Fires on every click/auxclick on links with `data-affiliate-cta="true"` attribute (deduped within 750ms)
- Fields tracked: `page_path`, `page_title`, `destination_domain`, `affiliate_program`, `cta_label`, `cta_position`, `link_url`
- All affiliate CTAs in `src/pages/` carry `data-affiliate-cta="true"` and `data-cta-position` attributes
- This was NOT listed in the original audit. The audit assumed it was absent. The code was already there, predating the audit.

### I4 — GSC wiki concept page consolidation
**Priority: Low (Month 2)**
- Audit flagged 3–7 overlapping GSC concept pages in `wiki/pages/concepts/`
- Action: Merge into `gsc-current.md` (auto-updated) + `gsc-architecture.md` (static). Delete redundant pages.

### I5 — Strategy.ts: inject Reddit data into agent context
**Status: CLOSED — do not revisit unless Jackson explicitly asks**
- The Reddit pipeline (`npm run reddit:all`) is a one-time/annual operation, not part of the weekly automation cycle. It was run once; raw data is archived in `data/reddit/` and `raw/reddit/`. A consolidated report already exists from that run.
- Reddit owner data does not change frequently enough to warrant re-running. The pipeline will not be re-run on any schedule and will not be connected to `strategy.ts`.
- Do not surface this as a gap, a deferred item, or a recommendation in any future audit or strategy session.

---

## Audit Findings Confirmed as Non-Issues

- **execute-fixes.ts smart quotes (F2):** Working correctly. Codex misidentified intentional sanitization logic as a bug.
- **strategy.ts plan validation:** Already existed (lines 168-185). Upgraded from warn to hard error in this session (P1 above).
- **Cooldown system:** 9/10 rating confirmed. No changes needed.
- **aeron-vs-leap-plus/ (2.15% CTR):** Best CTR on site. Do not touch.

---

## Adjusted System Score After Fixes

Estimated post-fix score: **7/10** (was 6/10 pre-session)
- Critical bugs eliminated: +0.5
- Data integrity restored: +0.3
- SEO signals cleaned: +0.2
- Content investment (C1–C3) not yet done: ceiling remains until Gesture review is expanded

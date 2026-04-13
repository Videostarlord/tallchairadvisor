---
type: log
---

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

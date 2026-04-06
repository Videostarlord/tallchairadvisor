---
type: log
---

# Wiki Log

Chronological record of wiki operations. Append new entries at the top.

---

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

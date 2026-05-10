# File Structure & Knowledge System Audit
**Auditor:** CLAUDE-SONNET-4-6 | **Date:** 2026-05-09 | **Mode:** Read-only forensic audit

---

## Repository Structure Assessment

```
tall-chair-advisor/
├── .github/workflows/          ← 6 workflow files, well-named by day
├── src/pages/                  ← 46 .astro files, correct
├── src/components/             ← 4 components (Byline, Header, Footer, RedditInsights)
├── src/layouts/                ← 1 layout (Layout.astro)
├── scripts/                    ← Data pipeline scripts
│   └── agents/                 ← Agent scripts + wiki-utils
├── data/                       ← Live/current data (agent-consumed)
│   ├── gsc/                    ← latest.json, analysis.json, history/
│   ├── competitors/            ← config.json, latest.json
│   └── reddit/                 ← raw/, normalized/, published/
├── raw/                        ← Immutable archive (never edit)
│   ├── gsc/                    ← API pulls + manual CSVs
│   ├── audits/                 ← Audit reports archive
│   ├── strategy/               ← Strategy docs archive
│   ├── competitors/            ← Competitor snapshots
│   └── misc/                   ← Session context, PDFs
├── wiki/                       ← LLM knowledge base
│   ├── index.md                ← Master catalog
│   ├── log.md                  ← Chronological ops log
│   ├── pages/                  ← Entity + concept pages
│   ├── synthesis/              ← Cross-cutting analysis
│   └── weekly/                 ← Weekly summaries (W16, W17, W18)
├── reports/                    ← Current-week agent outputs (overwritten)
├── credentials/                ← GSC service account (gitignored)
└── dist/                       ← Built site (gitignored)
```

**Assessment: The structure is clean, intentional, and correct.** The separation of `data/` (current, agent-consumed), `raw/` (immutable archive), `wiki/` (processed knowledge), and `reports/` (current-week outputs) is architecturally sound. This is better than most professional operations.

---

## CLAUDE.md Assessment

**File:** `tall-chair-advisor/CLAUDE.md` (and the workspace root `CLAUDE.md` via symlinks)

**What's good:**
- Voice constraint rules are extremely specific and correct
- Content pillar and priority queue is clear
- Wiki operating rules are well-documented
- SEO audit caveat about WebFetch stripping head elements is important and correct

**What's outdated or conflicting:**
1. Priority content queue lists "Deepen /review/gesture/" as #1 — this is still correct but no mechanism exists to track when it's actually done.
2. "Write /shoulder-pain-tall-people/" is in the queue but the page ALREADY EXISTS (src/pages/shoulder-pain-tall-people.astro). The CLAUDE.md hasn't been updated to reflect completed items.
3. "Write /standing-desk-height-tall-people/" — also already exists (src/pages/standing-desk-height-tall-people.astro). Two "write" items from the queue are already done.
4. "Fix /aeron-vs-gesture/ title/meta — pos 5 with 0 clicks" — this is still in the CLAUDE.md as a priority. Has it been fixed? Unknown from audit.

**Recommendation:** Add a "Completed" section to the Priority Content Queue in CLAUDE.md to track what's done vs. pending.

---

## Wiki Assessment

### Coverage

| Wiki Layer | Count | Assessment |
|-----------|-------|-----------|
| Chair entity pages | 4 | Good. One per key chair. |
| Site page entity pages | 6 | SPARSE. 6 of ~46 pages tracked. |
| Concept pages | 16 | Rich. GSC, CTR, linking, competitor, schema, etc. |
| Synthesis pages | 4 | Thesis, what-works, what-failed, decisions-log. Well-maintained. |
| Weekly summaries | 3 | W16, W17, W18. Adds 1/week. |

**The wiki is informationally rich for concepts but sparse for individual pages.** 40 of 46 pages have no wiki entity page. This means agents have no persistent memory about these pages — their ranking history, fix history, or issues.

### Wiki Index Status

The `wiki/index.md` is the agent's first read. As of audit:
- 4 chair entities ✅
- 6 site page entities ✅
- 16 concept pages ✅
- 4 synthesis pages ✅
- 3 weekly entries ✅

**Growth risk:** Saturday agent adds 1 weekly entry per week. In 6 months the index will have ~30 weekly entries. The CLAUDE.md system instructions load MEMORY.md at ≤200 lines — if wiki/index.md is being loaded similarly, it will hit context truncation issues. The wiki index needs an aggressive archiving strategy.

**Duplicate wiki pages:**
- `wiki/pages/concepts/gsc-intelligence.md` (auto-updated weekly by gsc-analyze.ts)
- `wiki/pages/concepts/gsc-performance.md` (auto-updated weekly by gsc-pull.ts + audit.ts)
- `wiki/pages/concepts/gsc-analysis-strategy.md` (static architecture reference)

These three serve overlapping purposes. Strategy agent reads all three. There is likely redundant and potentially conflicting data between gsc-intelligence.md and gsc-performance.md since both contain "latest snapshot" data.

### Wiki Log

The `wiki/log.md` receives entries from every agent run. Over time this becomes the system's operational history. It's valuable but there's no mechanism to summarize or archive old log entries. In 6 months it will be very long.

---

## SCHEMA.md Assessment

**File:** `tall-chair-advisor/SCHEMA.md`

Defines the wiki operating schema: page types (entity, concept, synthesis, weekly), frontmatter conventions, agent integration points. Well-written and specific.

**Issues:** The SCHEMA.md defines "Fix History" tables for site-page entity pages — but most site-page entities don't exist (only 6 pages have entity pages). The schema is ahead of the implementation.

---

## Reports Directory Assessment

`reports/` contains:
- `audit-report.md` — overwritten Tuesday
- `weekly-plan.md` — overwritten Wednesday
- `fixes-log.md` — overwritten Thursday
- `content-log.md` — overwritten Friday
- `weekly-summary.md` — overwritten Saturday
- `index-monitor.md` — overwritten Monday

**Design is correct:** These are current-week outputs, not history. History goes to raw/. But there is no way to view "last week's plan" without going to raw/strategy/. This is acceptable — raw/ serves this purpose.

---

## Secrets and Security

**Sensitive files:**
- `credentials/gsc-service-account.json` — contains private key for GSC API. Should be gitignored.
- `.env` — contains APIFY_TOKEN and ANTHROPIC_API_KEY. Should be gitignored.
- `.env.example` — template, safe to commit.

**verify-deploy.ts checks for secrets in src/** using regex patterns.** This is a good gate. BUT: it only checks `src/**/*.astro`, not scripts/ or config files. If a Claude-generated fix somehow included an API key in a comment (extremely unlikely but possible), it would pass the check.

**GitHub Actions secrets:**
- `GSC_SERVICE_ACCOUNT_JSON` — used to restore credentials on CI
- `ANTHROPIC_API_KEY` — used by all agents
- `APIFY_TOKEN` — needed for Reddit pipeline (may not be set as a GitHub secret currently)

---

## Agents.md Assessment

**File:** `agents.md` at workspace root (not inside tall-chair-advisor/)

This is the Codex-facing equivalent of CLAUDE.md. It contains the same core rules but with a "Codex Translation Rules" section explaining that slash commands are Claude Code specific.

**Issue:** agents.md is at the workspace root, outside the git repo (tall-chair-advisor/ is the git root). If another agent (Codex, GPT, etc.) clones the repo, they won't have access to agents.md — it's outside the repo boundary. This file should either be inside tall-chair-advisor/ or explicitly symlinked.

---

## File Structure Summary

| Area | Status | Issue |
|------|--------|-------|
| Directory separation (data/raw/wiki) | ✅ Excellent | None |
| Astro source files (src/) | ✅ Good | |
| GitHub Actions workflows | ✅ Good | Friday force-push bug |
| CLAUDE.md accuracy | ⚠️ Partially stale | 2 pages listed as "to write" already exist |
| Wiki coverage | ⚠️ Sparse | 40 of 46 pages without entity pages |
| Wiki index growth | ⚠️ Monitor | Will hit truncation in 6+ months |
| Duplicate wiki GSC pages | ⚠️ Overlap | 3 GSC concept pages with overlapping data |
| agents.md location | ⚠️ Outside repo | Not accessible to Codex on clone |
| Secrets management | ✅ Good | Credentials gitignored |
| reports/ design | ✅ Good | Current-week only, history in raw/ |

---
type: concept
last_updated: 2026-05-06
tags: [automation, workflow, agents, github-actions, obsidian]
---

# Workflow & System Reference

Operational reference for how tallchairadvisor.com's automation currently runs. Read this when answering any question about agents, the weekly cycle, GSC data flow, or Obsidian.

> **Note:** `system-setup-guide.md` is a human-facing replication guide for Jackson. It is NOT LLM context — do not read it to answer operational questions.

---

## Directory Layout

```
Claude TCA Workspace/               ← Obsidian vault root
├── tall-chair-advisor/             ← Git repo (Astro site + all automation)
│   ├── src/pages/                  ← Astro pages (.astro) — the live website
│   ├── scripts/
│   │   ├── gsc-pull.ts             ← Pulls GSC API → data/gsc/latest.json
│   │   └── agents/
│   │       ├── wiki-utils.ts       ← Shared library (read/write wiki, archive, log)
│   │       ├── competitor-monitor.ts
│   │       ├── index-monitor.ts    ← Monday: URL Inspection API for all pages, fixes + sitemap resubmit
│   │       ├── audit.ts
│   │       ├── strategy.ts
│   │       ├── execute-fixes.ts
│   │       ├── execute-content.ts
│   │       └── verify-deploy.ts
│   ├── .github/workflows/          ← GitHub Actions (monday–saturday.yml)
│   ├── data/gsc/latest.json        ← Live GSC data (overwritten each pull)
│   ├── reports/                    ← Current-week agent outputs (overwritten weekly)
│   ├── wiki/                       ← LLM knowledge base (committed to repo)
│   └── raw/                        ← Immutable archived sources (committed to repo)
├── wiki -> tall-chair-advisor/wiki ← Symlink for Obsidian browsing
└── raw -> tall-chair-advisor/raw   ← Symlink for Obsidian browsing
```

---

## Weekly Automated Cycle

Runs via GitHub Actions. Thursday and Friday push to `staging`. Saturday verifies, then merges `staging → main`, which triggers Cloudflare Pages deploy.

| Day | Workflow | Script | Reads | Writes | Push target |
|-----|----------|--------|-------|--------|-------------|
| Monday | monday.yml | `gsc-pull.ts` + `competitor-monitor.ts` + `index-monitor.ts` | GSC API, competitor URLs, URL Inspection API for all pages | `data/gsc/latest.json`, `raw/gsc/`, `data/competitors/latest.json`, `reports/index-monitor.md`, `wiki/pages/concepts/indexing-health.md`, fixed `src/pages/` files (if issues found) | `main` |
| Tuesday | tuesday.yml | `audit.ts` | `data/gsc/latest.json`, live site meta/schema, wiki concept pages | `reports/audit-report.md`, `raw/audits/`, `wiki/pages/concepts/gsc-performance.md` | `main` |
| Wednesday | wednesday.yml | `strategy.ts` | Audit report, GSC data, wiki synthesis + concept pages | `reports/weekly-plan.md`, `raw/strategy/` | `main` |
| Thursday | thursday.yml | `execute-fixes.ts` | `reports/weekly-plan.md` (FIXES section) | Modified `src/pages/*.astro` files, `reports/fixes-log.md`, wiki fix history | `staging` |
| Friday | friday.yml | `execute-content.ts` | `reports/weekly-plan.md` (NEW CONTENT section) | New `src/pages/*.astro` files, `reports/content-log.md`, new wiki entity pages | `staging` |
| Saturday | saturday.yml | `verify-deploy.ts` | All week's changes, built `dist/` | `reports/weekly-summary.md`, `wiki/weekly/YYYY-WNN.md`, git push → Cloudflare deploy | `staging` + `main` |

Friday skips automatically if the weekly plan has no unchecked `[ ] NEW:` tasks.

**Step order within Saturday workflow (critical — was wrong before Apr 13):**
1. Checkout `staging` with `fetch-depth: 0`
2. `npm ci`
3. `npm run build` ← must run before verify-deploy so `dist/` exists for schema check
4. `npm run lint:content`
5. `npx tsx scripts/agents/verify-deploy.ts`
6. Commit + push `staging` → `main`

---

## Data Flow

```
GSC API
  ↓ (Monday: gsc-pull.ts)
data/gsc/latest.json  +  raw/gsc/gsc-YYYY-MM-DD.json (archive)
  +  wiki/pages/concepts/gsc-performance.md (raw snapshot, no Claude analysis)
  ↓ (Tuesday: audit.ts)
reports/audit-report.md  +  wiki/pages/concepts/gsc-performance.md (richer update: live meta/schema + Claude analysis; archives Monday's snapshot to history)
  ↓ (Wednesday: strategy.ts)
reports/weekly-plan.md
  ↓ (Thursday: execute-fixes.ts)
src/pages/*.astro (fixes applied)
  ↓ (Friday: execute-content.ts)
src/pages/*.astro (new pages)
  ↓ (Saturday: verify-deploy.ts)
wiki/weekly/  →  git push  →  Cloudflare Pages deploy
```

**Key implication:** `gsc-pull.ts` now updates `wiki/pages/concepts/gsc-performance.md` immediately — raw GSC numbers are visible in Obsidian right after a pull. `audit.ts` on Tuesday then overwrites with a richer snapshot (live meta/schema + Claude analysis) and archives the pull snapshot to history. If both run the same day, `audit.ts` wins (gsc-pull guards against overwriting a same-day audit entry).

---

## What Each Agent Does

**`gsc-pull.ts`** — Data collection + immediate wiki update. Pulls page-level + query-level GSC data via the Google Search Console API. Writes `data/gsc/latest.json`. Archives raw JSON to `raw/gsc/`. Updates `wiki/pages/concepts/gsc-performance.md` with a new snapshot (same history preservation format as `audit.ts`). Guard: skips wiki update if `last_updated` is already today — means `audit.ts` already ran that day and is authoritative. Appends to `wiki/log.md`. Does not call Claude API.

**`competitor-monitor.ts`** — Fetches configured competitor URLs, extracts content, sends to Claude for analysis. Writes `data/competitors/latest.json`. Dead URLs (HTTP 400+) are flagged and excluded from analysis. Config lives in `data/competitors/config.json`.

**`audit.ts`** — Reads `data/gsc/latest.json` + fetches live meta/schema from the site. Sends to Claude with wiki context for historical comparison. Writes audit report to `reports/` and archives to `raw/audits/`. Updates `wiki/pages/concepts/gsc-performance.md` (preserves up to 8 weeks of historical snapshots).

**`strategy.ts`** — Reads audit report + GSC data + full wiki synthesis context (thesis, what-works, what-failed, decisions-log, concept pages). Generates weekly action plan. Writes `reports/weekly-plan.md`. Archives to `raw/strategy/`.

**`execute-fixes.ts`** — Parses `reports/weekly-plan.md` for `FIX:` and `REWRITE:` tasks. For each task, reads the target `.astro` file, calls Claude to apply the fix, checks word count (rejects if <85% of original — truncation guard), writes the file. Cooldown logic (updated 2026-05-06):
- Technical fixes (schema/canonical/404/redirect/voice/affiliate): no cooldown — always applied
- CRITICAL pages (400+ impr, pos ≤10, 0 clicks — detected from `data/gsc/latest.json` at runtime): 7-day minimum cooldown
- All other non-technical fixes: 14-day cooldown

**`execute-content.ts`** — Parses `reports/weekly-plan.md` for unchecked `[ ] NEW:` tasks. For each, calls Claude to write a complete `.astro` page. Pipeline (updated 2026-05-06):
1. `validateAstroFile()` — frontmatter fences, Layout wrapper, bare English operators in JS
2. `scoreContent()` — Haiku 4.5 scores 0-100 on 5 structural criteria: answer-first format, keyword placement, FAQPage schema, affiliate CTA block, internal links. Rejects if <80.
3. Writes to `src/pages/` only if both pass. Creates wiki entity page on success.
System prompt mandates 5 structural elements on every page: verdict box, answer-first opening, standalone citation capsule, 2-CTA affiliate block, FAQ+FAQPage schema.

**`verify-deploy.ts`** — Runs safety checks: secrets in code, affiliate tag presence, voice violations (non-Gesture first-person testing language), credentials staged, schema JSON-LD validity (requires `dist/` — must run after build), broken internal links (skips `/images/`, `/assets/`, and static file extensions like `.png`/`.ico`/`.svg`), content regression (word count vs previous commit — requires `fetch-depth: 0`). Blocks deploy if any check fails. Writes weekly summary. Writes `wiki/weekly/YYYY-WNN.md`.

---

## Obsidian Vault

The workspace root (`Claude TCA Workspace/`) is the Obsidian vault. Symlinks at the root point into the git repo so Obsidian can browse the wiki and raw directories directly:

- `wiki/` → `tall-chair-advisor/wiki/` — LLM knowledge base (markdown, wikilinks, graph view)
- `raw/` → `tall-chair-advisor/raw/` — Archived sources (CSV, JSON, MD files — visible in file explorer but not graph view)

CSV and JSON files in `raw/` are NOT markdown and do NOT appear in the Obsidian graph view. Only `.md` files connect in the graph. The wiki pages (`.md`) are the browsable, linked knowledge layer.

---

## GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GSC_SERVICE_ACCOUNT_JSON` | Base64-encoded GSC service account JSON |

---

## Running Manually (local)

```bash
cd tall-chair-advisor

npm run gsc:pull                    # Monday step only
npx tsx scripts/agents/audit.ts     # Tuesday
npx tsx scripts/agents/strategy.ts  # Wednesday
npx tsx scripts/agents/execute-fixes.ts   # Thursday
npx tsx scripts/agents/execute-content.ts # Friday
npx tsx scripts/agents/verify-deploy.ts   # Saturday
```

Requires `.env` with `ANTHROPIC_API_KEY` and `credentials/gsc-service-account.json`.

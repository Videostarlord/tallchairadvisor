---
type: concept
last_updated: 2026-05-28 (pipeline autonomy fixes: validation bug, roadmap injection, roadmap-sync)
tags: [automation, workflow, agents, github-actions, obsidian, analytics]
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
│   │   ├── gsc-pull.ts                  ← Pulls GSC API → data/gsc/latest.json
│   │   ├── gsc-analyze.ts               ← Monday: transforms raw GSC → analysis.json + wiki digest
│   │   ├── competitor-intelligence.ts   ← Monday (automated): SerpAPI+Firecrawl+Claude → intelligence.json
│   │   └── agents/
│   │       ├── wiki-utils.ts            ← Shared library (read/write wiki, archive, log)
│   │       ├── competitor-monitor.ts    ← Monday: lightweight metadata scan
│   │       ├── index-monitor.ts         ← Monday: URL Inspection API for all pages
│   │       ├── audit.ts
│   │       ├── strategy.ts              ← Wednesday: plan generation + post-gen enforcement
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
| Monday | monday.yml | `gsc-pull.ts` → `gsc-analyze.ts` → `clarity-pull.ts` → `competitor-intelligence.ts` → `index-monitor.ts` | GSC API, Clarity Data Export API, DataForSEO, Firecrawl, competitor URLs, URL Inspection API for all pages | `data/gsc/latest.json`, `data/gsc/analysis.json`, `data/gsc/history/`, `raw/gsc/`, `data/competitors/intelligence.json`, `data/competitors/crawl-cache.json`, `reports/index-monitor.md`, `wiki/pages/concepts/indexing-health.md`, `wiki/pages/concepts/gsc-intelligence.md`, `wiki/pages/concepts/competitor-landscape.md`, fixed `src/pages/` files (if issues found) | `main` |
| Tuesday | tuesday.yml | `audit.ts` | `data/gsc/latest.json`, live site meta/schema, wiki concept pages | `reports/audit-report.md`, `raw/audits/`, `wiki/pages/concepts/gsc-performance.md` | `main` |
| Wednesday | wednesday.yml | `strategy.ts` | Audit report, GSC data, wiki synthesis + concept pages | `reports/weekly-plan.md`, `raw/strategy/` | `main` |
| Thursday | thursday.yml | `execute-fixes.ts` | `reports/weekly-plan.md` (FIXES section) | Modified `src/pages/*.astro` files, `reports/fixes-log.md`, wiki fix history | `staging` |
| Friday | friday.yml | `execute-content.ts` | `reports/weekly-plan.md` (NEW CONTENT section) | New `src/pages/*.astro` files, `reports/content-log.md`, new wiki entity pages | `staging` |
| Saturday | saturday.yml | `verify-deploy.ts` | All week's changes, built `dist/` | `reports/weekly-summary.md`, `wiki/weekly/YYYY-WNN.md`, git push → Cloudflare deploy | `staging` + `main` |

Friday skips automatically if the weekly plan has no unchecked `[ ] NEW:` tasks.

**Step order within Saturday workflow (updated 2026-05-09):**
1. Checkout `staging` with `fetch-depth: 0`
2. `git fetch origin main && git merge origin/main` ← syncs Monday's GSC pull + any manual main fixes into staging *before* agents run
3. `npm ci`
4. `npm run build` ← must run before verify-deploy so `dist/` exists for schema check
5. `npm run lint:content`
6. `npx tsx scripts/agents/verify-deploy.ts`
7. Commit + push `staging` → `main` (no force — staging is a superset of main after step 2)

---

## Data Flow

```
GSC API
  ↓ (Monday: gsc-pull.ts)
data/gsc/latest.json  +  raw/gsc/gsc-YYYY-MM-DD.json (archive)
  +  wiki/pages/concepts/gsc-performance.md (raw snapshot, no Claude analysis)
  ↓ (Monday: gsc-analyze.ts — runs immediately after pull in same workflow)
data/gsc/analysis.json  +  wiki/pages/concepts/gsc-intelligence.md (structured opportunities, CTR leaks, affiliate alerts)
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

**`clarity-pull.ts`** — Monday behavioral data pull. Calls the Clarity Data Export API (2 requests: `dimension1=URL` + `dimension1=Device`). Budget: 2 of 10 daily requests. Writes `data/clarity/latest.json` with per-page sessions, scroll depth, rage clicks, dead clicks; device split; behavioral alerts (rage clicks ≥5, dead clicks ≥8, scroll depth <40%). Archives to `raw/clarity/`. `continue-on-error: true` in monday.yml — failure does not block GSC or competitor steps. Requires `CLARITY_TOKEN` secret.

**`gsc-pull.ts`** — Data collection + immediate wiki update. Pulls page-level + query-level GSC data via the Google Search Console API. Writes `data/gsc/latest.json`. Archives raw JSON to `raw/gsc/`. Updates `wiki/pages/concepts/gsc-performance.md` with a new snapshot (same history preservation format as `audit.ts`). Guard: skips wiki update if `last_updated` is already today — means `audit.ts` already ran that day and is authoritative. Appends to `wiki/log.md`. Does not call Claude API.

**`gsc-analyze.ts`** — Transforms `data/gsc/latest.json` into structured intelligence. Runs Monday immediately after `gsc-pull.ts` in the same workflow. Outputs `data/gsc/analysis.json` (scored opportunities: near-p1, ctr-leak, content-depth, affiliate-capture) and updates `wiki/pages/concepts/gsc-intelligence.md`. Phase 1 modules: CTR leak detector, query intent clusterer, opportunity scorer, cannibalization detector, affiliate opportunity detector, site trend / velocity. Phase 2 modules (added 2026-05-10): query entropy (fragmented/concentrated/balanced), impression gravity (hub candidate detection), informational→commercial intent transition mapper, AIO content structure recommendations, page velocity (history-based, activates after 2+ Monday runs). Includes URL canonical normalization (merges trailing-slash duplicates before scoring, uses composite `page|query` key for pageQuery rows), freshness warning (warns if latest.json >72h old), and junk query filter. Does not call Claude API. Archives to `data/gsc/history/YYYY-MM-DD.json` (16 weeks retained).

**`competitor-intelligence.ts`** (scripts/ root, not agents/) — v2 competitor gap analysis. 4 layers: (1) page-role-aware query selection (primary/supporting/strategic triple per TCA page), (2) SERP lane classification (editorial/retailer/brand/community/video), (3) persistent crawl cache with lane-aware freshness windows (editorial: 30d, brand: 14d, community: 7d), (4) role-specific Claude gap analysis comparing TCA page content against real crawled competitors. Selects top 8 pages from `analysis.json` (near-p1 + content-depth opportunities). Outputs `data/competitors/intelligence.json` (per-page gap findings with confidence filter) and `raw/competitors/YYYY-MM-DD-intelligence.json`. Updates wiki `competitor-landscape.md`. **This is the active Monday agent in monday.yml.** SERP provider: **DataForSEO** (`api.dataforseo.com/v3/serp/google/organic/live/advanced`). Cost: ~$1–5/month (DataForSEO SERP queries, Firecrawl 500 pages/month, mostly cache hits after first run). API keys: `DATAFORSEO_USERNAME` + `DATAFORSEO_PASSWORD` + `FIRECRAWL_API_KEY` required.

**`competitor-monitor.ts`** — LEGACY: Fetches configured competitor URLs (from `data/competitors/config.json`), extracts metadata, sends to Claude for analysis. Writes `data/competitors/latest.json`. Dead URLs (HTTP 400+) are flagged. **NOTE:** This script is no longer in monday.yml. The Monday workflow now runs `competitor-intelligence.ts` (SERP+Firecrawl+Claude v2) instead. `competitor-monitor.ts` can still be run manually (`npm run agent:competitor`) but is NOT part of the automated weekly cycle. `strategy.ts` prefers `data/competitors/intelligence.json` over `data/competitors/latest.json` when both exist.

**`audit.ts`** — Reads `data/gsc/latest.json` + fetches live meta/schema from the site. Sends to Claude with wiki context for historical comparison. Writes audit report to `reports/` and archives to `raw/audits/`. Updates `wiki/pages/concepts/gsc-performance.md` (preserves up to 8 weeks of historical snapshots).

**`strategy.ts`** — Reads audit report + GSC data + full wiki synthesis context (thesis, what-works, what-failed, decisions-log, concept pages). Generates weekly action plan. Writes `reports/weekly-plan.md`. Archives to `raw/strategy/`. Post-generation, `enforcePlanConstraints()` automatically drops tasks that violate: pages <300 impressions (non-technical), pages on 14-day cooldown (git-log Set), conditional language ("verify before executing", "only if..."), FIX+REWRITE overlap on same page, and >5 FIX cap. Dropped tasks are appended as a `## DROPPED TASKS` section in the archived plan for debugging. Hard error if zero valid tasks remain after enforcement — weekly-plan.md is never written in a broken state.

**`execute-fixes.ts`** — Parses `reports/weekly-plan.md` for `FIX:` and `REWRITE:` tasks. For each task, reads the target `.astro` file, calls Claude to apply the fix, checks word count (rejects if <85% of original — truncation guard), writes the file. Cooldown logic (updated 2026-05-06):
- Technical fixes (schema/canonical/404/redirect/voice/affiliate): no cooldown — always applied
- CRITICAL pages (400+ impr, pos ≤10, 0 clicks — detected from `data/gsc/latest.json` at runtime): 7-day minimum cooldown
- All other non-technical fixes: 14-day cooldown

Output safety (updated 2026-05-07 — added after Thursday build failure):
- `sanitizeFrontmatter()` runs on all Claude-generated output before writing. Replaces em dashes (`—` → `—`), en dashes (`–` → `–`), and curly quotes with ASCII equivalents in the `---...---` frontmatter JS block. HTML template section is not modified. Prevents esbuild `Unexpected "—"` parse errors.
- System prompt explicitly instructs: use only ASCII in frontmatter; em dashes are permitted in the HTML template section only.

**`execute-content.ts`** — Parses `reports/weekly-plan.md` for unchecked `[ ] NEW:` tasks. For each, calls Claude to write a complete `.astro` page. Pipeline (updated 2026-05-06):
1. `validateAstroFile()` — frontmatter fences, Layout wrapper, bare English operators in JS, rejects unresolved `AMAZON_URL` placeholders. Retries once with failure message injected as correction instruction.
2. `scoreContent()` — Haiku 4.5 scores 0-100 on 5 structural criteria: answer-first format, keyword placement, FAQPage schema, affiliate CTA block, internal links. Rejects if <80. Failed drafts archived to `raw/content-rejected/` (not discarded silently).
3. Writes to `src/pages/` only if both pass. Creates wiki entity page on success. Updates wiki `index.md` with new page entry.
System prompt mandates 5 structural elements on every page: verdict box, answer-first opening, standalone citation capsule, 2-CTA affiliate block, FAQ+FAQPage schema.

**`verify-deploy.ts`** — Runs safety checks: secrets in code, affiliate tag presence, voice violations (non-Gesture first-person testing language), credentials staged, schema JSON-LD validity (requires `dist/` — must run after build), broken internal links (skips `/images/`, `/assets/`, and static file extensions like `.png`/`.ico`/`.svg`), content regression (word count vs previous commit — requires `fetch-depth: 0`). Blocks deploy if any check fails. Writes weekly summary. Writes `wiki/weekly/YYYY-WNN.md`.

---

## Obsidian Vault

The workspace root (`Claude TCA Workspace/`) is the Obsidian vault. Symlinks at the root point into the git repo so Obsidian can browse the wiki and raw directories directly:

- `wiki/` → `tall-chair-advisor/wiki/` — LLM knowledge base (markdown, wikilinks, graph view)
- `raw/` → `tall-chair-advisor/raw/` — Archived sources (CSV, JSON, MD files — visible in file explorer but not graph view)

CSV and JSON files in `raw/` are NOT markdown and do NOT appear in the Obsidian graph view. Only `.md` files connect in the graph. The wiki pages (`.md`) are the browsable, linked knowledge layer.

---

## Known Issues & Tech Debt

Evaluated 2026-05-11. Source: `raw/audits/2026-05-11-workflow-evaluation.md`.

### High Priority

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| H1 | No API retry logic — transient 529/5xx on Saturday blocks deploy | `verify-deploy.ts` Claude summary call | 3-attempt exponential backoff loop around `client.messages.create()` |
| H2 | Wiki entity pages created for failed content tasks | `execute-content.ts:384` | Add `if (result.success)` guard before entity creation loop |
| H3 | No human review gate — plan executes autonomously Thu after Wed generation | Thursday workflow trigger | Check for `reports/weekly-plan.approved` marker; block execution if absent |

### Medium Priority

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| ~~M1~~ | ~~No prompt caching~~ | ~~`strategy.ts`, `execute-content.ts`~~ | **FIXED 2026-05-27.** All three agents have `cache_control: {type:'ephemeral'}` on system blocks. `execute-content.ts` further split into static-cached block + uncached slug-specific differentiation block — enables cache hits on retries and multi-task runs. |
| M2 | Thursday force-push doesn't gate on build result before staging push | `thursday.yml` | Ensure `git push --force` only runs after build passes |
| M3 | No failure notifications beyond GH Actions email | All workflows | Add `curl` POST to webhook in `if: failure()` step on each workflow |
| M4 | `execute-content.ts` wiki index update hardcoded to `## Concept Pages` heading | `execute-content.ts` | Use flexible insertion pattern; place new entries in Site Page Entities section |

### Low Priority

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| L1 | DataForSEO usage has no per-run cost tracking | `competitor-intelligence.ts` | Surface estimated query count in weekly summary |
| L2 | Voice check patterns only cover named chairs | `verify-deploy.ts` `checkVoice()` | Update pattern list when new chairs are added |

---

## GitHub Secrets Required

| Secret | Value | Required |
|--------|-------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes |
| `GSC_SERVICE_ACCOUNT_JSON` | Base64-encoded GSC service account JSON | Yes |
| `CLARITY_TOKEN` | Clarity Data Export API token | Configured — clarity-pull.ts |
| `DATAFORSEO_USERNAME` | DataForSEO account username | Configured — competitor-intelligence.ts |
| `DATAFORSEO_PASSWORD` | DataForSEO account password | Configured — competitor-intelligence.ts |
| `FIRECRAWL_API_KEY` | Firecrawl API key — 500 pages/month free tier (mostly cache hits after first run) | Configured — competitor-intelligence.ts |

---

## Site Analytics & Tracking

| Tool | Purpose | Installation | Status |
|------|---------|--------------|--------|
| Google Analytics 4 | Page views, sessions, affiliate click events | `PUBLIC_GA_MEASUREMENT_ID` env var → Layout.astro | Active |
| Microsoft Clarity | Heatmaps, session recordings, scroll depth | Inline script in `src/layouts/Layout.astro` `<head>` (tag ID: `wqec7ap5fe`) | Partially blocked on live site — diagnosed 2026-05-14 |

Clarity script is unconditional (no env gate) — it is emitted on every page. GA4 is gated on `PUBLIC_GA_MEASUREMENT_ID` being set.

### Clarity Diagnosis — 2026-05-14

Raw audit: `raw/audits/2026-05-14-clarity-diagnosis.md`

- GitHub `main` and the local repo both contain the Clarity snippet in `src/layouts/Layout.astro`.
- Live homepage `/` is still serving a stale CSP variant that omits Clarity domains entirely, so the browser blocks the loader even though the HTML contains the snippet.
- Sampled content pages are serving a newer CSP variant, but the tracked `_headers` file only allows `https://www.clarity.ms`.
- The fetched Clarity bootstrap script immediately loads `https://scripts.clarity.ms/0.8.64/clarity.js` and pings `https://c.clarity.ms/c.gif`, so the current `script-src` allowlist is still incomplete even on pages with the newer CSP.

### Cloudflare Cache Investigation — 2026-05-14

Raw audit: `raw/audits/2026-05-14-cloudflare-cache-investigation.md`

- Pages origin and deployment URLs serve the expected `_headers` output: `Cache-Control: public, max-age=300, must-revalidate` and the wildcard Clarity CSP.
- The custom domain `tallchairadvisor.com` serves a different HTML cache profile: `CF-Cache-Status: HIT` and `Cache-Control: public, max-age=3600, must-revalidate`.
- Fresh query-string variants immediately pull the new deployment and then become cached on repeat requests, proving the custom-domain zone is caching full HTML by URL key.
- Result: old per-path HTML objects can survive on the custom domain even after a new Pages deployment is live.

---
## Running Manually (local)

```bash
cd tall-chair-advisor

npm run gsc:pull                               # Monday step 1: pull GSC data
npm run gsc:analyze                            # Monday step 2: build analysis.json + gsc-intelligence wiki page
npm run competitor:intelligence                # Monday step 3: SerpAPI+Firecrawl+Claude competitor gaps (requires SERP_API_KEY + FIRECRAWL_API_KEY)
npx tsx scripts/agents/index-monitor.ts        # Monday step 4: URL Inspection API
# npx tsx scripts/agents/competitor-monitor.ts  ← LEGACY only (not in monday.yml)
npx tsx scripts/agents/audit.ts                # Tuesday
npx tsx scripts/agents/strategy.ts             # Wednesday
npx tsx scripts/agents/execute-fixes.ts        # Thursday
npx tsx scripts/agents/execute-content.ts      # Friday
npx tsx scripts/agents/verify-deploy.ts        # Saturday

# Monthly (manual): full competitor intelligence pipeline
npm run competitor:intelligence                 # Requires SERP_API_KEY + FIRECRAWL_API_KEY in .env
```

Requires `.env` with `ANTHROPIC_API_KEY` and `credentials/gsc-service-account.json`.

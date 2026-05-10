# TCA System Map
**Auditor:** CLAUDE-SONNET-4-6 | **Date:** 2026-05-09 | **Mode:** Read-only forensic audit

---

## System Overview

TallChairAdvisor.com is a niche affiliate site (ergonomic chairs for tall people 6'+) running on Astro SSG, deployed to Cloudflare Pages via a fully automated weekly agent pipeline. The system is a 5-layer stack:

```
[1] Data Ingestion        GSC API + Apify Reddit + Firecrawl-style competitor HTML fetch
        ↓
[2] Intelligence Layer    gsc-analyze.ts → analysis.json (7 scoring modules)
        ↓
[3] Agent Decision Layer  Monday→Saturday GitHub Actions (6 Claude-powered agents)
        ↓
[4] Execution Layer       Direct writes to src/pages/ (fixes + new .astro files)
        ↓
[5] Deployment Layer      Build → verify → push to staging → merge to main → Cloudflare Pages
```

---

## Every Component in the System

### GitHub Actions Workflows (6 files in .github/workflows/)

| Workflow | Day | Time (UTC) | Purpose |
|----------|-----|------------|---------|
| monday.yml | Monday | 08:00 | GSC pull + GSC analyze + competitor scan + index health check |
| tuesday.yml | Tuesday | 08:00 | Site audit (meta/schema/CTR against live site) |
| wednesday.yml | Wednesday | 08:00 | Strategy + weekly plan generation |
| thursday.yml | Thursday | 08:00 | Execute fixes from plan (meta/schema/complex edits) |
| friday.yml | Friday | 08:00 | Write new content pages from plan |
| saturday.yml | Saturday | 09:00 | Verify + merge staging to main + deploy |

### Agent Scripts (7 files in scripts/agents/)

| Agent | Workflow | Reads | Writes | Claude Call |
|-------|----------|-------|--------|-------------|
| audit.ts | Tuesday | gsc/latest.json, gsc/analysis.json, live site (HTTP), wiki concepts | reports/audit-report.md, wiki/pages/concepts/gsc-performance.md, raw/audits/ | 1x Sonnet (4000 tok) |
| strategy.ts | Wednesday | audit-report.md, gsc/latest.json, gsc/analysis.json, competitors/latest.json, wiki (index, synthesis, concepts) | reports/weekly-plan.md, raw/strategy/ | 1x Sonnet (4000 tok) |
| execute-fixes.ts | Thursday | weekly-plan.md, gsc/latest.json, src/pages/*.astro | src/pages/*.astro (targeted edits), reports/fixes-log.md | 1-5x Sonnet per fix |
| execute-content.ts | Friday | weekly-plan.md, gsc/latest.json | src/pages/*.astro (new files), reports/content-log.md, wiki/pages/site-pages/ | 1-2x Sonnet + 1x Haiku per page |
| competitor-monitor.ts | Monday | data/competitors/config.json, gsc/latest.json, live competitor URLs (HTTP) | data/competitors/latest.json, raw/competitors/, wiki/pages/concepts/competitor-landscape.md | 1x Sonnet (2000 tok) |
| index-monitor.ts | Monday | GSC URL Inspection API, src/pages/*.astro | reports/index-monitor.md, src/pages/ (fixes), wiki/pages/concepts/indexing-health.md | 0-N x Sonnet per fixable page |
| verify-deploy.ts | Saturday | src/pages/*.astro, dist/**/*.html, reports/, gsc/latest.json, wiki synthesis | reports/weekly-summary.md, wiki/weekly/YYYY-WNN.md, wiki/synthesis/decisions-log.md | 1x Sonnet (800 tok) |
| wiki-utils.ts | All | wiki/, raw/ | wiki/, raw/ | None (utility library) |

### Core Data Scripts (non-agent)

| Script | Purpose | Reads | Writes |
|--------|---------|-------|--------|
| gsc-pull.ts | Pull 6 GSC data dimensions | GSC API | data/gsc/latest.json, raw/gsc/, wiki/pages/concepts/gsc-performance.md |
| gsc-analyze.ts | 7-module intelligence engine | data/gsc/latest.json | data/gsc/analysis.json, data/gsc/history/YYYY-MM-DD.json, wiki/pages/concepts/gsc-intelligence.md |
| reddit-fetch.ts | Apify Reddit scrape | Apify API | data/reddit/raw/<chairId>/ |
| reddit-normalize.ts | Normalize Reddit data | data/reddit/raw/ | data/reddit/normalized/<chairId>.json |
| reddit-summarize.ts | Claude summary of Reddit data | data/reddit/normalized/ | data/reddit/published/<chairId>.json |
| lint-content.mjs | Build-time content lint | src/pages/*.astro | None (exit code only) |

### Data Flow Map

```
GSC API ──────────────────────────────┐
                                       ↓
                                  gsc-pull.ts → data/gsc/latest.json
                                       ↓
                                  gsc-analyze.ts → data/gsc/analysis.json
                                                 → data/gsc/history/YYYY-MM-DD.json
                                                 → wiki/pages/concepts/gsc-intelligence.md
                                       ↓
Competitor URLs ──────────────────── Monday workflow
                                       ↓
                                  competitor-monitor.ts → data/competitors/latest.json
                                       ↓
GSC URL Inspection API ─────────── index-monitor.ts → reports/index-monitor.md
                                                      → src/pages/ (auto-fixes)
                                       ↓
TUESDAY ─────────────────────────── audit.ts (reads latest.json + live HTTP)
                                       ↓ reports/audit-report.md
WEDNESDAY ──────────────────────── strategy.ts (reads everything above + wiki)
                                       ↓ reports/weekly-plan.md
THURSDAY ──────────────────────── execute-fixes.ts (reads plan → edits src/)
                                       ↓ src/pages/*.astro (modified)
FRIDAY ─────────────────────────── execute-content.ts (reads plan → creates src/)
                                       ↓ src/pages/*.astro (new files)
SATURDAY ──────────────────────── verify-deploy.ts (validates everything)
                                       ↓ push staging → merge main → Cloudflare deploys
```

### Website Pages (46 total, grouped by function)

**Reviews (L5 money pages):** /review/gesture/, /review/leap-plus/, /review/aeron-size-c/, /review/sihoo-doro-s300/

**Comparisons (L4):** /aeron-vs-gesture/, /aeron-vs-leap-plus/, /gesture-vs-leap-plus/

**Chair sub-pages (L5 support):** /chairs/steelcase-gesture/{seat-depth,seat-height,tall-people,weight-limit}/, /chairs/herman-miller-aeron/{seat-height,size-guide,tall-people}/, /chairs/steelcase-leap-plus/{seat-height,tall-people,weight-limit}/

**Height hubs (L3):** /office-chairs-for-tall-people/, /office-chairs-for-6-foot-{3,4,5,6,7}/

**Pain/Ergonomics (L2):** /back-pain-spine-height/, /knee-pain-seat-depth/, /leg-pain-circulation/, /shoulder-pain-tall-people/

**Educational (L2):** /correct-chair-dimensions/, /how-to-adjust-chair/, /why-standard-chairs-dont-fit/, /standing-desk-height-tall-people/

**Money/Hub (L3):** /best-office-chairs/, /best-office-chairs-under-500/, /fit-guides/

**Utility:** /about/, /author/jackson-christopher/, /contact/, /affiliate-disclosure/, /privacy-policy/, /pain-ergonomics/

### Knowledge System (wiki/)

```
wiki/
├── index.md              ← Master catalog, read first by all agents
├── log.md                ← Chronological operation log (all agent actions)
├── pages/
│   ├── chairs/           ← 4 chair entity pages (gesture, aeron, leap-plus, sihoo)
│   ├── site-pages/       ← 6 site page entities (sparse — 6 of ~46 pages covered)
│   └── concepts/         ← 16 concept pages (gsc-intelligence, ctr-optimization, etc.)
├── synthesis/
│   ├── thesis.md         ← Strategic bet and current priorities
│   ├── what-works.md     ← Confirmed winning patterns
│   ├── what-failed.md    ← Failed approaches and lessons
│   └── decisions-log.md  ← Week-by-week log
└── weekly/               ← W16, W17, W18 (3 weeks of weekly summaries)
```

### Key Data Files

| File | Size | Purpose | Freshness |
|------|------|---------|-----------|
| data/gsc/latest.json | Large | 90-day GSC pull (pages, queries, pageQueries, deviceSplit, dailyTrend) | Updated Monday |
| data/gsc/analysis.json | Large | 7-module intelligence output (CTR leaks, opportunities, clusters, etc.) | Updated Monday |
| data/gsc/history/2026-05-10.json | Large | Only 1 history snapshot (page velocity inactive) | Updated Monday |
| data/competitors/latest.json | Medium | HTML metadata from 5 competitor pages | Updated Monday |
| data/reddit/published/*.json | Small | Claude summaries of Reddit chair discussions | Last updated March 2026 |

---

## Where the System Is Strong

1. **GSC intelligence pipeline** — gsc-analyze.ts is genuinely sophisticated. 7 modules (CTR leaks, clustering, opportunity scoring, cannibalization, affiliate detection, velocity, device split) produce well-structured, ranked output that agents actually consume.
2. **Week-over-week memory** — The wiki system correctly separates immutable raw data from maintained knowledge. Agents build on prior-week context rather than starting fresh each time.
3. **Safety rails** — Word count regression protection (15% floor), frontmatter sanitization, build rollback on specific .astro failures, voice violation detection, affiliate tag validation.
4. **Cooldown system** — 14-day edit cooldown (7-day for critical pages) prevents thrashing recently edited pages based on noisy signals.
5. **Content quality gate** — 80/100 threshold before writing new pages to disk.
6. **Architecture depth** — For a one-person solo operation, this system is remarkably complete.

## Where the System Is Fragile

1. **siteTrend: null, deviceIntelligence: null** — Two of the 7 intelligence modules are outputting null in current analysis.json. Either a data format mismatch or an API issue.
2. **Only 1 history snapshot** — Page velocity tracking requires 2+ weekly history files. Currently inactive.
3. **Friday agent force-push to main on failure** — Critical bug (see AGENT_WORKFLOW_AUDIT).
4. **No deployment feedback loop** — verify-deploy.ts runs before the push; it cannot confirm Cloudflare Pages actually deployed successfully.
5. **Competitor intelligence is HTML metadata only** — no keyword ranking data, making content gap analysis impossible.
6. **Wiki coverage is sparse** — Only 6 of ~46 pages have wiki entity pages.
7. **Reddit data stale** — All Reddit pulls date from March 2026. Pipeline not re-run since.

## Where the System Is Redundant

1. **Two audit stores** — raw/audits/ and wiki/ both contain audit information. Concept pages and raw files overlap.
2. **Two GSC wiki pages** — wiki/pages/concepts/gsc-intelligence.md (auto-generated weekly) and wiki/pages/concepts/gsc-performance.md (also auto-generated weekly) overlap in purpose. Strategy agent reads both.
3. **Three GSC concept pages** — gsc-intelligence.md, gsc-performance.md, and gsc-analysis-strategy.md all address GSC analysis. Confusing naming.

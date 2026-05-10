# TCA System Overview
**Audit Date:** 2026-05-09
**Auditor:** Senior Technical Strategist / Agent Systems Review

---

## 1. What Is This System Trying To Do?

Tall Chair Advisor (tallchairadvisor.com) is a niche affiliate site targeting tall people (6'+) looking for ergonomic office chairs. The business model is standard affiliate: earn Amazon commissions when visitors click through product links. The site is built on Astro SSG, deployed on Cloudflare Pages.

The system has two layers of ambition running in parallel:

**Layer A — Content Site:** Build a topically authoritative site on height-specific chair ergonomics that ranks on Google and converts visitors to Amazon clicks. The unique angle is Jackson Christopher, a 6'4" Mechanical Engineering student who has personally tested only the Steelcase Gesture but applies engineering analysis to all other chairs.

**Layer B — Autonomous SEO Pipeline:** Run a fully automated weekly improvement cycle using GitHub Actions + Anthropic API. The pipeline pulls fresh data Monday, audits Tuesday, strategizes Wednesday, executes fixes Thursday, writes content Friday, verifies and deploys Saturday — all without human input.

The thesis: own "height-specific chair ergonomics" as a sub-niche before any competitor notices it exists, and compound the advantage weekly through autonomous improvement.

---

## 2. Main Moving Parts

### 2a. The Website

**Framework:** Astro SSG (static output). All pages are `.astro` files in `tall-chair-advisor/src/pages/`. No content collections, no MDX. Deployed to Cloudflare Pages from the `main` git branch via continuous deployment.

**Page inventory (46 pages):**
- Homepage + utility pages (about, contact, privacy, affiliate disclosure)
- Full reviews: gesture (first-person), aeron-size-c, leap-plus, sihoo-doro-s300 (all research voice)
- Chair clusters: `/chairs/<brand>/` with sub-pages for seat-height, seat-depth, tall-people, weight-limit
- Height-specific guides: `/office-chairs-for-6-foot-[3-7]/`
- Comparison pages: aeron-vs-gesture, aeron-vs-leap-plus, gesture-vs-leap-plus
- Pain/ergonomic pages: back-pain-spine-height, knee-pain-seat-depth, leg-pain-circulation, shoulder-pain-tall-people
- Educational: correct-chair-dimensions, how-to-adjust-chair, why-standard-chairs-dont-fit, fit-guides, pain-ergonomics (hub)
- List pages: best-office-chairs, best-office-chairs-under-500, office-chairs-for-tall-people
- Workstation: standing-desk-height-tall-people

**Layout system:** Single `Layout.astro` handles title, description, canonical, OG, schema (JSON-LD), preloadImage, breadcrumbs (auto-rendered from BreadcrumbList schema). Schema is defined inline in each page's frontmatter block.

**Key components:**
- `Byline.astro` — author attribution with credentials and dates
- `RedditInsights.astro` — renders Reddit owner data (only used on gesture.astro and leap-plus.astro)
- `Header.astro`, `Footer.astro`

### 2b. The Data Pipeline (Reddit)

Three-stage manual pipeline: `reddit-fetch.ts` (Apify) → `reddit-normalize.ts` → `reddit-summarize.ts` (Claude API). Output lives in `data/reddit/published/<chairId>.json`. Pages import this at build time via `readFileSync`. Chair IDs registered in `scripts/chair-registry.ts`. This pipeline is entirely separate from the weekly automation — it is run manually when Reddit data needs refreshing.

### 2c. The Automation Pipeline (Weekly Agents)

Six TypeScript agents run via GitHub Actions on a Mon-Sat schedule. All agents read/write a shared wiki and raw archive. The pipeline is:

| Day | Agent | Primary Job |
|-----|-------|------------|
| Monday | `gsc-pull.ts` + `competitor-monitor.ts` + `index-monitor.ts` | Pull fresh GSC data, scrape competitors, check indexing, apply fixes (noindex removal, canonical correction) |
| Tuesday | `audit.ts` | Fetch each live page, check meta/schema/CTR, write `reports/audit-report.md`, update wiki GSC page |
| Wednesday | `strategy.ts` | Read all wiki context + audit + GSC + competitors, write `reports/weekly-plan.md` in structured format |
| Thursday | `execute-fixes.ts` | Parse plan's FIXES and REWRITES sections, apply targeted edits (meta/title) or full-file rewrites (schema/content), build-check |
| Friday | `execute-content.ts` | Parse plan's NEW CONTENT section, generate new Astro pages, quality-score, validate, write |
| Saturday | `verify-deploy.ts` | Run 7 safety checks, write weekly summary, merge staging → main, push to trigger Cloudflare deploy |

**Branch strategy:** Thursday and Friday write to `staging`. Saturday merges `main` into `staging`, runs checks, then pushes `staging → main` (no force). Monday writes directly to `main`.

### 2d. The Wiki System (3-Layer Knowledge Base)

All wiki and raw files live inside the git repo (`tall-chair-advisor/wiki/` and `tall-chair-advisor/raw/`) — committed alongside code, accessible to CI.

- **Layer 1 (raw/):** Immutable source documents — GSC exports, audit snapshots, strategy docs, competitor data. Never edited.
- **Layer 2 (wiki/):** LLM-maintained knowledge — entity pages (chairs, site pages), concept pages (CTR, schema, linking), synthesis pages (what-works, what-failed, thesis, decisions-log), weekly summaries. Updated by agents every week.
- **Layer 3 (SCHEMA.md):** Operating rules for how any agent (human or automated) interacts with the wiki.

Obsidian symlinks at workspace root (`wiki/` → `tall-chair-advisor/wiki/`, `raw/` → `tall-chair-advisor/raw/`) let Jackson browse the wiki as an Obsidian vault without affecting the Astro build.

### 2e. Manual Audit Agent (`tca-audit.md`)

A `.claude/agents/tca-audit.md` file defines a persistent Claude Code sub-agent for on-demand full site audits. It has its own 7-step protocol: read CLAUDE.md → find GSC data → run `/seo-audit` → run `/blog-geo` → score (SEO + GEO + Total) → fuse data → write `AUDIT_SUMMARY.md` + `NEXT_STEPS.md`. This agent is invoked manually, not on a schedule.

### 2f. Configuration and Safety

- **Sitemap:** Managed entirely in `astro.config.mjs` with a manual `pageLastmod` map and priority tier logic
- **Redirects:** `public/_redirects` for trailing-slash and legacy URL handling
- **Security headers:** `public/_headers`
- **Content lint:** `scripts/lint-content.mjs` — checks for draft placeholders and voice violations; runs in Thursday and Friday CI steps
- **Saturday safety checks:** secrets scan, affiliate links, voice constraint, credentials not staged, schema validity, internal links, content regression

### 2g. Affiliate Monetization

Amazon tag: `tag=tallchairadvi-20`. Links embedded inline in `.astro` pages. Saturday agent scans for violations. First confirmed commission ($18, May 1, 2026) came from `/knee-pain-seat-depth/` — a pain-pillar educational page, not a direct review. Revenue at time of audit: $18 total.

---

## 3. How the Pieces Fit Together

The intended flow is:

1. **Monday** refreshes data (GSC, competitors, index health)
2. **Tuesday** analyzes what's broken using live site data
3. **Wednesday** synthesizes findings into an execution plan by querying the wiki's accumulated history
4. **Thursday** applies fixes to existing pages
5. **Friday** writes new pages
6. **Saturday** verifies quality gates and ships everything to production
7. **Wiki** acts as institutional memory across all cycles — agents read it before acting and write to it after

The wiki is the key differentiator in the architecture. Without it, each agent would operate only on current-week data. With it, Wednesday's strategy agent knows what was tried 6 weeks ago, what failed, and what the current strategic thesis is. This is the design's biggest structural advantage.

**Current state as of May 9, 2026:** The pipeline was running but producing no fixes for 3+ weeks due to a shallow clone bug (cooldown logic always returning 0 days). That bug was fixed May 6. First real meta rewrites are queued for execution. Total traffic: 12,209 impressions, 29 clicks, 0.24% CTR (90-day). Single $18 commission to date.

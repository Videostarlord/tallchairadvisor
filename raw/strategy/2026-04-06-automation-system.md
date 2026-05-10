# TCA Automation System
**Created:** 2026-04-06
**Site:** tallchairadvisor.com
**Repo:** github.com/Videostarlord/tallchairadvisor

---

## Overview

A fully automated weekly SEO pipeline that runs on GitHub Actions without any manual input. Every week the system pulls fresh data, audits the site, generates a strategy, executes fixes and new content, verifies quality, and deploys to Cloudflare Pages — all while you sleep.

**Stack:** GitHub Actions → Anthropic API (claude-sonnet-4-6) → Astro SSG → Cloudflare Pages

---

## Weekly Schedule

| Day | Time (PDT) | Workflow | Output |
|-----|-----------|----------|--------|
| Monday | 1:00 AM | Data pull + competitor scan | `data/gsc/latest.json`, `data/competitors/latest.json` |
| Tuesday | 1:00 AM | Full site audit | `reports/audit-report.md` |
| Wednesday | 1:00 AM | Strategy + planning | `reports/weekly-plan.md` |
| Thursday | 1:00 AM | Execute fixes | Updated `src/pages/` files, `reports/fixes-log.md` |
| Friday | 1:00 AM | Write new content (conditional) | New `src/pages/` files, `reports/content-log.md` |
| Saturday | 2:00 AM | Verify + deploy | `reports/weekly-summary.md`, git push → Cloudflare |

Friday skips itself automatically if the weekly plan contains no new content tasks.

---

## File Structure

```
tall-chair-advisor/
├── .github/
│   └── workflows/
│       ├── monday.yml
│       ├── tuesday.yml
│       ├── wednesday.yml
│       ├── thursday.yml
│       ├── friday.yml
│       └── saturday.yml
├── scripts/
│   ├── gsc-pull.ts                    # GSC data fetcher
│   └── agents/
│       ├── competitor-monitor.ts      # Monday: fetches + analyzes competitor pages
│       ├── audit.ts                   # Tuesday: audits live site meta/schema/CTR
│       ├── strategy.ts                # Wednesday: generates weekly-plan.md
│       ├── execute-fixes.ts           # Thursday: applies fixes from plan
│       ├── execute-content.ts         # Friday: writes new Astro pages
│       └── verify-deploy.ts           # Saturday: safety checks before push
├── data/
│   ├── gsc/
│   │   └── latest.json               # 90 days of GSC data (refreshed Monday)
│   └── competitors/
│       ├── config.json               # Competitor URLs to monitor (edit quarterly)
│       └── latest.json               # Competitor metadata (refreshed Monday)
└── reports/
    ├── audit-report.md               # Tuesday output — issues by severity
    ├── weekly-plan.md                # Wednesday output — fix + content tasks
    ├── fixes-log.md                  # Thursday output — what was changed
    ├── content-log.md                # Friday output — what was written
    └── weekly-summary.md             # Saturday output — full week recap
```

---

## How Each Agent Works

### Monday — Data & Competitor Intelligence
1. Runs `npm run gsc:pull` → fetches 90 days of GSC data via Google Search Console API
2. Fetches competitor pages defined in `data/competitors/config.json`
3. Extracts title, meta description, H1, H2s, word count, schema types from each
4. Calls Claude to identify content gaps vs. our GSC performance
5. Commits both JSON files to the repo

### Tuesday — Full Site Audit
1. Reads `data/gsc/latest.json` to identify pages with meaningful impressions
2. Fetches each page live (curl-style) to check: title length, meta description length, canonical tag, OG tags, schema presence and validity
3. Calls Claude with all findings + site rules
4. Claude outputs a structured markdown audit report with issues ranked by severity and specific fixes
5. Commits `reports/audit-report.md`

### Wednesday — Strategy & Planning
1. Reads: audit report, GSC data, competitor analysis, previous week's plan
2. Calls Claude with full context + all site constraints (voice rules, affiliate rules, content pillars)
3. Claude outputs `reports/weekly-plan.md` in a structured format the execution agents can parse:
   - `## FIXES` — specific file paths + what to change
   - `## NEW CONTENT` — new pages with keyword, slug, angle
   - `## REWRITES` — existing pages needing overhaul
   - `## STRATEGY NOTES` — week's focus

### Thursday — Execute Fixes
1. Parses `## FIXES` and `## REWRITES` sections from weekly plan
2. For each fix: reads the source `.astro` file, asks Claude to apply the specific change, writes the result back
3. Claude outputs the complete updated file — no partial edits
4. Runs `npm run build` to verify no build errors before committing
5. Commits changed files + `reports/fixes-log.md`

### Friday — New Content (Conditional)
1. Parses `## NEW CONTENT` section from weekly plan
2. If empty → exits with code 0, workflow skips commit step
3. If tasks exist: reads an example Astro page for structure reference, calls Claude with brief + keyword + site rules
4. Claude writes the complete `.astro` page file
5. Runs `npm run build` to verify, commits new files + `reports/content-log.md`
6. Sets `CONTENT_WRITTEN=true` env var so the workflow knows to commit

### Saturday — Verify & Deploy
Runs four safety checks before allowing the deploy:

| Check | What it looks for |
|-------|------------------|
| Secrets scan | API keys, tokens, private keys in `src/` files |
| Affiliate links | Amazon URLs missing `tag=tallchairadvi-20` |
| Voice constraint | First-person testing language on non-Gesture pages |
| Credentials not staged | `.env`, `credentials/` files accidentally staged |

If any check fails → exits with code 1 → GitHub Actions blocks the git push → no deploy.
If all pass → writes `reports/weekly-summary.md` → commits → pushes → Cloudflare auto-deploys.

---

## Credentials & Secrets

| Secret | Stored In | Used By |
|--------|-----------|---------|
| `ANTHROPIC_API_KEY` | GitHub Secrets + `.env` | All Claude API calls |
| `GSC_SERVICE_ACCOUNT_JSON` | GitHub Secrets (base64) | Monday GSC pull |
| GSC credentials file | `credentials/gsc-service-account.json` | Local development only |

The `credentials/` directory and `.env` are both in `.gitignore` and will never be committed.

---

## Critical Site Rules Baked Into Every Agent

1. **Voice constraint** — Jackson has ONLY personally tested the Steelcase Gesture. All other chairs (Aeron, Leap Plus, Sihoo, etc.) must use research-based voice. First-person testing language on non-Gesture pages triggers a verification failure and blocks deploy.

2. **Affiliate tag** — every Amazon link must include `tag=tallchairadvi-20`. The Saturday agent scans for violations.

3. **Content quality gate** — new content targets 80+ on the blog-analyze scoring criteria before being committed.

4. **Meta constraints** — descriptions 130-155 chars, titles 50-60 chars. Audit agent flags violations.

5. **Schema validity** — no duplicate `@type` entries, valid JSON-LD only.

---

## What Still Requires Manual Input

| Task | Why |
|------|-----|
| Product images | Copyright — must be sourced legally (Amazon PA API recommended) |
| Chair spec verification | Accuracy critical — scan new pages for spec correctness before Saturday deploy |
| New competitor URLs | Edit `data/competitors/config.json` quarterly as you discover new competitors |
| Workflow failures | GitHub emails you on failure — check Actions tab and investigate |

Everything else is fully automated.

---

## Running Agents Manually

Any agent can be triggered manually without waiting for its schedule:

**Via GitHub:** Actions tab → select workflow → "Run workflow" button

**Locally (for testing):**
```bash
npm run gsc:pull              # Pull fresh GSC data
npm run agent:competitor      # Monday competitor scan
npm run agent:audit           # Tuesday audit
npm run agent:strategy        # Wednesday strategy
npm run agent:fixes           # Thursday fixes
npm run agent:content         # Friday content
npm run agent:verify          # Saturday verification
```

---

## Monitoring & Debugging

- **GitHub Actions tab** — live logs for every workflow run, email notification on failure
- `reports/weekly-summary.md` — human-readable recap of what shipped each week
- `reports/audit-report.md` — current site health issues
- `reports/weekly-plan.md` — what the agents are working on this week

---

## Extending the System

**To add a new competitor to monitor:**
Edit `data/competitors/config.json` — add an entry to the `competitors` array with `name`, `url`, and `topic`.

**To add a new agent check (Saturday):**
Add a new `check*()` function in `scripts/agents/verify-deploy.ts` and include it in the `Promise.all()` array.

**To change the schedule:**
Edit the `cron:` field in the relevant `.github/workflows/*.yml` file. Format: `minute hour * * day` (0=Sunday, 1=Monday, etc.). All times are UTC (PDT = UTC-7).

**To disable a workflow temporarily:**
In GitHub → Actions → select workflow → disable it. Re-enable when ready.

---

## Cost Estimate

| Item | Cost |
|------|------|
| Anthropic API (claude-sonnet-4-6) | ~$2-5/week |
| GitHub Actions | Free (public repo) |
| Cloudflare Pages | Free |
| GSC API | Free |
| **Total** | **~$10-20/month** |

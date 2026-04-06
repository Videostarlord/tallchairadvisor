---
type: concept
last_updated: 2026-04-06
tags: [guide, setup, repeatable, system]
---

# Automated SEO Pipeline — Full Setup Guide

A step-by-step guide for replicating this system on any new niche site. Assumes you're starting from scratch with a domain, a Google Search Console property, and a blank repo.

**What you'll have when done:**
- Astro SSG site deployed on Cloudflare Pages
- Weekly automated pipeline: GSC pull → audit → strategy → fixes → content → verify → deploy
- LLM Wiki knowledge base (Obsidian) that compounds intelligence over time
- Total cost: ~$10-20/month (Anthropic API)

---

## Phase 1: Google Search Console API Credentials

### Step 1.1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Click the project dropdown (top bar) → **New Project**
3. Name it something like `mysite-gsc-automation`
4. Click **Create**, then select it as your active project

### Step 1.2 — Enable the Search Console API

1. In the Google Cloud Console, go to **APIs & Services → Library**
2. Search for **Google Search Console API** (also called "Search Console API" or "Webmasters API")
3. Click it → **Enable**

### Step 1.3 — Create a Service Account

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → Service Account**
3. Name: `gsc-reader` (or anything descriptive)
4. Role: leave blank (no project-level role needed)
5. Click **Done**
6. You'll see the service account listed. Click on it.
7. Go to the **Keys** tab → **Add Key → Create New Key → JSON**
8. A `.json` file downloads. **This is your credentials file.** It looks like:

```json
{
  "type": "service_account",
  "project_id": "mysite-gsc-automation",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "gsc-reader@mysite-gsc-automation.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

9. **Save this file** as `credentials/gsc-service-account.json` in your project repo (it's in `.gitignore` — never commit it)

### Step 1.4 — Grant the Service Account Access to GSC

1. Go to [Google Search Console](https://search.google.com/search-console/)
2. Select your property (e.g., `https://yoursite.com/`)
3. Go to **Settings → Users and permissions → Add user**
4. Email: paste the `client_email` from the JSON file (e.g., `gsc-reader@mysite-gsc-automation.iam.gserviceaccount.com`)
5. Permission: **Restricted** (read-only is all the script needs)
6. Click **Add**

### Step 1.5 — Test Locally

```bash
# From your project root
mkdir -p credentials
# Copy the downloaded JSON into credentials/gsc-service-account.json

# Create .env
echo 'ANTHROPIC_API_KEY=sk-ant-api...' > .env

# Pull GSC data
npm run gsc:pull
```

You should see output like:
```
Pulling GSC data: 2026-01-06 → 2026-04-06 (90 days)
Done. Written to data/gsc/latest.json
  Pages: 15
  Queries: 42
```

If you get `403 Forbidden`, the service account email hasn't been added to GSC yet, or the API isn't enabled.

### Step 1.6 — Base64-encode for GitHub Secrets

The CI pipeline needs the credentials without a file. Base64-encode them:

```bash
base64 -i credentials/gsc-service-account.json | pbcopy
# (pbcopy puts it on your clipboard on Mac)
```

You'll paste this into GitHub Secrets in Phase 4.

---

## Phase 2: Project Scaffolding

### Step 2.1 — Create the Astro Site

```bash
npm create astro@latest my-site
cd my-site
npx astro add tailwind
npx astro add sitemap
```

### Step 2.2 — Install Automation Dependencies

```bash
npm install @anthropic-ai/sdk googleapis dotenv glob
npm install -D tsx
```

### Step 2.3 — Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "gsc:pull": "tsx scripts/gsc-pull.ts",
    "gsc:pull:16m": "tsx scripts/gsc-pull.ts --days=16m",
    "agent:competitor": "tsx scripts/agents/competitor-monitor.ts",
    "agent:audit": "tsx scripts/agents/audit.ts",
    "agent:strategy": "tsx scripts/agents/strategy.ts",
    "agent:fixes": "tsx scripts/agents/execute-fixes.ts",
    "agent:content": "tsx scripts/agents/execute-content.ts",
    "agent:verify": "tsx scripts/agents/verify-deploy.ts"
  }
}
```

### Step 2.4 — Create Directory Structure

```bash
mkdir -p scripts/agents
mkdir -p data/gsc data/competitors
mkdir -p reports
mkdir -p credentials
mkdir -p wiki/pages/chairs wiki/pages/site-pages wiki/pages/concepts wiki/weekly wiki/synthesis
mkdir -p raw/gsc raw/audits raw/strategy raw/competitors raw/misc raw/assets
```

### Step 2.5 — Set Up .gitignore

```gitignore
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp
*.log
npm-debug.log*
credentials/
```

### Step 2.6 — Create .env

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

---

## Phase 3: The Scripts

You need 8 files in `scripts/`. Here's what each does and the key things to customize per site.

### Step 3.1 — `scripts/agents/wiki-utils.ts` (shared library)

Copy verbatim from the TCA repo. This is site-agnostic — no customization needed.

**What it provides:**
- `readWikiIndex()`, `readWikiPage()`, `writeWikiPage()` — wiki CRUD
- `appendWikiLog()` — operation logging
- `archiveToRaw()`, `archiveJsonToRaw()` — immutable archiving
- `readSynthesisContext()`, `readConceptContext()` — pre-built context loaders for agent prompts
- `today()`, `currentWeek()` — date helpers

### Step 3.2 — `scripts/gsc-pull.ts`

**Customize these lines for each new site:**

```typescript
const SITE_URL = 'https://yoursite.com/';  // ← Your domain
const CREDENTIALS_PATH = resolve(ROOT, 'credentials/gsc-service-account.json');
const OUTPUT_PATH = resolve(ROOT, 'data/gsc/latest.json');
```

Everything else (date parsing, GSC API calls, wiki archiving) is generic.

### Step 3.3 — `scripts/agents/competitor-monitor.ts`

**Customize:**
- The Claude prompt's site description: `"You are an SEO strategist for yoursite.com, a niche affiliate site for..."`

**Also create:** `data/competitors/config.json`:

```json
{
  "targetQueries": [
    "your main keyword 1",
    "your main keyword 2"
  ],
  "competitors": [
    {
      "name": "Competitor Name",
      "url": "https://competitor.com/relevant-page/",
      "topic": "topic they cover"
    }
  ]
}
```

### Step 3.4 — `scripts/agents/audit.ts`

**Customize:**
- `const BASE_URL = 'https://yoursite.com';`
- The `system` prompt: site description, author name, voice rules, affiliate tag, meta length constraints

### Step 3.5 — `scripts/agents/strategy.ts`

**Customize:**
- The `system` prompt: site niche, author identity, voice constraints, content pillars, affiliate tag

**This is the most important agent.** It reads from the wiki before generating strategy. The prompt includes:
- `thesis.md` — current strategic direction
- `what-works.md` — proven patterns
- `what-failed.md` — don't repeat these
- `decisions-log.md` — recent history
- Concept pages: CTR optimization, content gaps, internal linking, AI citation readiness

### Step 3.6 — `scripts/agents/execute-fixes.ts`

**Customize:**
- The `system` prompt: site name, voice rules, affiliate tag, schema rules

The fix parser looks for this format in the weekly plan:
```
- [ ] FIX: [description] | [why] | FILE: src/pages/[path].astro
- [ ] REWRITE: [description] | [what to improve] | FILE: src/pages/[path].astro
```

### Step 3.7 — `scripts/agents/execute-content.ts`

**Customize:**
- The `system` prompt: site niche, author identity, voice rules, content rules, affiliate tag

The content parser looks for:
```
- [ ] NEW: [title] | [keyword] | [slug] | [description]
```

### Step 3.8 — `scripts/agents/verify-deploy.ts`

**Customize:**
- `SECRET_PATTERNS` — add any patterns specific to your API keys
- `NON_GESTURE_VOICE_PATTERNS` → rename to whatever your voice constraints are (e.g., if you only tested Product X, flag first-person voice for Products Y and Z)
- Affiliate link check: change `tag=tallchairadvi-20` to your Amazon tag (or remove if not Amazon affiliate)

---

## Phase 4: GitHub Repository & Secrets

### Step 4.1 — Create the Repo

```bash
cd my-site
git init
git add -A
git commit -m "initial commit"
gh repo create your-username/my-site --public --push
```

### Step 4.2 — Add GitHub Secrets

Go to your repo on GitHub → **Settings → Secrets and variables → Actions → New repository secret**

Add these two:

| Secret Name | Value |
|------------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (`sk-ant-api03-...`) |
| `GSC_SERVICE_ACCOUNT_JSON` | The base64-encoded contents from Step 1.6 |

### Step 4.3 — Create the 6 Workflow Files

Create `.github/workflows/` with these files. Each one follows the same pattern:

**monday.yml** — Data pull + competitor scan
```yaml
name: Monday — Data & Competitor Intelligence

on:
  schedule:
    - cron: '0 8 * * 1'  # 8:00 UTC (adjust for your timezone)
  workflow_dispatch:

permissions:
  contents: write

jobs:
  data-pull:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci

      - name: Restore GSC credentials
        run: |
          mkdir -p credentials
          echo "${{ secrets.GSC_SERVICE_ACCOUNT_JSON }}" | base64 -d > credentials/gsc-service-account.json

      - name: Pull GSC data
        run: npm run gsc:pull
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Run competitor intelligence
        run: npx tsx scripts/agents/competitor-monitor.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Commit data files + wiki updates
        run: |
          git config user.name "bot"
          git config user.email "bot@yoursite.com"
          git add data/gsc/latest.json data/competitors/latest.json raw/ wiki/
          git diff --staged --quiet || git commit -m "data: Monday pull $(date +%Y-%m-%d)"
          git push
```

**tuesday.yml** — Audit
```yaml
name: Tuesday — Full Site Audit

on:
  schedule:
    - cron: '0 8 * * 2'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci

      - name: Run audit agent
        run: npx tsx scripts/agents/audit.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Commit audit report + wiki updates
        run: |
          git config user.name "bot"
          git config user.email "bot@yoursite.com"
          git add reports/audit-report.md raw/ wiki/
          git diff --staged --quiet || git commit -m "report: Tuesday audit $(date +%Y-%m-%d)"
          git push
```

**wednesday.yml** — Strategy
```yaml
name: Wednesday — Strategy & Planning

on:
  schedule:
    - cron: '0 8 * * 3'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  strategy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci

      - name: Run strategy agent
        run: npx tsx scripts/agents/strategy.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Commit weekly plan + wiki updates
        run: |
          git config user.name "bot"
          git config user.email "bot@yoursite.com"
          git add reports/weekly-plan.md raw/ wiki/
          git diff --staged --quiet || git commit -m "plan: Week of $(date +%Y-%m-%d)"
          git push
```

**thursday.yml** — Execute fixes
```yaml
name: Thursday — Execute Fixes

on:
  schedule:
    - cron: '0 8 * * 4'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  execute-fixes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci

      - name: Run fixes agent
        run: npx tsx scripts/agents/execute-fixes.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Verify build
        run: npm run build

      - name: Commit fixes + wiki updates
        run: |
          git config user.name "bot"
          git config user.email "bot@yoursite.com"
          git add src/ reports/fixes-log.md raw/ wiki/
          git diff --staged --quiet || git commit -m "fix: Thursday SEO fixes $(date +%Y-%m-%d)"
          git push
```

**friday.yml** — New content (conditional)
```yaml
name: Friday — New Content (Conditional)

on:
  schedule:
    - cron: '0 8 * * 5'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  execute-content:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci

      - name: Run content agent
        id: content
        run: npx tsx scripts/agents/execute-content.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Verify build (only if content was written)
        if: env.CONTENT_WRITTEN == 'true'
        run: npm run build

      - name: Commit new content + wiki updates
        if: env.CONTENT_WRITTEN == 'true'
        run: |
          git config user.name "bot"
          git config user.email "bot@yoursite.com"
          git add src/ reports/content-log.md raw/ wiki/
          git diff --staged --quiet || git commit -m "content: New pages $(date +%Y-%m-%d)"
          git push
```

**saturday.yml** — Verify & deploy
```yaml
name: Saturday — Verify & Deploy

on:
  schedule:
    - cron: '0 9 * * 6'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  verify-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci

      - name: Run verification agent
        run: npx tsx scripts/agents/verify-deploy.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Final build verification
        run: npm run build

      - name: Commit weekly summary + wiki updates and push
        run: |
          git config user.name "bot"
          git config user.email "bot@yoursite.com"
          git add reports/weekly-summary.md raw/ wiki/
          git diff --staged --quiet || git commit -m "deploy: Weekly cycle $(date +%Y-%m-%d)"
          git push
```

**Cron schedule reference:**
- Format: `minute hour * * day` (0=Sunday, 1=Monday, etc.)
- All times are UTC. PDT = UTC-7, EST = UTC-5.
- `0 8 * * 1` = Monday at 8:00 UTC = 1:00 AM PDT

---

## Phase 5: Cloudflare Pages Deployment

### Step 5.1 — Connect to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/) → **Workers & Pages → Create**
2. Select **Connect to Git** → authorize GitHub → select your repo
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Click **Save and Deploy**

### Step 5.2 — Set Environment Variables

In Cloudflare Pages → your project → **Settings → Environment variables**:
- `PUBLIC_GA_MEASUREMENT_ID` = your GA4 ID (if using analytics)

### Step 5.3 — Custom Domain

1. In Cloudflare Pages → **Custom domains → Set up a custom domain**
2. Enter `yoursite.com`
3. Cloudflare handles DNS automatically if the domain is on Cloudflare

Now every `git push` to `main` triggers a Cloudflare Pages build. The Saturday workflow pushes → Cloudflare auto-deploys.

---

## Phase 6: The LLM Wiki (Obsidian Knowledge Layer)

### Step 6.1 — Create the Wiki Structure

Already done in Step 2.4, but here's what each directory is for:

```
wiki/
├── index.md              # Master catalog of ALL wiki pages (read this first)
├── log.md                # Chronological record of every operation
├── pages/
│   ├── chairs/           # One .md per product entity (or whatever your niche entities are)
│   ├── site-pages/       # One .md per important URL on your site
│   └── concepts/         # One .md per topic: CTR, schema, linking, competitors, etc.
├── weekly/               # One .md per week, written by Saturday agent
└── synthesis/
    ├── what-works.md     # Patterns/fixes with confirmed positive outcomes
    ├── what-failed.md    # Fixes that didn't work — don't repeat
    ├── thesis.md         # Current strategic thesis and priorities
    └── decisions-log.md  # Week-by-week log of what was done and decided

raw/
├── gsc/                  # GSC JSON exports archived by date (never edit)
├── audits/               # Audit reports archived by date
├── strategy/             # Plans and strategies archived by date
├── competitors/          # Competitor snapshots archived by date
├── misc/                 # Anything else
└── assets/               # Images, XML, CSV
```

### Step 6.2 — Seed the Wiki

Before the first automated run, create these starter files:

**wiki/index.md:**
```markdown
---
type: index
last_updated: YYYY-MM-DD
---

# Site Wiki Index

## Entity Pages
| Page | Summary |
|------|---------|
(empty — agents will populate this)

## Concept Pages
| Page | Summary |
|------|---------|

## Synthesis
| Page | Summary |
|------|---------|
| [[what-works]] | Confirmed wins with evidence |
| [[what-failed]] | Fixes that didn't produce results |
| [[thesis]] | Current strategic thesis |
| [[decisions-log]] | Week-by-week decision record |

## Raw Sources
Located in `raw/`. Organized by type.
```

**wiki/log.md:**
```markdown
---
type: log
---

# Wiki Log

Chronological record of wiki operations. Append new entries at the top.

---

## [YYYY-MM-DD] initial-setup | Wiki Initialized

Wiki created for [yoursite.com]. Awaiting first automated data pull.
```

**wiki/synthesis/thesis.md:**
```markdown
---
type: synthesis
last_updated: YYYY-MM-DD
tags: [thesis, strategy]
---

# Strategic Thesis

[Write 3-5 sentences about what your site is, why the niche works, and what the current priorities are. The Wednesday strategy agent reads this before generating each week's plan.]
```

**wiki/synthesis/what-works.md, what-failed.md, decisions-log.md:**
Create empty starter versions with just the frontmatter and a header. The agents will populate these as they run.

### Step 6.3 — Create SCHEMA.md

Copy from the TCA repo and customize the page types for your niche. The key sections:
- **Page types** — entity pages, concept pages, synthesis pages, weekly pages
- **Frontmatter convention** — type, last_updated, sources, tags
- **Operations** — ingest, query, lint workflows
- **Weekly agent integration** — which agent reads/writes which wiki pages
- **Rules** — never edit raw/, always update log, contradictions are features

### Step 6.4 — Open in Obsidian

**Option A (recommended):** Create a workspace directory that contains the repo + Obsidian config:

```
My Site Workspace/            ← Open this as Obsidian vault
├── .obsidian/                # Obsidian config
├── my-site/                  # The git repo
│   ├── src/
│   ├── wiki/                 # LLM wiki (inside repo for CI)
│   ├── raw/                  # Archived sources (inside repo for CI)
│   └── ...
├── wiki -> my-site/wiki      # Symlink for Obsidian browsing
├── raw -> my-site/raw        # Symlink for Obsidian browsing
└── CLAUDE.md                 # Claude Code instructions
```

Create the symlinks:
```bash
cd "My Site Workspace"
ln -sf my-site/wiki wiki
ln -sf my-site/raw raw
ln -sf my-site/SCHEMA.md SCHEMA.md
```

**Option B (simpler):** Open the repo itself as the Obsidian vault. The downside is Obsidian indexes `node_modules/` and `src/` which adds noise.

### Step 6.5 — Configure Obsidian Settings

**app.json:**
```json
{
  "useMarkdownLinks": false,
  "newLinkFormat": "shortest",
  "attachmentFolderPath": "raw/assets",
  "showFrontmatter": true,
  "alwaysUpdateLinks": true,
  "userIgnoreFilters": [
    "my-site/node_modules",
    "my-site/.astro",
    "my-site/.git",
    "my-site/dist"
  ]
}
```

**graph.json** — set `"search": "path:wiki"` to filter graph view to wiki pages only. Add color groups for your page types.

### Step 6.6 — Recommended Plugins

| Plugin | Why |
|--------|-----|
| **Smart Connections** | Semantic search over the wiki — ask questions in natural language |
| **Dataview** | Query frontmatter (tags, dates, types) into dynamic tables |
| **Obsidian Web Clipper** | Browser extension to clip competitor pages into raw/competitors/ |

---

## Phase 7: The Weekly Cycle (What Happens Automatically)

Once everything is pushed and workflows are enabled:

| Day | Time (UTC) | What Runs | Inputs | Outputs |
|-----|-----------|-----------|--------|---------|
| Monday | 08:00 | GSC pull + competitor scan | GSC API, competitor URLs | `data/gsc/latest.json`, `data/competitors/latest.json`, archived to `raw/`, wiki updated |
| Tuesday | 08:00 | Full site audit | GSC data, live site meta tags, wiki history | `reports/audit-report.md`, archived to `raw/audits/`, wiki pages updated |
| Wednesday | 08:00 | Strategy generation | Audit report, GSC data, competitor data, **full wiki context** | `reports/weekly-plan.md`, archived to `raw/strategy/` |
| Thursday | 08:00 | Execute fixes | Weekly plan's `## FIXES` section | Modified `.astro` files, `reports/fixes-log.md`, wiki fix history updated |
| Friday | 08:00 | Write new content | Weekly plan's `## NEW CONTENT` section | New `.astro` files, `reports/content-log.md`, new wiki entity pages |
| Saturday | 09:00 | Verify + deploy | All week's changes | Safety checks → `reports/weekly-summary.md` → `wiki/weekly/YYYY-WNN.md` → git push → Cloudflare deploys |

**Friday skips automatically** if the weekly plan has no `## NEW CONTENT` tasks.

**Saturday blocks deploy** if any safety check fails (secrets in code, missing affiliate tags, voice violations, credentials staged).

---

## Phase 8: Your Weekly Routine (5 minutes)

1. **Saturday morning:** Read `wiki/weekly/YYYY-WNN.md` (or check `reports/weekly-summary.md` on GitHub). This is the full recap.
2. **Spot-check any new content pages** for factual accuracy — the agents can't verify real-world specs.
3. **If a workflow failed:** GitHub emails you. Check the Actions tab. Usually it's an API key expiring or a rate limit.
4. **Quarterly:** Update `data/competitors/config.json` with new competitor URLs you've discovered.

---

## Checklist: New Site from Zero

```
[ ] Google Cloud project created + Search Console API enabled
[ ] Service account created + JSON key downloaded
[ ] Service account email added to GSC as Restricted user
[ ] base64-encoded credentials ready for GitHub Secrets
[ ] Astro site scaffolded with tailwind + sitemap
[ ] npm dependencies installed (@anthropic-ai/sdk, googleapis, dotenv, glob, tsx)
[ ] package.json scripts added (gsc:pull, agent:*)
[ ] Directory structure created (scripts/agents/, data/, reports/, wiki/, raw/)
[ ] .gitignore includes credentials/ and .env
[ ] .env created with ANTHROPIC_API_KEY
[ ] wiki-utils.ts copied (no changes needed)
[ ] gsc-pull.ts created with correct SITE_URL
[ ] 5 agent scripts created with site-specific prompts
[ ] data/competitors/config.json populated
[ ] Wiki seeded (index.md, log.md, thesis.md, what-works, what-failed, decisions-log)
[ ] SCHEMA.md created with site-specific page types
[ ] CLAUDE.md created with site rules
[ ] Git repo pushed to GitHub
[ ] GitHub Secrets set (ANTHROPIC_API_KEY, GSC_SERVICE_ACCOUNT_JSON)
[ ] 6 workflow .yml files created in .github/workflows/
[ ] Cloudflare Pages connected to repo
[ ] Local test: npm run gsc:pull works
[ ] Local test: npm run build passes with wiki/ and raw/ present
[ ] Obsidian vault configured with symlinks + graph view
[ ] First Monday workflow triggered manually via GitHub Actions tab
```

---

## Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Anthropic API (claude-sonnet-4-6) | ~$2-5/week | 6 agents × ~2K-8K tokens each |
| GitHub Actions | Free | Public repo; private repos get 2,000 min/month free |
| Cloudflare Pages | Free | Unlimited sites, 500 builds/month |
| Google Search Console API | Free | |
| Obsidian | Free | Local app, no account needed |
| **Total** | **~$10-20/month** | |

---

## Troubleshooting

**"403 Forbidden" on GSC pull:**
- Service account email not added to GSC, or Search Console API not enabled in Google Cloud

**Monday workflow fails silently:**
- Check GitHub Secrets are set correctly. The base64 decoding of GSC credentials is the most common failure — make sure you used `base64 -i` not `base64 -w 0`

**Thursday/Friday agent produces bad code:**
- The fix/content agents have Claude write the COMPLETE file. If it hallucinates bad Astro syntax, the `npm run build` step in the workflow catches it and the commit doesn't happen. Check the workflow logs for build errors.

**Saturday blocks deploy:**
- Read the verification output in the workflow logs. It tells you which check failed (secrets, affiliate links, voice, credentials).

**Wiki pages getting stale:**
- Run the lint check from SCHEMA.md: look for pages where `last_updated` is >4 weeks old, orphan pages with no inbound links, contradictions between pages.

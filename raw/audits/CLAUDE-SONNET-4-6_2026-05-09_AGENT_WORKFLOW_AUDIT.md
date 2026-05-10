# Agent Workflow Audit
**Auditor:** CLAUDE-SONNET-4-6 | **Date:** 2026-05-09 | **Mode:** Read-only forensic audit

---

## Agent-by-Agent Analysis

### 1. gsc-pull.ts (Monday, Step 1)

**Purpose:** Pull 6 GSC data dimensions from Google Search Console API.

**Inputs:** GSC Service Account credentials, date range (default 90 days)
**Outputs:** data/gsc/latest.json, raw/gsc/gsc-YYYY-MM-DD.json, wiki update

**What it does well:**
- Pulls 6 dimensions simultaneously: page, query, page+query, device+page, daily trend, totals
- Archives each pull to raw/gsc/ for historical reference
- Guards against double-updating the wiki if Tuesday's audit already ran

**Critical issue found:**
- The current analysis.json shows `siteTrend: null` and `deviceIntelligence: null`. If gsc-pull.ts correctly writes deviceSplit and dailyTrend arrays, then gsc-analyze.ts should populate these. The null values suggest either: (a) the analysis.json was generated from an OLD latest.json format that predated these fields, or (b) there's a silent failure in the GSC API calls for these dimensions. This is a data integrity gap — two intelligence modules are silently inactive.

**Scores:** Usefulness 8 | Clarity 9 | Reliability 7 | Scalability 8 | Risk 3 | Data Quality 6 | Strategic Value 9
**Verdict: Keep** — core data pipeline, well-designed. Investigate null siteTrend/deviceIntelligence.

---

### 2. gsc-analyze.ts (Monday, Step 2)

**Purpose:** Transform raw GSC data into structured intelligence for downstream agents.

**Inputs:** data/gsc/latest.json
**Outputs:** data/gsc/analysis.json, data/gsc/history/YYYY-MM-DD.json, wiki/pages/concepts/gsc-intelligence.md

**What it does well:**
- 7 modules (CTR leaks, query clustering, opportunity scoring, cannibalization, affiliate detection, site velocity, device split)
- 4 Phase-2 modules (query entropy, impression gravity, intent transitions, AIO recommendations)
- Properly archives history (keeps last 16 weeks)
- Writes a human-readable wiki digest alongside the JSON

**Issues:**
- siteTrend: null and deviceIntelligence: null in current output (data issue or format mismatch)
- Only 1 history file exists (2026-05-10.json) → pageVelocity always returns null (needs 2+ snapshots)
- Query clustering uses a simple 3-word normalized fingerprint — misses semantic equivalents
- AIO suspect detection threshold (pos ≤6, CTR < 0.5%, AIO indicator term present) is reasonable but has false positives for genuinely bad meta descriptions
- CTR expected curve uses desktop benchmarks; mobile SERP CTRs are typically 30-50% lower — inflates expected CTR for mobile-heavy queries

**Scores:** Usefulness 9 | Clarity 8 | Reliability 6 | Scalability 9 | Risk 2 | Data Quality 7 | Strategic Value 10
**Verdict: Keep + Fix** — genuinely excellent architecture. Fix the null output modules. Add a second history snapshot before velocity tracking activates.

---

### 3. competitor-monitor.ts (Monday, Step 3)

**Purpose:** Fetch competitor page metadata and generate gap analysis.

**Inputs:** data/competitors/config.json (list of URLs), gsc/latest.json
**Outputs:** data/competitors/latest.json, raw/competitors/, wiki/pages/concepts/competitor-landscape.md

**What it does well:**
- Polite fetch (2-second delay between requests)
- Dead URL detection
- Claude generates a brief strategic gap analysis from H2s + word count

**Critical weakness:**
- Only fetches HTML metadata: title, H2s, word count, schema types. NO keyword data.
- The gsc-analyze.ts itself notes this explicitly in a comment: "there is no structured keyword array to cross-reference against GSC clusters... this module is intentionally omitted from output."
- The Claude prompt asks for "top 3 content/SEO gaps" but Claude can only compare H2 headings and word counts. This is theater — it looks like competitive intelligence but produces generic recommendations.
- No tracking of competitor ranking positions on shared keywords
- Config.json targets only 5 specific competitor URLs (not their full sites)
- No alerting if a competitor publishes a page targeting TCA's top keywords

**The fundamental problem:** Competitive intelligence without SERP data is not competitive intelligence. It's page diffing.

**Scores:** Usefulness 3 | Clarity 7 | Reliability 7 | Scalability 4 | Risk 2 | Data Quality 2 | Strategic Value 2
**Verdict: Rewrite or deprioritize** — Either integrate a keyword ranking API (DataForSEO, ValueSERP) or replace with a simpler "monitor when competitors target our exact keywords" approach using Google Alerts or SERP API spot-checks. Current implementation produces the illusion of intelligence.

---

### 4. index-monitor.ts (Monday, Step 4)

**Purpose:** Check every page's GSC indexing status and auto-fix fixable issues.

**Inputs:** GSC URL Inspection API, src/pages/*.astro files
**Outputs:** reports/index-monitor.md, src/pages/ (auto-fixes), wiki indexing-health page

**What it does well:**
- Inspects every .astro file via GSC URL Inspection API
- Classifies issues (noindex, canonical, soft-404, robots, thin-content, wait)
- Applies targeted fixes (noindex removal, canonical correction, content expansion)
- Resubmits sitemap after fixes
- Respects SKIP_FIX list for intentionally noindexed pages

**Issues:**
- GSC URL Inspection API allows ~1 req/sec per property. With 46 pages this takes ~50 seconds minimum. Acceptable now, fragile at scale.
- "thin-content" fix type calls Claude with the entire source file and asks it to "add 200 words" — this is an unguarded full-file rewrite that could introduce voice violations or damage content structure. The word count guard (80% minimum) helps but doesn't catch subtler issues.
- No cooldown system — if a page fails inspection for "wait" (just needs time), the agent doesn't flag it as already-attempted-wait from last week. It will categorize the same "wait" page identically every Monday with no differentiation.
- Sitemap resubmission happens even when there are 0 fixable issues and only "wait" type problems. Unnecessary API call.

**Risk:** The auto-fix-and-commit path on index-monitor.ts writes to src/ on Monday, before the Tuesday audit or Wednesday strategy has run. A bad thin-content expansion could ship to main (via Monday's commit) and then remain through the week's cycle.

**Scores:** Usefulness 8 | Clarity 8 | Reliability 6 | Scalability 6 | Risk 5 | Data Quality 8 | Strategic Value 7
**Verdict: Keep + Guard** — Add voice violation check to the fix output before writing. Add cooldown to "wait" pages so they're not re-classified identically every week. Guard thin-content expansions with the same validate checks used in execute-content.ts.

---

### 5. audit.ts (Tuesday)

**Purpose:** Audit the live site's top 20 pages for meta/schema/CTR issues.

**Inputs:** gsc/latest.json, gsc/analysis.json, live site HTTP fetches, wiki concepts
**Outputs:** reports/audit-report.md, wiki/pages/concepts/gsc-performance.md, raw/audits/

**What it does well:**
- Fetches live HTML for actual meta tags (not relying on source files)
- Injects query-level CTR leak context from analysis.json alongside page-level data
- Reads wiki historical context to avoid re-suggesting already-tried fixes
- Properly rotates historical GSC snapshots in the wiki (keeps last 7)

**Issues:**
- Audits only the top 20 pages by impression count. Pages below this threshold (including some spec sub-pages and new pages) are never audited.
- The regex for meta description extraction: `/<meta\s+name=["']description["']\s+content="([^"]*)"/i` will miss meta descriptions where the content attribute comes BEFORE the name attribute. Some frameworks output `<meta content="..." name="description">`. The CLAUDE.md itself warns about this regex bug.
- The Claude prompt gets 4000 max_tokens which may truncate complex multi-page audit reports.
- No validation of the Claude output before archiving — a malformed response goes directly to disk.

**Scores:** Usefulness 9 | Clarity 8 | Reliability 7 | Scalability 7 | Risk 3 | Data Quality 8 | Strategic Value 8
**Verdict: Keep** — solid agent. Fix meta regex. Increase page audit limit to 30 when site grows.

---

### 6. strategy.ts (Wednesday)

**Purpose:** Generate the week's action plan (FIXES, NEW CONTENT, REWRITES).

**Inputs:** audit-report.md, gsc/latest.json, gsc/analysis.json, competitors/latest.json, wiki (index, synthesis, concept pages), git log for recently edited pages
**Outputs:** reports/weekly-plan.md, raw/strategy/

**What it does well:**
- Reads more context than any other agent (synthesis, thesis, what-works, what-failed, decisions-log, CTR, content-gaps, internal-linking, AI citation, competitor gaps)
- Validates plan format before committing (checks for parseable task rows)
- Edit cooldown rules are clearly specified in the system prompt
- Impression threshold guards prevent action on noisy signals (<100 impr)
- REWRITE vs NEW CONTENT distinction prevents execute-content.ts from overwriting existing pages

**Critical issue — format validation is weak:**
The `countParsedItems()` function only checks for `] FIX:` and pipe count ≥ 3. A malformed plan where Claude produces the right section headers but slightly wrong pipe format will: (a) pass validation, (b) produce zero parseable tasks in execute-fixes.ts, and (c) result in a no-op week. The warning is logged but not escalated to a blocking failure.

**Other issues:**
- The weekly plan is the single point of failure for the entire Thu/Fri execution cycle. If strategy.ts produces a bad plan on Wednesday, no human sees it before Thursday execution.
- No "sanity check" on whether the suggested NEW pages already exist in src/pages/ (execute-content.ts handles this, but strategy should catch it earlier).
- The competitor gap input is low-quality (see competitor-monitor critique above).

**Scores:** Usefulness 10 | Clarity 8 | Reliability 7 | Scalability 8 | Risk 5 | Data Quality 7 | Strategic Value 10
**Verdict: Keep + Add approval gate** — the highest-leverage agent in the pipeline. Consider adding a weekly manual review step before Thursday execution, or at minimum a Slack/email notification of the plan for Jackson to review before Thursday 1AM.

---

### 7. execute-fixes.ts (Thursday)

**Purpose:** Apply SEO fixes to src/pages/*.astro files.

**Inputs:** reports/weekly-plan.md, gsc/latest.json, src/pages/*.astro
**Outputs:** src/pages/*.astro (modified), reports/fixes-log.md, raw/audits/

**What it does well:**
- Targeted edit path for meta/title changes (regex replace on Layout props only, not full-file rewrite)
- Full-file path for complex changes (schema, affiliate links, verdict tables)
- Word count regression protection (15% floor)
- Cooldown enforcement (7 days for critical pages, 14 for others, bypass for technical fixes)
- Frontmatter sanitization (em-dashes, curly quotes → ASCII)
- Claude generates meta descriptions with character count validation before applying

**Issues:**
- The `sanitizeFrontmatter()` function only sanitizes characters in the JS frontmatter block. But the full-file rewrite path doesn't run sanitizeFrontmatter — it only runs on the CLEANED output. This means if Claude outputs Unicode in schema JSON strings that happen to be in the frontmatter, it could slip through.
- The `isCriticalPage()` function constructs the URL as `/` + filePath stripped of `src/pages/` + `.astro` + `/`. But some pages use index.astro at folder level (e.g., src/pages/chairs/herman-miller-aeron/index.astro → /chairs/herman-miller-aeron/). The URL construction logic correctly strips `/index`, but needs verification that the GSC data uses trailing-slash URLs consistently.
- Thursday pushes to `staging --force`. This is correct. BUT: if the build fails AND the per-file rollback fails (e.g., no .astro file identified in error output), the workflow exits with code 1 and the push never happens — but the fix IS written to disk locally. On the next push (e.g., manual trigger), modified-but-failed-build content could ship.

**Scores:** Usefulness 9 | Clarity 8 | Reliability 8 | Scalability 7 | Risk 4 | Data Quality 8 | Strategic Value 8
**Verdict: Keep** — the targeted edit architecture is genuinely clever. Address the edge case in isCriticalPage URL construction.

---

### 8. execute-content.ts (Friday)

**Purpose:** Write new .astro pages from the weekly plan.

**Inputs:** reports/weekly-plan.md, gsc/latest.json, wiki/index.md
**Outputs:** src/pages/*.astro (new files), reports/content-log.md, wiki/pages/site-pages/, wiki/index.md

**What it does well:**
- Template-based generation (shows Claude exactly what structure to produce)
- 2-attempt validation loop (retry with specific failure feedback)
- Quality scoring gate (80/100 using Haiku before writing to disk)
- AMAZON_URL placeholder detection catches unresolved template CTAs
- English operator detection (and/or in frontmatter JS → fail)
- Correctly skips existing pages (won't overwrite with NEW CONTENT)

**CRITICAL BUG — double force-push:**
```yaml
# Friday success case:
git push origin HEAD:staging --force   ✅ correct

# Friday failure case (CONTENT_WRITTEN != 'true'):
git push origin HEAD:main --force      ❌ DANGEROUS
```
If the content agent runs but writes zero pages (quality gate failures, validation failures, or no NEW tasks in plan), it does `git push origin HEAD:main --force`. This could overwrite the main branch with whatever state the CI runner has — including Wednesday's wiki updates from strategy.ts commit, but if executed from a stale checkout, it could overwrite main with older content.

**Other issues:**
- The quality gate uses Haiku with 200 max_tokens. This is structurally fast but semantically shallow. A page can score 80+ by having a verdict box div, keyword in H1, 4 FAQ entries, 2 Amazon links, and 3 internal links — regardless of whether the content is accurate, on-voice, or well-written.
- Wiki index update uses string replacement: `.replace('## Concept Pages', newEntries + '\n\n## Concept Pages')`. This inserts new site-page entries into the wrong section (Concept Pages header, not Site Page Entities). Bug — new pages appear in the wrong wiki index section.
- Generated wiki entity pages for new content have no content beyond the template stub. They'll never be updated unless there's a follow-up process.

**Scores:** Usefulness 9 | Clarity 8 | Reliability 7 | Scalability 7 | Risk 6 | Data Quality 6 | Strategic Value 9
**Verdict: Keep + Fix the force-push bug immediately** — the double force-push to main is the highest-risk bug in the entire system.

---

### 9. verify-deploy.ts (Saturday)

**Purpose:** Run pre-deploy safety checks and write the weekly summary.

**Inputs:** src/pages/*.astro, dist/**/*.html, reports/, gsc/latest.json, wiki synthesis
**Outputs:** reports/weekly-summary.md, wiki/weekly/YYYY-WNN.md, wiki/synthesis/decisions-log.md

**What it does well:**
- 7 parallel safety checks: secrets scan, affiliate links, voice constraint, credentials not staged, schema validity, internal links, content regression
- Voice constraint check specifically looks for first-person testing language on non-Gesture pages
- Schema validity checks parsed JSON-LD in built HTML (not source)
- Internal link validator builds a set of known routes from src/pages/

**Issues:**
- Voice violation regex patterns are very narrow: only 3 specific phrases. Claude could write "I tried out the Aeron" and it would pass.
- The weekly summary Claude call gets `max_tokens: 800` — for a weekly summary covering an entire week's activity, this is very tight.
- verify-deploy.ts runs and then the Saturday workflow pushes to staging AND main. But there's no confirmation that Cloudflare Pages built successfully. The Saturday workflow has no step to poll Cloudflare Pages API or wait for build confirmation.
- `checkContentRegression()` uses `git diff --name-only HEAD~1` — only compares against 1 commit back. If Thursday made 3 commits, this misses regressions from 2 commits ago.

**Scores:** Usefulness 9 | Clarity 9 | Reliability 7 | Scalability 8 | Risk 3 | Data Quality 8 | Strategic Value 8
**Verdict: Keep + Expand voice patterns + Add Cloudflare deploy confirmation**

---

## Priority Issues Summary

| Severity | Issue | File | Risk |
|----------|-------|------|------|
| CRITICAL | friday.yml force-pushes to main on content failure | friday.yml | Could overwrite main branch |
| HIGH | siteTrend: null, deviceIntelligence: null | analysis.json | 2 intelligence modules inactive |
| HIGH | No human review of weekly plan before execution | strategy.ts / thursday.yml | Bad plan auto-executes at 1AM |
| HIGH | index-monitor thin-content fix unguarded | index-monitor.ts | Unvalidated full-file rewrite on Monday |
| MEDIUM | Wiki index injection into wrong section | execute-content.ts | New pages appear in wrong wiki section |
| MEDIUM | Voice violation regex too narrow | verify-deploy.ts | Voice violations could slip through |
| MEDIUM | Competitor intelligence is HTML-only | competitor-monitor.ts | Strategy gets fake competitive data |
| LOW | Only 1 GSC history snapshot | data/gsc/history/ | Page velocity tracking inactive |

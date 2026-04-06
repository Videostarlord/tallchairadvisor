# Automation System Blind Spot Fixes
**Date:** 2026-04-06 | **Triggered by:** GPT review of TCA automation system identifying 8 structural vulnerabilities | **Commit:** single atomic commit covering all 7 actionable fixes

---

## Executive Summary

A GPT review of the TCA automation pipeline identified 8 structural blind spots. 7 were real and actionable. 1 ("not true RAG") was by-design and no-action. This document records what was changed, why, and how to verify each fix.

Fix 1 (voice/truth contradiction) was **already applied in a prior session** — all author/about/llms.txt/height-guide files already used correct "evaluated/researched" language. One residual violation was found in `chairs/steelcase-leap-plus/index.astro` and fixed here.

---

## Fix 1 — Voice Violation (1 file changed)

**Severity:** CRITICAL  
**File:** `src/pages/chairs/steelcase-leap-plus/index.astro` (line 204)

**What changed:**  
> "Those are the two measurements that were right at the margin on every other chair I **tested seriously**."

became:

> "Those are the two measurements that come up short on every other chair **evaluated for this height range**."

**Why:** Jackson has only personally tested the Steelcase Gesture. "Every other chair I tested seriously" on the Leap Plus page falsely implies he sat in multiple chairs. This violates the core E-E-A-T constraint in CLAUDE.md.

**Verification:** `grep -rn "I've tested\|I tested\|chairs tested" src/pages/ --include="*.astro" | grep -v gesture | grep -v "haven't personally\|haven't sat"` returns zero real violations (remaining hits are all Gesture-specific or "15+ chairs evaluated").

---

## Fix 2A — Competitor Config URLs

**Severity:** HIGH  
**File:** `data/competitors/config.json`

**What changed:** Replaced 4 competitors (Wirecutter, RTINGS, Ergonomic Trends, Office Chair Picks) with 5 verified URLs:

| Name | URL | Topic |
|------|-----|-------|
| BTOD.com | https://www.btod.com/Big-And-Tall-Chairs.php | big and tall chairs |
| ChairsFX | https://chairsfx.com/office-chair-reviews/aeron-remastered/ | aeron review |
| Tall.Life | https://tall.life/tall-office-chairs-for-tall-people/ | tall people chairs |
| TheHumanSolution | https://www.thehumansolution.com/steelcase-gesture-chairs/ | gesture product page |
| Wirecutter | https://www.nytimes.com/wirecutter/reviews/best-office-chair/ | best office chairs |

**Why:** RTINGS covers gaming/AV monitors, not ergonomic office chairs — not a relevant competitor. Ergonomic Trends and Office Chair Picks had URL reliability concerns. The new list is niche-focused (tall people + Gesture specifically) and matches actual search competition.

---

## Fix 2B — Dead URL Health Tracking

**Severity:** HIGH  
**File:** `scripts/agents/competitor-monitor.ts`

**What changed:**
1. Added `dead: boolean` to `CompetitorPage` interface
2. `dead` is set to `true` when `status >= 400 || status === 0`
3. Dead pages are filtered OUT of the Claude analysis prompt (no point analyzing 404 pages)
4. A SKIPPED notice lists dead URLs in the prompt for awareness
5. Dead URLs remain in `data/competitors/latest.json` with their `dead` flag for debugging
6. Wiki log entry now includes `(N live, N dead)` count

**Why:** Previously, a dead URL would silently produce an empty CompetitorPage with `wordCount: 0`, `title: null`, etc. Claude would see this as a competitor with no content and draw false conclusions. Now dead URLs are explicitly labeled and excluded from analysis.

---

## Fix 3 — Audit History Preservation

**Severity:** HIGH  
**File:** `scripts/agents/audit.ts`

**What changed:** Replaced the `writeWikiPage()` call that overwrote `wiki/pages/concepts/gsc-performance.md` with read-then-append logic:

1. Read existing `gsc-performance.md`
2. Extract current "Latest Snapshot" section
3. Convert it to a dated `### YYYY-MM-DD` entry under "## Historical Snapshots"
4. Trim historical list to max 8 entries (drop oldest)
5. Write new file: fresh "Latest Snapshot" + preserved history + updated frontmatter

Also added `readWikiPage` to the audit.ts imports (was missing).

**Why:** Each weekly audit run was destroying all prior GSC snapshots. The `gsc-performance.md` wiki page already had a "Trend section: Historical snapshots showing progression" in its content, but the wholesale overwrite was undoing all prior entries on every run. Now up to 8 weeks of history is preserved — enough for trend analysis by the strategy agent.

---

## Fix 4 — Expanded Deploy Verification

**Severity:** HIGH  
**File:** `scripts/agents/verify-deploy.ts`

**What changed:** Added 3 new check functions to the `Promise.all()` alongside existing 4 checks:

### `checkSchemaValidity()`
- Globs `dist/**/*.html` (skips gracefully if `dist/` doesn't exist)
- Extracts all `<script type="application/ld+json">` blocks
- `JSON.parse()`s each; reports filename + excerpt on failure
- **Why:** JSON-LD parse errors suppress rich result eligibility (confirmed issue on /best-office-chairs/ in the April 3 audit). This now gates every deploy.

### `checkInternalLinks()`
- Builds a set of known routes from `src/pages/**/*.astro`
- Checks every `href="/..."` in the codebase against known routes
- Skips `/images/`, `/assets/`, fragment anchors, query strings
- **Why:** Broken internal links degrade crawlability and user experience. Previously undetected without a live crawl.

### `checkContentRegression()`
- Uses `git diff --name-only HEAD~1 -- src/pages/` to find changed pages
- Compares word count before/after; flags if drop exceeds 15%
- Skips gracefully if git history is unavailable or file is new
- **Why:** The `execute-fixes.ts` agent calls Claude to rewrite files. There was no safety net against Claude returning truncated content. This check at deploy time catches any regressions that slipped through.

---

## Fix 5 — Word Count Guard in execute-fixes.ts

**Severity:** HIGH  
**File:** `scripts/agents/execute-fixes.ts`

**What changed:** In `applyFix()`:
- Captures `originalWordCount` immediately after reading the file
- After Claude returns and cleans output: captures `newWordCount`
- If `newWordCount < originalWordCount * 0.85`: returns a `REJECTED` result with both counts and percentage, skips `writeFileSync`
- On success: includes word counts in the summary for audit trail

**Why:** Claude occasionally returns partial content (especially on long files near token limits). Previously this would silently overwrite a full-length page with a stub. The 85% threshold gives generous margin for legitimate trims while blocking accidental truncation.

---

## Fix 7A — Edit Cadence Rules in strategy.ts

**Severity:** NEW (not in original blind spots — GPT 5.4 recommendation)  
**File:** `scripts/agents/strategy.ts`

**What changed:**
1. Added `import { execSync } from 'child_process'`
2. Added `getRecentlyEditedPages()` function: queries `git log --since=21-days-ago -- src/pages/` to get recently modified .astro files
3. Injects two new sections into the Claude weekly planning prompt:

**EDIT CADENCE RULES:**
```
- Do NOT schedule FIXES or REWRITES for pages edited in the last 14 days UNLESS technical issue
- New content pages: publish freely every week
```

**IMPRESSION THRESHOLDS FOR ACTION:**
```
- <100 impressions: noise — do not optimize
- 100–300: weak signal — technical fixes only
- 300+: actionable — CTR/meta changes worth trying
- 400+ at pos ≤10 with 0 clicks: CRITICAL — fix regardless of cooldown
```

**RECENTLY EDITED PAGES** (live list from git, prevents re-editing)

**Why:** At ~4,100 total impressions, re-editing the same page weekly makes results uninterpretable. There's no way to know if a CTR change worked if the page is edited again before GSC data catches up. The strategy agent had no concept of data maturity or editing lag — it would re-suggest the same pages every week.

---

## Fix 7B — Cooldown Guard in execute-fixes.ts

**Severity:** NEW  
**File:** `scripts/agents/execute-fixes.ts`

**What changed:**
1. Added `import { execSync } from 'child_process'`
2. Added `daysSinceLastEdit(filePath)` function: queries `git log -1 --format=%ai` for the file's last commit date
3. In `applyFix()`, before calling Claude:
   - If file was edited < 14 days ago AND fix description doesn't match technical keywords (`schema|canonical|noindex|404|broken|redirect|voice|affiliate`): return `SKIPPED` with reason
   - Technical fixes bypass the cooldown always

**Why:** The strategy prompt (Fix 7A) is advisory — Claude might still suggest a non-technical meta tweak on a recently edited page. The execute-fixes.ts guard is the hard enforcement layer. Defense in depth.

---

## Fix 6 — Wiki Documentation

**Files updated:**
- `wiki/synthesis/decisions-log.md` — W15 entry documenting all 7 fixes and edit cadence policy
- `wiki/log.md` — operation entry listing all changed files
- `wiki/pages/concepts/content-gaps.md` — new "Edit Cadence Policy" section with threshold tables and implementation notes

---

## What Was NOT Changed (and Why)

**"Not true RAG" blind spot:** The agents read wiki pages as text context passed to Claude — not vector similarity search. This is by design. True RAG (embedding search) would add infrastructure complexity for a site with ~25 wiki pages. Flat-file reading of targeted wiki pages is adequate at this scale and simpler to audit.

---

## Verification Steps

```bash
# 1. Build passes
cd tall-chair-advisor && npm run build
# → "44 page(s) built"

# 2. Voice violations clear
grep -rn "I've tested\|I tested\|chairs tested\|hands-on testing\|15+ chairs" \
  src/pages/ --include="*.astro" | grep -v gesture | grep -v "haven't personally\|haven't sat\|not personal"
# → only "15+ chairs evaluated" hits (correct) + Gesture-specific lines (correct)

# 3. Competitor config valid JSON
python3 -c "import json; json.load(open('data/competitors/config.json'))"
# → exits 0

# 4. No new TypeScript errors (pre-existing config errors are expected)
npx tsc --noEmit scripts/agents/competitor-monitor.ts 2>&1 | grep "competitor-monitor"
# → only pre-existing TS1343/TS2802 errors, no TS2741 (dead property) error
```

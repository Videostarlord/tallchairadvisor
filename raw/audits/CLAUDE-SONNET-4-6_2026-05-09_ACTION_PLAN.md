# Action Plan
**Auditor:** CLAUDE-SONNET-4-6 | **Date:** 2026-05-09 | **Mode:** Read-only forensic audit

Prioritized by: (1) risk elimination, (2) revenue impact, (3) intelligence quality, (4) simplification.

---

## CRITICAL FIXES — Fix Before Next Automated Run

### FIX-1: Patch the Friday force-push-to-main bug
**File:** `.github/workflows/friday.yml`
**Problem:** When `CONTENT_WRITTEN != 'true'`, the workflow runs `git push origin HEAD:main --force`. This can overwrite main with stale CI runner state.
**Fix:**
```yaml
# Replace this in the "Commit content log (failures)" step:
git push origin HEAD:main --force || true

# With:
git push origin HEAD:staging || true
# (failures go to staging too, not main)
```
**Expected impact:** Eliminates risk of silent main branch overwrite.
**Difficulty:** Trivial (1-line change)
**Do this manually — do not let the Friday agent make this change.**

### FIX-2: Investigate null siteTrend and deviceIntelligence
**Files:** `data/gsc/latest.json`, `scripts/gsc-analyze.ts`
**Problem:** analysis.json shows siteTrend: null and deviceIntelligence: null despite gsc-pull.ts collecting these dimensions.
**Diagnosis:** Run `npm run gsc:pull` manually. Check if latest.json contains non-empty `dailyTrend` and `deviceSplit` arrays. If they're present but null in analysis.json, the issue is in `buildAnalysis()` — specifically `computeTrend(gsc.dailyTrend)` returning null because `dailyTrend.length < 14`.
**Fix:** If the issue is a minimum data threshold, lower the minimum from 14 to 7 days (acceptable for trend direction). If the issue is missing arrays, check the GSC API response structure.
**Expected impact:** Restores 2 intelligence modules. Device split data is particularly valuable — mobile vs desktop CTR divergence is a real signal.
**Difficulty:** Low (diagnosis + 1 constant change)

### FIX-3: Expand voice violation patterns in verify-deploy.ts
**File:** `scripts/agents/verify-deploy.ts` lines 36-40
**Problem:** Only 3 patterns detected. Many natural first-person testing phrases escape detection.
**Fix:** Expand `NON_GESTURE_VOICE_PATTERNS` to cover:
```typescript
/I (tried|used|sat in|sat on|tested|reviewed|experienced).{0,30}(aeron|leap|sihoo|doro)/i,
/my (time|experience|week|month|year).{0,30}(aeron|leap|sihoo|doro)/i,
/after (sitting|using|testing).{0,30}(aeron|leap|sihoo|doro)/i,
/I.{0,20}(aeron|leap|sihoo|doro).{0,20}(felt|noticed|found|think|believe)/i,
```
**Expected impact:** Catches more voice violations before deploy.
**Difficulty:** Low

---

## HIGH-LEVERAGE IMPROVEMENTS — Do This Week

### IMPROVE-1: Write the Cornell cluster fix
**File:** `src/pages/knee-pain-seat-depth.astro`
**Problem:** /knee-pain-seat-depth/ has 165 impressions at avg pos 8 on "cornell ergonomics chair seat depth [rule]" queries — all at 0% CTR. Title "Seat Depth & Knee Pain: The Fix for Tall People" doesn't match searcher intent.
**Fix:** Change title to include "Cornell Ergonomics Rule" (e.g., "Cornell Ergonomics Seat Depth Rule for Tall People"). Update H1 and meta description. Add the specific Cornell rule as the page's opening verdict box.
**Expected impact:** Highest-confirmed click yield opportunity on the site per analysis.json.
**Difficulty:** Low (title + meta + one content section)
**Dependency:** None. Do manually — don't wait for Thursday agent.

### IMPROVE-2: Add plan review notification
**Files:** `.github/workflows/wednesday.yml`
**Problem:** The weekly plan is generated at 1AM Wednesday and auto-executes at 1AM Thursday with no human review opportunity (except checking a private repo).
**Fix:** Add a step after strategy.ts that sends a summary to Jackson:
```yaml
- name: Send plan for review
  run: |
    PLAN=$(head -50 reports/weekly-plan.md)
    curl -X POST -H "Content-Type: application/json" \
      -d "{\"text\": \"TCA weekly plan ready for review:\n$PLAN\"}" \
      ${{ secrets.SLACK_WEBHOOK }}
```
Or simpler: open a GitHub PR for the plan changes instead of direct commits. Jackson reviews, approves, PR merges, then Thursday reads from merged main.
**Expected impact:** Catches bad plans before they execute.
**Difficulty:** Low (webhook setup) to Medium (PR workflow change)

### IMPROVE-3: Add Reddit pipeline to Monday workflow
**Files:** `.github/workflows/monday.yml`, `.env`
**Problem:** Reddit data last fetched March 2026. RedditInsights component shows stale data.
**Fix:** Add `npm run reddit:all` step to Monday workflow (after GSC steps). Requires APIFY_TOKEN secret in GitHub.
**Expected impact:** Fresh community voice data on review pages. E-E-A-T improvement.
**Difficulty:** Low if APIFY_TOKEN is already a GitHub secret. Medium if not.

### IMPROVE-4: Write /review/gesture/ depth expansion (Jackson writes this)
**File:** `src/pages/review/gesture.astro`
**Problem:** The Gesture review is the only page with true first-person E-E-A-T authority. Current impressions: 1,895 (90-day), pos 8.4. A 3,000+ word first-person review with real specifics would be the single highest-leverage content investment.
**Content to add:**
- Exact seat height range as experienced at 6'4" (not just spec — what the range means in practice)
- Arm position at 6'4" — does the arm width reach for tall users?
- Lumbar support behavior for tall spines
- Before/after on back/shoulder pain (real data)
- 90-day ownership experience updates
- Real photos (Jackson sitting in the chair)

**This cannot be written by an agent. Only Jackson can write this.**
**Expected impact:** Would likely push /review/gesture/ from pos 8.4 toward pos 3-5. The only real SERP moat.
**Difficulty:** High (time investment from Jackson, not technical)

---

## SYSTEM SIMPLIFICATIONS

### SIMPLIFY-1: Consolidate GSC wiki concept pages
**Files:** `wiki/pages/concepts/gsc-intelligence.md`, `wiki/pages/concepts/gsc-performance.md`, `wiki/pages/concepts/gsc-analysis-strategy.md`
**Problem:** 3 overlapping GSC concept pages. Strategy agent and audit agent read different subsets. Conflicting data can appear.
**Fix:** Merge into a single `wiki/pages/concepts/gsc-current.md` (auto-generated weekly by gsc-analyze.ts + gsc-pull.ts). Keep `gsc-analysis-strategy.md` as a static architecture reference (not auto-updated).
**Expected impact:** Reduces agent context confusion. Simplifies wiki index.
**Difficulty:** Medium (update wiki-utils.ts and both write paths)

### SIMPLIFY-2: Reduce competitor-monitor to monthly
**Files:** `.github/workflows/monday.yml`, `scripts/agents/competitor-monitor.ts`
**Problem:** Competitor intelligence runs weekly but produces low-signal HTML metadata. Cost: 1 Claude Sonnet call/week plus API time.
**Fix:** Move competitor-monitor.ts to a separate workflow that runs on the 1st of each month. Or: add a check in monday.yml that skips competitor-monitor unless it hasn't run in 28+ days.
**Expected impact:** Saves ~4 Claude API calls/month. Forces the module to earn its keep.
**Difficulty:** Low

### SIMPLIFY-3: Archive weekly wiki entries aggressively
**Files:** `wiki/index.md`, `scripts/agents/verify-deploy.ts`
**Problem:** The wiki index grows by 1 weekly entry per week. In 6 months: 26+ entries. The wiki index has a 200-line truncation risk in Claude Code context loading.
**Fix:** In verify-deploy.ts, keep only the last 4 weekly entries in the wiki index. Archive older ones to wiki/weekly/ (already done) but remove the index pointer. Add a "last 4 weeks" section instead of an ever-growing table.
**Expected impact:** Keeps wiki index compact and readable.
**Difficulty:** Low

---

## DATA INTELLIGENCE UPGRADES

### INTEL-1: Add SERP API for competitive keyword data
**Files:** `scripts/agents/competitor-monitor.ts`, `data/competitors/config.json`
**Problem:** Competitor analysis is HTML-only. No ranking data.
**Fix:** Integrate ValueSERP or DataForSEO API (cheap tier). Monthly call checking competitor rankings for TCA's top 20 keywords. Store as `data/competitors/rankings-YYYY-MM.json`.
**Expected impact:** Transforms competitor intelligence from decoration to signal.
**Cost:** ~$0.05/query × 20 queries × 5 competitors = ~$5/month
**Difficulty:** Medium

### INTEL-2: Lower siteTrend minimum threshold
**File:** `scripts/gsc-analyze.ts` line 369
**Problem:** `if (!dailyTrend || dailyTrend.length < 14) return null;` requires 14+ days. If the API returns fewer rows, the trend is permanently null.
**Fix:** Lower to 7. Compute week-over-week if ≥7 days available. Return null only if <7.
**Expected impact:** Restores trend module for sites with limited API data.
**Difficulty:** Trivial

### INTEL-3: Add GSC history bootstrapping check
**Files:** `scripts/gsc-analyze.ts`, Monday workflow
**Problem:** Only 1 history snapshot. Page velocity requires 2+. The module is silently inactive.
**Fix:** Add a log message in gsc-analyze.ts when `pageVelocity === null` due to insufficient history: `console.log('Page velocity inactive: needs 2+ history snapshots. Current: N.')`. Also update the wiki intelligence digest to clearly show "INACTIVE (N/2 snapshots required)" rather than the generic velocity table header with null values.
**Difficulty:** Trivial

### INTEL-4: Add per-page impression velocity (simple version)
**File:** `scripts/gsc-analyze.ts`
**Problem:** Page velocity is week-over-week but only activates after 2+ history snapshots. Meanwhile there's no per-page growth signal.
**Fix:** Add a simple "new pages this week" flag: any page in current GSC data that didn't appear in the previous week's data. This requires only 2 data points and gives strategy.ts a "newly ranking pages" signal.
**Difficulty:** Low

---

## AGENT SAFETY / VALIDATION UPGRADES

### SAFETY-1: Add voice check to index-monitor.ts fix output
**File:** `scripts/agents/index-monitor.ts` line ~233
**Problem:** `fixPage()` writes Claude's output directly to disk after only basic structural validation (frontmatter + Layout wrapper + 80% word count). No voice check.
**Fix:** After generating the fix, run it through the same voice pattern check used in verify-deploy.ts before writing to disk.
```typescript
for (const pattern of NON_GESTURE_VOICE_PATTERNS) {
  if (!filePath.includes('gesture') && pattern.test(fixed)) {
    return { fixed: false, summary: `Voice violation detected in fix for ${filePath}` };
  }
}
```
**Expected impact:** Prevents voice violations from index-monitor's thin-content expansions.
**Difficulty:** Low

### SAFETY-2: Add strategy plan approval delay gate
**Files:** `.github/workflows/thursday.yml`
**Problem:** Plan auto-executes at 1AM Thursday with no human review.
**Quick fix (no tooling required):** Add `workflow_dispatch` trigger to thursday.yml (already present) AND change the cron from `0 8 * * 4` to a manual-only trigger for a trial period. Jackson reviews the Wednesday plan and manually triggers Thursday when satisfied.
**This is the most impactful safety upgrade available.**
**Difficulty:** Trivial (1-line change, can revert after building confidence)

### SAFETY-3: Score content immediately after writing (archive rejected drafts)
**File:** `scripts/agents/execute-content.ts`
**Problem:** Quality gate failures result in `success: false` logged to content-log.md but the failed content is discarded. No way to review what was rejected and why.
**Fix:** Archive failed drafts to `raw/content-rejected/YYYY-MM-DD-<slug>.astro` before discarding. Include the quality score and feedback in the archive.
**Expected impact:** Allows Jackson to review near-pass drafts and manually fix them rather than waiting for next Friday's re-attempt.
**Difficulty:** Low

---

## WEBSITE / SEO IMPROVEMENTS

### SEO-1: /office-chairs-for-tall-people/ cornerstone rewrite
**File:** `src/pages/office-chairs-for-tall-people.astro`
**Current:** pos 24.9, 570 impressions. Page 2. Site's most important head keyword.
**Fix:** 2,500+ words. Height-bracket verdict table (6'3" vs 6'4" vs 6'5" vs 6'6" vs 6'7"). Spec comparison matrix. Internal links to all review pages and height-specific guides. This is the primary target for AI Overview citation.
**Expected impact:** Moving from pos 25 to top 10 on "office chairs for tall people" would be worth more clicks than any meta description change on the entire site.
**Difficulty:** High (major content investment)

### SEO-2: /review/leap-plus/ narrative reframe
**File:** `src/pages/review/leap-plus.astro`
**Current:** 632 impressions, pos 9.3, 0% CTR. Generic research-voice review.
**Fix:** Reframe as "I almost bought the Leap Plus — here's why I chose the Gesture instead." This gives the page a unique angle, establishes Jackson's credibility (he researched it seriously), and creates a comparison narrative that's both E-E-A-T and commercial.
**Expected impact:** Differentiated angle = higher CTR + better engagement signals.
**Difficulty:** Medium (significant content rewrite)

### SEO-3: Cornell Ergonomics verdict box on /knee-pain-seat-depth/
**File:** `src/pages/knee-pain-seat-depth.astro`
**Current:** 165 impressions at pos 8 for Cornell rule queries, 0% CTR.
**Fix:** Title change + dedicated Cornell Rule answer box at top of page (not buried). Exact wording: "The Cornell Ergonomics rule: leave 2-3 finger-widths of space between the seat edge and the back of your knee." Add this as the very first visible element after the H1.
**Expected impact:** Highest ROI per analysis.json. Direct CTR improvement on confirmed high-impression queries.
**Difficulty:** Low

### SEO-4: Add affiliate CTA block to all pain/ergonomics pages
**Files:** `src/pages/back-pain-spine-height.astro`, `src/pages/leg-pain-circulation.astro`, `src/pages/shoulder-pain-tall-people.astro`
**Problem:** The first commission came from /knee-pain-seat-depth/ which had an embedded CTA. Other pain pages may lack this pattern.
**Fix:** Add 2-chair affiliate CTA block to every pain pillar page. Primary = Gesture (first-person tested). Secondary = research-based recommendation per that page's context.
**Expected impact:** Replicates the conversion pattern that drove the first commission.
**Difficulty:** Low

---

## Implementation Order

**Week of May 9:**
1. FIX-1 (Friday bug) — TODAY, before next Friday
2. SAFETY-2 (manual Thursday trigger) — TODAY, enables human review
3. SEO-3 (Cornell cluster fix) — THIS WEEK, highest-yield click opportunity
4. FIX-2 (investigate null intelligence modules)

**Week of May 12:**
5. IMPROVE-2 (plan notification)
6. FIX-3 (expanded voice patterns)
7. SAFETY-1 (voice check in index-monitor)
8. INTEL-2 + INTEL-3 (minor threshold fixes)

**Week of May 19:**
9. IMPROVE-4 (Gesture review depth — Jackson writes)
10. SEO-2 (Leap Plus narrative reframe)
11. SIMPLIFY-1 (consolidate GSC wiki pages)

**Month of June:**
12. SEO-1 (cornerstone rewrite — biggest investment)
13. INTEL-1 (SERP API integration)
14. IMPROVE-3 (Reddit pipeline automation)
15. SIMPLIFY-2 (monthly competitor cadence)

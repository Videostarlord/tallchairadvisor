# Next Prompt — Execution Handoff
**Auditor:** CLAUDE-SONNET-4-6 | **Date:** 2026-05-09

This file is the handoff document for the next Claude session. It contains the prioritized actions from the audit, ready to execute.

---

## Context Summary

TCA (tallchairadvisor.com) is a niche affiliate site for ergonomic chairs for tall people. It has a sophisticated 6-agent weekly automation pipeline. The system is architecturally sound (7/10 overall) but has 2 critical bugs and several high-leverage opportunities.

**Current state:**
- 135-day-old domain
- 12,209 impressions, 29 clicks, 0.24% CTR (90-day)
- $18 first commission (May 1)
- 46 pages, all indexed
- Weekly automation cycle running Monday–Saturday

**Full audit files are in:** `/AUDIT/CLAUDE-SONNET-4-6_2026-05-09_*.md`

---

## Immediate Fixes (Do These Before Next Friday)

### Fix 1: friday.yml force-push bug (CRITICAL)
**File:** `tall-chair-advisor/.github/workflows/friday.yml`
**Problem:** Line ~55: `git push origin HEAD:main --force || true` runs when content writing fails or is skipped. This can overwrite main with stale state.
**Change:** Replace `git push origin HEAD:main --force || true` with `git push origin HEAD:staging || true`
**Then:** Verify the staging branch receives the commit correctly on next Friday run.

### Fix 2: Investigate siteTrend and deviceIntelligence nulls
**File:** `tall-chair-advisor/data/gsc/latest.json`
**Check:** Does `latest.json` contain non-empty `dailyTrend` and `deviceSplit` arrays? Run `cat data/gsc/latest.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('dailyTrend:', len(d.get('dailyTrend',[])), 'deviceSplit:', len(d.get('deviceSplit',[])))"`
**If empty arrays:** Check if the GSC API calls for these dimensions are succeeding in gsc-pull.ts. Look for API error logs.
**If non-empty arrays:** The issue is in gsc-analyze.ts `computeTrend()` threshold (requires ≥14 rows). Lower to 7 on line 369: `if (!dailyTrend || dailyTrend.length < 14) return null;`

---

## Highest-Yield SEO Action This Week

### Cornell Cluster Fix — /knee-pain-seat-depth/
**Evidence:** 165 impressions at pos 8 for "cornell ergonomics chair seat depth [rule]" queries, 0% CTR. Title mismatches query intent.
**Do this manually:**
1. Open `tall-chair-advisor/src/pages/knee-pain-seat-depth.astro`
2. Find the `<Layout title="..." />` prop
3. Change title to: `Cornell Ergonomics Seat Depth Rule for Tall People | Tall Chair Advisor`
4. Update meta description to lead with the Cornell rule explicitly: `The Cornell Ergonomics rule says leave 2-3 finger-widths between seat edge and the back of your knee. At 6'4", here's what that means for chair selection.`
5. Add a verdict box at the top of the page content with the exact Cornell rule stated directly
6. Run `npm run build` to verify, then commit to main

This is the single confirmed highest-click-yield opportunity on the site right now.

---

## Recommended Next Actions for Jackson (Human Required)

### 1. Write the Gesture review depth section
No agent can do this. Jackson writes it. Target: add 1,500+ words to `/review/gesture/` with:
- Exact seat height you use at 6'4"  
- What the armrest width means for shoulder alignment at your height
- 90-day back/shoulder pain update (before/after numbers if you have them)
- Real photos of you sitting in the chair
- Lumbar support placement for a tall spine

### 2. Reframe the Leap Plus review
Replace the current research-voice opening of `/review/leap-plus/` with: "I almost bought the Leap Plus. Here's the spec analysis that drove my decision toward the Gesture instead." Then keep the research specs but frame them as "why I rejected this."

### 3. Review the weekly plan every Wednesday
The plan is at `tall-chair-advisor/reports/weekly-plan.md`. Check it Wednesday night before Thursday 1AM execution. If you don't like a task, either edit the plan file directly or disable Thursday workflow until you've manually made your preferred change.

---

## System Prompt for Next Deep Audit (6 weeks from now)

When you return to audit this system in ~6 weeks, these are the questions to answer:

**1. Did the Friday force-push bug get fixed?**
Check: `cat .github/workflows/friday.yml | grep "push origin"`

**2. Are siteTrend and deviceIntelligence now populated?**
Check: `cat data/gsc/analysis.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('siteTrend:', d.get('siteTrend') is not None, 'deviceIntelligence:', d.get('deviceIntelligence') is not None)"`

**3. Has page velocity tracking activated?**
Check: `ls data/gsc/history/` — should show 2+ files.

**4. Did the Cornell cluster CTR improve?**
Check: `cat data/gsc/analysis.json | python3 -c "import json,sys; d=json.load(sys.stdin); leaks=[l for l in d['ctrLeaks'] if 'cornell' in l['query']]; print(leaks)"`

**5. What's the site-wide CTR now?**
Check: `cat data/gsc/latest.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('CTR:', d['totals']['ctr'], 'Clicks:', d['totals']['clicks'])"`

**6. Has a human-review gate been added before Thursday execution?**
Check: `cat .github/workflows/wednesday.yml | grep -A5 'notify\|slack\|review'`

---

## Files to Read First in Next Session

In order:
1. `wiki/index.md` — master catalog, always first
2. `wiki/synthesis/thesis.md` — current strategic priorities
3. `data/gsc/analysis.json` — current intelligence state
4. `wiki/pages/concepts/gsc-intelligence.md` — processed weekly digest
5. `reports/weekly-plan.md` — what was planned this week
6. `reports/fixes-log.md` or `reports/content-log.md` — what happened

---

## Things NOT to Do Next Session

- Don't audit the site again from scratch — this audit is thorough. Build on it.
- Don't re-engineer the gsc-analyze.ts architecture — it's correct. Fix the null modules.
- Don't add more automation — simplify first. The system doesn't need more agents.
- Don't rewrite the Gesture review with an agent — Jackson writes this one.
- Don't change the cooldown system — it's one of the best-designed components.

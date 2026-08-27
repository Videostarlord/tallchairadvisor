---
type: synthesis
last_updated: 2026-08-26
sources: [raw/audits/2026-04-03-full-audit.md, raw/audits/2026-04-22-serp-analysis.md]
tags: [patterns, failures, lessons]
---

# What Failed (or Hasn't Worked Yet)

Fixes and approaches that didn't produce the expected result. Knowing what doesn't work is as valuable as knowing what does.

## Position Interventions of 2026-07-20 — all four failed, measured

Filed 2026-07-20, evaluated nightly for 23 days across 7 attempts, escalated 2026-08-12. **None produced any improvement.**

| Page | Baseline | Position 2026-08-12 | Result |
|---|---|---|---|
| `/review/leap-plus/` | 8.7 | 8.8 | slightly worse |
| `/office-chairs-for-tall-people/` | 8.1 | 8.6 | worse |
| `/chairs/herman-miller-aeron/tall-people/` | 8.1 | 8.1 | flat |
| `/correct-chair-dimensions/` | 9.6 | 9.6 | flat |

For contrast, `/best-office-chairs-under-500/` (baseline 9.1) from the same batch **did** close — so the closure machinery works and this is a real negative result, not a broken measurement.

**Lesson.** Two of the four did not move by a single tenth in over three weeks. That is not "needs more time"; a page whose average position is *identical* three weeks after an intervention did not respond to it. `/correct-chair-dimensions/` is on the kill list as an AIO-eaten informational query, and its flatness is consistent with that diagnosis: the page ranks where it ranks and the SERP is answering above it.

**What was nearly recorded instead.** A `<=` threshold tweak would have closed the two flat rows as successes, because their position exactly equals their baseline. That would have written two fabricated wins into what-works.md — the precise failure `MEANINGFUL_POSITION_DELTA` exists to prevent. Rejected 2026-08-13.

**Open question this raises.** Four of five position interventions in one batch failed. Either the interventions were too small to move a ranking, or position is the wrong target metric for pages in this band. Worth answering before filing a sixth.

### CLOSED 2026-08-26 — 37 days, 20 attempts, final verdict `fail`

Fourteen more days and thirteen more evaluations changed nothing. `data/ledger-state.json` now carries all four with `verdict: "fail"`, `ageDays: 37`, `attempts: 20`, and reasons of the form *"position 8.8 does not satisfy < 8.7"*.

| Page | Baseline | 2026-08-12 | 2026-08-26 | Net over 37 days |
|---|---|---|---|---|
| `/review/leap-plus/` | 8.7 | 8.8 | 8.8 | −0.1 (worse) |
| `/office-chairs-for-tall-people/` | 8.1 | 8.6 | 8.9 | **−0.8, still degrading** |
| `/chairs/herman-miller-aeron/tall-people/` | 8.1 | 8.1 | 8.1 | 0.0 (flat, 37 days) |
| `/correct-chair-dimensions/` | 9.6 | 9.6 | 9.6 | 0.0 (flat, 37 days) |

**Decision: stop re-checking these and do not file a sixth position intervention on this batch.** Two pages have not moved by a single tenth in five weeks, and the one that moved most moved the wrong way and is *still* moving the wrong way. The open question above is now answered as far as this evidence can answer it: **position was the wrong target metric for pages in this band**, and the interventions were not the constraint.

**They were deliberately NOT retracted, and that distinction matters.** `data/retractions.jsonl` is for claims that were *wrong* — its schema demands the mistaken `claim`, the `why` it is false, and a standing `rule` to stop it recurring. These four findings are not wrong; they are correct and unwelcome. Filing them as retractions would assert the pipeline had erred when it had in fact worked perfectly: it adjudicated `fail`, escalated after 3 attempts as configured, and refused to manufacture a closure. **A finding that is true and inconvenient must not be silenced through the mechanism built for findings that are false.**

The consequence is accepted knowingly: the nightly will keep listing them under "what needs you" until someone acts on the pages. That is the honest state of the world, and the cost of the alternative — a general "acknowledge and mute" facility — is that it would work just as well on findings that deserve action.

**What NOT to do next, on the evidence of 2026-08-26:**
- **Not a CTR fix on `/review/leap-plus/`.** Its "steelcase leap plus" query sits at position 9.8, and `no-ctr-iteration-below-position-8` in `data/strategy-rules.json` forbids exactly this. The rule is right: snippet work below page one buys nothing.
- **Not an affiliate-revenue justification for `/office-chairs-for-tall-people/`.** The same day's export measured 45 chair clicks at **$0.00** on the dedicated `tcachair-20` tag. Ranking the money hub higher feeds a funnel with a measured conversion rate of zero. See [[affiliate-performance]].

**Where the effort should go instead.** `/knee-pain-seat-depth/` is at position **5.7 on 40,581 impressions** — the highest-scoring opportunity in `data/gsc/analysis.json` and not on any kill list. A page already on page one with that impression volume is a better use of the next intervention than a fifth attempt at a page that has ignored four.

## Fixes That Haven't Moved the Needle

### 1. Comparison Table on /aeron/tall-people/ — Added but CTR still 0%
Added between Mar 30 and Apr 3. The page still has 0% CTR on 406 impressions. **Lesson:** On-page content improvements don't fix SERP clickthrough if the meta description is the problem. The user decides to click before they see the page content.

### 2. Meta Fix on /review/gesture/ — Trimmed but CTR still 0.17%
Meta went from 171→146 chars. CTR moved from ~0% to 0.17% (1 click). Marginal improvement at best. **Likely explanation:** The issue is positional (pos 10.31), not meta-related. Below position ~8, CTR improvements from meta alone are limited.

### 3. Internal Links from /review/gesture/ to New Pages — No Ranking Impact Yet
Links to shoulder-pain, under-500, sihoo, aeron-size-c all confirmed present. No measurable effect on those pages' rankings. **Caveat:** Most of those pages weren't even indexed until recently, so the links may start helping now.

## Approaches That May Be Wrong

### Over-investing in CTR Fixes for Pages Below Position 8
Three of the four CTR crisis pages are at positions 7.4–10.3. At these positions, organic CTR benchmarks are naturally 3–5% (pos 7) and 1–2% (pos 10). The 0% CTR is extreme, but some of it is statistical noise on low click volumes. **Question:** Should ranking lift take priority over meta rewrites?

### Expecting Fast Indexing
The 5 height guide pages (6-foot-3 through 6-foot-7) still had zero impressions as of Apr 3, despite sitemap priority 0.8. They were confirmed indexed by Apr 5, but the 2-week+ delay suggests Google is slow to crawl new pages from a young domain. **Lesson:** Don't plan content velocity that depends on fast indexing.

## Pipeline Failures

### Friday Agent Generated Invalid Astro Syntax (Apr 13, 2026)
Claude wrote `size-guide.astro` with a bare `and` keyword in a JavaScript expression inside the frontmatter (`Expected "}" but found "and"`). esbuild rejected the file, the build step failed, and the commit step was skipped — so no bad file was ever pushed. The content was simply lost that week.

**Root cause:** `execute-content.ts` wrote the file to disk and set `CONTENT_WRITTEN=true` before any syntax validation. The only gate was the separate build step in the workflow.

**Fix:** Added `validateAstroFile()` in `execute-content.ts` that runs before `writeFileSync`. Checks frontmatter fences, Layout wrapper, and bare English operators in JS. Also hardened the system prompt to explicitly prohibit `and`/`or` as JS operators.

**Lesson:** Never trust LLM-generated code without structural validation before writing. The build step in the workflow is a safety net, not a first-line guard. The agent itself must validate before committing to disk.

### Saturday Verify-Deploy Always Failing on Schema Check (Mar–Apr 2026)
`verify-deploy.ts` ran BEFORE `npm run build` in the committed `saturday.yml`. `checkSchemaValidity()` looks for `dist/` which doesn't exist until after the build. Every Saturday deploy was blocked by this false failure.

**Fix:** Reordered `saturday.yml` steps — build now runs first.

### Saturday Verify-Deploy Flagging Favicons as Broken Internal Links (Apr 2026)
`checkInternalLinks()` skipped `/images/` and `/assets/` paths but not root-level static files. Every `<link rel="icon" href="/favicon-32x32.png">` in Layout.astro was flagged as a broken internal link, blocking deploy.

**Fix:** Added extension-based skip rule — any href ending in `.png`, `.ico`, `.svg`, `.jpg`, etc. is not treated as an internal page link.

### 4. Verdict-First Meta as Primary CTR Fix — Wrong Diagnosis (Apr 22)

The Apr 3 audit prescribed verdict-first meta rewrites as the primary CTR lever. The Apr 22 incognito SERP audit shows the actual cause is structural SERP suppression:
- Spec queries where TCA ranks pos 7–10 → AI Overviews eating clicks (confirmed on 2 queries)
- Money queries → shopping carousels above organic results, TCA buried at pos 65–79 anyway

**Lesson:** Always check the actual SERP before prescribing a CTR fix. Meta quality is downstream of SERP layout. If an AI Overview is present, there is no meta description fix.

## Not Yet Enough Data To Judge

- **Meta description verdict-first rewrites** — 5 deployed May 7. Awaiting CTR signal (~14 days needed).
- **Height-bracket verdict table on /best-office-chairs/** — ✅ SHIPPED May 7. No AI citation data yet.
- Citation capsules (not yet implemented on any page)
- Standing desk content (not yet written)
- PAA targeting (not yet implemented)
- Height-specific page depth upgrades (C1 Gesture REWRITE + C2 Leap Plus reframe queued for upcoming weeks)

## Links

- [[what-works]] — the other side
- [[ctr-optimization]] — meta fix effectiveness unclear
- [[gsc-performance]] — data source

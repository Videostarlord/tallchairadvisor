---
type: synthesis
last_updated: 2026-08-04
tags: [decisions, history]
---

# Decisions Log

A rolling record of key strategic decisions and their outcomes. The most valuable RAG source for the automation agents — before making a new strategy, query this first.

## 2026-W32 (August 4) — CORRECTION: "monetization problem, not traffic problem" is no longer true; constraint has moved to traffic

**CONTEXT:** Jackson asked whether to keep optimizing TCA or start a second site, citing a half-remembered kill rule. Session pulled GSC (Aug 3), GA4 (Jul 6–Aug 3), GitHub Actions history, the Aug 3 Amazon export, and ran the first-ever DataForSEO CPC vs realized EPC benchmark.

**⚠ SUPERSEDES the Jul 4 line: "Audit verdict adopted: monetization problem, not traffic problem."** That verdict was correct when written and is now inverted. Do not cite it as current state.

**FINDING — The monetization layer is fixed and performing at or above category norms.**
July EPC $1.00/click ($0.35 ex-outlier) vs Amazon home/furniture norms of $0.20–0.80. Revenue per session ~$0.30 vs display ads' ~$0.015–0.030 for this niche — affiliate is ~10x better than the ad alternative. Unknown attribution has held at 0% across four consecutive exports. **The Jul 4 ASIN work did what it was supposed to do; there is no remaining monetization-mechanics problem to solve.** Full benchmark in [[affiliate-performance]].

**FINDING — Market CPC establishes the traffic is genuinely valuable.**
Impression-weighted CPC across 16 matched ranking queries: **$3.73/click**, HIGH competition, commercial/transactional intent (DataForSEO, `data/keywords/raw/2026-08-01T09-51-48.json`). TCA ranks for queries advertisers actively bid on. The problem is not what the traffic is worth — it is that there are only **303 sessions/28d**.

**FINDING — The impression collapse was noise, not business loss.**
GSC impressions fell 2,200/day (late June) → ~600/day (late July), −72%, position 7.0 → 9.5. But clicks stayed ~2–4/day and GA4 organic (65 sessions/28d) cross-validates against GSC (~68 clicks/28d). **The lost impressions produced no clicks.** Do not treat the impression chart as the health metric; it was flattering. Real converting traffic was roughly flat.

**FINDING — GA4 traffic mix: AI assistants are 16% of sessions.**
Direct 170 (56%), Organic Search 65 (22%), **AI Assistant 47 (16% — ChatGPT 44, Perplexity 6, Claude 3)**, Unassigned 26 (9%). AI referral volume is ~72% of Google organic volume. This is a genuine differentiator for a 7-month domain and the one surface AI Overviews cannot erode. The 56% direct share is implausible as pure human traffic on an unbranded domain — **open question, needs investigation.**

**FINDING — The chair-conversion gap is now conclusive, not tentative.**
Fourth consecutive export with named chair clicks → 0 chair orders (88 clicks this window; 200+ cumulative). Buyers purchase $520-average chair-priced goods via indirect baskets, just never the three promoted ASINs. Corollary: `/best-office-chairs-under-500/` is the #1 GA4 page (29 sessions) and #2 in affiliate clicks. **The audience converts down-market from the recommendations.**

**DECISION — Do not start a second niche site yet. Keep TCA, stop hand-optimizing it.**
Rationale: the monetization fix started compounding exactly when abandonment was being considered; walking away spends ~30 hours seeding a new domain to escape a solved problem. The existing kill list already forbids most hand-optimization (no meta/CTR iteration below pos 8, no new automation features, no AIO capsules on informational queries) — following it frees the time without needing a new site.

**DECISION — Kill-list gate stands at 1 of 2–3 positive months. Re-evaluate 2026-09-01.**
The Aug 3 export (rolling 30-day, Jul 5 – Aug 3) is **99.7% July's money re-reported**: +$7.99 revenue and +$0.24 earnings over the July close. August has produced $0.24 in three days. It is not a second positive month. See [[affiliate-performance]] for the window algebra.

**DECISION — The kill rule needs a deadline, not just a threshold.**
"Defer until $100/mo" has no time bound. At 77 clicks/month against a ~25,000-click requirement (per the Jul 3 math, itself since falsified) the gate could never be passed, making it a trap rather than a rule. **Add a date.** Proposed and pending Jackson's call: *if TCA is under $100/mo by 2026-12-31, it moves to permanent maintenance regardless of trajectory.*

**CAVEATS on the July number — do not over-read it.**
66% of July revenue ($2,048.80 of $3,109.76) came from a **single order**; ex-outlier July is ~$31.83. n=5 orders. The return window on that order is open and Amazon can restate. Per [[statistical-confidence-policy]], one month with one dominant order is not a run rate.

**PROCESS FIX — record the export date range on every Amazon download.**
The Aug 3 export was briefly read as a second positive month because month-to-date and rolling-30-day exports are indistinguishable in the CSV. Jackson's confirmation of "last 30 days" is what made the reconciliation possible. Prefer calendar-month ranges for continuity with the monthly log.

**OPEN — Friday content pipeline still failing 4 of last 8 runs.** Root cause: the content agent writes an en-dash inside a JS expression in `src/pages/best-office-chairs.astro:118`, esbuild fails, nothing commits. That page **does not exist on main and should not** — `/best-office-chairs/` is a 301 to `/office-chairs-for-tall-people/` (`public/_redirects:7`). The agent burns a run every other Friday recreating a deliberately consolidated URL. Not yet fixed.

**CORRECTION — the 2026-08-04 Tuesday audit's "C-1 CRITICAL duplicate content crisis" is a false positive.** It flagged `/best-office-chairs/` and `/office-chairs-for-tall-people/` as duplicates with identical titles and canonicals. Verified by curl: the first 301-redirects to the second. The audit followed the redirect and compared the page to itself — the WebFetch-strips-head failure mode that CLAUDE.md already warns about, now present in the audit agent. **The audit agent needs a no-follow status check before flagging duplicates.**

## 2026-07-25 — CRITICAL: two money pages found rendering raw LLM output in production; fixed

**CONTEXT:** While inspecting Tier-1 pages for the affiliate-CTA scaffolding (Profit Audit Step B), found `/review/leap-plus/` — the #1 money page — was structurally broken in production.

**THE BUG:** The top of `src/pages/review/leap-plus.astro` contained the model's raw reasoning prose ("Looking at the file, I need to identify the dead click...") followed by a literal ` ```astro ` markdown fence, ABOVE the `---` frontmatter. Because the file didn't start with `---`, Astro parsed NO frontmatter → the `<Layout>` wrapper silently failed. Live-page damage (verified in `dist/`): reasoning text + code fence rendered visibly on the page; **no `<html>` wrapper, no `<title>`, no meta description, no canonical, no JSON-LD schema.** The page shipped to Google with zero head signals. Build never caught it — a page without leading `---` renders as a broken-but-valid fragment, so no error.

**SCOPE:** Full scan of all 49 pages found exactly TWO corrupted: `/review/leap-plus/` and `/best-office-chairs-under-500/` (Tier-2 money page, same pattern — 3 reasoning paragraphs + fence about a Clarity "dead click / rage click" fix). Both fixed by removing the junk above `---`. Rebuilt: both now have title/meta/canonical/schema/html restored. Site-wide leak scan clean. `pageLastmod` bumped to 2026-07-25 for both.

**ASIN COLLATERAL FIX:** The same bad leap-plus edit had also swapped the Amazon ASIN to `B09NR9QMGN` on the reasoning that the verified earner `B00TYE4QXU` "may be dead / is the standard Leap not the Plus." Jackson validated the live listing 2026-07-25: `B00TYE4QXU` = "Steelcase Leap Plus Desk Chair … 500 lb Weight Capacity," alive and correct. Reverted both review hrefs `B09NR9QMGN` → `B00TYE4QXU`; review now matches the money hub and the verified top-earner (19 clicks). Lesson: the pipeline's "dead click" reasoning invented a listing problem that did not exist — do not trust model-asserted ASIN facts without live validation.

**ROOT CAUSE (pipeline — NOT yet fixed):** Both files were last touched by an `execute-fixes.ts` run addressing Clarity dead-click/rage-click data. The model returned its answer wrapped in reasoning prose + a ` ```astro ... ``` ` markdown code block, and execute-fixes.ts wrote the ENTIRE response to disk instead of extracting only the code inside the fence. The `@astrojs/compiler` compile gate added to `execute-content.ts` on 2026-07-20 was NEVER applied to its sibling `execute-fixes.ts` — the exact "check the other sibling agent" rule from the 2026-07-20 entry. execute-fixes.ts needs: (1) strip leading prose / markdown fences from model output before writeFileSync, (2) the same authoritative compile gate, (3) a guard rejecting any page file not starting with `---`.

**RULE FOR FUTURE SESSIONS:** A passing `npm run build` does NOT prove pages are well-formed — Astro renders a file with no leading `---` as a broken fragment (no head) without erroring. Add a structural check (first line == `---`, no ``` fences, `<title>` present in dist) to verify-deploy. When execute-content gets a hardening fix, apply it to execute-fixes the same day.

## 2026-07-24 — Profit Audit adopted as the "next steps" routing directive

**CONTEXT:** Jackson asked for a profit-obsessed contractor's take — what they'd say, immediate next steps, what to absolutely stop — and asked that the evaluation be written into the wiki so future "what's next" queries route through it. Grounded in the 2026-07-23 GSC pull (95,251 impr, 206 clicks, 0.22% CTR, avg pos 8.1) and [[affiliate-performance]] (first profitable month +$36.06, Jul 17).

**VERDICT — Traffic engine bolted to a broken cash register.** Traffic is the thing working (impressions 12x in 10 weeks). Everything between impression and dollar is severed in two places, and effort has been going into the half that's already fixed.

**THE TWO SEVERED LINKS:**
1. **Impression → click** severed by SERP structure (AI Overviews on informational/spec queries; shopping carousels on money queries). Site CTR 0.22% vs ~2-3% benchmark at pos 8 — capturing ~14% of a normal click rate.
2. **Click → dollar** severed by monetization structure (Amazon 3% furniture needs ~167x traffic for $100/mo; one $610 return wipes a month).

**THE SMOKING GUN:** `/knee-pain-seat-depth/` = 38,990 impr (41% of the whole site) at pos 5.7, converting at **0.05% CTR (18 clicks)**. Ranks beautifully for an informational, AIO-eaten, non-buyer query. Meanwhile the real money pages are starved: `/review/leap-plus/` (0.28%), `/review/aeron-size-c/` (0.44%), `/office-chairs-for-tall-people/` (0.55%), `/best-office-chairs-under-500/` (0.85%) — 10-17x the knee-pain CTR because they're buyer-intent on escapable SERPs.

**DECISION — Adopt this as the routing logic for all future "next steps" queries.** Both severed links point to the same move: **stop growing impressions, convert the traffic already present.** Substance matches the Jul 3 monetization pivot (email → direct programs → adjacent niche) but is reframed and hardened:

*Immediate next steps (profit-only order):*
1. Freeze new content ~30 days — the traffic to make money is already on the site.
2. Triage every page by `buyer-intent × escapable-SERP × position` → ~6 pages get 100% of revenue effort.
3. Fix the cash register, not the CTR — ship the monetization pivot (Humanscale/Crandall/FlexiSpot applications, per-page tracking IDs, "Also available at" direct CTAs) before writing anything new. Do NOT remove Amazon links.
4. Email capture on `/knee-pain-seat-depth/` — own the audience the page can't monetize (thesis item #1, still unbuilt).
5. Buy ranking lift where SERP is escapable (leap-plus pos 8.7 → 5) over meta tweaks on suppressed pages.

*Absolutely stop:*
1. Treating impression growth as success (12x impressions, flat revenue). Track clicks-to-buyer-pages and EPC.
2. Farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages). [[what-failed]] proves 3x you can't meta-tweak into an AI Overview.
3. Meta-tweaking suppressed pages — documented dead lever.
4. 100% dependence on Google CTR + Amazon 3% — both structurally rigged.
5. Spreading effort across 47 pages — concentrate on the ~6 that convert.

**RULE FOR FUTURE SESSIONS:** When Jackson asks "what's next" / "next steps," lead with this frame — convert existing traffic, don't grow impressions — and rank actions by revenue impact, not content volume. Impressions are a vanity metric here until CTR and commission structure are fixed. Full detail: `raw/strategy/2026-07-24-profit-audit.md`. Not yet executed — this is the adopted plan, next checkpoint is whether steps 1-4 get built.

## 2026-07-20 — Full pipeline test run (Mon→Sat, local): 4 bugs/blindspots fixed

**CONTEXT:** Jackson asked to run the entire weekly cycle end-to-end and fix any bugs or blindspots. Ran all stages locally on isolation branch `pipeline-test-run-2026-07-20` (gsc-pull → analyze → clarity → competitor-intelligence → index-monitor → audit → strategy → execute-fixes → execute-content → verify-deploy). Build passes (49 pages); all 7 verify-deploy checks green. Nothing pushed/deployed — deploy lives only in the workflow YAML, not the scripts.

**Bug 1 — Redirect-blind opportunity scoring (`gsc-analyze.ts`).** The analyzer scored `/best-office-chairs/` as a top affiliate + impression-gravity opportunity, but that page 301-redirected to `/office-chairs-for-tall-people/` on 2026-07-04. GSC serves impressions for a redirected URL for ~90 days, so the analyzer scored a dead page — occupying real opportunity slots and surfacing it in the executive summary. FIX: `normalizeUrl` now parses `public/_redirects` and folds redirected URLs into their live target (impressions accrue to the real page); history snapshots are normalized on load too, so redirects added later retroactively fold old data. Verified: 33 phantom references → 0; affiliate alert now correctly targets `/office-chairs-for-tall-people/`; no phantom reached the weekly plan.

**Bug 2 — index-monitor inspects redirect-source noise (`index-monitor.ts`).** URL Inspection ran on all 48 redirect sources, including 38 trailing-slash normalizers (`/review/gesture` → `/review/gesture/`) that permanently return "unknown to Google" — ~38 wasted API calls/Monday and false "may not be indexed" lines in indexing-health. FIX: skip trailing-slash normalizers (source differs from target only by a slash); inspect only the 10 genuine content redirects where a broken redirect could actually matter.

**Bug 3 — execute-fixes `max_tokens` truncation (`execute-fixes.ts`) — the sibling-file completion of the W29 (Jul 18) fix.** The full-file edit path capped output at 8,000 tokens with no stop_reason check — the identical bug pattern the Jul 18 session fixed in `execute-content.ts` (raised to 12000 + stop_reason) but never applied to its sibling. The largest pages reproduce to ~12–13k tokens, so every fix on a page over ~8k was truncated mid-file and rejected by the word-count guard — the pipeline could never edit its biggest, highest-opportunity pages (correct-chair-dimensions, office-chairs-for-tall-people, best-office-chairs-under-500). Confirmed exactly: every page whose reproduction exceeded 8k tokens was rejected; every one under it applied. FIX: `max_tokens` 8000→20000 and explicit `stop_reason==='max_tokens'` detection reporting "TRUNCATED" distinctly. After fix, all 6 fixes applied; the 3 large pages grew correctly (+190/+327/+517 words).

**Bug 4 — execute-content emits build-breaking pages (`execute-content.ts`).** The new page `/aeron-size-c-vs-leap-plus/` scored 98/100 and passed `validateAstroFile`, but broke `npm run build`: a backslash-escaped quote inside the Layout `description` attribute (`6'0\"–6'5\"`) — invalid in HTML attributes — closed the attribute early, leaving an en dash parsed as JS (`Expected "}" but found "–"`). Root cause: validation only syntax-checked the frontmatter (vm.Script), never the template. In production this reaches staging Friday and fails the Saturday deploy build. FIX: added an authoritative compile gate (`@astrojs/compiler` transform → `esbuild.transform`) that validates the WHOLE file exactly as the real build does, catching any esbuild-rejectable template error; error message enriched with a `&quot;` hint when the `\"` pattern is present. Respects the W29 RULE — NOT a regex heuristic; it's the real compiler. Verified: gate rejects the broken content, accepts the fixed page. Repaired the generated page to `&quot;` (codebase convention); build now green at 49 pages.

**LATENT (not fixed):** pre-existing TS error `gsc-analyze.ts:704` — AIO `priority` not narrowed to `'high'|'medium'`. Unrelated to these changes; `tsx` transpiles without type-checking so it never affects runtime. One-line `as const` cleanup someday.

**RULE FOR FUTURE SESSIONS:** When a redirect/merge ships, the redirected URL keeps generating GSC impressions for ~90 days — any per-URL analysis (scoring, index inspection) must be redirect-aware or it acts on dead pages. When one of a pair of sibling agents (execute-content / execute-fixes) gets a fix, check the other for the same pattern.

## 2026-W29 (July 18) — Friday content pipeline root-caused: gates rejected good pages for 10 weeks; all 4 bugs fixed

**CONTEXT:** Jackson asked why the Friday agent keeps failing. Root-cause session on execute-content.ts against the 7 archived rejects in raw/content-rejected/.

**FINDING — The model was never the problem. The deterministic gate code was.** All 7 rejected drafts (May 15 → Jul 17) replay as VALID + 80/80 structural under corrected checks. Since the quality gate shipped May 6 (fcd7ae3), the Friday agent published zero pages on its own; every live page since came from manual sessions.

**Bug 1 (quality gate):** scoreContent sent only `content.slice(0, 5000)` of ~20k-char pages to the Haiku judge, but graded criteria that live past char 5000 (affiliate CTA at ~16-17k, internal links at ~8-13k). 40/100 points were structurally unwinnable → max score ~60 vs 80 gate → no normal-length page could ever pass. W29's "answer-first section cut off mid-sentence" feedback was the slice boundary, not the page.

**Bug 2 (validator false positive):** regex `/'[^'\n]*'[^'\n]*'/` rejected any frontmatter line with 3+ apostrophes regardless of quoting context — fatal on a site where heights like `6'2"` and `6'4"` appear constantly. The W28 and Jul 4 rejects were valid JavaScript (verified via vm.Script) killed by this regex; the retry instructed the model to use double quotes, which it had already done.

**Bug 3 (dead sanitizer):** the apostrophe-fixing branch in sanitizeFrontmatter used `[^'\\\n]` which by construction cannot match a string containing a bare apostrophe — it never fired once.

**Bug 4 (latent):** no stop_reason check after generation; a max_tokens truncation was indistinguishable from a model failure.

**FIX (all in execute-content.ts, same day):**
1. Quality gate rebuilt: criteria 2-5 (keyword placement, FAQPage ≥4 questions, CTA with tag=tallchairadvi-20, ≥3 class="link-internal") are now deterministic code checks against the FULL page (80pts); only answer-first quality remains an LLM judgment (Haiku, 0-20pts, prompt states it sees an excerpt). Gate threshold unchanged at 80. Scorer failure now defaults to 15/20 instead of 0/100.
2. Apostrophe regex deleted from validateAstroFile — the vm.Script parse (already present five lines below) is the authoritative syntax check with zero false positives.
3. Dead sanitizer branch deleted.
4. stop_reason==='max_tokens' now logged with token count; max_tokens raised 8000→12000 for headroom.
Plus: data/token-log.jsonl is now committed by the Tuesday/Wednesday/Friday workflows (it was written inside CI runners and discarded — why cost tracking had only 2 entries).

**COST:** ~$0/month delta (pipeline total ~$4-5/mo API spend). Removing false-positive retries saves more than the occasional competitive-depth re-roll adds.

**RULE FOR FUTURE SESSIONS:** Do not add regex-based syntax heuristics on top of the vm.Script parse in validateAstroFile. Do not slice content before scoring criteria that live in the back half of a page. When a gate rejects repeatedly, replay the archived reject from raw/content-rejected/ against the check before assuming the generator is at fault.

**WATCH:** Next Friday (Jul 24) should publish whatever Wednesday plans (likely /seat-depth-too-shallow-fix/ again). The Jul 10 (/leap-plus-vs-aeron-size-c/) and Jul 17 (/seat-depth-too-shallow-fix/) archived drafts were publishable as-is if faster shipping is wanted.

## 2026-W27 (July 4, later) — Commercial cluster consolidation executed after GSC verification

**CONTEXT:** Audit plan item 3. Jackson approved: verification pass first, then consolidate.

**VERIFICATION FINDING — The cannibalization was worse and different than assumed.** The 90-day GSC pull showed the entire "best office chair(s) for tall people/person" head-term family (~340 visible impr) at position 45–90 sitewide with zero clicks ever, attributed to /best-office-chairs/. Meanwhile /office-chairs-for-tall-people/'s pos 8.1 was built entirely on Steelcase Leap V2 brand queries. Not two pages splitting a ranking — one page with the queries and no authority, one with authority and the wrong queries.

**VERIFICATION FINDING — Audit kill-list revision.** best-big-and-tall and wide-seat pages were NOT merged into heavy-duty as the audit proposed: they were created Jul 4 (days old, zero GSC data) as deliberate keyword-gap fills targeting the distinct "big and tall" query family. Merging them would kill unindexed gap content. Re-evaluate ~Aug 15 with real data.

**DECISION + EXECUTION:** /best-office-chairs/ 301'd into /office-chairs-for-tall-people/ (exact-match slug + existing authority). Survivor retitled to "Best Office Chairs for Tall People 2026", absorbed Quick Picks + height-bracket verdict table, broken AIO capsule replaced, back-pain FAQ added, affiliate links 3→15. Three dead spec sub-pages (crawled-not-indexed since spring) 301'd to parents. Nav, breadcrumb schemas, 40+ internal links repointed. Sitemap: 48 pages.

**SUCCESS METRIC (audit experiment 4):** head-term family gains 3+ positions on the survivor within 4 weeks of crawl. Check GSC ~Aug 1. If head terms don't move by Sep 1, the constraint is domain authority, not architecture — response is content depth + links, not more restructuring.

## 2026-W27 (July 4) — Affiliate revenue audit: link architecture root cause found and fixed same day

**CONTEXT:** Jackson requested a hostile affiliate revenue audit (full report: `raw/audits/2026-07-04-affiliate-revenue-audit.md`), then ordered items 1–2 of its 30-day plan executed immediately.

**FINDING — The June "-$0.41 month" had a structural cause, not a volume cause.** 82 of ~90 Amazon links were search-results links (`/s?k=`), which explains both the 94% "Unknown" attribution and why all 7 June orders were for non-recommended products. Additionally, all 8 existing `/dp/` ASINs in the codebase were hallucinated (no matching live listing) — the 6-foot-X pages linked to dead product pages.

**FINDING — Thesis assumption wrong: Autonomous.ai pays ~2%, worse than Amazon's 3%.** Direct-program priority reordered to Humanscale (Impact), Crandall, FlexiSpot. Crandall's remanufactured Leap V2 is sold ON Amazon (B08PPVCCST) — the refurb angle monetizes under the existing tag with zero applications needed.

**DECISION + EXECUTION (same day):**
1. All monetizable links swapped to verified live ASINs (9-product map in [[affiliate-performance]]); 4 search links intentionally kept (no verifiable listing).
2. `Layout.astro` DIRECT_PROGRAMS map added — GA4 tracks 6 direct-retailer domains as `affiliate_click` with program labels, so direct-program EPC is measurable from day one.
3. NEW PAGE /refurbished-steelcase-leap-tall-people/ (blog-analyze 82/100) with Crandall Amazon CTA; un-monetized refurb mentions on under-500 page now carry the CTA too.
4. Audit verdict adopted: monetization problem, not traffic problem. Kill list: no new automation features, no sub-pos-8 meta iteration, no AIO capsules on informational queries, defer adjacent niche — until repeatable positive revenue months.

**PENDING (Jackson only):** create per-page Amazon tracking IDs, click-verify the 9 ASINs, apply to Humanscale/Crandall/FlexiSpot. Remaining plan items: commercial-cluster consolidation (item 3), knee-pain email capture (item 4), Gesture photo shoot (item 5).

## 2026-W27 (July 3) — 7-month audit, monetization pivot, 3 next steps decided

**CONTEXT:** Full cross-source analysis session. Data reviewed: Amazon Associates report (June 30), GA4 (28-day ending June 29), GSC (28-day ending June 29), Clarity behavioral data (July 3), all wiki synthesis pages. Jackson asked whether to continue or pivot after 7 months.

**FINDING — Traffic side is working, monetization side has a structural ceiling.**
GSC impressions grew 12x in 10 weeks (5,590 Apr 18 → 67,673 Jun 29). Clicks 12 → 150. New pages hit pos 5–10 in weeks. ChatGPT actively cites the site (30 AI sessions/28d). Domain authority is compounding. These signals are real.

But: Amazon 3% furniture commissions require ~167x more traffic to hit $100/month. ($3,300/month shipped revenue ÷ $600 avg chair ÷ 10% CVR = 55 Amazon clicks/month needed; at 0.22% CTR = 25,000 organic clicks/month needed; current = 150/month.) The May 11 pipeline projection of $20–30/month by Dec 2026 is accurate — and not a business.

**FINDING — The pipeline was broken more than it was running for the first 5 months.**
From launch (~Jan 2026) through May 28, the autonomous pipeline had: force-push bugs, stale data reads, silent Friday failures, JS syntax validation gaps, Thursday cooldown bugs, strategy agent bypassing the content roadmap, and 4 other critical issues. It has been genuinely stable for only ~5 weeks. The Jun 30 Amazon spike + Wed/Thu/Fri failures this week are consistent with "mostly stable, still fragile." Do not replicate until it runs cleanly for ~3 more months.

**FINDING — Amazon affiliate click tracking was already sitewide; earlier diagnosis of "9x undercount" was wrong.**
The Layout.astro global click listener catches all Amazon links with `?tag=tallchairadvi-20` via URL detection. The 8 GA4 affiliate clicks (28-day ending Jun 29) vs Amazon's 70 clicks (Jun 30 only) was a time-window mismatch, not a tracking gap. No code change needed.

**FINDING — What the 7 months actually proved (the portable framework):**
1. Spec-driven fitment content for an underserved physical characteristic (height, weight, body type) ranks fast on a young domain
2. Hub-and-spoke sub-page architecture (seat-height, seat-depth, tall-people, weight-limit per chair) ranks independently without cannibalization
3. Pain-pillar educational pages (not reviews) are the highest-converting pages — first commission from /knee-pain-seat-depth/, not /review/gesture/
4. ChatGPT and AI tools actively cite spec-verification content; height-specific pages get 60% scroll depth from AI-referred users
5. A fully autonomous Mon–Sat pipeline is buildable by one person; it took 4 months of debugging to stabilize
6. The wiki/intelligence system (GSC analysis → competitor intelligence → strategy → execution) works as a self-contained memory layer

**DECISION — Do not pivot the site. Pivot the monetization structure.**
The content/authority asset is working. Abandoning at this trajectory point (fastest growth of the site's lifetime) is the wrong call. What's broken is the Amazon 3% commission layer. Three changes fix this without changing the content strategy:

**DECISION — Next 3 steps in priority order (see [[thesis]] for full implementation specs):**

**Step 1: Email capture on /knee-pain-seat-depth/** (~4 hours)
Why: 25k impressions/month + 62% Clarity scroll depth + problem-aware intent = highest-converting opt-in opportunity on the site. Builds a subscriber asset independent of Google CTR and Amazon commissions. ConvertKit free tier, PDF lead magnet from existing page content. Target: ~125 subscribers/month at 0.5% opt-in rate on current impressions.

**Step 2: Add Autonomous.ai + InMovement + Humanscale affiliate programs** (~5 hours)
Why: 8–12% commissions vs Amazon's 3% = 3–4x revenue per click with zero traffic change. Autonomous.ai carries Leap Plus and overlaps directly with existing content. InMovement (10% commission, 30-day cookie) replaces Fully.com (shuttered 2023, migrated to Herman Miller — no affiliate program). Humanscale has genuine tall-user products. Add as parallel CTAs alongside Amazon (do not remove Amazon). Update Layout.astro domain detection to track these clicks in GA4.

**Step 3: Launch adjacent niche site** (~30 hours seed, then autonomous)
Why: The proven framework is fully replicable (8 workflows, all TS agents, wiki system are portable). Adjacent niches with higher commission structures generate materially more revenue on the same traffic model. Do NOT start before ~Sep 2026 — pipeline needs 3 more clean months first.
Best candidates: (1) standing desks for tall people (InMovement 10% / Standing Desk Nation 7–10% commissions, spec-verification angle proven by /standing-desk-height-tall-people/); (2) mattresses for tall people (flat-fee $50–200/sale affiliate programs, no tested product constraint).

**DECISION — Previous "do not start second site yet" decision (Jun 14) is superseded.**
That decision was waiting for autonomously generated pages to reach pos 15–30. Condition is still not fully met, but the monetization ceiling analysis changes the calculus. The time investment for step 3 is now justified by the framework proof — with a target start date of ~Sep 2026 pending pipeline stability confirmation.

**OPEN — ChatGPT citation rate declining (56 sessions/28d in June → 30 in July window).** Monitor. If it continues declining, prioritize citation capsule content on the height-specific pages before step 3.

**OPEN — 3 thin-content sub-pages still stuck "crawled not indexed":** /chairs/herman-miller-aeron/seat-height/, /chairs/steelcase-gesture/seat-height/, /chairs/steelcase-gesture/tall-people/. Expand or 301 redirect — no decision made yet.

## 2026-W24 (June 14) — Indexing audit, strategic review, index-monitor enhancement

**DECISION — Thesis queue is fully cleared. No new thesis priorities exist.** All items 0–7 verified done in codebase. Standing priorities are now: (1) fix 3 thin-content sub-pages that are stuck "crawled not indexed" for 3+ weeks, (2) let autonomous pipeline run and prove content quality before expanding to new niches.

**DECISION — Do not start a second site yet.** Content pipeline was broken until May 28. Only ~2–3 autonomous Friday runs have completed. Need to see autonomously generated pages reach pos 15–30 before replicating the stack. Fastest expansion path is adjacent content inside TCA (standing desks, monitor arms) not a cold new domain.

**DECISION — index-monitor.ts now checks redirect sources.** Gap discovered: GSC Coverage UI tracks every URL Google ever crawled; our script only checked src/pages/. Added getRedirectSourceUrls() to parse public/_redirects and inspect all non-wildcard source URLs. Two stale redirect errors (/review/gesture, /author/marcus-reid/) surfaced — both are working 301s, just stale records. Validated Fix in GSC UI recommended to clear faster.

**OPEN — 3 thin-content sub-pages need action:** /chairs/herman-miller-aeron/seat-height/, /chairs/steelcase-gesture/seat-height/, /chairs/steelcase-gesture/tall-people/. Stuck "crawled not indexed" since at least May 25. Options: expand with more spec data, or 301 redirect into parent chair hub. No decision made yet.

## 2026-W24 (June 14) — 4 CRO/CTR fixes from full-site-report audit

**DONE — /knee-pain-seat-depth/ calculator now works.** The site's #1 impression page (12,804 GSC) had a fully-built interactive calculator UI with zero JavaScript — every button click was a dead click. Injected working JS: height selection reveals body-type step, which calculates minimum seat depth and displays matching chairs with affiliate links. Manual inseam path also wired. File was also silently truncated (last FAQ entry and `</Layout>` missing); completed.

**DONE — /review/gesture/ TL;DR moved before hero image.** ChatGPT visitors (56 sessions/28d, 3% avg scroll) were leaving before seeing the verdict box. Moved TL;DR Verdict Box (Best for / Not ideal for) to appear immediately after the disclosure notice, before the hero `<figure>`. Two-line change.

**DONE — /knee-pain-seat-depth/ → /best-office-chairs-under-500/ link added.** #1 impression page had no link to the hidden-star conversion page (285s dwell, 5 affiliate clicks, unranked in GSC). Added one contextual sentence in the "Chairs With Adequate Seat Depth" section.

**DONE — /aeron-vs-gesture/ meta rewritten with verdict lead.** Page had 0 clicks at position 8.5. Meta was spec-listing ("seat depth, breathability, armrests"). Rewritten to: "At 6'4", the Gesture won — adjustable seat depth and 360° armrests outweighed the Aeron's breathability advantage." GSC validation pending.

**Source:** raw/audits/2026-06-14-full-site-report.md — issues 1–4 of the 7-recommendation report.

## 2026-W22 (May 28) — Autonomous content pipeline fully fixed

**DECISION — Content pipeline was broken in 4 ways; all fixed and pushed to main.**

**Root causes found:**
1. `validateAstroFile()` had no JS comment stripping — Claude writing `// tall and athletic` in frontmatter comments caused false `and`/`or` validation failures. The fix (`replaceOutsideStrings`) was sitting in the local working tree uncommitted for weeks, never deployed to GitHub Actions.
2. Strategy LLM was ignoring the content roadmap queue — chose its own topics instead of the 4 pending items. No enforcement existed.
3. Failed slugs were not tracked — pipeline would re-attempt the same broken slug indefinitely.
4. Roadmap required manual maintenance — no auto-population from keyword gap data.

**What was built:**
- `validateAstroFile()` now strips comments + template literals before `and`/`or` check
- `execute-content.ts` falls back to roadmap directly if strategy plan has 0 NEW tasks
- `data/content-failed.json` tracks slugs that fail validation twice — strategy + fallback both skip them
- `injectMandatoryRoadmapItems()` in `strategy.ts` deterministically force-injects top-2 pending roadmap items post-enforcement — LLM cannot bypass the queue
- New `scripts/roadmap-sync.ts` clusters 225 competitor keyword gaps and promotes new page opportunities to `data/content-roadmap.json` every Monday

**Roadmap state after fix:** 7 pending items — shoulder-pain (1), standing-desk (2), sihoo-doro (3), budget-500 (4), wide-seat (5, 8,940/mo), big-and-tall (6, 5,100/mo), back-pain (7).

**Expected outcome:** 2 new pages auto-written every Friday. Roadmap self-replenishes weekly from Monday's keyword gap run. No Jackson input needed.

## 2026-W22 (May 27) — CTA placement fixed + FTC compliance verified across all affiliate pages

**DONE — `/aeron-vs-gesture/` early CTA added.** Both Amazon CTAs were previously at 85%+ scroll. Added a two-button CTA block (Gesture + Aeron) immediately after the Quick Answer box at the top of the article. Disclosure was already present and compliant.

**DONE — FTC disclosures added to 3 pages.** Source audit found `/knee-pain-seat-depth/`, `/correct-chair-dimensions/`, and `/office-chairs-for-tall-people/` had affiliate links but no body disclosure. Standard amber disclosure box added after Byline on each. Homepage has no affiliate links — disclosure not required.

**DONE — `/review/gesture/` revenue leak confirmed already fixed.** The May 25 rewrite already added a CTA after the Direct Answer box. The wiki note was stale.

**STATUS — All 7 affiliate-link pages are now FTC compliant.** One remaining revenue leak: `/best-office-chairs/` Quick Picks links to internal pages not Amazon. Surfaced in automation.

See [[affiliate-compliance]] for updated full status table.

## 2026-W22 (May 26) — Content push: 7 pages updated, 1 new page created

**DONE — `/correct-chair-dimensions/` defragmented.** Title/H1/subtitle rewritten to explicitly signal anthropometric fitment for tall users. Dimensional requirements table moved above intro prose. Generic "Why Standard Specs Fail" 3-paragraph section cut to a single tight paragraph. Entropy 4.419 fix: removed generic furniture sizing framing that was attracting 52 unrelated query clusters.

**DONE — Spec tables added to all 5 height-specific pages.** `/office-chairs-for-6-foot-3/` through `/office-chairs-for-6-foot-7/` now open with a 6-column spec table (chair, seat height range, seat depth, back height, weight capacity, fit verdict) before any prose. Each table is height-calibrated: 6'3" shows Gesture as sweet spot; 6'5"+ shows Aeron Size C as red/not recommended. Pattern from GSC: specific measurement = clicks.

**DONE — New page `/heavy-duty-ergonomic-chairs-tall-people/` created.** Research-voice. Targets "best heavy duty ergonomic chairs for tall people" (pos 14, no dedicated content). Core frame: weight capacity and tall-user dimensional fit are two separate problems most chairs solve only one of. Leap Plus (500 lbs + 22.5" seat height) as only mainstream solution to both. Honest Aeron warning (350 lbs — lowest capacity in category). Amazon affiliate links included. 47th page on site.

## 2026-W21 (May 23) — Strategic direction set; Gesture rewrite protocol established

**DECISION — TCA's identity is spec-first fitment authority, not a review site.** Confirmed by [[semantic-intent-analysis]] (May 22). Google already classifies TCA as spec-verification authority for tall-user ergonomic fitment. Every page should lead with dimensional data (seat height, seat depth, weight capacity) before any prose. Generic recommendation pages (best-office-chairs at 0% CTR) are not the investment direction.

**DECISION — No rebranding needed.** "Tall Chair Advisor" is well-aligned with the fitment authority identity. What changes is content positioning, not the brand name.

**DECISION — No page consolidation needed.** The problem is not too many pages but semantic contamination on one page (`/correct-chair-dimensions/` entropy 4.419) and positioning on existing pages. Stop investing in generic "best of" pages.

**DECISION — Priority order for manual work (highest to lowest):**
1. **Gesture review full rewrite** — manual session only. Protocol: Claude asks Jackson prompting questions about his real 6'4" Gesture experience → Jackson answers → Claude writes the entire page in first-person from those answers. Do NOT start without the Q&A session.
2. **Seat depth calculator** — manual build, vanilla JS, no new dependencies. 2–3 hours.
3. Everything else is automation-eligible (spec tables on height pages, /correct-chair-dimensions/ defrag, weight capacity guide, Leap Plus reframe).

**DECISION — Automation workflow resumes Monday** after Anthropic API credits are topped up (ran out mid-week of May 19–23, causing Tue/Wed/Fri failures). Node.js bumped to 24 across all workflows (committed May 22).

## 2026-W20 (May 15) — Architecture audit implementation status verified; wiki updated

**DECISION — [[systems-architecture-audit-2026-05-13]] is the authoritative source of truth for system architecture status.** Code audit performed 2026-05-15 against all scripts in `scripts/` and `scripts/agents/`. Every finding from the 2026-05-13 audit verified against actual code.

**5 of 10 priority recommendations implemented since audit:**
- ✅ **Keyword research pipeline** — `keyword-discovery.ts` + `keyword-gap-discovery.ts` (DataForSEO Labs). Top-20 opportunities scored and written to `data/keywords/opportunities.json`. Writes wiki page. **Gap: not yet in Monday CI.**
- ✅ **Fix attribution tracker** — `interventions.jsonl` infrastructure in `wiki-utils.ts`. `appendIntervention()` called from execute-fixes.ts; `reconcileInterventions()` called from audit.ts. `data/interventions.jsonl` will be created on next fix run.
- ✅ **Content roadmap** — `data/content-roadmap.json` with 4 priority topics (shoulder-pain, standing-desk, sihoo-doro, budget-500). Strategy.ts injects top-2 pending topics as NEW CONTENT each week.
- ✅ **Structured outcome tracking** — `formatOutcomesForPrompt()` feeds structured before/after data to strategy. Replaces prose synthesis as primary signal.
- ✅ **Content decay detection** — `detectDecayingPages()` in gsc-analyze.ts (8+ consecutive-week decline). Injected into strategy; cooldown bypass for flagged pages. Activates ~July 2026.
- ✅ **Internal link audit** — `gsc-analyze.ts` writes `data/gsc/link-audit.json`. Strategy.ts injects underlinked high-impression pages as FIX targets.
- ✅ **Prompt caching** — `audit.ts` + `strategy.ts` now have `cache_control: { type: 'ephemeral' }`. execute-fixes.ts and competitor-intelligence.ts still uncached.
- ✅ **Saturday regression baseline** — `getWeekStartBaseline()` in verify-deploy.ts uses oldest commit since last Monday, not HEAD~1.
- ✅ **Module 6 (Content Gap)** — implemented in gsc-analyze.ts; no longer dead code.
- ✅ **AIO capsule first-H2 fallback** — competitor-intelligence.ts now falls back to first `<h2>` for component-rendered headings.

**7 items implemented 2026-05-15** (see log entry + [[systems-architecture-audit-2026-05-13]] for detail):
- ✅ Keyword gap discovery wired into `keywords-monthly.yml` (`npm run keyword:gaps` step added)
- ✅ Prompt caching in `execute-fixes.ts` (3 call sites) and `competitor-intelligence.ts` (2 call sites, analyzeGaps refactored)
- ✅ DAG enforcement — pipeline-status check added to `thursday.yml` and `friday.yml`
- ✅ Voice regex expanded — 6 brand-anchor-free patterns added to `verify-deploy.ts`
- ✅ Competitive-depth quality gate — `scoreCompetitiveDepth()` in `execute-content.ts`; Haiku call post-80/100 structural gate; ratio < 70 triggers re-roll with competitor gaps injected
- ✅ Differentiation asset injection — `buildDifferentiationAssets()` in `execute-content.ts`; ME framing, 6'4" anchor, Gesture voice, Reddit owner signals per page
- ✅ Competitive-depth gate decision: threshold 70 is structural content comparison (not GSC signals) — appropriate at current 7 clicks/week scale per [[statistical-confidence-policy]]

**2 items deferred (Phase 3):**
- ❌ Decouple data commits from code commits — recommended approach: `[skip cd]` in data-only commit messages + Cloudflare Pages config. Deferred until frequency of bad wiki writes justifies the change.
- ❌ Anthropic Batch API for audit.ts and strategy.ts — audit called it a "one-line change" but Batch is async (submit + poll); requires workflow split. Deferred until prompt caching savings are measured and cost still exceeds $60/month.

**Content tasks (not code — strategy agent's job):**
- 4 content-roadmap.json entries still pending: shoulder-pain-tall-people (priority 1), standing-desk-height (priority 2), sihoo-doro-s300 (priority 3), best-chairs-under-500 (priority 4)

**ARCHIVED:** `[[audit-implementation-2026-05-10]]` and `[[audit-2026-05-10-seo]]` marked as archived. Read entity pages and `[[systems-architecture-audit-2026-05-13]]` for current state.

## 2026-W20 (May 11) — CTR root cause analysis + next automation priority set

- **ANALYSIS COMPLETE — Revenue projection (automation-only):** $100–250 cumulative through end of 2026. Monthly run rate: $20–30/month by Dec 2026 base case. Current run rate: ~$6/month. Full analysis: `raw/strategy/2026-05-11-ctr-revenue-analysis.md`.
- **ROOT CAUSE — CTR problem has two distinct causes:**
  - Cause A (~80%): AI Overview suppression. Pages at pos 5–15 with >30 impr and <0.3% CTR are getting answered inline by Google. Confirmed on: /chairs/steelcase-gesture/seat-depth/, /chairs/herman-miller-aeron/tall-people/, and likely 3–5 more pages. Meta rewrites cannot fix this.
  - Cause B (~15%): Shopping carousel burial. TCA at pos 22–25 on commercial terms is below fold. Requires domain authority lift over 12–18 months.
  - Cause C (~5%): Editorial pages (Gesture, Leap Plus, aeron-vs-gesture) on clean editorial SERPs. Meta rewrites DO help here. May 7 rewrites awaiting signal.
- **DECISION — Next automation build: `geo-optimize.ts`** — monthly script that detects AIO-suppressed pages, fetches the actual AI Overview content via SerpAPI, and rewrites the target page section to add a citation capsule in the format Google is currently pulling from competitors. Cost: <$2/month, within existing API quotas. Full spec: `wiki/pages/concepts/geo-optimize-plan.md`.
- **DECISION — Secondary build: SERP-aware title comparison in `audit.ts`** — before flagging a meta rewrite, pull top-5 competitor titles on that SERP and match the winning click pattern. Upgrades current generic verdict-first approach.
- **DECISION — No external services** for CTR. No SEO agency fixes AIO/carousel suppression. Link building ($1k–8k minimum for meaningful impact) is a 2027 play, not 2026. Workflow already outperforms any meta optimization service.

## 2026-W20 (May 11) — Reddit pipeline permanently closed

- **STATUS: CLOSED.** The Reddit/Apify pipeline (`npm run reddit:all`) is a one-time operation, not a recurring workflow. It was run once; all raw data is archived in `data/reddit/` and `raw/reddit/`, and a consolidated report was produced from that run.
- Reddit owner data does not update frequently enough to warrant re-running on any schedule. The pipeline will not be connected to `strategy.ts` or any other agent.
- **Do not surface Reddit pipeline injection (I5), Reddit data freshness, or Reddit automation as a gap or recommendation in any future audit, strategy, or planning session unless Jackson explicitly asks.**

## 2026-W20 (May 11) — RunPod migration moved to backlog / soft reject

- **STATUS: BACKLOG / SOFT REJECT.** Do not implement a broad RunPod migration in the TCA automation stack.
- **Why the decision changed:** Follow-up Qwen3-32B-AWQ benchmarks on 24GB vs 48GB GPUs showed the larger tier is not economical for the same model. 48GB was only ~7-19% faster while costing ~50-67% more per call, and its cold provisioning was less reliable.
- **Important limitation:** Those benchmarks were synthetic throughput tests, not real TCA prompt packs. They are useful for infrastructure sizing, but they do not prove that an open model can match Claude on `audit.ts`, `strategy.ts`, `execute-fixes.ts`, `index-monitor.ts`, or `execute-content.ts`.
- **New default cost-reduction path:** Research **Anthropic Batch** first. Batch keeps the current Anthropic integration, preserves model quality, and is operationally far simpler than adding RunPod, provider abstraction, fallback routing, and model-quality validation.
- **Scope boundary:** If RunPod is ever used later, limit it to read-only, highly input-heavy, concise-output jobs after shadow-testing real TCA prompts. Do not move write-capable or file-rewriting agents based on synthetic token benchmarks.

## 2026-W19 (May 10g) — RunPod + Local Model Migration — Under Consideration

- **STATUS: NOT DECIDED.** This was the initial review state before the May 11 soft-reject decision above. No action should be taken from this entry alone.
- **Context:** A manual `/seo-audit` skill run revealed issues the automated weekly workflow missed (security headers, robots.txt, sitemap gaps, schema structural validation, Core Web Vitals). Prompted a broader evaluation of whether the automation intelligence layer can be expanded cheaply.
- **Claude API cost baseline confirmed:** $85–136/year across the full Mon–Sat cycle. execute-fixes.ts (3 calls/fix × 3–5 fixes) and execute-content.ts (2 calls/page) are the dominant costs, not the intelligence agents.
- **Proposal:** Replace Claude API in intelligence agents (audit, strategy, competitor-monitor, index-monitor, verify-deploy, execute-fixes) with Gemma 4 31B (GPQA Diamond 84.3% — exceeds Sonnet's 75.4%) on RunPod 24GB serverless at $0.00019/s. Retain Claude API only for execute-content.ts (Astro page writing).
- **Cost if approved:** ~$35–55/year vs. current $85–136/year. Gemma 4 31B on 24GB is $0.68/hr → $35.57/year at 1hr/week.
- **New capabilities identified:** GSC query semantic clustering via free embedding model, semantic competitor gap analysis on 20–30 competitors vs. current 5, full-site quality matrix on all 50 pages, Reddit automation reconnected to strategy agent, content brief pre-generation for Friday agent.
- **Key open question before any decision:** Does Gemma 4 31B produce acceptable TCA-voice output for non-Gesture pages? Needs test prompt comparison vs. Claude Sonnet.
- **Full research:** `raw/strategy/2026-05-10-runpod-migration-proposal.md`

## 2026-W19 (May 10f) — `mergeCanonicalDuplicates` pageQuery bug fix

- **BUG FIXED — `gsc-analyze.ts` `mergeCanonicalDuplicates` keyed on page only for pageQuery rows.** All 46 queries on `/review/gesture/` were collapsed into a single leak row, summing impressions (303) and taking the best position (1) across all queries. "steelcase gesture review" was the first query in the raw array for that page, so it became the representative — with completely wrong metrics.
- **Actual data for "steelcase gesture review":** 12 impressions, position 49.9, 1 click, 8.33% CTR. Below the 15-impression and ≤20-position thresholds — correctly absent from `ctrLeaks` after fix.
- **Fix:** `mergeCanonicalDuplicates<T>()` now accepts an optional `keyFn` parameter. `pageQueries` call uses `` pq => `${normalizeUrl(pq.page)}|${pq.query}` `` so each page+query pair deduplicates independently. The stored row's `page` field always uses `normalizeUrl(row.page)` regardless of key strategy.
- **Data corrected:** Re-ran `npm run gsc:analyze`. New top leaks are all real: `/chairs/steelcase-gesture/seat-depth/` AIO suspects (Cornell seat-depth cluster queries, 34–64 impr, pos 4–10, 0% CTR).
- **CORRECTION to prior entry:** The May 10 deferred item "Gesture review is highest priority — 304 impr at pos 1, 8.33% CTR vs 35% expected" was based on corrupted data. Actual Gesture review profile: 2,589 impr, pos 8.2, 3 clicks, 0.12% CTR. Content depth expansion remains the right call for C1, but the CTR-leak framing was invalid.
- **Architecture note:** See `gsc-intelligence-system.md` → "Known Bugs / Fix History" for full technical writeup.

## 2026-W19 (May 10e) — Strategy agent autonomous enforcement hardening

- **DECISION — All constraints moved from prompt to code.** The strategy agent's impression threshold, cooldown, file ref validity, conditional language detection, FIX+REWRITE overlap, and max-5-FIX cap are now enforced post-generation in `enforcePlanConstraints()`. Claude's output is corrected before saving — the agent no longer relies on Claude following its own rules correctly.
- **Implementation:** `getPagesOnCooldown()` (14-day git-log Set) + `isTechnicalFix()` (keyword exemption) + `hasConditionalLanguage()` (unsafe-for-autonomy patterns) + `lookupImpressions()` (GSC lookup chain) + `enforcePlanConstraints()` (drop loop with reasons). Dropped tasks appended as `## DROPPED TASKS` section in archived plan for visibility.
- **Validated:** Simulation against 2026-05-10 plan correctly drops /fit-guides/ (178 impr), /seat-depth/ (101 impr), /knee-pain/ REWRITE (conditional language + cooldown). Keeps 3 FIX + 1 NEW + 1 REWRITE.
- **Not fixed (Finding 3):** Strategy layer over-trusting thin competitor inputs. Requires adding `competitorWordCount` to gap output — deferred.

## 2026-W19 (May 10d) — Structured extraction + finding type classification (competitor-intelligence v3)

- **BUILT — section manifest in `extractTcaContent()`:** Page source is now parsed into named sections (`parseSections()`). A `[SECTION MANIFEST]` listing every H1–H3 with char count and attributes (table/faq/cta) is prepended before the content budget is consumed. The manifest is always complete regardless of truncation — the model sees every section that exists and cannot infer absence from a partial excerpt. This is the structural fix for gesture's 61% coverage false-positive class (was the primary remaining gap accuracy problem after the v2 confidence filter iteration).
- **BUILT — `FindingType` formal taxonomy:** `type FindingType = 'absence_claim' | 'structure_claim' | 'depth_claim' | 'spec_gap'`. Added to `RawGapFinding` and `GapFinding` interfaces. Two-layer classification: Claude supplies `findingType` in JSON, `classifyFindingType()` validates and corrects. Replaces the `ABSENCE_PATTERNS` regex array.
- **UPGRADED — confidence filter uses `findingType` not regex:** `applyConfidenceFilter()` now checks `f.findingType === 'absence_claim' || f.findingType === 'spec_gap'`. `depth_claim` and `structure_claim` pass through at any coverage — they are valid from partial visibility. `spec_gap` is now also downgraded at <90% coverage (missing-table claims are absence-adjacent).
- **Deferred backlog cleared:** Both items explicitly deferred from v2 iteration are now implemented.

## 2026-W19 (May 10c) — Built competitor-intelligence.ts (I1)

- **BUILT — `scripts/competitor-intelligence.ts`:** 3-stage competitor intelligence pipeline. Stage 1: SerpAPI fetches real SERP rankings for top TCA keywords (from `analysis.json`) → finds URLs actually outranking TCA, not hardcoded competitor list. Stage 2: Firecrawl crawls those URLs for full markdown content. Stage 3: Claude Sonnet generates specific content gap findings per TCA page. Outputs `data/competitors/intelligence.json` + wiki competitor-landscape page.
- **ACTIVATED:** `SERP_API_KEY` and `FIRECRAWL_API_KEY` configured in `.env` and GitHub Actions secrets. Free tiers: SerpAPI 250 credits/month (~23/run), Firecrawl 500 pages/month.
- **`package.json`:** Added `competitor:intelligence` script (`npm run competitor:intelligence`).
- **Cost controls:** Max 8 keywords/run, max 12 competitor URLs — estimated ~$1–3/month.
- **Does NOT replace `competitor-monitor.ts`:** The old script still runs Monday for lightweight metadata checks. This runs monthly for deep content gap analysis.

## 2026-W19 (May 10b) — Friday branch bug fix + weekly plan C1/C2

- **CRITICAL BUG FIXED — friday.yml reads stale plan:** Added `ref: staging` to `actions/checkout@v4`. Friday was checking out `main` — every week it read the previous Saturday's plan, not Wednesday's new one. Generated page failed Layout validation → `CONTENT_WRITTEN=false` → zero pages published since at least Apr 17. Added `::warning::` step for `CONTENT_WRITTEN=false` runs — was silently green, now visible in GitHub Actions.

- **WEEKLY PLAN UPDATED — 2026-05-10:** C1 (Gesture depth expansion REWRITE, 3,000+ words, first-person voice, 80+ quality gate), C2 (Leap Plus "almost bought" reframe REWRITE), and shoulder pain new content page added. These are the highest-priority deferred items from the May 9 audit.

- **DEFERRED — C3 + I1:** L3/L5 differentiation (C3) queued for next weekly plan. SERP API + Firecrawl competitor intelligence (I1) queued as a separate build session.

## 2026-W19 (May 10) — Combined audit implementation (14 fixes, 5 deferred)

- **CONTEXT:** Two-auditor forensic audit (CLAUDE-SONNET-4-6 + CODEX) completed 2026-05-09. Adjudicated score 6/10. 21 findings across workflow bugs, data integrity, agent safety, SEO, and content. Full implementation status in `wiki/pages/concepts/audit-implementation-2026-05-10.md`.

- **CRITICAL FIX — friday.yml force-push:** `CONTENT_WRITTEN != 'true'` failure path was pushing to `main --force`. Changed to `staging --force`. This ran every Friday content generation failed — how long this was live is unknown. Now fixed.

- **DATA INTEGRITY RESTORED — deviceSplit + dailyTrend:** `latest.json` was missing both keys (partial previous pull). Re-ran `gsc:pull --force`. Both modules now non-null in analysis.json: `siteTrend` = impressions up 29.1% WoW, `deviceIntelligence` = non-null.

- **DATA INTEGRITY — URL canonical normalization:** `gsc-analyze.ts` now normalizes all URLs to trailing-slash form and merges duplicate entries (e.g. `/gesture/` + `/gesture`) before scoring. Was creating phantom cannibalization and split opportunity scores.

- **DATA INTEGRITY — Freshness guards:** `gsc-pull.ts` now skips redundant pulls if `latest.json` < 72h old (with `--force` override). `gsc-analyze.ts` now warns if `latest.json` > 72h old before generating analysis.

- **DATA INTEGRITY — Junk query filter:** `detectCTRLeaks()` now suppresses entity-mismatched queries (knee brace, wheelchair, etc.) before scoring. "Steelcase knee brace review" was inflating CTR leak scores.

- **AGENT SAFETY — Voice check in index-monitor.ts:** `fixPage()` now rejects generated fixes containing first-person testing voice on non-Gesture pages before writing. Previously, a bad fix could ship and not be caught until Saturday verify-deploy.

- **AGENT SAFETY — Voice patterns expanded:** `verify-deploy.ts` NON_GESTURE_VOICE_PATTERNS expanded from 3 to 6. Now catches "I found/discovered/noticed", "during my review/testing", generic "I tested it".

- **AGENT SAFETY — Failed draft archival:** `execute-content.ts` now saves quality-gate rejections to `raw/content-rejected/` before discarding. Previously lost with no inspection path.

- **STRATEGY HARDENING — Plan validation upgraded:** `strategy.ts` now throws a hard error (writes `reports/plan-debug-malformed.md`, logs to wiki) when zero parseable tasks found. Was a `console.warn()` that still wrote the broken plan to disk.

- **SEO — Author page:** Removed from sitemap (`astro.config.mjs`). Removed relative `canonical="/about/"` prop (Layout.astro now derives correct absolute canonical). Was simultaneously noindex + canonicalized to /about/ + in sitemap — three contradictory signals.

- **SEO — Freshness drift:** `best-office-chairs.astro` visible date + Byline `updatedDate` aligned to 2026-05-07, matching schema `dateModified` and sitemap `lastmod`. Was 4-way inconsistency.

- **SEO — Cornell cluster fix:** `knee-pain-seat-depth.astro` title + H1 now include "Cornell Ergonomics Rule". Added verdict box with the rule definition. 165 impressions at pos 8, 0% CTR on cornell queries — was mismatching searcher intent.

- **SEO — size-guide orphan resolved:** `/chairs/herman-miller-aeron/size-guide/` now linked from both the aeron hub page (Detailed Guides grid) and the aeron-size-c review page. Was completely orphaned.

- **DECISION — F2 smart quotes confirmed non-issue:** Codex flagged execute-fixes.ts lines 64-67. Inspection confirmed these are intentional: they are the search patterns inside regex character classes that match and replace curly quotes. No change needed.

- **DEFERRED — Content investment (C1-C3):** Gesture review depth expansion, Leap Plus reframe, L3/L5 role differentiation. All require agent REWRITE tasks in upcoming weekly plans. Gesture review is highest priority — 2,589 impr at pos 8.2, 3 clicks, 0.12% CTR. *(The "304 impr at pos 1, 8.33% CTR" figure was a data corruption artifact from the mergeCanonicalDuplicates bug — corrected 2026-05-10.)*

- **DEFERRED — SERP API + Firecrawl pipeline (I1):** Data integrity fixes are now complete (prerequisite met). Pipeline can be built next. Monthly cadence, ~$1-3/month API cost.

- **DEFERRED — Reddit pipeline injection into strategy.ts:** User confirmed current March 2026 Reddit data is still valid. Deferred indefinitely until data needs refreshing.

- **NOT IMPLEMENTED — GSC pagination (I2), GA4 affiliate tracking (I3), wiki concept page consolidation (I4):** Low priority, no urgency.

## 2026-W19 (May 9d) — GSC data gap audit + gsc-analyze.ts architecture decision

- **FINDING — Queries and pageQueries data is never read:** `gsc-pull.ts` collects 200 queries and 427 page+query combos every Monday. Every agent ignores them entirely. Strategy agent only reads `pages.slice(0,5)`. Audit agent only reads `pages` sorted by impressions. This means the richest signal in the data (query intent, query-to-page mapping, CTR per query) never reaches Claude.
- **FINDING — Device dimension not collected:** The GSC API supports `['device']` and `['page', 'device']` dimensions. Neither is in `gsc-pull.ts`. Mobile/desktop CTR split, which can vary 10-30× on SERP-feature-heavy queries, is completely invisible to the pipeline.
- **FINDING — No date-level data:** Week-over-week trend and velocity detection not possible without `['date']` dimension. Only 90-day aggregates are available.
- **FINDING — Cornell cluster is the single highest-leverage fix on the site right now:** 6 query variants of "cornell ergonomics chair seat depth [two fingers / 2-3 fingers / 2 inches] behind knees" → 165 combined impressions at avg pos 8.9 on `/knee-pain-seat-depth/` → 0 clicks. Title "Seat Depth & Knee Pain: The Fix for Tall People" mismatches the query intent (researcher wants the Cornell rule specifically, not a "pain fix"). This has been true for weeks and no agent has flagged it because none read `pageQueries`.
- **FINDING — AIO diagnostic pattern:** `/chairs/steelcase-gesture/seat-depth/` at pos 4.2 for "steelcase gesture seat depth range inches" (23 impr, 0 CTR). Title already has the exact spec numbers — this is not a meta problem. Pattern = AI Overview consuming the answer above organic results. Fix: restructure content for AIO citation, not title rewrite. This diagnostic is only reachable with query-level data.
- **DECISION — Build `gsc-analyze.ts` as Monday step after `gsc-pull.ts`:** Script reads `data/gsc/latest.json`, groups query variants by intent cluster (normalized, stemmed), identifies CTR leaks with their specific query context, flags AIO pattern (pos ≤ 6, 0 CTR, spec-type query), and writes to `data/gsc/analysis.json` + `wiki/pages/concepts/gsc-analysis-strategy.md`. Strategy agent already reads this concept page directory via `readConceptContext()` — zero other agent changes needed. This converts vague "optimize this page" signals into specific fix instructions with the exact query driving the problem.
- **DECISION — Expand `gsc-pull.ts` with 3 new dimensions:** `['device']` (site-wide device split), `['page', 'device']` (per-page device CTR), `['date']` (daily data for trend analysis). These are additional API calls on the existing Monday pull — no new workflow step needed.
- **NOT DECIDED YET — Exact query clustering algorithm:** Options are TF-IDF similarity, simple word-overlap threshold, or LLM-based grouping via Claude Haiku. To be determined during implementation. LLM grouping is most accurate but adds cost; word-overlap is free and probably sufficient for a 200-query dataset.

## 2026-W19 (May 9c) — Pipeline bug fixes from full system audit (8 fixes)

- **FIX — audit.ts meta description regex:** Changed `(.*?)` to `([^"]*)`. The lazy quantifier stopped at apostrophes in `6'4"` content, truncating descriptions and producing false audit flags. Decision: always use negated char class `[^"]` when matching attribute values bounded by double quotes.
- **FIX — execute-content.ts overwrite guard:** `writeNewPage()` now skips (returns SKIPPED) if the target file already exists. Previously a strategy agent slug collision would silently destroy a live page. Decision: existing pages must go through REWRITE task type, not NEW CONTENT.
- **FIX — AMAZON_URL placeholder detection:** Added `href="AMAZON_URL` check to both `validateAstroFile()` and `checkAffiliateLinks()`. Template placeholder was invisible to the affiliate link checker (which only scans amazon.com URLs). Decision: both generation-time and deploy-time checks now catch this.
- **FIX — competitor-monitor.ts gap deduplication:** `## Recent Competitor Gaps` section is now fully replaced (section slice + rewrite) instead of prepended. Old logic accumulated duplicate rows every Monday run indefinitely. Decision: whole-section replacement is the correct pattern for rolling wikis.
- **FIX — strategy.ts plan validation:** Added post-generation parse check. If plan has section headers but zero pipe-delimited task rows, a WARNING is logged with raw plan preview. Decision: empty plans should be loud, not silent.
- **FIX — verify-deploy.ts Saturday summary:** Added system prompt (factual, terse, trend-aware) and prior-week GSC stats injection from wiki history. Decision: no-system-prompt Claude calls produce generic, low-value output — always set context for weekly summaries.
- **FIX — tca-audit.md memory path:** Was pointing to wrong directory (`/Downloads/Claude TCA Workspace/`) and wrong agent name (`tca-seo-strategist`). Corrected to `/Downloads/Claude-Projects/PROJECTS/Claude TCA Workspace/.claude/agent-memory/tca-audit/`.
- **FIX — tca-audit.md Python regex:** `["\'\]` pattern had backslash before `]` making the character class unterminated — would raise `re.error` at runtime. Fixed to `["\']\s+` (unescaped `]` closes the class).

## 2026-W19 (May 9b) — Saturday workflow: stale GSC data + main overwrite

- **ROOT CAUSE — Agents using stale GSC data:** Monday's `gsc-pull.ts` commits fresh `data/gsc/latest.json` to `main`. Saturday workflow checked out `staging` — which was behind main — so all agents read the previous week's GSC snapshot. Fix: merge `origin/main` into staging immediately after checkout, before any agent or build step runs.
- **ROOT CAUSE — Manual main fixes being overwritten weekly:** Saturday used `--force-with-lease` to push staging → main. Any fix committed directly to main (not via staging) would survive until Saturday, then be silently erased. The upfront merge of main into staging eliminates this — staging is now a superset of main before the push, so a regular non-force push is safe and correct.
- **Decision:** Saturday workflow now follows: checkout staging → merge main → npm ci → build → lint → agent → commit + push. No force on final push.

## 2026-W19 (May 9) — Agent reliability audit + deep fixes

- **AUDIT FINDING — execute-fixes.ts full-file rewrite was root cause:** Every meta/title fix regenerated the entire Astro file. Title and description are just string literals on the `<Layout>` tag — no full-file rewrite needed. Full-file approach introduced em-dash bleed, structural regressions, and word count drops. **Decision:** Added targeted edit mode. `classifyFix()` detects meta/title tasks and routes them to `applyTargetedFix()` which generates only the changed value and applies it via `applyLayoutPropReplace()` — a regex replacement scoped to the Layout opening tag in the HTML section. Frontmatter is never touched for these tasks.
- **AUDIT FINDING — execute-content.ts example truncation caused missing Layout wrapper:** `getExamplePage()` read `gesture.astro` and truncated to 3000 chars. The gesture frontmatter is ~130 lines of schema JSON — 3000 chars doesn't reach `<Layout>`. Claude wrote correct frontmatter then fell back to raw HTML. **Decision:** Replaced with `buildTemplate(slug)` — a purpose-built compact template showing every structural element (verdict box, citation capsule, affiliate CTA, FAQ, `<Layout>...</Layout>`) regardless of content length. Also added `getImportPrefix(slug)` to correctly calculate `../layouts/` vs `../../layouts/` by slug depth.
- **AUDIT FINDING — execute-content.ts had no retry:** One bad generation = zero content that week. **Decision:** Added one retry with the specific validation failure reason injected back into the prompt.
- **AUDIT FINDING — strategy.ts REWRITE format silently broken:** Template showed 3 pipe-separated fields; parser regex requires 4. All REWRITE tasks from the strategy agent were silently dropped unless Claude happened to add a 4th field. **Decision:** Fixed template comment to show correct 4-field format.
- **AUDIT FINDING — Thursday workflow all-or-nothing build:** One bad file blocked all fixes from committing. **Decision:** Added per-file rollback to `thursday.yml` — identifies failing `.astro` from build error output, rolls back just that file, commits the rest.
- **AUDIT FINDING — wiki/index.md summaries were stale:** Entity row text stuck at March/April numbers. Underlying `gsc-performance.md` concept page was current (updated by Tuesday audit agent). **Decision:** Updated index summaries to current data. Index.md summary rows are now clearly labeled with dates to prevent silent staleness.
- **Cost analysis:** Weekly API cost ~$3–5/month. Rebuilding to use Claude Code CLI or a second Claude Pro account ($20/month) is not justified — API approach is correct architecture for automation.

## 2026-W19 (May 7) — Thursday build failure recovery + weekly plan execution

- **BUILD FAILURE DIAGNOSED AND FIXED:** Thursday `execute-fixes.ts` wrote a Claude-generated `.astro` file with an em dash (U+2014) in a JavaScript expression context inside the HTML template (not a string). esbuild emits `Unexpected "—"` — the character is a valid JS string value but not a valid token in expression position. Build failed; CI aborted before the commit step, so repo was clean.
- **Root cause:** The fix prompt for `/knee-pain-seat-depth/` asked only for a title + meta change, but the agent regenerated the entire file. Claude introduced something like `{...—...}` in the template. The underlying write was not validated before esbuild ran.
- **Fix applied to `execute-fixes.ts`:**
  1. `sanitizeFrontmatter()` — parses the `---...---` frontmatter block, replaces `—` → `—`, `–` → `–`, curly quotes → straight quotes before writing. HTML template section is not touched. This is a safety net for the frontmatter JS block where any non-ASCII token is fatal.
  2. System prompt rule — explicit instruction: "FRONTMATTER ONLY: Use only ASCII characters between the --- markers. Never use em dashes, curly quotes, or other Unicode characters directly in the JavaScript frontmatter."
- **Decision:** The deeper fix (validating generated output with a syntax checker before writing) is deferred — `sanitizeFrontmatter()` covers the most common failure mode. The `validateAstroFile()` function in `execute-content.ts` already checks for "bare English operators in JS" — consider adding equivalent check to `execute-fixes.ts` in a future hardening pass.
- **All Thursday weekly-plan tasks executed manually:** 5 FIX tasks + 1 REWRITE. See log entry 2026-05-07 for full details. Note: `/review/gesture/` and `/aeron-vs-gesture/` redirects were already live in `_redirects` — confirmed no duplicate needed.
- **Pages updated today:** `/review/aeron-size-c/` (meta), `/chairs/steelcase-gesture/` (meta), `/knee-pain-seat-depth/` (title + meta), `/best-office-chairs/` (affiliate links in verdict table).

## 2026-W19 (May 6) — manual session + pipeline repair

- **First commission:** $18 on May 1 from Amazon affiliate. Validated full funnel. **CORRECTED (May 6):** Commission came from /knee-pain-seat-depth/, not /review/gesture/ — confirmed via GSC click data for May 1. This was a pain-pillar educational page, not a review. The page embeds two Amazon CTAs (Leap Plus + Gesture). Visitor arrived problem-aware ("knee pain from office chair"), read the seat depth analysis, and clicked through to buy. Implication: pain-pillar pages have real conversion potential, not just topical authority value.
- **GSC trajectory confirmed:** 4,443 → 12,209 impressions over 4 weeks (90-day rolling). Clicks 10 → 29. Position 14.3 → 11.5. Not a fluke — consistent weekly improvement.
- **CRITICAL BUG FIXED — Thursday cooldown:** `thursday.yml` used `actions/checkout@v4` without `fetch-depth: 0` (shallow clone). `git log -1 --format=%ai` always returned today's date for every file → `daysSinceLastEdit()` always returned 0 → every page permanently locked at "edited 0d ago." 3 weeks of zero fixes directly caused by this. Fix: added `fetch-depth: 0` to thursday.yml checkout.
- **CRITICAL BUG FIXED — Friday silent failure:** Strategy agent formats plan slugs with Markdown backticks (e.g. `` `/slug/` ``). Backticks survived into `task.slug`, corrupting file paths. Pages were written to invalid paths → `CONTENT_WRITTEN` stayed false → commit step skipped → content lost silently for 3 weeks. Fix: strip backticks from parsed slug/keyword in `execute-content.ts`. Also added: validation failure logging, always-commit content-log.md step on failure so errors are visible.
- **Local workspace was 12 commits behind remote** — agents had been running correctly all along. Workspace just needed `git pull`.
- **SERP suppression conclusion reassessed:** April 22 finding (AI Overviews + carousels = root CTR cause) is still valid for specific query types. But "meta rewrites won't help" was overgeneralized. Review/comparison pages (gesture, leap-plus, aeron-size-c) are on editorial SERPs without carousels — meta rewrites are valid there. Thursday fixes now correctly target these pages.
- **Decision:** `what-works.md` updated with post-April growth data. `thesis.md` updated with current state and revised priorities.
- **PIPELINE IMPROVEMENT — CRITICAL threshold bypass:** `execute-fixes.ts` now loads GSC data at runtime and detects CRITICAL pages (400+ impr, pos ≤10, 0 clicks). These pages use a 7-day minimum cooldown instead of 14-day. Technical fixes still bypass both. The 14-day rule protects ranking signals — but a page with literally 0 clicks has no signal to protect, so the full wait was wasteful.
- **PIPELINE IMPROVEMENT — Richer content prompt:** `execute-content.ts` system prompt now mandates 5 structural elements on every generated page: verdict box, answer-first opening, standalone citation capsule, 2-CTA affiliate block, FAQ section + FAQPage schema. Previous prompt specified these loosely; now they're explicit requirements.
- **PIPELINE IMPROVEMENT — Quality gate:** `execute-content.ts` now runs a second Claude call (Haiku 4.5) after generation to score content 0-100 against the 5 structural criteria. Pages scoring below 80 are rejected before writing to disk. Enforces the 80+ gate that was only aspirational in the strategy prompt before.
- **Decision:** These three changes do not conflict with the May 8 CTR test (meta rewrites on review pages) — the CRITICAL bypass only fires on 0-click pages, and the content changes only affect new pages.

## 2026-W15 (Apr 7 – Apr 13)

- **Automation system hardened:** 7 blind spots identified by GPT review, all fixed in one commit
- **Fix 1 (voice):** One remaining voice violation fixed in `/chairs/steelcase-leap-plus/index.astro` ("every other chair I tested seriously" → "every other chair evaluated for this height range"). All other author/about/llms.txt/height-guide pages were already clean.
- **Fix 2 (competitors):** Replaced 4 competitor URLs (RTINGS, Ergonomic Trends, OfficechairPicks, Wirecutter kept) with 5 verified URLs. Added `dead: boolean` tracking through interface → output JSON → wiki log.
- **Fix 3 (audit history):** Replaced wholesale `writeWikiPage()` overwrite of `gsc-performance.md` with read-preserve-append logic. Max 8 historical snapshots retained on each run.
- **Fix 4 (deploy checks):** Added 3 new verify-deploy checks: `checkSchemaValidity()` (JSON-LD parse), `checkInternalLinks()` (broken hrefs), `checkContentRegression()` (>15% word count drop).
- **Fix 5 (word count guard):** execute-fixes.ts now rejects any Claude-generated file where word count drops >15% from original.
- **Fix 7 (edit cadence):** strategy.ts now injects recently-edited pages list (21-day window) and impression thresholds into Claude prompt. execute-fixes.ts now enforces 14-day cooldown on non-technical fixes.
- **Decision:** Edit cadence policy codified — technical fixes anytime; CTR/meta changes require 14-day cooldown; impression thresholds: <100=noise, 100-300=technical only, 300+=CTR changes OK, 400+@pos≤10+0clicks=CRITICAL.

## 2026-W14 (Mar 31 – Apr 6)

- **Audit score:** 89/100 (+3 from Mar 30)
- **Fixed:** 7 issues from prior audit (404, meta lengths, sitemap priorities, og:type, internal links)
- **Identified:** CTR crisis is the #1 problem — 0.29% avg CTR across ~4,100 impressions
- **Prescribed:** Verdict-first meta rewrites for 3 pages (NOT YET IMPLEMENTED)
- **Prescribed:** Height-bracket verdict table for /best-office-chairs/ (NOT YET IMPLEMENTED)
- **New signal:** "steelcase gesture review independent" query emerging (11 impr, pos 8.91)
- **Decision:** All previously unindexed pages submitted to GSC → confirmed indexed by Apr 5
- **Decision:** Automation system designed (AUTOMATION-SYSTEM.md) for weekly agent pipeline
- **ARCHITECTURE: LLM Wiki system implemented.** 22 wiki pages created from ~35 scattered workspace files. 3-layer pattern: raw/ (immutable sources), wiki/ (LLM-maintained knowledge), SCHEMA.md (operating rules). All 6 automation agents wired to read/write wiki. Wednesday strategy agent now gets compiled multi-week history instead of just last week's raw data. Wiki + raw moved inside git repo for CI access. Obsidian vault configured with graph view, color groups, and symlinks for browsing.

## 2026-W13 (Mar 24 – Mar 30)

- **Audit score:** 86/100
- **Fixed:** gesture review meta (171→146), leap-plus seat-height meta (166→133)
- **Identified:** 404 on /leap-plus/weight-limit/, og:type wrong on 3 pages, sitemap priority wrong on height pages
- **Decision:** Sitemap priority for height pages raised to 0.8

## 2026-W12 and earlier (Mar 2 – Mar 23)

- **Site launched:** ~Jan 2026
- **Phase 1 (Foundation):** All chair clusters created, comparison pages expanded, E-E-A-T foundation (about page, bylines, Person schema)
- **Phase 2 (Expansion):** Aeron + Leap Plus clusters, FAQ schema, Quick Answer boxes
- **Blog audit (Mar 19):** 37 pages, avg score 71/100
- **GEO analysis (Mar 16):** Score 71/100, identified citation capsules and passage blocks as gaps
- **Multiple SEO audits:** Mar 2, 8, 12, 15, 16, 17, 19 — iterative improvement cycle

---

## 2026-W30 (2026-07-20)

- **Deploy:** Passed
- **GSC:** 207 clicks, 94576 impr, pos 8.1
- **Fixes:** 4 applied
- **Content:** 1 new pages
## 2026-W31 (2026-08-01)

- **Deploy:** Passed
- **GSC:** 221 clicks, 97131 impr, pos 8.1
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W29 (2026-07-18)

- **Deploy:** Passed
- **GSC:** 188 clicks, 89422 impr, pos 8.1
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W28 (2026-07-11)

- **Deploy:** Passed
- **GSC:** 167 clicks, 78826 impr, pos 8.3
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W27 (2026-07-04)

- **Deploy:** Passed
- **GSC:** 150 clicks, 67673 impr, pos 8.5
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W24 (2026-06-13)

- **Deploy:** Passed
- **GSC:** 55 clicks, 23105 impr, pos 10.5
- **Fixes:** 1 applied
- **Content:** 0 new pages



## 2026-W23 (2026-06-06)

- **Deploy:** Passed
- **GSC:** 55 clicks, 23105 impr, pos 10.5
- **Fixes:** 1 applied
- **Content:** 0 new pages



## 2026-W21 (2026-05-23)

- **Deploy:** Passed
- **GSC:** 46 clicks, 19437 impr, pos 10.6
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W20 (2026-05-16)

- **Deploy:** Passed
- **GSC:** 41 clicks, 17877 impr, pos 10.7
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W20 (2026-05-16)

- **Deploy:** Passed
- **GSC:** 41 clicks, 17877 impr, pos 10.7
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W20 (2026-05-16)

- **Deploy:** Passed
- **GSC:** 35 clicks, 15417 impr, pos 11
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W18 (2026-05-02)

- **Deploy:** Passed
- **GSC:** 23 clicks, 8455 impr, pos 12.6
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W17 (2026-04-25)

- **Deploy:** Passed
- **GSC:** 19 clicks, 7096 impr, pos 13.2
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W16 (2026-04-18)

- **Deploy:** Passed
- **GSC:** 12 clicks, 5590 impr, pos 13.6
- **Fixes:** 0 applied
- **Content:** 0 new pages



## 2026-W16 (2026-04-13) — CI/CD repair + new content

- **Deploy:** Passed (Saturday, after multiple failures and manual repairs)
- **GSC:** 12 clicks, 5590 impr, pos 13.6
- **New page created:** `/chairs/herman-miller-aeron/size-guide/` — "Aeron Size B vs Size C for tall people." Planned by Wednesday agent; Friday agent generated the file with invalid JS (`and` used as a JS operator in frontmatter), breaking the build. File was rewritten manually and committed.
- **Root cause of Friday failure:** `execute-content.ts` wrote a Claude-generated file without validating its syntax. The esbuild error `Expected "}" but found "and"` was a bare English word in a JavaScript expression. Build failed → commit step skipped → file never pushed. System behaved correctly (no bad file shipped) but content was lost.
- **Fixes applied to CI pipeline (all committed):**
  1. `execute-content.ts` — added `validateAstroFile()` pre-write check (frontmatter fences, Layout wrapper, bare `and`/`or` in JS); hardened system prompt with explicit Astro syntax rules
  2. `saturday.yml` — reordered steps: build now runs BEFORE verify-deploy (was after — caused schema check to always fail with "dist/ not found")
  3. `saturday.yml` — added `fetch-depth: 0` so `git diff HEAD~1` works for content regression check
  4. `saturday.yml` — final push now goes to both `staging` and `main`
  5. `friday.yml` + `thursday.yml` — added `lint:content` step before commit
  6. `friday.yml` + `thursday.yml` — push now goes to `staging` (not directly to `main`)
  7. `verify-deploy.ts` — internal link checker now skips root-level static files (`.png`, `.ico`, `.svg`, etc.) — was incorrectly flagging favicons as broken links and blocking every Saturday deploy
  8. `package.json` — added missing `lint:content` script entry
  9. `scripts/lint-content.mjs` — committed (was untracked)
- **Decision:** `staging` branch is now the deploy target for all weekly agents. Saturday is the only step that merges `staging → main`. This was already the intended design but wasn't enforced in the committed workflow files.
- **Decision:** Friday agent now validates generated files before writing to disk. Invalid files are skipped with `success: false` — `CONTENT_WRITTEN` stays `false`, build is never attempted, pipeline is clean.



*Append new entries at the top. Each week's entry should note: what was done, what was decided, what was deferred, and any surprising outcomes.*

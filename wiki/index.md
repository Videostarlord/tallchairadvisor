---
type: index
last_updated: 2026-09-01 (revenue-portfolio inversion shipped; AIO citation tracker built; /chair-specs/ dataset published; visual-diff false escalation fixed) | prev: 2026-08-31 (CTA placement finished site-wide — 9 more pages from 37-73% down to 8-20%; 6 FTC disclosure failures fixed, 45/45 verified by rendered position)
---

# TCA Wiki Index

Master catalog of all wiki pages. The LLM reads this first to find relevant pages before answering queries.

---

## Chair Entities

| Page | Summary |
|------|---------|
| [[steelcase-gesture]] | Jackson's chair. Only first-person content. 1895 impr, pos 8.4. Flagship. |
| [[herman-miller-aeron]] | Research-only. /tall-people/ at 1175 impr, pos 7.3, 3 clicks. Previously 0% CTR — improving. |
| [[steelcase-leap-plus]] | Research-only. Best raw specs for tall users. "Almost bought" narrative. |
| [[sihoo-doro-s300]] | Research-only. Budget option. Rising in AI citations. Newly indexed Apr 5. |

## Site Page Entities

| Page | Summary |
|------|---------|
| [[review-gesture]] | Flagship review. Score 88. 2,529 impr, pos 8.2. AIO capsule May 12. TL;DR moved before hero image Jun 14 (ChatGPT bounce fix). |
| [[review-leap-plus]] | Research-based "almost bought" review. Seat-height spec corrected 2026-08-06 — 15.5"–19.5" standard, 22.5" only with the optional 5" cylinder. See [[steelcase-leap-plus]]. |
| [[aeron-tall-people]] | 1,353 impr, pos 7.4, 4 clicks (0.30% CTR). May 10. |
| [[knee-pain-seat-depth]] | **NEW entity Jun 14.** #1 impression page (12,804 GSC). Calculator now working. Links to /best-office-chairs-under-500/ added. Cornell Rule framing. |
| [[aeron-vs-gesture]] | 385 impr, pos 8.5, 0 clicks. Meta rewritten Jun 14 to verdict-lead. GSC validation pending. |
| [[chairs-herman-miller-aeron-size-guide]] | NEW 2026-04-13. Size B vs C guide for tall users. No GSC data yet. |
| [[correct-chair-dimensions]] | Educational. 1,766 impr, pos 15.8. Top GSC opportunity (content-depth, score 883). May 12. |
| [[best-office-chairs]] | **MERGED 2026-07-04** — 301 → /office-chairs-for-tall-people/. Never ranked <45 on head terms, 0 clicks ever. Historical only. |
| [[office-chairs-for-tall-people]] | **MONEY HUB since 2026-07-04.** Absorbed best-office-chairs. Pos 8.1, 2715 impr. Quick Picks + verdict table + "best" title. Watch head-term positions ~Aug 1. |
| [[heavy-duty-ergonomic-chairs]] | **NEW 2026-05-26.** Targets "best heavy duty ergonomic chairs for tall people" (pos 14). Two-problem frame: weight capacity + tall-user dimensions. Leap Plus as only mainstream solution. |
| [[chair-specs-dataset]] | **NEW 2026-09-01.** `/chair-specs/` — the spec registry published as a citable CC BY 4.0 dataset + `/chair-specs.json`. **Not a money page; no affiliate links, deliberately.** Do not score it on CTR or position — its job is to be cited. The `guarded` list (figures true but misleading alone) is the differentiator. |
| [[refurbished-steelcase-leap]] | **NEW 2026-07-04.** Refurb Leap V2 for tall users — height-cutoff angle (~6'2" max). Crandall Amazon CTA (B08PPVCCST). Score 82/100. From revenue audit item 2. |

| [[aeron-size-c-vs-leap-plus]] | New page: Herman Miller Aeron Size C vs Steelcase Leap Plus for Tall People. Created 2026-07-20. **Both affiliate CTAs were dead ASINs (pipeline-invented) until fixed 2026-08-04.** |
| [[standing-desk-converter-tall-people]] | **NEW 2026-08-04. Strongest of the accessory batch.** Vari Tall 40's own Amazon title says "up to 6'6"" — explicitly tall-marketed, in stock, no niche competitor ranking. Converter height math (desk + riser vs 44-50" target). Disambiguated from [[standing-desk-height-tall-people]]. |
| [[chair-headrest-tall-people]] | **NEW 2026-08-04.** Only the Aeron has buyable aftermarket headrests. Gesture has none (factory-bundled only); Atlas Leap V2 unit sold out everywhere AND does not fit Leap Plus. Highest differentiation, weakest availability. |
| [[seat-cushion-height-tall-people]] | **NEW 2026-08-04.** Firm cushions for 2-4" of added seat height. Corrects the leg-extender myth (wrong for gas-cylinder chairs). Info gain: cushion height gained vs backrest/lumbar position lost. Most inbound links of the batch (8). |
| [[lumbar-support-tall-people]] | **NEW 2026-08-04.** Long-torso lumbar apex sits higher than standard 14-16" cushions support. **Tells Leap/Gesture/Aeron owners NOT to buy** — those chairs have built-in lumbar and a cushion costs 2-4" of seat depth. |
| [[keyboard-tray-tall-people]] | **NEW 2026-08-04.** Negative-tilt trays as companion to raised desks. States plainly there is no tall-specific keyboard tray; debunks the Fellowes "6.25in above desktop" claim arithmetically. |

## Concept Pages

| Page | Summary |
|------|---------|
| [[godseye-nightly]] | **OPERATIONAL 2026-08-06.** Observation layer over the Mon-Sat pipeline. 7/7 collectors healthy, phone alerts live, watchdog in a second private repo. Full-week stress test found 6 real bugs (audit truncating findings for a month; 2 state files never committed; workflows discarding runs on push conflict). **Open task list: `raw/audits/2026-08-06-open-issues-task-list.md` (frozen snapshot) — current status in [[open-issues-status]].** **A1 cooldown gate FIXED 2026-08-09** — the pipeline's own commits were arming the lockout that blocked its next fix (49/54 pages locked -> 0). **L2 now also captures visual regression at desktop + mobile (P1).** **2026-08-30 — two alarm-honesty fixes.** (1) The dead-man's switch had fired a FALSE `TCA DEAD` **every morning since 2026-08-13**: the 17:00 nightly writes `wiki/nightly/<yesterday>.md`, and the 08:00 watchdog looked for `<today>.md` — a file that can never exist. Now accepts today *or* yesterday; window still exactly one missed cycle. **The fix is inert until `deadmans-switch.ts` is re-copied by hand to `Videostarlord/tca-watchdog`.** (2) `--no-narrative` nights were rendered by the *model-call-broke* renderer, so 6 nights in 7 the report announced **"The report writer failed"** and filed itself as the #1 item needing attention — nothing had failed. New `skippedNarrativeReport()` says the essay is weekly and **lists** the escalated/regressed findings instead of only counting them. **New seam rule: changing a schedule changes a filename, and something downstream matches on it — including outside this repo.** |
| [[ctr-optimization]] | #1 site bottleneck. 0.23% CTR (May 2026). Cause A: AIO suppression (80%). Cause B: carousels. Build geo-optimize.ts to fix. |
| [[aio-citation-tracking]] | **NEW 2026-09-01.** Weekly DataForSEO observation of whether an AI Overview exists on TCA's money queries and whether TCA is cited in it. **The 80% AIO-suppression figure in [[ctr-optimization]] has never been observed — this is the instrument that checks it.** Includes a deliberate control group of unsuspected queries. **Zero observations so far**; do not cite until two runs agree. |
| [[geo-optimize-plan]] | **COMPLETE (May 11).** Integrated into competitor-intelligence.ts v2.3. 3 capsules applied (gesture, best-office-chairs, leap-plus). SERP cache live (72h). 3 pages pending (page_token — unfixable). Strategy.ts reads AIO context. |
| [[meta-descriptions]] | Length constraints, regex bug, current status per page. |
| [[schema-markup]] | Types in use, JSON-LD parse error on money page, aggregateRating issues. |
| [[ai-citation-readiness]] | **2026-08-08: 49/49 pages satisfy the `geo-capsule` predicate.** Documents the exact marker contract and the three traps found rolling it out. Caveat: 22 of the 45 pages touched were outside B10's sanctioned money-page scope — see [[open-issues-status]]. |
| [[open-issues-status]] | **Living status of the open-issues task list.** Read this before the frozen `raw/` snapshot. **2026-08-09: A1 and A10 closed by the autonomous-data-layer build.** Still open: the kill-list prose/code contradiction awaiting Jackson's decision, B11 Leap Plus spec sweep, B5 Gesture CTR, A2/A5-A8/A13. |
| [[autonomous-data-layer]] | **FOUR OF FIVE STAND — P3 RETIRED 2026-08-26** (the Amazon Playwright pull; deleted, do not rebuild). **ALL FIVE BUILT 2026-08-09** (branch `feat/autonomous-data-layer`). **A1 cooldown fixed — the pipeline's own commits were blocking its next fix; 49/54 pages locked → 0.** P1 visual regression: 98 baselines, first-ever mobile 375×812 coverage, advisory until calibrated. P2 sitemap submit with read-back (`siteFullUser` sufficient — the predicted Owner requirement was wrong). P3 Amazon — **LIVE**; there was no CSV endpoint, so it harvests the SPA's own auth headers and reads the reporting JSON API. Daily live data + weekly archive. Daily overview only; ASIN-level attribution still manual. P4 dead ASINs via Firecrawl — first live run threw a false positive, now pinned as a test. Claude-in-Chrome still cannot run unattended. Scroll attention is ALREADY collected — do not rebuild it. |
| [[internal-linking]] | Hub-and-spoke architecture. Verified + unverified link inventory. |
| [[competitor-landscape]] | 5 direct competitors. TCA advantage: height specificity. |
| [[gsc-performance]] | 12,209 impr, 29 clicks, 0.24% CTR (May 4, 90-day). Page-level rankings. KPI targets. |
| [[ga4-performance]] | **AUTO-GENERATED by ga4-pull.ts.** Sessions, pageviews, engagement rate, bounce rate, affiliate clicks, ChatGPT sessions, traffic channels per page. |
| [[keyword-opportunities]] | Monthly keyword discovery results. Top-20 scored gaps for Jackson to review and approve. |
| [[true-keyword-gaps]] | Monthly DataForSEO competitor-gap analysis. 225 grouped non-ranking keywords after GSC subtraction; main lane is big-and-tall / wide / heavy-user adjacency. |
| [[dataforseo-reference]] | Official DataForSEO V3 reference for TCA. Auth model, priority endpoints, and current repo integration. Read before any DataForSEO work. |
| [[gsc-analysis-strategy]] | Query-level GSC analysis. Cornell cluster (164 impr, 0 CTR). AIO pattern detection. Plan for gsc-analyze.ts. Read before any CTR fix decision. |
| [[semantic-intent-analysis]] | **2026-05-22.** What Google thinks TCA is. 7-part analysis: entity clusters, intent decomposition, hidden signals, contamination, positioning, opportunities, defensibility. Five verdicts. |
| [[gsc-intelligence]] | **AUTO-GENERATED WEEKLY** by gsc-analyze.ts. Current week's ranked opportunities, CTR leaks, affiliate alerts, device split. Read before strategy.ts runs. |
| [[gsc-intelligence-system]] | Architecture reference: data flow, scoring formulas, expected CTR curve, file locations. Includes bug fix history. Read when modifying the pipeline. |
| [[statistical-confidence-policy]] | Guardrail for low-volume GSC interpretation. Use query clusters and reversible tests; avoid overconfident causal claims from thin data. |
| [[systems-architecture-audit-2026-05-13]] | **SOURCE OF TRUTH — system architecture status. Verified 2026-05-15.** 5/10 audit items fixed (keyword scripts, attribution tracker, content roadmap, decay detection, link audit, caching partial). 5 open: CI wiring, execute-fixes caching, DAG enforcement, commit decoupling, voice regex. Read before any pipeline changes. |
| [[audit-implementation-2026-05-10]] | **ARCHIVED 2026-05-15.** May 10 combined audit tracker (CLAUDE+CODEX, 21 findings). Superseded by [[systems-architecture-audit-2026-05-13]]. C1/C2/C3 content items still valid, in data/content-roadmap.json. |
| [[audit-2026-05-10-seo]] | **ARCHIVED SNAPSHOT — 2026-05-15.** May 10 full SEO audit (77/100). Findings ingested into entity pages. Read [[schema-markup]], [[affiliate-compliance]], [[meta-descriptions]] for current state. |
| [[query-clustering-system]] | How queries are grouped into semantic clusters. Intent weights, known TCA cluster families, cannibalization logic. |
| [[opportunity-scoring-system]] | Scoring formulas for near-p1, ctr-leak, content-depth, affiliate-capture opportunity types. Priority thresholds. |
| [[content-gap-engine]] | Internal + competitor gap detection. Current known gaps. Integration with competitor-monitor. |
| [[market-signal-framework]] | Velocity signals, AIO suppression detection, seasonal intent emergence, impression gravity. Current market state. |
| [[niche-validation-framework]] | How to tell "dead niche" vs distribution lag. Separates demand, ranking, and monetization validation. TCA verdict: not dead; expand adjacently first. |
| [[niche-incubator-system]] | Adjacent-project architecture for multi-niche go/no-go scoring before site launch. Verdicts: reject / hold / existing-site expansion / new-site MVP. Separate repo recommended. |
| [[content-gaps]] | Standing desk page, verdict table, citation capsules, depth upgrades. |
| [[content-quality-scores]] | Blog audit Mar 19. Avg 71/100. Gate: 80+ for new content. |
| [[system-setup-guide]] | Step-by-step replication guide for Jackson (human reference only — not LLM context). Do not read for operational questions. |
| [[workflow-system-reference]] | Current operational setup: weekly agent cycle, GitHub Actions, scripts, Obsidian vault, data flow. Read this for any question about how the automation works. |
| [[indexing-health]] | Per-page GSC indexing status. Jun 14: 35/47 indexed. 3 thin-content pages stuck crawled-not-indexed. **2026-08-09: sitemap submission automated on Saturday's deploy with read-back verification (P2) — `siteFullUser` proved sufficient, no permission change needed. It will NOT fix the 2 unindexed URLs; those are crawl-priority, not submission.** |
| [[affiliate-compliance]] | **NEW 2026-05-11.** FTC body disclosure missing on 6 pages. Revenue leaks: aeron-vs-gesture (0 CTAs in 84%), gesture review (CTA at 85%), best-office-chairs (Quick Picks → internal not Amazon). **2026-08-09: monthly dead-ASIN liveness check added (A10/P4, Firecrawl). Findings are ADVISORY — its first live run produced a false positive that would have removed a working link.** **2026-08-31 — 6 pages were non-compliant and the 07-25 sweep had reported them fixed.** A RENDERED check (real pixel offsets, all 45 affiliate pages) found 5 placing the disclosure BELOW the first CTA — worst 5,206px below — and `/office-chairs-for-6-foot-4/` carrying 3 affiliate links with **no disclosure at all**. All fixed; **45/45 re-verified by position.** **Why the old sweep passed:** it was a text scan for the component's presence, but the FTC rule is about ORDER. A page passes "has a disclosure" while burying it under the buy button — the check measured something adjacent to the rule. |
| [[affiliate-performance]] | **UPDATED 2026-08-30. ✅ THE $0.49 CHAIR-TAG EPC REPLICATED — first finding in this archive to ever reproduce.** `tcachair-20`: **60 clicks, 9 orders, $961.69, $29.25 ($0.4875 EPC)** on window Jul 31–Aug 29, against **59 / 6 / $28.54 ($0.484)** on Jul 29–Aug 27 two days earlier. Two independent windows agree; the **Aug 26 $0.00 is the outlier** and was a *null result at low volume, not a zero rate*. ⚠ **NARROWER THAN IT LOOKS — it is "Leap Plus clicks earn", not "chair clicks earn":** all 6 attributed orders sit on `B00TYE4QXU` (13.33% product CVR); Gesture, Aeron and Crandall together = **59 clicks, 0 orders**. **Chair UNITS never sell — confirmed 3x, and the gap is widening:** average item $157.30 (6 items) → **$106.85** (9 items) against $1,300–$1,800 chairs. Basket spillover inside the 24h window. ⚠ **TRAP — the headline fell $96.84 → $36.09 and that is NOT a loss:** the window advanced 2 days and the Jul 29 item ($2,048.80 / **$61.46**) aged out; underlying earnings **rose $0.71**. A rolling window manufactures declines out of nothing — always solve the window first. **August closed +$36.09.** ⚠ **DECISION OWED BY JACKSON:** the Jul 3 kill-list gate says *"2–3 consecutive positive months"* → +$36.09 is positive → **advances to 2 of 2–3**; but [[thesis]] separately tracks a **$100 month**, which August misses by ~64%. The gate was written when a positive month meant +$92.06. Two bars, tracked as one, now disagree. **Window SOLVED by algebra a 3rd time** against `data/affiliate/latest.json`'s daily rows — the method is routine, and those rows are the **decoder for every hand export**. 🚫 **P3 AUTOMATED PULL RETIRED — `amazon-pull.ts` and its workflow are DELETED. Do not rebuild.** Affiliate data is hand-exported into `raw/affiliate/YYYY-MM-DD-amazon-csv/`, permanently; `collectors/amazon.ts` nags at 7 days. **`data/affiliate/latest.json` is frozen — never overwrite it from a CSV drop.** For "do chair links earn?" the **tracking-ID row is authoritative**, not `linked-product.csv` (which credits basket revenue to the referring ASIN) or `category.csv`. July closed +$92.06. Market benchmark: DataForSEO CPC $3.73 — **the 3% furniture tier on a $500+ considered purchase is the constraint, not clicks.** |
| [[runpod-migration-proposal]] | 🔴 BACKLOG / soft rejected. Broad RunPod migration for TCA deferred; Anthropic Batch research is now the preferred low-friction cost path. Raw proposal remains as historical research only. |

## Synthesis

| Page | Summary |
|------|---------|
| [[what-works]] | Confirmed wins: hub-and-spoke, spec sub-pages, FAQ schema, content expansion. |
| [[what-failed]] | Comparison table didn't fix CTR. Meta trim had marginal effect. |
| [[thesis]] | The strategic bet: own height-specific chair ergonomics. Current priorities. |
| [[decisions-log]] | Week-by-week record of what was done, decided, and deferred. **UPDATED 2026-08-04 — the Jul 4 verdict "monetization problem, not traffic problem" is SUPERSEDED and inverted; monetization is fixed, traffic is now the constraint. Do not cite the old line as current state.** |

## Weekly Summaries

| Page | Summary |
|------|---------|
| [[2026-W16]] | Deployed. 12 clicks, 5590 impr. |
| [[2026-W17]] | Deployed. 19 clicks, 7096 impr. |
| [[2026-W18]] | Deployed. 23 clicks, 8455 impr. |
| [[2026-W20]] | Deployed. 35 clicks, 15417 impr. |
| [[2026-W21]] | Deployed. 46 clicks, 19437 impr. |
| [[2026-W23]] | Deployed. 55 clicks, 23105 impr. |
| [[2026-W24]] | Deployed. 55 clicks, 23105 impr. |

## Weekly Summaries

| Page | Summary |
|------|---------|
| [[2026-W27]] | Deployed. 150 clicks, 67673 impr. |

## Weekly Summaries

| Page | Summary |
|------|---------|
| [[2026-W28]] | Deployed. 167 clicks, 78826 impr. |

## Weekly Summaries

| Page | Summary |
|------|---------|
| [[2026-W29]] | Deployed. 188 clicks, 89422 impr. |

## Weekly Summaries

| Page | Summary |
|------|---------|
| [[2026-W30]] | Deployed. 207 clicks, 94576 impr. |
| [[2026-W31]] | Deployed. 221 clicks, 97131 impr. |

## Weekly Summaries

| Page | Summary |
|------|---------|
| [[2026-W32]] | Deployed. 236 clicks, 99415 impr. |

## Weekly Summaries

| Page | Summary |
|------|---------|
| [[2026-W33]] | Deployed. 236 clicks, 99415 impr. |

## Raw Sources (reference only — do not edit)

Located in `raw/`. Organized by type:
- `raw/affiliate/` — Amazon Associates export snapshots (latest: **2026-08-03 — rolling 30-day window**, 99.7% a restatement of the 2026-07-31 July close of +$92.06). **Two window types exist: month-to-date snapshots are cumulative and supersede each other; rolling-window exports cannot be appended to the monthly log at all. The CSV does not record which was selected — always note the range at download.**
- `raw/gsc/` — GSC data exports (Mar 7 through May 4)
- `raw/audits/` — Audit/analysis files (latest: 2026-07-04). Key files: `2026-07-04-affiliate-revenue-audit.md` (hostile revenue audit: link architecture root cause, 30-day plan, kill list, ASIN map), `2026-06-14-full-site-report.md` (cross-source site audit: GSC+GA4+Clarity, 47 pages mapped, 5 tiers, 7 recommendations), `2026-05-27-full-seo-audit.md` (SEO audit, 75/100, 6-agent), `2026-05-27-action-plan.md` (29 prioritized fixes), `2026-05-13-systems-architecture-audit.md` (systems audit — source for [[systems-architecture-audit-2026-05-13]]), `2026-05-10-full-seo-audit.md` (prior SEO audit, 77/100, archived).
- `raw/strategy/` — Strategy/planning files (latest: 2026-05-15). Key files: `2026-05-15-niche-incubator-plan.md` (adjacent-project architecture for niche go/no-go scoring), `2026-05-11-niche-validation-evaluation.md` (core validation framework), `2026-05-10-runpod-migration-proposal.md` (historical cost research, backlog only).
- `raw/reddit/` — Reddit/Apify pipeline docs
- `raw/misc/` — Session context, PDF
- `raw/assets/` — Images, XML files

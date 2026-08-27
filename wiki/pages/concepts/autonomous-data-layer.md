---
type: concept
last_updated: 2026-08-09
sources: [raw/strategy/2026-08-09-autonomous-data-layer-plan.md]
tags: [automation, playwright, api, visual-regression, architecture]
---

# Autonomous Data & Verification Layer

**Full build spec: `raw/strategy/2026-08-09-autonomous-data-layer-plan.md`.** This page is the durable summary; the spec is the executable detail.

**Status: ALL FIVE BUILT 2026-08-09**, branch `feat/autonomous-data-layer`. A1, P1, P2, P3, P4 — see "What shipped" below for what each one actually does and what it cost to learn.

## The question

Jackson asked for a system that autonomously controls his dashboards (GSC, GA4, Clarity, Cloudflare, GitHub) and visits the live site to confirm it works and looks right.

## The correction that shapes the design

**Claude in Chrome cannot run autonomously.** It requires an open browser and a live model session, so it cannot fire at 03:00 unattended — which is the entire requirement. It is also the most expensive option per action, since every screenshot costs image tokens.

| Tier | Tool | Cost | Unattended? | Use for |
|---|---|---|---|---|
| 1 | Vendor REST APIs | ~$0 | ✅ | Anything with an endpoint |
| 2 | Scripted Playwright in CI | ~$0 | ✅ | No-API surfaces, visual regression |
| 3 | Firecrawl | free tier | ✅ | Hosts that block datacenter IPs |
| 4 | Claude in Chrome | expensive | ❌ | One-off changes, exploration, re-auth |

Tier 4 is never scheduled and never on the critical path.

## Already covered — do not rebuild

GSC search analytics and URL inspection, GA4, Cloudflare analytics **and config writes**, Clarity behavioral metrics, GitHub, the Playwright probe, and A9 preview gating.

**Scroll attention is already collected.** `clarity-pull.ts` pulls `scrollDepthAvg` per URL and flags anything under 40% as `low-scroll-depth`, flowing into `data/clarity/latest.json` and `strategy.ts`. A heatmap scraper for this would rebuild something that exists.

The real limit there is sample size: 1–2 sessions per page as of 2026-08-07, so the numbers (7% on `/chair-headrest-tall-people/`, 8% on `/shoulder-pain-tall-people/`) are noise. That is a **traffic** problem, not a measurement one. Heatmap capture becomes worth it only at 50+ sessions per page.

## Build order

**A1 → P1 → P3 → P2 → P4.**

- **P1 — visual regression in the existing probe.** Highest value: the system is completely blind to layout breakage today. The probe already loads all 49 pages nightly at 1366×900; **mobile 375×812 has zero coverage and is where wide spec tables are likeliest to break.** Advisory until the diff threshold is calibrated on a week of real diffs, then added to `BLOCKING_CLASSES`. Aesthetic review stays threshold-triggered, never nightly — a vision model over 49 pages a night would cost more than the rest of the pipeline to mostly say "still fine".
- ~~**P3 — Amazon Associates** via Playwright + a stored `storageState` secret.~~ **RETIRED 2026-08-26 — the one collector in this layer that did not survive contact.** It worked for eleven days, then the session expired and demanded a manual login to a financial account that only Jackson may perform. It never removed the manual step; it converted a monthly CSV download into a fortnightly credential-capture chore that returned less data (daily overview, no ASIN attribution). **Amazon Associates is back to being the one surface with no API and an irreducible human load.** Do not rebuild it — see [[affiliate-performance]] and [[decisions-log]].
- **P2 — sitemap submission** via the Search Console API. Needs the read-write `webmasters` scope; `gsc-pull.ts` currently requests `webmasters.readonly`. Cheap, largely ceremonial.
- **P4 — A10 dead ASINs** via Firecrawl. Playwright cannot do it: Amazon hard-blocks datacenter IPs.

## Rejected, with reasons

- **GSC "Request Indexing" automation.** No API (the Indexing API is restricted to `JobPosting`/`BroadcastEvent`), ~10/day quota, Google states it does not reliably accelerate indexing, and automating clicks in Google's own UI is a gray area under their automated-access policy — with Jackson's account as the thing at risk. Only 2 URLs affected, both ordinary crawl-priority cases. Treat as a content-authority signal, not a submission problem.
- **Clarity heatmap scraping.** Data already collected; sample size too small to interpret.
- **Claude in Chrome on a schedule.** Structurally impossible.

## The dependency that outranks all of it

**A1 — the cooldown gate applies zero fixes** (29 findings → 0 applied across a full-week stress test). Every item here adds *observation* to a pipeline that ships nothing it finds. More instrumentation without A1 produces better-documented stagnation.

**Resolved 2026-08-09 — and the root cause was not the threshold.** See below.

---

# What shipped, 2026-08-09

## A1 — the pipeline was blocking itself

Cooldown asked `git log --since=14d -- <file>`: **any** commit touching a page. But most commits touching a page are the pipeline's own mechanical sweeps — one inbound-link injection across 8 orphans (`66bc44c`), one GEO capsule rollout across 45 pages (`a2f809f`), one spec qualification across 17 (`fe06db6`). Each sweep re-armed a 14-day lockout on everything it touched.

**The gate tightened in proportion to how much the system did.** Measured before the fix: **49 of 54 pages locked.** After: **0.**

Three defects, all fixed:

1. **Wrong signal.** `data/edit-log.jsonl` now records what agents actually changed, classified at the moment of the write. Cooldown reads that, not git. Seeded from `interventions.jsonl` — deliberately not from git, the signal being retired.
2. **Two classifiers that disagreed.** `strategy.ts` exempted 11 keywords at plan time; `execute-fixes.ts` exempted 8 different ones at apply time, so a task could clear the planner and die on application for a reason the planner could not see. Both are now `lib/cooldown.ts`.
3. **Neither list covered the defects the system finds.** The 2026-08-06 plan dropped its own Leap Plus spec correction to cooldown — the same plan whose prose said that fix *"bypasses the cooldown gate on technical grounds"*. "Correct the spec contradiction" matched no keyword in either list.

**The distinction now encoded:** cooldown governs *substantive revision* (thrash looks bad to Google; two content changes in one measurement window make attribution impossible). It does not govern *deterministic defects* — title/meta length, wrong specs, schema, canonical, redirects, dead affiliate tags, alt text, orphans — which have exactly one correct value and are machine-verifiable. Waiting does not make a 73-character title righter.

**Deliberately not loosened:** "Add a Fit Verdict callout block" and "Expand the Compare With section" remain substantive and still wait. Exempting those too would be a removal, not a fix.

Verified against the five real task lines the 2026-08-06 plan dropped: all five now pass — three as deterministic, two because those pages genuinely had no substantive revision inside 14 days.

Also fixed the upstream half: the planner's prompt listed all 49 pages as "do not re-edit", suppressing work before the gate ever saw it.

## P1 — visual regression, and the first mobile coverage at all

`raw/visual/baseline/` holds **98 baselines: 49 pages × desktop 1366×900 + mobile 375×812.** Mobile had **zero** coverage before this, on a site whose pages are full of wide spec tables.

Zero model tokens and zero extra navigations — the page is already open and measured; mobile is reached by resizing, so CSS media queries re-evaluate without a reload. Honest limit: `srcset` does not re-fetch and load-time JS does not re-run, so this catches CSS layout breakage and would miss a JS-driven mobile layout.

Load-bearing design points:

- **Capture runs LAST** in `probeUrl`, after every vital is read. Resizing provokes layout shifts; any earlier and CLS would measure the probe's own resize.
- **Synthetic runs may not write baselines.** A preview build writing baselines would redefine "correct" as "whatever this unmerged branch renders" — the inversion of a regression test.
- **`diffPct: null` never files.** No baseline, failed screenshot and changed dimensions are all "no comparison happened", not "no difference". A freshly written baseline is `unevaluable` — it would be comparing with itself.

**Advisory, not blocking.** `visual-regression` is absent from `BLOCKING_CLASSES`: 2% is a guess until a week of real diffs calibrates it. Stability verified — two independent full production runs, **0.000% on all comparisons**.

## P2 — sitemap submission, and a prediction that was wrong

Runs from Saturday's deploy, not the nightly. Submits, then reads back `sitemaps.get` to assert `lastSubmitted` advanced past the run's start (captured *before* the submit) and that errors and warnings are zero — `sitemaps.submit` returns 204, which proves only that a request was accepted.

**`siteFullUser` is enough.** The service account holds `siteFullUser`, and the common reading of Google's docs is that `sitemaps.submit` needs `siteOwner`. That was predicted here and it is wrong: a real submit succeeded, `lastSubmitted` advanced 2026-08-06T09:49:58Z → 2026-08-09T06:42:02Z, zero errors. **No permission change is needed** — this would otherwise have become a permanent false blocker.

Expectations: this will not move traffic. Google already refetches on its own schedule. It closes a loop cheaply.

## P3 — Amazon Associates — LIVE since 2026-08-09

The design point is the failure path. On an expired session it files `amazon-session-expired` and writes **no report** — it must never report `$0`. A zero from a failed login is indistinguishable downstream from a genuinely zero month, and **the kill-list gate that decides whether this site continues reads that number.** A fabricated zero could retire a site that was earning fine.

Expiry is detected positively (sign-in URL, challenge text, HTML where a CSV should be), never by trusting a parsed zero. Sign-in detection deliberately beats report-marker detection, because Amazon's login chrome can retain destination-page text. An `empty` CSV is recorded as empty, never as `$0` — Top-Sellers legitimately has no rows most weeks.

The export window is chosen by the script and written into the report as a stated fact, closing the month-to-date/rolling-30 ambiguity that already caused one misreading in this archive.

### Corrected 2026-08-09 — the untested selector layer WAS wrong

Flagged as unverified when shipped, and the first live session proved it. **There is no CSV endpoint.** The guessed `?format=csv` URL returned Associates Central's own 249KB JSON payload, which the CSV classifier read as *"header row only"* — an empty report. A wrong endpoint was one step from being recorded as a period with no earnings, which is the precise failure this component exists to prevent. JSON is now rejected explicitly, like HTML.

The real endpoint is `/reporting/table`, and it returns **401 to a plain cookie-authenticated request**: it also needs a per-page-load `authorization: Bearer` JWT and an `x-csrf-token`, neither a cookie, both rotating each page load, so neither can live in `storageState`.

**The fix is to harvest, not construct.** Open the page, intercept the app's own first request to `/reporting/table`, capture its headers, replay them with this run's date range. It never guesses an auth scheme — it borrows the one the application just used. That is also why it degrades honestly: if the app stops calling that endpoint, no headers are harvested and the run fails saying so, rather than inventing a total.

Verified by reproducing the 2026-08-04 archive export exactly: $3,337.74 ordered revenue, 7 items, 108 clicks.

**Two corrections that fell out of that comparison**, both now in the generated report: `total_earnings` is *shipped* earnings, not net ($100.40 vs the archive's $98.90 — a $1.50 clawback not present in the column set), and days without activity are omitted rather than zero-filled (25 rows for a 30-day window), so sparse is normal and only a wholly empty window is a failure.

**Scope: daily overview only.** ASIN-level tables need different `query[type]` values whose parameters were not established — probing started returning HTTP 429 and was stopped rather than risk the account. Click-to-ASIN attribution still needs a manual export, and the report states that in its own body rather than looking complete.

**Activated 2026-08-09.** Jackson captured the session by hand and set the secret; verified end-to-end from CI. That step is human by design — an agent must never handle a login to a financial account:

```
npx playwright codegen --save-storage=amazon-state.json https://affiliate-program.amazon.com/home/reports
gh secret set AMAZON_STORAGE_STATE < amazon-state.json && rm amazon-state.json
```

Until then it exits 0 silently; `collectors/amazon.ts` keeps nagging at 7 days. The selector layer could not be exercised without the secret and wants one supervised `--dry-run` — safe to get wrong, since a bad selector yields `invalid` and no report.

### Cadence, corrected 2026-08-09: daily live data, weekly archive

Shipped weekly because the plan said "weekly workflow" — a default taken without re-deriving it. Revenue was then the only major signal the nightly could not see, despite being the number the kill-list gate decides on.

Now `--mode daily` runs in the nightly (`data/affiliate/latest.json` + `history.jsonl`) and `--mode weekly` keeps writing the dated `raw/affiliate/` snapshot. The archive stays weekly because `raw/` is an archive of evidence, not a log; ~30 near-identical dated files a month would bury the signal in its own copies.

**Freshness is `fetchedAt` inside the file, never mtime** — see [[godseye-nightly]], where that distinction has now been caught in three separate components.

## P4 / A10 — dead ASINs, and the false positive that shaped it

Monthly, capped at 25 ASINs, Firecrawl (Amazon hard-blocks datacenter IPs, so Playwright cannot). Under 5% of the 500/mo free tier, metered through `meterExternal`.

**The first live run produced a false positive, and it is the most useful thing this build learned.** It reported `B0CQ4K1KXT` (Hbada E3 Pro, linked from `/best-office-chairs-under-500/`) as DEAD on "Currently unavailable". The phrase was real — it belonged to the **"Newer Version Available" cross-sell block** advertising the E3 Ultra. The E3 Pro itself showed Add to Cart, Buy Now and In Stock. **Acting on it would have removed a working affiliate link from a money page: the detector destroying the revenue it exists to protect.**

An Amazon page is a page about many products. Markers are now split:

- **HARD dead** (404, "couldn't find that page", dog page) — describes the whole document, trusted alone.
- **SOFT dead** (currently unavailable, no longer available, discontinued) — counts **only** when the page also offers no way to buy anything.

Purchasability is checked before soft-dead for that reason; bot walls before everything. A failed fetch is `unknown` and files nothing. The false positive is pinned as a test fixture from the real page.

Product names come from `data/verified-asins.json`, not the scrape — three attempts to read a title off the markdown returned "Product summary presents key product information", "Customers who viewed this item also viewed", and "3-Year Furniture Protection Plan".

Findings are advisory; a human confirms before any affiliate link is removed.

## The thread running through all five

Every one of these landed on the same rule, and it is the rule this codebase keeps re-learning: **a measurement that did not happen must never be representable as a clean result.** `diffPct: null` is not 0%. A failed Amazon login is not `$0`. A bot wall is not a dead product. A 204 is not a recorded submission. An unreadable edit log is not "nothing on cooldown".

## Related

[[godseye-nightly]] · [[open-issues-status]] · [[decisions-log]] · [[thesis]]

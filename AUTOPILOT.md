# TCA — AUTOPILOT MODE

**Entered:** 2026-09-01
**State:** Content frozen. Data collection only.
**Read this before touching anything in this repo.**

---

## Why the site is in this state

The Sept 2026 outside audit (`../TALLCHAIRADVISOR_OUTSIDER_AUDIT.md`) established three things:

1. The niche's entire head-term demand is **~5,300 searches/month**. Amazon-only, total
   dominance of it is worth **~$600/month**. The site currently earns ~$42/month — 7% of a
   small ceiling.
2. **Zero chair units have ever sold.** ~370 chair clicks, three exports. All revenue is
   24-hour basket spillover on other people's products. Amazon's cookie is shorter than the
   purchase decision, and that is mechanical, not fixable with copy.
3. Search growth **stopped on 2026-07-13**. Impressions and average position have been flat
   for seven weeks.

The audit's largest recommendation was to move chair links to 30-day-cookie merchants
(Crandall, Herman Miller via Impact, Branch). **Those applications were rejected.** That
closes the only funded path to 3x revenue-per-session, so the $300/month route in the audit
is not currently available.

The decision is therefore **not to abandon and not to scale** — to hold the asset passively,
keep collecting clean data, and spend the effort on validating a larger niche with a shorter
buying cycle. This file is what makes "passively" real.

---

## ⚠ TWO MANUAL STEPS ARE REQUIRED RIGHT NOW

Autopilot is **not** fully armed until both are done. Neither can be done from code.

### 1. Activate the GA4 internal-traffic Data Filter — 5 minutes, do this first

`src/layouts/Layout.astro` now sets `traffic_type: 'internal'` on every hit from the nightly
probe fleet. **That label does nothing until a Data Filter is told to act on it.**

> **DO NOT use the "Define internal traffic" screen. It is IP-based and cannot work here.**
> The 88% is **GitHub Actions runners on Azure** — a fresh, ephemeral IP essentially every
> run, from ranges that rotate without notice. There is no address or range to enter. That
> screen exists only to stamp `traffic_type` for people who cannot set it in their own tag.
> This site sets it directly, so the screen is redundant. Skip it.

**Admin → Data collection and modification → Data filters.**

Two things GA4 makes easy to confuse:

- **"Define internal traffic"** (under Data Streams → Configure tag settings) is a rule that
  *stamps* `traffic_type` onto hits based on IP. **Leaving it empty is correct here** — the
  tag stamps the parameter itself. An empty list is not a problem to fix.
- **"Data filters"** is the thing that *acts on* the parameter. This is the only piece needed.

Every GA4 property ships with an **"Internal Traffic"** filter already present in **Testing**
state. Open it and confirm the settings below. If it is missing (deleted at some point), click
**Create filter → Internal traffic** and set the same values:

| Field | Value |
|---|---|
| Filter type | Internal traffic |
| Parameter name | `traffic_type` — fixed by GA4, not editable |
| Parameter value | `internal` |
| Filter operation | Exclude |
| Filter state | **Testing** (not Active yet — see below) |

**Verify in Testing before going Active. Two reasons:**

- **Active permanently DISCARDS matching events** — not hidden, deleted, unrecoverable. If the
  user-agent regex were wrong and matched real visitors, Active would silently delete real
  traffic for the whole collection period.
- **Filters are not retroactive.** August's polluted data stays polluted whatever you do; this
  only cleans data from activation forward.

The verification sequence — note that step 2 is the re-baseline you have to do anyway:

1. Deploy the code. The tagging must be live before any of this means anything.
2. Manually dispatch the nightly with `rebaseline_visual: true` (manual dispatch always runs
   probes). This re-baselines **and** generates ~54 tagged hits to test against.
3. Next day, add the **"Test data filter name"** dimension to a report. Expect ~54 events
   matched and **zero** real sessions caught.
4. Only then set the filter to **Active**.

Confirm a week after activation: GA4 sessions should sit near **250–350/month** and Direct
should fall from ~88% to near zero. If it hasn't, the filter is not Active.

*Separate and optional:* your own browsing of the live site from home is a real second
pollution source, and that one genuinely is IP-shaped — the "Define internal traffic" screen
with your home IP is the correct tool for **that**. It will not touch the 88%.

### 2. Re-baseline the visual regression suite — 1 minute

**This is the same workflow run as step 1's verification dispatch — do it once, it serves both.**

Seven pages changed today, so their visual baselines are stale and will report diffs.

Run **Actions → "Nightly — God's-Eye" → Run workflow** with **`rebaseline_visual: true`**.

**It must run in CI, not locally.** Baselines captured on macOS and diffed on Ubuntu produced
a font-rasterisation offset that put all 49 mobile pages between 1.3% and 3.7% against a 2%
threshold, and read as five unrelated page regressions. Re-baselining locally recreates that
exact fault.

---

## What changed today

| Change | Why | Expected effect |
|---|---|---|
| GA4/Clarity tag probe traffic as internal | 1,929 of 2,188 Aug sessions were CI | Honest analytics — **needs step 1 above** |
| BuyBox added to 7 pages (first CTA moved 83–96% → 12–19% depth) | Their own data: first-CTA depth predicts clicks almost perfectly. 4 of the 7 are the Leap Plus cluster — the only ASIN that has ever converted | **~+$1–3/month.** Small, because the traffic is small |
| Nightly probe sweep → weekly (Sundays) | Frozen site; 6 of 7 sweeps re-measured an identical build | Lower CI + cleaner GA4 |
| `competitor-intelligence` → monthly (first Monday) | Its own header always said "monthly"; the workflow ran it weekly | ~−$2/month LLM |
| Tuesday full audit → monthly (first Tuesday) | Interprets data, collects none; re-audits a frozen site | ~−$0.4/month + less noise |
| `pageLastmod` advanced on the 7 edited pages | Project rule in CLAUDE.md | Correct sitemap signal |
| New seam test `analytics-exclusion.test.ts` | The probe UA and the Layout regex live in files that never import each other | Drift now fails `npm test` |

**Honest expectation: none of this meaningfully changes revenue.** The CTA work is worth a
few dollars a month at 250 sessions. It was done because a data-collection period should
collect data on a correctly-instrumented site, not a broken one — not because it is a
growth lever. The constraint is traffic volume and cookie length, and neither is fixable here.

---

## What still runs, and when

| When | What | Cost | Keep because |
|---|---|---|---|
| **Nightly 17:00 PT** | Collectors (GSC, GA4, Clarity, Cloudflare, quotas), ledger, cost rollup, heartbeat, deterministic report | ~$0 | The heartbeat feeds the dead-man's switch. Collectors are the point of the period. |
| **Sunday nightly** | + Playwright probe sweep (54 pages), visual regression, written narrative | ~$0.57/wk | Only thing that would notice the site silently breaking while unattended |
| **Monday 01:00 PT** | GSC pull + analyze, GA4, Clarity history, **`aio:track`**, index-monitor, roadmap sync | ~$0 | The primary dataset |
| **First Monday** | Competitor intelligence | ~$0.7/mo | Slow-moving; monthly is enough |
| **First Tuesday** | Full site audit agent | ~$0.15/mo | Catches structural content regressions |
| **Saturday 02:00 PT** | Build, content lint, verify deploy, submit sitemap | ~$0 | Catches a broken build; keeps indexing signal alive |
| **Monthly (1st)** | ASIN check, keyword discovery | small | Dead affiliate links earn nothing |

**Estimated forward run cost: ~$3–5/month**, down from ~$18/month in August.

Dead-man's switch lives in a **separate repo** and checks at 08:10 local against
`MAX_HEARTBEAT_AGE_HOURS=29`. One missed nightly = one phone alert. Do not disable it —
it is the only thing standing between "autopilot" and "silently stopped three months ago".

---

## The one recurring manual step

**Export the Amazon Associates CSV once a month** and drop it in
`raw/affiliate/YYYY-MM-DD-amazon-csv/`.

**Write down the date range you selected at download time.** Associates Central does not
record it in the file, and a rolling-30-day export is indistinguishable from a month-to-date
one. This already caused the 2026-08-03 export to be misread as a second positive month when
it was 99.7% July's money re-reported.

If you forget, the window can usually still be *solved* by summing the frozen daily rows in
`data/affiliate/latest.json` — see `data/affiliate/README.md`. **Never overwrite that file
from a CSV drop.** It is the decoder, not old data.

`collectors/amazon.ts` will nag in the nightly report at 7 days stale. Expect to see that
nag most of the month; it is not an error.

---

## What the data is being collected to answer

Three open questions. All three resolve on their own if you just let it run.

| # | Question | Instrument | Ready to read when |
|---|---|---|---|
| **Q1** | What are the 96,000 unattributed impressions? `/knee-pain-seat-depth/` alone reports 38,004 impressions at position 5.6 → 13 clicks → **zero named queries**. AI Overview? Carousel? PAA? Nobody has ever looked. | `aio:track`, Mondays, archives to `raw/aio/` | **4+ weekly runs** (~2026-10-01) |
| **Q2** | Do sub-$300 accessories convert where $1,300 chairs do not? `tcaaccessory-20` and `tcadesk-20` have never recorded a single click; `CompanionPicks` shipped 2026-09-01 to give them somewhere to fire from. | Monthly Amazon export, `tracking-id.csv` | **n ≥ 10 orders**, not the first export |
| **Q3** | Was the network rejection about the *niche* or about *scale*? | Read the rejection emails | Now — this is free and it changes the next site |

**On Q2, read `wiki/pages/concepts/statistical-confidence-policy.md` before concluding
anything.** At ~250 sessions/month this test produces 0–3 accessory orders in 30 days. That
is a **null result, not a zero rate** — this archive has twice recorded a single export as
settled and had to take it back. Do not let one export turn the strategy.

---

## Wake-up decision rule — decide on 2026-12-01, not before

Judge on these three. Not on rankings, not on impressions, not on any score.

| Signal | Pass | Fail |
|---|---|---|
| Monthly revenue, 3-month average | **≥ $75/mo** | < $50/mo |
| Q2 accessory test | a non-zero `tcaaccessory-20` or `tcadesk-20` row | still no rows after 3 exports |
| Q1 AIO tracking | AIO present on < 50% of the leak queries (so CTR is fixable) | AIO on most of them (so it is not) |

- **2 of 3 pass** → the ceiling is higher than the audit thought. Reopen it: re-apply to
  merchant programs with three months of *clean* GA4 behind you, and revisit the $300 route.
- **2 of 3 fail** → the ceiling is real and measured. Drop to 30 minutes a month: keep the
  nightly heartbeat and the monthly CSV, turn the rest off, and let it earn ~$40/month
  passively forever.

**Write the answer into `wiki/synthesis/decisions-log.md` when you make it.** The previous
gates ("2–3 consecutive positive months", "a $100 month") drifted apart and now disagree with
each other; the decisions log already flags that you owe a ruling. This table replaces both.

---

## What NOT to do while it collects

1. **Do not publish new pages.** The niche has ~5,300 head-term searches/month against 53
   existing pages. The marginal page is worth about $0.80/month and it changes the site
   mid-measurement.
2. **Do not run the content or fixes agents.** `wednesday.yml`, `thursday.yml` and
   `friday.yml` are already unscheduled. Leave them that way.
3. **Do not edit pages.** Every edit resets the baseline you are trying to establish. If
   something must change, note the date — a mid-period change makes before/after unreadable.
4. **Do not re-measure the Amazon chair question.** Three exports, ~370 clicks, zero chair
   units, mechanism understood. It is closed.
5. **Do not write more audits or strategy documents.** The site's revenue has not moved in
   three months while the document layer grew every week. That was the audit's single
   clearest "stop".
6. **Do not rebuild the Amazon Playwright pull.** Retired 2026-08-26, deliberately, and
   `data/affiliate/latest.json` must survive as the frozen decoder.
7. **Do not re-baseline visuals locally.** CI only — see the manual steps above.

---

## If you are an agent or a future session reading this

Start here, then `wiki/index.md`. Read entity and concept pages
(`wiki/pages/chairs/`, `wiki/pages/site-pages/`, `wiki/pages/concepts/`) for current state —
**not** the `audit-*.md` snapshots, which are frozen archives.

The single most useful thing you can do in this period is **nothing**. The asset is
instrumented, cheap, and profitable at a small scale. It needs elapsed time and one CSV a
month, not another intervention. If asked to "improve TCA", check this file's decision date
first — if it is before 2026-12-01, the correct answer is usually to say so.

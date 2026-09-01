# 2026-09-01 — Four builds: link-portfolio inversion, AIO citation tracker, open spec dataset, visual-diff honesty fix

Immutable snapshot. Living status lives in the entity and concept pages named at the end.

---

## Why these four

Jackson asked what was left to optimise and rejected the first answer as generic —
diversify affiliates, fix CTR, fix engagement. Fair: all three are already stated
priorities in [[thesis]] and none of them was a new observation. What follows came
out of re-reading the repo's own data rather than the strategy documents.

---

## 1. The revenue portfolio was instrumented and then never given anywhere to fire from

**The measurement.** Three Amazon tracking IDs were created 2026-08-13 to answer
"which product class converts". Across three hand exports:

| tag | clicks | orders | earnings |
|---|---|---|---|
| `tcachair-20` | 60 | 9 | $29.25 |
| `tcaaccessory-20` | **no rows** | — | — |
| `tcadesk-20` | **no rows** | — | — |

Not a single click has ever been recorded under the accessory or desk tag.

**Why.** The link inventory, not the copy. 116 chair links against 14 accessory
and 3 desk — and all 17 of those sat on the six accessory pages, which carry a
small fraction of site traffic. The classes existed; the links did not exist
anywhere a reader would reach them.

**Why it matters more than it looks.** The orders under the chair tag are not
chairs. All 6 attributed orders sit on one ASIN, average item value is **$106.85**
against $1,300–$1,800 chairs, and zero units of any chair this site recommends
have ever sold. The revenue is basket spillover inside the 24-hour window a chair
click opens. **The site earns from the price band it barely links to, and links
almost exclusively to the band that has never sold a unit.**

**What shipped.** `src/components/CompanionPicks.astro`, placed on the 8
highest-traffic chair pages, below each page's existing primary CTA.

- accessory links: 14 → 32, on 6 pages → 13
- desk links: 3 → 9, on 1 page → 7
- chair links: unchanged at 116

**Editorial constraints honoured, not worked around.** Every pick has to be
defensible on the page it appears on, which is why the component takes a list
rather than rendering a fixed set:

- No lumbar cushion on Gesture / Leap / Aeron pages. [[lumbar-support-tall-people]]
  tells those owners explicitly not to buy one; contradicting a published position
  for a few cents was not on the table.
- Headrests only on Aeron pages. It is the only chair here with a real aftermarket
  supply, per [[chair-headrest-tall-people]].
- Seat cushions only on budget and big-and-tall pages, where the chair has a hard
  height ceiling and no lumbar system worth losing.
- Monitor arm / keyboard tray / converter are universal, on one honest argument:
  setting a chair to a tall user's seat height puts the desk relatively too low.

**Placement is deliberately NOT above the existing CTA**, despite BuyBox's own
evidence that first-CTA depth predicts clicks. The FTC disclosure must precede the
first affiliate link, and the 2026-08-31 rendered audit found five pages violating
that. Inserting CTAs above existing ones on 8 pages at once is that failure waiting
to recur. Verified after the change: **45/45 pages, disclosure precedes the first
Amazon link.**

**What this is: a test, not a conclusion.** The hypothesis is that the cheap band
converts where chairs do not. It is now measurable, because the tags already exist.
The read is the next hand export that shows a non-zero row for
`tcaaccessory-20` or `tcadesk-20`. A null result is a real answer and should be
reported as one.

---

## 2. The AIO suppression thesis has never been observed

[[ctr-optimization]] attributes ~80% of the site's CTR loss to AI Overview
suppression, and the entire GEO capsule programme was built on that number in May
2026. Nothing has ever looked at a SERP to check it.

What exists is inference and says so: `gsc-analyze.ts` sets `aioSuspect` from the
SHAPE of a leak — good position, far fewer clicks than the position curve predicts.
That cannot distinguish an AI Overview from a product carousel, a PAA stack, a
video block, or a title that does not earn its impressions. Four problems, four
different fixes, one of which the site has spent months building for.

**What shipped.** `scripts/aio-track.ts` (`npm run aio:track`), wired into
`monday.yml` after `gsc:analyze`. Asks TCA's own money queries two questions: is
there an AI Overview, and is `tallchairadvisor.com` cited in it. DataForSEO returns
`ai_overview` with its `references` on the endpoint `competitor-intelligence.ts`
already calls. ~$0.04/run, guarded by `AIO_SPEND_LIMIT`.

**Design decisions worth keeping:**

- **Query set is drawn from GSC each run, not frozen.** Three sources with reserved
  shares: CTR leaks (50%), buyer-intent (20%), top clusters (30%).
- **The share allocation is the whole design, and the first dry run proved it.**
  Straight priority order filled all 20 slots with CTR leaks, because GSC currently
  reports 21 of them. That would have been worse than useless: CTR leaks are
  *selected for* the symptom under investigation, so a series drawn only from them
  finds a high AIO rate and proves nothing. Without unsuspected queries alongside
  them there is no baseline. Spare capacity backfills to the control group first
  and to leaks last.
- **A failed request is `null`, never `false`.** A wholly broken run must not read
  as "checked 20 queries, found no AI Overviews". Rates are computed over what was
  OBSERVED, and a run that saw nothing reports `null`, not 0.
- **The output is the delta, not the snapshot.** One desktop, US, unpersonalised
  observation per query per week. AI Overviews are volatile enough that a single
  run answers "was there an AIO at this moment", never "does this query have AIOs".
  [[statistical-confidence-policy]] applied before the fact rather than after — the
  strategy has already turned on a single Amazon export twice and turned back both
  times.

**Known limit, stated in the code:** desktop only, while 61% of impressions are
mobile and mobile AIOs occupy far more of the viewport. Read the rate as a lower
bound.

---

## 3. The spec registry was a private linter input; it is now a citable dataset

[[ctr-optimization]] priced link building honestly and declined it: "$100–400 per
link, need 10–20 = $1,000–8,000 minimum". This is the version of that spend that
costs nothing, because the asset already existed.

`data/chair-specs.json` was built as a build-time linter input after a fabricated
Leap Plus seat-height range shipped across 33 pages. Every figure traces to a
manufacturer specification PDF with its edition and the date a human opened it.
Nobody outside the repo could see it.

**What shipped.**

- `/chair-specs/` — browsable, rendered from the registry at build time so the page
  and the data can never disagree. `schema.org/Dataset` + `FAQPage` + breadcrumbs.
- `/chair-specs.json` — the payload. CC BY 4.0, permissive CORS, one fetch.
- Added to `public/llms.txt`, linked from `/correct-chair-dimensions/`, sitemap
  priority 0.6 (reference tier, not the 0.3 catch-all).

**The `guarded` key is the differentiator and is deliberately exported.** It names
figures that are true but misleading alone — the Leap Plus 22.5" seat height, which
requires an optional cylinder that also raises the floor to 17.5". That is the exact
error this site published, and it is the error every other source in the niche still
carries. Retailers publish specs without sources; review sites publish figures
without editions.

**Coverage is 4 chairs and the page says so plainly**, along with why: that is the
set whose every figure has been read from a primary source, not the set of chairs
the site covers. Padding it with retailer figures would reintroduce the exact
failure the registry exists to prevent.

**A linter caught this page trying to explain the banned range.** `lint-content.mjs`
fired three times on prose that was *debunking* the fabricated Leap Plus span. The
gate was not weakened — the page was reworded so the two endpoints never share a
line. A rule that could be talked out of firing by surrounding prose would not have
caught the original error either, which also sat beside text explaining it.

---

## 4. `escalated` was pointed at the instrumentation for three weeks

**The defect.** Three pages sat `escalated` in the ledger with 18, 18 and 22
attempts each:

| finding | page | mobile diff |
|---|---|---|
| `c401f8c099f6` | `/review/gesture/` | 7.256% |
| `add4a1951347` | `/best-big-and-tall-office-chairs/` | 3.595% |
| `e1cb4b21f390` | `/wide-seat-office-chairs-tall-people/` | 3.467% |

Every one is macOS-vs-Linux font rasterisation: baselines captured on a MacBook,
compared on an ubuntu runner.

**The system already knew.** `describePlatformMismatch` has worked correctly since
2026-08-13 and wrote the cause into `note` on every affected record.
`deriveFindings` filed them anyway, because it read `diffPct` and nothing else.
**Prose in a field no evaluator reads is not a verdict.**

This violates the ledger's own fourth rule, quoted from `predicates/types.ts`:
unevaluable "must never be counted as pass … and never as fail (that escalates on
the system's own blindness — the exact failure mode this PRD exists to kill)".
`escalated` is the loudest status the system has, and for three weeks the top of the
nightly report meant "the runner changed".

**What shipped.** A `comparable: boolean` field on `ProbeVisualViewport`, set false
when a platform mismatch is detected. `deriveFindings` skips filing; the predicate
returns `unevaluable`, so the attempt counter stops. The number is retained, not
suppressed — hiding it would conceal the size of the offset from anyone calibrating
the threshold. Read as `!== false` so the ~3 weeks of stored artifacts keep their
original meaning.

**Still requires one manual act.** The three findings stop accruing attempts but
stay `escalated` until a re-baseline on the runner that does the comparison:

```
gh workflow run nightly.yml -f rebaseline_visual=true
```

CI, never locally — a local re-baseline recreates the exact offset. After it, the
next nightly evaluates the predicates clean and they auto-close with evidence.
This was already an open action from 2026-08-31 (10 pages stale); the 8 pages
changed today add to it.

---

## Gates

Build clean (55 pages) · affiliate lint 157 links · content lint 55 pages ·
architecture lint 0 new violations · **29/29 test files** (2 new: `aio-track.test.ts`,
plus new cases in `visual.test.ts` and `predicates.test.ts`) · disclosure order
45/45 verified by rendered position.

## Ingested into

[[affiliate-performance]] · [[aio-citation-tracking]] · [[chair-specs-dataset]] ·
[[ctr-optimization]] · [[godseye-nightly]] · [[decisions-log]]

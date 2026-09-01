---
type: concept
last_updated: 2026-09-01 (built — first observation lands with the next Monday run)
sources: [raw/strategy/2026-09-01-portfolio-inversion-aio-tracker-dataset.md, scripts/aio-track.ts]
tags: [aio, geo, ctr, measurement, dataforseo, weekly]
---

# AI Overview Citation Tracking

**Read this before quoting the "80% of CTR loss is AIO suppression" figure from
[[ctr-optimization]].** That number is an inference from May 2026 and has never
been checked against a SERP. This page is the instrument that checks it.

`npm run aio:track` · `scripts/aio-track.ts` · runs weekly inside `monday.yml`

---

## The hole this fills

The GEO capsule programme — Direct Answer blocks, citation sentinels, the 49/49
`geo-capsule` rollout in [[ai-citation-readiness]] — was built on the claim that AI
Overviews eat ~80% of this site's clicks. Then nothing ever looked.

What the pipeline has today is inference, and it is honest about being inference:
`gsc-analyze.ts` sets `aioSuspect` on a CTR leak by its SHAPE — a good position
earning far fewer clicks than the position curve predicts. That is a reasonable
prior. It cannot tell an AI Overview from a product carousel, a People-Also-Ask
stack, a video block, or a title that simply does not earn its impressions. Four
different problems with four different fixes, and the site has spent months
building for one of them.

The distinguishing fact was cheap and nobody was buying it: DataForSEO returns the
`ai_overview` element with its `references` on the same SERP endpoint
`competitor-intelligence.ts` already calls.

## The two questions

1. Is there an AI Overview on this query at all?
2. When there is, is `tallchairadvisor.com` cited inside it?

## Query set

Drawn from `data/gsc/analysis.json` each run rather than frozen, so it tracks what
the site actually ranks for. Three sources with reserved shares:

| source | share | why |
|---|---|---|
| `ctr-leak` | 50% | the queries the suppression thesis is ABOUT |
| `buyer-intent` | 20% | an AIO on a commercial query costs more than one on an informational query |
| `top-cluster` | 30% | **the control group** — queries nobody suspects |

**The control group is the whole design, and the first dry run proved why.**
Straight priority order filled all 20 slots with CTR leaks, because GSC currently
reports 21 of them. That would have been worse than useless: CTR leaks are
*selected for* the symptom under investigation, so a series drawn only from them
finds a high AIO rate and confirms the thesis it was built to test. Without
unsuspected queries alongside them there is nothing to say the rate is high
against. Spare capacity backfills to clusters first and to leaks last.

## What it can and cannot prove

**One desktop, US, unpersonalised observation per query per week.** AI Overviews
appear and vanish on the same query within a day, vary by device and location, and
Google has rolled them back on whole query classes more than once.

- A single absent AIO is **not** evidence the suppression thesis was wrong.
- A single citation is **not** evidence the capsule on that page earned it.
- The unit of evidence is the **trend across runs** on the same query set. Every
  run archives itself to `raw/aio/<date>.json`, and `computeDeltas` reports only
  what MOVED against the previous archive.

This is [[statistical-confidence-policy]] applied before the fact instead of after
it. The strategy has already turned on a single Amazon export twice and had to turn
back both times — see [[affiliate-performance]].

**Known limit:** desktop only, while 61% of impressions are mobile and mobile AIOs
occupy far more of the viewport. Read the AIO rate as a lower bound on what mobile
readers see.

## The null rule

A failed request records `aioPresent: null`, never `false`. Rates are computed over
what was **observed**, so a run where 15 of 20 requests failed cannot report a 25%
AIO rate, and a wholly broken run reports `null` rather than 0.

This matters more than it sounds: `false` would read as "no AI Overview on this
query" and silently deflate the exact number the file exists to measure — in the
weeks the collector was broken, which is when a wrong number is least likely to be
questioned. The envelope's `healthy: false` names the failure count.

## Files

| path | what |
|---|---|
| `scripts/aio-track.ts` | the collector |
| `scripts/aio-track.test.ts` | 50 assertions, no network, no key |
| `scripts/schemas/aio-run.ts` | contract for both outputs |
| `data/aio/latest.json` | L1 collector envelope + `deltas` |
| `raw/aio/<date>.json` | the archive the trend is built from |

**The archive must be committed by CI or the instrument is inert.** `computeDeltas`
reads the previous run off disk; a series that never leaves the runner has no
previous run and reports "no changes" forever while appearing to work.
`monday.yml` stages `data/aio/` and `raw/`.

## Cost

~$0.002/query, 20 queries = ~$0.04/run, ~$0.16/month. `AIO_SPEND_LIMIT` (default
$1) aborts before spending if the query set ever grows unexpectedly. Actual cost
per response is metered to `data/cost-ledger.jsonl`.

## Status

**Built 2026-09-01. Zero observations so far.** The first run lands with the next
Monday pipeline. Nothing on this page should be cited as a finding until at least
two runs exist and agree.

## Next reads

- Two runs: is there an AIO rate difference between the `ctr-leak` set and the
  `top-cluster` control? That is the first real test of the suppression thesis.
- Four runs: is TCA's citation rate moving on the capsuled pages? That is the first
  evidence for or against the GEO programme in [[geo-optimize-plan]].

Related: [[ctr-optimization]] · [[ai-citation-readiness]] · [[gsc-analysis-strategy]] ·
[[statistical-confidence-policy]] · [[dataforseo-reference]]

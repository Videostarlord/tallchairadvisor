---
type: concept
last_updated: 2026-08-26
sources: [raw/affiliate/2026-08-26-amazon-associates-report.md, raw/audits/2026-08-06-open-issues-task-list.md, data/ledger-state.json, wiki/nightly/2026-08-08.md]
tags: [open-issues, status, tracking]
---

# Open Issues — Living Status

`raw/audits/2026-08-06-open-issues-task-list.md` is an **immutable snapshot** and its checkboxes freeze at 2026-08-06. This page is the current truth. Read this first; use the snapshot for the original reasoning and evidence.

## ⛔ CLOSED BY DELETION 2026-08-26 — P3 Amazon automated pull

**Opened as a blocker earlier the same day, closed by retiring the thing instead of fixing it.**

The item read: *"pull 17 days stale, `AMAZON_STORAGE_STATE` must be re-captured by Jackson."* Jackson
declined to re-auth, and the automation was **deleted**: `scripts/amazon-pull.ts`,
`scripts/lib/amazon-session.ts`, `scripts/lib/affiliate-store.ts`, `.github/workflows/amazon-weekly.yml`,
the nightly's affiliate step, and the `amazon:pull*` npm scripts.

**This is not a deferral and it is not a regression to triage.** The design was sound; the *shape* was
wrong. A session-replay scraper against a financial account expires on a ~11-day cycle and each expiry
demands a manual login only a human may perform — so P3 never removed the manual step, it replaced a
monthly CSV download with a fortnightly credential-capture chore that returned *less* data (daily
overview, no ASIN attribution). **Do not reopen this as "automate the affiliate pull."** If the 7-day
staleness nag becomes annoying, raise the threshold or change affiliate program.

Kept deliberately: `data/affiliate/latest.json` is frozen, not deleted — its 25 per-day rows are the
decoder that solves the window of hand-dropped CSVs. See `data/affiliate/README.md` and
[[affiliate-performance]].

## 🔴 WATCH — opened 2026-08-26

| Item | Status |
|---|---|
| **August is on track to FAIL the $100 revenue gate** | Recoverable Aug 1–25 earnings: **$12.15**, plus ~$47 unrealized on ~$1,575 of ordered-but-unshipped revenue. Gate stands at **1 of 2–3** consecutive months above $100. Not an action item — a forecast to be ready for on 2026-09-01. See [[affiliate-performance]]. |

## ✅ RESOLVED 2026-08-26 — "does a chair click ever convert on Amazon?"

The 2026-08-13 tracking-ID split answered its question in twelve days: **`tcachair-20`, 45 clicks, 0 orders, $0.00.** With the Aug 13 export's 89 chair clicks → 0, that is **134 named chair clicks → $0 across two periods**, now measured directly instead of inferred. Decision recorded in [[decisions-log]]: Amazon chair clicks are no longer counted as a revenue lever. The instrumentation item is closed; the monetization problem it exposed is not.

## Changed on 2026-08-08

| Item | Snapshot status | Now |
|---|---|---|
| **B10** GEO worklist never actioned | open, 44/49 pages with a gap | **Applied — but wider than sanctioned.** 49/49 pass the `geo-capsule` predicate. See the scope deviation below. |
| **B6** AIO suppression needs GEO treatment | 3 findings, "decide" | Capsules now live on all three, including `/knee-pain-seat-depth/`. **The "decide" was not decided — it was overtaken.** See deviation. |
| **B9** Four URLs not indexed | 3 remaining | `/office-chair-return-policy/` was a **true orphan at 0 inbound internal links** — now 3. The other two are ordinary crawl-priority cases needing manual GSC requests. `/lumbar-support-tall-people/` was created 2026-08-04, so "not indexed" is age, not defect. |
| **B11** Bad Leap Plus spec on 31 pages | open, B-CRITICAL | **Still open.** The 2026-08-08 GEO rollout briefly *added* 17 new unqualified `22.5"` claims; all 17 were corrected in `fe06db6`. Pre-existing instances untouched. |
| **A11** CI runs none of the test files | done | Confirmed: `tests.yml` green. Its one red run (2026-08-06) was the GitHub Actions outage — "job was not acquired by Runner", 0/0 steps. Not a code failure. |
| **A15** Watchdog never completed a scheduled run | unproven | **Proven — by false positive.** Fired 2026-08-07 (×2) and 2026-08-08 (×2). Cause was an uncommitted heartbeat, fixed. Alarm path works end to end; still untested on a genuinely dead night. |
| **A4** Architecture lint backlog | 163 | Unchanged at 163, 0 new violations. |
| **A9** Probe only runs against production | open | **DONE 2026-08-08.** `pr-probe.yml` probes the Cloudflare preview build of the PR's own commit and blocks on A9's three classes. Matches on commit SHA, not branch — a branch alias serves the previous build. Two Cloudflare settings it depends on are unverifiable from CI and documented in the workflow header. |
| — | not in snapshot | **NEW: Saturday deploy dead since 2026-07-25.** `git merge` conflict on `data/token-log.jsonl`. Fixed via `.gitattributes` union driver, bootstrapped onto `staging`. |
| — | not in snapshot | **NEW: closure predicate closed on noise.** `op:'<', value: beforeMetric` meant a 8.70 → 8.69 drift filed as a success. Now requires a 5% move. |

## ✅ RESOLVED 2026-08-13 — the prose kill list and the enforced kill list disagreed

**Corrected 2026-08-08.** This was first written up as "the GEO rollout violated the kill list." That framing is wrong, and the real finding is more useful.

`data/strategy-rules.json` — the deterministic gate adopted 2026-08-06 precisely so a strategy constraint would stop living in prose — contains **three** rules, covering `meta-length`, `meta-quality`, `title-length`, `title-quality`, `ctr-leak`, and `thin-content`. **None covers capsules.** And `aio-suppression` sits in `alwaysInScope`, the list no rule can override, meaning capsule findings are never withheld from the planner on any page.

So:

| Source | Says |
|---|---|
| Prose directive (decisions-log 2026-07-24; task list header; B10) | "no AIO capsules on informational queries" — B10: *"the exact thing 2026-07-24 forbade"* |
| Enforced code (`data/strategy-rules.json`) | `aio-suppression` is `alwaysInScope` — never filtered, on any page |

**The clause that would have blocked the rollout is the one clause never translated into code.** That is the same failure the 2026-08-06 codification was built to eliminate ("a constraint that governs what an agent may recommend cannot live behind a character budget, and cannot be enforced by asking"), still live in the one rule that did not make the trip.

The decision is therefore **not** "was a rule broken" but **which of the two is the real intent** — then make them agree. Either add an `aio-capsule` / `geo-capsule` rule scoped to informational pages, or strike the clause from the prose directive. Leaving them contradictory hands the same trap to the next agent, human or otherwise.

### The scope facts, for whichever way it goes

B10 scopes the GEO rollout to **money pages only**, and says of the informational pages: *"adding capsules there is the exact thing 2026-07-24 forbade."*

The 2026-08-08 rollout covered **45 pages: 23 inside that scope, 22 outside it.** Outside-scope pages now carrying a Direct Answer and/or capsule:

`/` · `/about/` · `/back-pain-spine-height/` · `/chair-headrest-tall-people/` · `/correct-chair-dimensions/` · `/fit-guides/` · `/how-to-adjust-chair/` · `/keyboard-tray-tall-people/` · `/knee-pain-seat-depth/` · `/leg-pain-circulation/` · `/lumbar-support-tall-people/` · `/monitor-arm-tall-people/` · `/office-chair-lower-back-pain-tall-people/` · `/office-chair-return-policy/` · `/pain-ergonomics/` · `/review/sihoo-doro-s300/` · `/seat-cushion-height-tall-people/` · `/shoulder-pain-tall-people/` · `/standing-desk-converter-tall-people/` · `/standing-desk-height-tall-people/` · `/why-standard-chairs-dont-fit/` · `/wide-seat-office-chairs-tall-people/`

**DECIDED 2026-08-13: keep the capsules, strike the prose clause.** Full reasoning in [[decisions-log]]. In short — a capsule is not a snippet rewrite, and the directive's own logic is what separates them: it forbids meta/CTR iteration on AIO-eaten pages because the click is taken before the SERP is read, and a capsule does not chase that click at all. It feeds the assistant surface (~16% of sessions), the one surface AI Overviews cannot erode. Reverting 22 deployed capsules would have cost more than it recovered.

`data/strategy-rules.json` now carries `alwaysInScope._aio_suppression_is_deliberate` so the next agent does not "fix" the missing rule by adding it back. Meta/title/CTR work on those pages remains forbidden and enforced — that half of the directive is untouched.

**"49/49 pages pass `geo-capsule`" now reads as a clean number.** The argument that was weighed:

- **Keep:** the kill list is a directive about *where to spend effort*, and that effort is already spent and deployed. Removing 22 capsules costs more effort than leaving them. AI assistants are ~16% of sessions and are the one surface AI Overviews cannot erode; a capsule on an informational page still feeds that surface.
- **Revert:** the directive exists because informational-query clicks are structurally suppressed, and leaving the capsules in place normalizes ignoring the kill list. It also inflates the apparent GEO coverage number, hiding how much of it was sanctioned.

~~Until decided, treat "49/49 pages pass `geo-capsule`" as 23/23 sanctioned + 22 unsanctioned.~~ **Decided 2026-08-13 — all 49 are sanctioned.**

## Changed on 2026-08-13 — the escalation queue, and what was actually wrong with it

Nine items had been escalated. Neither half was the thing it looked like.

### The 5 visual regressions were ONE bug, not five

Not a design change and not drift. **The 98 baselines were captured on a MacBook (commit `05703fa`, authored from `Jacksons-MacBook-Air.local`) and every comparison since has run on a GitHub Actions ubuntu runner.** macOS and Linux rasterise fonts differently, which adds a constant, text-proportional diff to every page.

The evidence is in the distribution, not in any one page:

| | mobile | desktop |
|---|---|---|
| pages with a non-zero diff | 49 / 49 | 49 / 49 |
| min | 1.309% | — |
| median | 1.554% | 0.660% |
| max | 3.678% | 1.901% |
| identical to 3 d.p. on 08-09, 08-10, 08-11, 08-12 | yes | yes |

Four nights of byte-identical numbers is a **constant offset**. The five escalated pages crossed the 2% line only because they are the most text-dense on mobile. **The other forty-four sit just under it having already spent most of their 2% budget on font rendering** — so a genuine regression on those pages would have had to be enormous to trip, and the dashboard would have stayed green. The mobile gate was effectively off site-wide.

**Re-baselining the five loudest pages — the obvious fix — would have removed the symptom and left the disabled gate exactly as it was.**

Fixed by recording provenance next to the images (`raw/visual/baseline/provenance.json`), attaching the cause to every diff when the platform disagrees, and adding `--rebaseline` as the only way to overwrite a baseline. **The re-baseline must run where the comparison runs**, so it is a `workflow_dispatch` input on `nightly.yml` (`rebaseline_visual`), not a local command. Running it on the laptop would recreate the fault.

**Still open until that dispatch is run.** One click clears all 5 escalations *and* the 44 hidden ones.

### The 4 position interventions all FAILED — none is a threshold artifact

| Page | Baseline (2026-07-20) | Position now | Verdict |
|---|---|---|---|
| `/review/leap-plus/` | 8.7 | 8.8 | worse |
| `/office-chairs-for-tall-people/` | 8.1 | 8.6 | worse |
| `/chairs/herman-miller-aeron/tall-people/` | 8.1 | 8.1 | did not move |
| `/correct-chair-dimensions/` | 9.6 | 9.6 | did not move |

**A `<=` tweak was considered and rejected.** It would have closed the two exact-baseline rows as *successes* — and those two are the pages that did not move at all. That is precisely the fabricated win `MEANINGFUL_POSITION_DELTA` was introduced to prevent ("a page wandering 8.70 → 8.69 filed as a SUCCESSFUL intervention and taught what-works.md a lesson that never happened"). 23 days, 7 attempts, zero movement is a **failed intervention**, and the ledger should keep saying so.

**What WAS broken: the closure-target fix never reached the filed records.** `positionClosureTarget()` changed on 2026-08-09, but the backfill skips an already-filed id, so five interventions still carry `op:'<', value: beforeMetric` — the exact shape the new formula replaced:

| Page | filed | current formula |
|---|---|---|
| `/review/leap-plus/` | < 8.7 | < 8.26 |
| `/chairs/herman-miller-aeron/tall-people/` | < 8.1 | < 7.69 |
| `/best-office-chairs-under-500/` | < 9.1 | < 8.64 |
| `/correct-chair-dimensions/` | < 9.6 | < 9.12 |
| `/office-chairs-for-tall-people/` | < 8.1 | < 7.69 |

Now **reported** by the backfill, deliberately **not** rewritten: moving a bar after the fact makes a record's own history unreadable. Note the new targets are *harder*, so this changes no verdict — the four still fail. It changes whether anyone can see which rule they are being judged by.

**These four need content work, not a code change.** That is what `escalated` means and the status is correct.

### Also found: `--backfill --dry-run` was writing to the ledger

Found by running it. Two findings were appended to the live `data/ledger.jsonl` by a command whose entire purpose is to append nothing. Reverted and fixed. A dry run that mutates is worse than no dry run, because it is the flag people reach for when they are unsure.

## Changed on 2026-08-09 — the autonomous data layer build

Branch `feat/autonomous-data-layer`. Full detail in [[autonomous-data-layer]].

| Item | Status | Now |
|---|---|---|
| **A1** Cooldown gate applies zero fixes | A-CRITICAL, open | **FIXED.** Root cause was not the threshold — cooldown counted *any* commit touching a page, so the pipeline's own bulk sweeps armed the lockout that blocked its next work. **49 of 54 pages were locked; now 0.** |
| **A10** Nothing checks affiliate links resolve | open | **BUILT.** `scripts/asin-check.ts`, monthly via Firecrawl. Found a false positive on its first live run — see below, it is the useful part. |
| — | not in snapshot | **NEW: P1 visual regression.** 98 baselines, and the first mobile (375×812) coverage the site has ever had. Advisory until the threshold is calibrated. |
| — | not in snapshot | **NEW: P2 sitemap submit** on Saturday's deploy, with read-back verification. |
| — | not in snapshot | **NEW: P3 Amazon Associates — LIVE 2026-08-09.** Session captured, secret set, verified in CI. Daily pull into `data/affiliate/`, weekly archive to `raw/affiliate/`. ASIN-level attribution still manual. |
| — | not in snapshot | **NEW: a cost-metering refactor** was recovered from the working tree, where it had sat uncommitted since 2026-08-09. Drives `lint:architecture` R5 from 15 → 0. |

### A1's real mechanism, because "the cooldown was too strict" is the wrong lesson

The 14-day window was never the problem. `git log --since=14d -- <file>` cannot distinguish "the strategist rewrote this page's argument" from "a sweep added one inbound link to 8 orphans". Because the pipeline's own fixes land as commits, **every sweep re-armed a lockout on everything it touched**, and the gate got tighter the more the system did.

Two classifiers had also drifted apart (`strategy.ts` exempted 11 keywords, `execute-fixes.ts` 8 different ones), and **neither covered the defects the system actually finds** — which is why the 2026-08-06 plan dropped its own spec correction while its prose said that fix bypassed cooldown on technical grounds.

Cooldown now governs **substantive revision** only. **Deterministic defects** — title/meta length, wrong specs, schema, canonical, redirects, dead affiliate tags, alt text, orphans — are exempt at any cadence. Content churn ("add a Fit Verdict callout") still waits, deliberately.

### A10's false positive is the finding, not the footnote

The first live run reported `B0CQ4K1KXT` (Hbada E3 Pro, on `/best-office-chairs-under-500/`) as DEAD on "Currently unavailable". That text belonged to the **"Newer Version Available" cross-sell block**; the product itself showed Add to Cart and In Stock. Acting on it would have stripped a working affiliate link off a money page.

Soft unavailability markers now only count when the page offers **no way to buy anything**. Findings stay advisory — a human confirms before any link is removed.

## Nothing is waiting on Jackson

**P3 activated 2026-08-09.** Session captured by hand, `AMAZON_STORAGE_STATE` set, verified end-to-end from CI. The affiliate export was the last irreducible manual load in the pipeline; it is now automated — daily into `data/affiliate/`, weekly archive into `raw/affiliate/`.

Two corrections came out of activating it, neither reachable without a live session: **there was no CSV endpoint** (the guessed URL returned the SPA's own JSON payload, which the CSV classifier read as an *empty report* — one step from recording a wrong endpoint as no earnings), and the reporting API **401s a plain cookie request**, needing per-page-load Bearer and CSRF tokens now harvested from the app's own request rather than constructed.

**Still manual, and stated rather than hidden:** ASIN-level attribution. The linked-product / category / top-sellers tables need query parameters that could not be established before HTTP 429 appeared, so probing was stopped rather than risk the account. The "0 chair orders on 92 named-chair clicks" pattern still needs a hand export.


**P2 needed nothing.** It was predicted to need `siteOwner`; a real submit succeeded under the existing `siteFullUser` with `lastSubmitted` advancing and zero errors. Recorded so it does not become a phantom blocker.

## Changed on 2026-08-09 (second session) — B11 closed

| Item | Status | Now |
|---|---|---|
| **B11** Leap Plus spec sweep | B-CRITICAL, open since 2026-08-06 | **CLOSED.** 146 statements across 29 files, verified against the rendered HTML. Cause fixed too: `data/chair-specs.json` + a `guarded` rule in `lint-content.mjs` fails the build on any unqualified `22.5"` claim. Detail in [[steelcase-leap-plus]] and [[log]]. |
| **B7** "under-linked" claim | open, flagged questionable | **Was a fabricated task, like B7's other half.** Measured directly: `/office-chairs-for-6-foot-4/` has **7 distinct inbound internal links** and 15 unique outbound, which is neither under-linked nor orphaned. Nothing in `scripts/` computes an "under-linked" metric — grep finds no such detector. The finding came from an LLM audit narrating a plausible-sounding deficiency, not from a measurement. **No action; the item is the lesson.** |

### The gate I wrote to close B11 passed real instances twice

Worth recording because it is A13's argument arriving in a new place, and this time the blind detector was one written *for* this task:

1. **Line-scoped context is blind to tables.** A bare `<td>22.5"</td>` names no dimension — its row label is structural, lines away. **26 real instances sat inside comparison tables on pages whose prose was already corrected.**
2. **Literal matching missed ranges containing inch marks.** `15.5"-22.5"` does not contain `15.5-22.5`, so the fabricated range survived exactly where it did the most damage.

**Both were caught by checking the rendered HTML rather than the source.** The source-level gate reported clean while the shipped pages still carried the error — a detector that reads only its inputs cannot see what its own transform emits. That is the strongest concrete argument yet for **A13**, and it now has a worked example rather than a rationale.

## Changed on 2026-08-09 (third session) — A5 closed, A8 made visible, A7 blocked

| Item | Status | Now |
|---|---|---|
| **A5** Probe retention | A-MEDIUM, open — module written, nothing called it | **CLOSED.** `scripts/retention-prune.ts` (`npm run retention:prune`) runs in `nightly.yml` immediately after `ledger:evaluate`, and in the `godseye` script at the same position. 30-night window; `data/ledger.jsonl` is sized but never pruned. |
| **A8** `.env` name drift | A-MEDIUM, open — "quotas.ts accepts both, which masks it" | **CLOSED as a masking problem.** The aliases still work; they are no longer silent. Canonical names documented in `.env.example`; `collect-all.ts` prints a drift banner before the collectors run. |
| **A7** GSC URL Inspection ~6 min | A-MEDIUM, open | **NO LONGER BLOCKED — now half-built.** `scripts/lib/gsc-rotation.ts` is written (cycle tracking; `new`/`changed`/`due` priority so a new URL is never starved) but **nothing calls it**. `collectors/gsc.ts:307` still takes the prefix slice, so the nightly still spends ~6 min. The session building it hit its limit before wiring. |

### A5's real risk was not deletion — it was a pruner that reclaims nothing

Wiring the module in exposed a defect that would have made it a no-op. `pruneProbeArtifacts()` derived its pin set from `readLedger()`, the raw append-only file, which holds every **transition** rather than one row per finding — 291 rows for 63 findings. A finding opened on 08-06 and closed on 08-09 leaves its open row in the file forever, so the raw history pins every probe date that ever backed a non-closed transition.

Measured against the real ledger: **4 of the 4 probe dates in existence were pinned**, cited by 50, 48, 48 and 5 non-closed rows respectively. It would have shipped, gone green every night, and freed zero bytes — *a component that looks healthy while doing nothing*, which is the exact failure its own header was written to warn about. Fixed by folding to current state first (`foldToCurrent()`, the same fold `ledger.currentState()` performs). A `--keep=2` dry run now plans to reclaim 949.5 KB where it previously planned zero.

Nothing is lost by folding: an older transition's evidence detail is already written inline on its own ledger line, so the probe file was never the only copy of what was observed.

**The safety property is asserted against the filesystem, not against the plan.** `scripts/lib/__tests__/retention.test.ts` writes real probe files to a temp root, runs a real non-dry-run prune, and checks that a file cited by a still-open finding survives while an unpinned file **of the same age** is deleted. A plan object that said "keep" while the unlink loop removed the file anyway would satisfy a plan-level assertion and still lose the evidence.

### A8: the documentation of the drift had itself drifted

Canonical is `SERP_API_KEY` and `DATAFORSEO_USERNAME`, decided by what CI actually sets rather than by preference — `nightly.yml`, `monday.yml` and `keywords-monthly.yml` all pass the repo spellings, and **no workflow sets a vendor spelling**. Making the vendor name canonical would mean renaming three GitHub secrets, and Actions substitutes an empty string for a name that does not exist, so a typo in that rename fails silently and the quota check goes blind. That is the 2026-08-06 failure, repeated.

`.env.example` had claimed `SERPAPI_KEY` was accepted "because nightly.yml passes that spelling" and that `DATAFORSEO_LOGIN` is "the name nightly.yml uses". **Both were false** — nightly.yml was corrected on 2026-08-06 and the comments never were. The documentation of the masking was itself stale, which is the most reliable way for a masked problem to stay masked.

### A7 is blocked on file ownership, and the task list names the wrong file

The nightly's URL Inspection loop is `scripts/collectors/gsc.ts:307` — 49 eligible URLs. It is **not** in `gsc-pull.ts`, and `index-monitor.ts` (which also inspects) runs Monday only, so it is not what costs the nightly its ~6 minutes. Rotating ~10/night means changing the `eligible.slice(0, limit)` selection in `collectors/gsc.ts`.

`GSC_INSPECT_LIMIT` is not a workaround: it slices a **prefix**, so the tail of the list is starved permanently rather than rotated — and that is worse than the slow run, because partial coverage is currently reported honestly as `healthy: false` with a named cause.

## Changed on 2026-08-09 (fourth session) — A2 and A13 closed

| Item | Status | Now |
|---|---|---|
| **A2** Nightly cannot see the agents' own execution logs | A-HIGH, open | **CLOSED.** `reports/fixes-log.md` and `reports/content-log.md` are nightly sources with a real contract (`scripts/schemas/execution-log.ts`). |
| **A13** No health check on the detectors themselves | A-HIGH, open | **CLOSED.** `scripts/lib/agent-health.ts` + `detectorHealth()` in `nightly-report.ts`. All three sub-items done, plus the surface-mismatch rule the B11 gate argued for. |

### A2: the contract is what makes them sources rather than text

Adding two `readFileSync` calls would have satisfied the letter of the task and nothing else. The obligations the other twelve sources carry apply here too, and markdown has no zod schema, so `execution-log.ts` is a **text contract** run in the same place `readValidated` is:

- **Shape** — the dated H1 both writers emit (`# Content Log — 2026-08-07`).
- **Freshness from the HEADER DATE, never mtime.** mtime lies after a CI clone, and this matters more here than anywhere: `execute-content.ts` exits *without writing* when it has no tasks, so a stale content log is the live evidence of the Friday-produced-nothing-for-5-days failure. An 8-day SLA — one weekly cadence plus a day.
- **Non-vacuity** — at least one `- [✅]` / `- [❌]` outcome line, or the explicit `No fixes needed this week.` A header with nothing under it is an agent that ran and told nobody anything, and it must not read as a quiet success.

The event that motivated A2 — the trust layer refusing fabricated ASIN `B000VNLYYS` on a page scoring 100/100 — is now a parsed `refused` entry, and the report has a mandatory **"What the agents did"** section that names applied, skipped, rolled-back and refused separately. What the pipeline *refused* is as much an observation as what it applied.

### A13: `unevaluable` is the third state the system was missing

`probes/types.ts` already enforced null-not-zero for a page and `collectors/types.ts` for a collector. Nothing enforced it for the **agents**. `scripts/lib/agent-health.ts` does, and `data/agent-health.jsonl` is its append-only log.

1. **stop_reason on every call.** Captured in `meteredCreate` — the one chokepoint lint rule R5 already guarantees every LLM call passes through. Four call sites checked `max_tokens` by hand; eleven did not, and the audit was one of the eleven. A per-call-site convention is exactly what one new call site forgets. `max_tokens`, `refusal`, an absent stop reason and an **unrecognised** one are all `unevaluable`.
2. **Input floor.** `assertPromptBudget()` now guards both ends; `CONTEXT_FLOORS` sets 5,000 tokens for `audit` and `strategy`. The 1.4% run was ~610 tokens of 43,670 and now throws. The floor is deliberately far below normal rather than near it — a floor that fires on a quiet week gets raised to shut it up and stops meaning anything, which is how a 4,000-token ceiling came to be tolerated for a month.
3. **The nightly refuses to report success while blind.** `detectorHealth()` assesses agents, collectors, quotas and sources in one place; the model is forbidden from calling a blind night clean; the count is restated mechanically in the footer below the narrative and in the **phone-push title** (`God's-Eye 2026-08-09 (92% coverage, 2 BLIND)`), because the lock screen is often the whole report.

**A collector returning `rowCount: 0` under `healthy: true` is now flagged.** The credential worked, the request succeeded, and it came back with nothing — an empty observation, not a healthy one, and in a summary table it was previously indistinguishable from a full one.

### The B11 lesson is now a rule, not a rationale

`judgeVerdict()` encodes what the source-only content gate proved on 2026-08-09: **a detector that reads only its inputs cannot see what its own transform emits.** A verdict declares which surface it *read* (`source` / `rendered` / `live`) and which it *claims to cover*. A **clean** verdict where those differ is `unevaluable`. A verdict that *found* violations is still believed — the bug was that "no violations" was wrong, not that its findings were, and suppressing real findings on a surface mismatch would trade one silent failure for another.

Its first caller found a live instance of the same class inside this file. `summarizeProbes()` could emit *"No failing assertions. Every probed page fired its tags"* over a results array in which every entry was skipped or unhealthy — a clean verdict over zero inspected units. It now says `NOTHING WAS PROBED` and the source's trust degrades to `unevaluable`.

**The nightly still exits 0 and still writes its heartbeat when detectors are blind.** That is the §7.6 contract, not an oversight: failing here would suppress the heartbeat and fire "TCA DEAD" on a night whose only fault was one empty collector — replacing a blind report with no report at all.

## Changed on 2026-08-09 (fifth session) — the cost-ledger commit seam, and agent-health retention

| Item | Status | Now |
|---|---|---|
| **Cost ledger lost on every weekday** | Found while closing A13 | **FIXED.** 7 workflows now stage `data/cost-ledger.jsonl`. |
| **A6** reconcile never run against an invoice | A-MEDIUM, open | **STILL OPEN — blocked on Jackson.** The reconcile path had a real defect and it is fixed; the run itself needs an invoice figure only he can supply. |
| **`data/agent-health.jsonl` retention** | Landed hours earlier, no policy | **DECIDED: watched, never pruned.** Sized and alarmed every night by `retention-prune.ts`. |

### The metering worked. The seam threw the result away.

`data/cost-ledger.jsonl` is written by `meteredCreate()` on every LLM call and by `meterExternal()` on every paid vendor call. It was committed by **only `nightly.yml`** (and `asin-monthly.yml`). Every other workflow metered its spend into an ephemeral runner and let the container delete it.

**Proved from the data, not from reading the YAML.** The 53-record ledger on 2026-08-09 contained exactly four agents:

| Agent | Records | Committed by |
|---|---|---|
| `nightly-report` | 14 (LLM) | `nightly.yml` ✅ |
| `collector-gsc` | 15 (external) | `nightly.yml` ✅ |
| `collector-clarity` | 13 (external) | `nightly.yml` ✅ |
| `asin-check` | 11 (external) | `asin-monthly.yml` ✅ |

Not one record from `audit`, `strategy`, `execute-fixes`, `execute-content`, `verify-deploy`, `index-monitor`, `competitor-intelligence`, `keyword-discovery` or `keyword-gap-discovery` — **every one of which calls `meteredCreate` or `meterExternal`.** The ledger contained precisely the agents whose workflow happened to commit the file, and nothing else. That correlation is the proof.

Fixed in `monday`, `tuesday`, `wednesday`, `thursday`, `friday` (both the success and the no-content-written paths), `saturday`, and `keywords-monthly` — using the existing `for f in …; do [ -e "$f" ] && git add "$f" || true; done` idiom and the rebase-retry push loop the repo already standardised on.

**The `merge=union` driver was already correct and did not need adding.** `.gitattributes` has carried `data/cost-ledger.jsonl merge=union` since the affiliate-history commit. It was, until now, **dead insurance** — the file only ever existed on `main`. Thursday and Friday push to `staging`, so this fix is what makes that driver load-bearing for the first time: Saturday's `Merge main into staging` would otherwise hit the same append-tail conflict that killed the deploy on 2026-07-25 and 2026-08-08.

### A6 — what is fixed, and what only Jackson can supply

**The reconcile could pass on nothing.** `npm run cost:reconcile -- 0 --month 2026-01` printed `OK — within 5%` and exited 0 for a month in which nothing had ever been metered. $0 against a $0 invoice is 0% drift, so the single case where the metered figure is least trustworthy was the one case that could not fail. The correct words already existed in the `detail` string — *"No metered records … Either no calls ran or call sites are not yet migrated"* — but the branch was reachable only when drift **also** exceeded threshold. Zero records is now its own refusal, independent of drift, and `cost-rollup.ts`'s own header rule ("never reports $0.00 spent as if that were a measurement") is now true of the reconcile path and not just the rollup path.

**The reconcile now names its coverage.** `agents: nightly-report — LLM only; external services are not on an Anthropic invoice`. A drift percentage is only as meaningful as the ledger behind it, and a reader seeing `$5.03, OK within 5%` could not previously tell a complete month from one carried entirely by the single workflow that commits the file.

**What Jackson must provide, and in what format:**

1. Go to **console.anthropic.com → Settings → Billing → Usage**, pick a **completed calendar month** (UTC), and read the **Anthropic API total in USD** for that month. Not the invoice grand total if it includes Claude.ai subscription seats or purchased credits — those are not API spend and are not in this ledger.
2. Run `npm run cost:reconcile -- <total> --month YYYY-MM`, e.g. `npm run cost:reconcile -- 12.47 --month 2026-08`.
3. Exit 0 = within 5%. Exit 1 = drift filed to `data/cost-drift.jsonl` with the contributing-agents list attached.

**The historical totals will remain an undercount and that data is not recoverable.** Every weekday LLM call made before 2026-08-09 was metered into a runner that no longer exists; there is no archive, no re-derivation, and the Anthropic Console does not break spend down by our agent names. **So the first honest reconciliation is of a month that begins after this fix — realistically 2026-09.** Reconciling 2026-08 will show large drift, and that drift is *explained*, not anomalous. Do not tune the threshold to make it pass.

One live caveat for an August reconcile: `claude-sonnet-5` introductory pricing (2.00/10.00 rather than 3.00/15.00) expires **2026-08-31** per `DATED_OVERRIDES` in `pricing.ts`. Costs were priced at call time, so the ledger is right; a hand-check of an August invoice must use the intro rate.

### `data/agent-health.jsonl` — watched, never pruned

A5's pruner covers `data/probes/` and deliberately only *sizes* `data/ledger.jsonl`. The obvious move was to point the pruner at A13's new log. **That is wrong**, and `retention.ts`'s own header is why: its argument that deleting probe files cannot destroy evidence rests on three facts, and **all three are false here.**

| Fact that makes probe pruning safe | True for `agent-health.jsonl`? |
|---|---|
| Nothing reads an old file — only the newest is loaded | **No.** `nightly-report.ts` reads the whole file; `checked += records.length` makes the full history a verdict denominator. Only the *alerting* pass is windowed. |
| Evidence is copied into `ledger.jsonl`; the file is only a label | **No.** Nothing copies an agent-health record anywhere. The line **is** the observation. |
| Regression detection folds the ledger, not the raw files | **No.** The pattern lives in the history: A13's founding incident was `audit.ts` at its `max_tokens` ceiling on **5 of 5** weekly runs across a month. "Tonight was truncated" is one record; "this agent has been truncating for a month" needs five weeks of them. |

A pruner sized to the nightly's alert window would delete exactly the records that make the chronic case provable — silently destroying evidence about detector blindness, which is the precise failure A13 exists to catch, committed by the cleanup code. So it gets the **ledger's** treatment: `inspectAgentHealthSize()` + `AGENT_HEALTH_ALARM_BYTES` (25 MB, same as the ledger because the two are in the same growth class — ~400 B/record at ~30 metered calls/week is ~600 KB/year, roughly forty years to the alarm). `retention-prune.ts` reports it every night and never touches it. The test asserts the safety property on the **filesystem**: a real non-dry-run prune leaves the file byte-for-byte intact.

## Still open, unchanged

- **A6** — the *defect* in the reconcile path is fixed and the *undercount* is fixed going forward; the **reconciliation itself has still never been run**, because it needs an invoice figure from Jackson. See the fifth-session section below for exactly what to supply.
- **Residual on the cost seam:** the weekday commit steps are gated on step success (GitHub's default). An agent that spends tokens and *then* fails still loses its ledger lines. Monday's step is `if: always()` and does not have this gap; `keywords-monthly` is explicitly `if: success()`. Worth an `if: failure()` ledger-only commit step, deliberately not added here because Thursday/Friday force-push `staging` and a failure-path push there needs its own argument.
- ~~**A7** — the module exists, unwired.~~ **WIRED 2026-08-13.** `collectors/gsc.ts` §4 reads state → `planRotation()` in place of the slice → `applyResults()` → writes state back; `gsc-rotation.test.ts` added. An unusable cursor (absent, malformed, or older than `STATE_MAX_AGE_HOURS`) produces a **full 49-URL sweep and `healthy: false` naming the file**, never a batch — a batch drawn from an empty cursor is the prefix slice with extra steps. `nightly.yml` now stages `data/gsc/inspection-rotation.json`, the one line the module's own header named as missing before it existed; without it every CI run reads an absent cursor and the rotation never once takes effect.
- ~~**B5** `/review/gesture/` — 8,415 impressions, 0.12% CTR at pos 8.0~~ — **title/meta rewritten 2026-08-09.** Ledger `018c617c0678`. Both now lead with the fact that this is the one chair Jackson owns and sits in. See [[review-gesture]]. Sanctioned only because the page sits *at* pos 8.0 — the kill list bars this treatment below it, and this remains the single CTR task in scope.
- **C** 14 findings held back by strategy
- **A4** architecture lint backlog, 163

## Ledger findings are not closed by hand

The 52 escalated items were **not** marked done. They close on their own evidence: the nightly re-probes the live site (`nightly.yml` runs `probe` before `ledger:evaluate`), and the `geo-capsule` predicate reads that fresh probe record. A manual close would be a close without evidence, which `MissingEvidenceError` exists to prevent.

Verified 2026-08-08: the real Playwright probe against the live site returns **0 failing assertions** on a sample of fixed pages. A local dry-run still showed failures only because the on-disk probe record was from 10:46Z, before deploy.

## Related

[[godseye-nightly]] · [[ai-citation-readiness]] · [[decisions-log]] · [[thesis]]

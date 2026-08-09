---
type: concept
last_updated: 2026-08-09
sources: [raw/audits/2026-08-06-open-issues-task-list.md, data/ledger-state.json, wiki/nightly/2026-08-08.md]
tags: [open-issues, status, tracking]
---

# Open Issues — Living Status

`raw/audits/2026-08-06-open-issues-task-list.md` is an **immutable snapshot** and its checkboxes freeze at 2026-08-06. This page is the current truth. Read this first; use the snapshot for the original reasoning and evidence.

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

## ⚠️ The prose kill list and the enforced kill list disagree — needs a decision

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

**Not reverted, deliberately — this is Jackson's call.** The argument each way:

- **Keep:** the kill list is a directive about *where to spend effort*, and that effort is already spent and deployed. Removing 22 capsules costs more effort than leaving them. AI assistants are ~16% of sessions and are the one surface AI Overviews cannot erode; a capsule on an informational page still feeds that surface.
- **Revert:** the directive exists because informational-query clicks are structurally suppressed, and leaving the capsules in place normalizes ignoring the kill list. It also inflates the apparent GEO coverage number, hiding how much of it was sanctioned.

Until decided, treat "49/49 pages pass `geo-capsule`" as **23/23 sanctioned + 22 unsanctioned**, not as a clean win.

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
| **A7** GSC URL Inspection ~6 min | A-MEDIUM, open | **BLOCKED, not deferred** — it lives in a file another agent owns this session. See below; the audit also names the wrong file. |

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

## Still open, unchanged

- **A6** cost reconcile
- **A7** — blocked on `scripts/collectors/gsc.ts` ownership, see above. Nothing else stands in the way.
- ~~**B5** `/review/gesture/` — 8,415 impressions, 0.12% CTR at pos 8.0~~ — **title/meta rewritten 2026-08-09.** Ledger `018c617c0678`. Both now lead with the fact that this is the one chair Jackson owns and sits in. See [[review-gesture]]. Sanctioned only because the page sits *at* pos 8.0 — the kill list bars this treatment below it, and this remains the single CTR task in scope.
- **C** 14 findings held back by strategy
- **A4** architecture lint backlog, 163

## Ledger findings are not closed by hand

The 52 escalated items were **not** marked done. They close on their own evidence: the nightly re-probes the live site (`nightly.yml` runs `probe` before `ledger:evaluate`), and the `geo-capsule` predicate reads that fresh probe record. A manual close would be a close without evidence, which `MissingEvidenceError` exists to prevent.

Verified 2026-08-08: the real Playwright probe against the live site returns **0 failing assertions** on a sample of fixed pages. A local dry-run still showed failures only because the on-disk probe record was from 10:46Z, before deploy.

## Related

[[godseye-nightly]] · [[ai-citation-readiness]] · [[decisions-log]] · [[thesis]]

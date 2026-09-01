# God's-Eye Nightly

**Type:** concept · **Status:** operational · **Created:** 2026-08-06 · **Updated:** 2026-09-01
**Spec:** `raw/strategy/2026-08-05-godseye-PRD.md` · **Branch:** `feat/godseye-nightly`

The observation layer over the Mon–Sat pipeline. It does not replace that pipeline — it watches it, proves what it claims, and alarms when it goes quiet.

## 2026-09-01 — `escalated` was pointed at the instrumentation for three weeks

**A fourth entry for the table below, and this one the system detected and then
ignored.**

Three findings sat `escalated` with 18, 18 and 22 attempts each:

| finding | page | mobile diff |
|---|---|---|
| `c401f8c099f6` | `/review/gesture/` | 7.256% |
| `add4a1951347` | `/best-big-and-tall-office-chairs/` | 3.595% |
| `e1cb4b21f390` | `/wide-seat-office-chairs-tall-people/` | 3.467% |

Every one is macOS-vs-Linux font rasterisation — baselines captured on a MacBook,
compared on an ubuntu runner.

**The system already knew.** `describePlatformMismatch` has worked correctly since
2026-08-13 and wrote the cause into `note` on every affected record.
`deriveFindings` filed them anyway, because it read `diffPct` and nothing else.
**Prose in a field no evaluator reads is not a verdict — a verdict has to travel as
a field to survive the trip.**

This violated the ledger's own fourth rule, quoted from `predicates/types.ts`:
unevaluable "must never be counted as pass … and never as fail (that escalates on
the system's own blindness — the exact failure mode this PRD exists to kill)".
`escalated` is the loudest status this system has, and for three weeks the top of
the nightly report meant *the runner changed*.

**Fixed:** `comparable: boolean` on `ProbeVisualViewport`, false when a platform
mismatch is detected. `deriveFindings` skips filing; the predicate returns
`unevaluable`, so the attempt counter stops. The diff number is retained rather
than suppressed — hiding it would conceal the size of the offset from anyone
calibrating the threshold. Read as `comparable !== false`, so three weeks of stored
artifacts keep their original meaning when `pr-gate.ts` re-derives from them.

**⚠ STILL NEEDS ONE MANUAL ACT.** The three stop accruing attempts but stay
`escalated` until a re-baseline on the runner that does the comparison:

```
gh workflow run nightly.yml -f rebaseline_visual=true
```

**CI, never locally** — a local re-baseline recreates the exact offset. The next
nightly then evaluates the predicates clean and they auto-close with evidence.
This was already open from 2026-08-31 (10 pages stale); the 8 pages changed
2026-09-01 add to it.

**New seam rule, alongside the 2026-08-30 one about schedules and filenames:**
*a detector that can tell it is blind must SAY SO IN THE FIELD THE VERDICT IS READ
FROM. A correct diagnosis written somewhere nothing reads is the same as no
diagnosis.*

---

## Why it exists

TCA's failures were silent by construction. Three examples, all real:

| Failure | How long it hid | Why nothing caught it |
|---|---|---|
| `reconcileInterventions` reconciled nothing | months | `raw.pages ?? []` on a key that does not exist → empty Map → byte-identical rewrite → green checkmark |
| June 16 GA4 CSP incident | ~1 month | the `gtag.js` script tag still loaded 200; only the *hit* was blocked, and nothing asserted on the hit |
| Cost visibility | since 2026-05-15 | 8 token-log entries for 15 `messages.create` sites; no pricing logic anywhere |

The unifying shape: **a component returned a degraded-but-plausible value instead of failing loudly.** Every rule below exists to make that impossible.

## The invariant

> No component may return a degraded-but-plausible value. Every failure is loud, named, and lands in the ledger.

Concretely, and each of these is enforced rather than documented:

- A missing key **throws**, naming the file, the key, and the expectation — it never defaults to `[]`.
- A collector that returns nothing writes `healthy: false` **with a specific reason** — never an empty section.
- A finding cannot be filed without a **machine-evaluable closure predicate**. If an agent cannot say how a fix would be verified, it does not get to claim the problem exists.
- A value the system could not measure is `null` or `unevaluable` — **never `0`, never `NaN`, never `false`**.
- The report renders anything without a contract or predicate behind it as `unverified`, and states its own coverage percentage.

## Layers

| Layer | Lives in | Does |
|---|---|---|
| L0 contracts | `scripts/lib/read-validated.ts`, `scripts/schemas/` | every read validates; throws `ContractViolation` with a "did you mean" hint |
| L1 collectors | `scripts/collectors/` | GSC (incl. URL Inspection), GA4, Clarity, Cloudflare, GitHub Actions, quotas, **Amazon affiliate revenue (daily since 2026-08-09)** |
| L2 probes | `scripts/probes/` | Playwright: tags actually firing, `<head>` truth, CWV, GEO markup, **visual regression at desktop + mobile (P1, 2026-08-09)** |
| L3 ledger | `scripts/lib/ledger.ts`, `scripts/lib/predicates/` | append-only state per finding + nightly predicate re-evaluation |
| L4 cost | `scripts/lib/metered-client.ts`, `pricing.ts` | every LLM call priced at write time |
| L5 report | `scripts/nightly-report.ts` | one Sonnet call over the whole ledger → `wiki/nightly/` + phone |
| L6 dead-man | `scripts/deadmans-switch.ts` | alarms on **absence** — must run from a second repo |
| L7 corrector | `scripts/corrector.ts` | bounded, deterministic auto-fixes only; no LLM |

## The three rules that carry the most weight

1. **A finding needs a closure predicate to exist.** This is what turns "the audit said something" into "the system can prove whether it is still true". It is why findings auto-close with evidence and why `regressed` is detectable at all.

2. **`regressed` is the highest-value output.** A finding that passed its predicate and later fails is the case nothing previously caught. Because `findingId = sha1(page|issueClass)` is stable, a re-raised finding collides with the closed one by construction rather than appearing as new work.

3. **Blindness is not failure.** `unevaluable` never counts as pass or fail and never increments the escalation counter. Escalating because the system could not look would poison the ledger with its own gaps.

## Operating it

```bash
npm run collect:all      # L1 — writes data/collectors/
npm run probe            # L2 — writes data/probes/YYYY-MM-DD.json
npm run probe -- --visual   # L2 + P1 screenshots vs raw/visual/baseline/ (what the nightly runs)
npm run ledger:evaluate  # L3 — re-runs every open predicate, writes data/ledger-state.json
npm run cost:rollup      # L4 — writes data/cost-summary.json
npm run nightly          # L5 — writes wiki/nightly/YYYY-MM-DD.md + heartbeat
npm run godseye          # collect + evaluate + report
npm run lint:architecture   # ratchet; --strict once migration completes
npm run correct -- --dry-run
```

CI: `.github/workflows/nightly.yml` at 10:00 UTC (03:00 PT). Almost every step is `continue-on-error` and the report is `if: always()` — **an unhealthy collector is a successful run of the observation system.** A nightly that aborted on the first bad collector would recreate the silent-failure class it exists to kill.

## Status — operational as of 2026-08-06

All three launch blockers are cleared:

| Was blocking | Now |
|---|---|
| `CLOUDFLARE_API_TOKEN` | ✅ set; **7/7 collectors healthy, 100% coverage**. Only `Account → Cloudflare Pages:Read` was genuinely missing — beware the two decoys named "Custom Pages" and "Access: Custom Pages". |
| `NTFY_TOPIC` | ✅ set; both the nightly push and the dead-man's alarm verified delivering |
| Second-repo watchdog | ✅ [`Videostarlord/tca-godseye-watchdog`](https://github.com/Videostarlord/tca-godseye-watchdog) (private), verified firing from CI |

`CLOUDFLARE_ACCOUNT_ID` must be set explicitly in both `.env` and repo secrets — the token carries zone scopes but **cannot list accounts**, so auto-discovery fails.

## Open items

- **Cache hit rate is 9.2% over 7 days** (20,161 requests, 1,862 cached), though today alone is 46.2%. Low for a static Astro site; not yet investigated.
- **Architecture lint baseline is 172.** New violations fail today; the backlog ratchets down as call sites migrate to `readValidated`. `--strict` is the end-state gate.
- **Probe files are ~470KB/night** (~14MB/month), 52% of it retained JSON-LD used as closure evidence. No retention policy set — a decision for Jackson.
- **Three defects the first runs surfaced, all unfixed:** the Friday — New Content workflow failed 2026-07-31 and committed nothing; `/review/sihoo-doro-s300/` and `/shoulder-pain-tall-people/` each 404 their own hero image; 4 URLs are not indexed by Google.

## Bugs that only appeared once it ran

Each of these was invisible until the component was actually used, which is the argument for turning things on rather than declaring them done:

- **The dead-man's alarm could never have been delivered.** HTTP headers are Latin-1 only; the title contained a U+2014 em dash, so `fetch()` threw before sending. The switch detected death correctly and then failed to announce it — silently, and only ever on nights something had already gone wrong.
- **`nightly.yml` never wrote `credentials/gsc-service-account.json`.** It passed the JSON as an env var, but both pull scripts read it from that file. GSC and GA4 would have failed in CI while working perfectly on the machine where the file happens to exist.
- **Two CI secret names were wrong** (`SERPAPI_KEY`, `DATAFORSEO_LOGIN`). GitHub substitutes an empty string for a nonexistent secret, so nothing errors — the quota check just goes blind.
- **The heartbeat never left the runner — 4 false "TCA DEAD" alarms.** `nightly-report.ts` writes `data/nightly-heartbeat.json` last on success, and the dead-man's switch reads it *from `main` via the GitHub API*. But `nightly.yml`'s commit loop never listed the file, so every scheduled run wrote a fresh heartbeat into the runner and threw it away. The copy on `main` stayed frozen at `2026-08-06T09:07:29Z` — a hand-commit from a dev fix, not a run. At 29h it went stale and the switch fired on 2026-08-07 (16:04Z, 17:05Z) and 2026-08-08 (15:38Z, 16:50Z), every one of them on a night the nightly had succeeded. Fixed 2026-08-08 by adding the path to the commit loop.

  Worth keeping in view: **both halves were behaving exactly as specified.** The nightly ran (8m5s, 100% coverage, pushed to ntfy at 10:47Z); the watchdog correctly reported a stale heartbeat. The defect lived in the seam between them — the one place neither component's tests look. The alarm body was accurate and said so (`✗ heartbeat: … 54.5h ago` beside `✓ report: … present`); only the title, which is all a lock screen shows, read as total death.

- **The watchdog cried wolf every morning for 17 days — and this time nothing was wrong at all.** On 2026-08-13 the nightly moved from 03:00 to 17:00 local (`cron: '0 0 * * *'` = 00:00 UTC = 17:00 PDT the *previous* day). `nightly-report.ts` names its file with the local date at the moment it runs, so the evening run of day D writes `D.md` — while `checkReportFile()`, at 08:00 on D+1, went on looking for `(D+1).md`. That file cannot exist yet and never will. Every morning from 2026-08-13 to 2026-08-30 the switch pushed `TCA DEAD` with a **healthy heartbeat printed directly underneath the alarm**.

  This is the heartbeat bug's mirror image and a fourth seam defect: the 2026-08-08 case was a real staleness the alarm reported correctly; this one was a fabricated absence the alarm reported just as confidently. Both components were individually correct — the report was written, the watcher looked where it was told — and **the schedule change updated the producer's timing without updating the watcher's assumption about that timing, in a different repository**. Neither side's tests could see it. The cost is worse than a missed night: a daily false alarm trains the one person who can act on it to ignore the channel, which is the failure mode the whole build exists to prevent. Fixed 2026-08-30 by accepting today *or* yesterday.

- **The cost fix told Jackson his reporter was broken, every night, for making it.** The narrative went weekly on 2026-08-28 (83% of August spend, ~$0.55/night restating the same list). The saving was real; the rendering was not. `--no-narrative` nights were handed to `fallbackReport()` — the renderer for when the **model call breaks** — so six nights in seven the report opened with *"The part that writes this report in plain English is what broke"*, listed *"**The report writer failed.**"* as the #1 thing needing attention, and closed with a `Raw error` block quoting the deliberate skip message. Nothing had failed.

  Reusing the failure renderer was a deliberate, reasoned choice at the time ("a format that only runs on failure days is a format nobody has read"). The reasoning was sound and the conclusion was still wrong, because the format carried a *claim* as well as a layout. **An intentional saving must never be reported in the vocabulary of a failure** — same class as a blind check reading green: the words and the world disagree, and the words are what gets believed. Compounding it, the deterministic path never printed the findings at all, so the headline said "10 things need you" and the body never said which ten. Fixed 2026-08-30.

## Fix History

| Date | Issue | Fix |
|---|---|---|
| 2026-08-08 | Watchdog fired 4 false "TCA DEAD" alarms across 2 nights; heartbeat on `main` frozen at 2026-08-06 | Added `data/nightly-heartbeat.json` to the `Commit nightly artifacts` loop in `.github/workflows/nightly.yml` |
| 2026-08-08 | Closure predicate for position interventions closed on noise — `op:'<', value: beforeMetric` meant a 8.70 → 8.69 drift filed as a success, and a page on its exact baseline could never close | `ledger-evaluate.ts` now files `positionClosureTarget(beforeMetric)`, requiring a 5% move (the floor `assignConfidence` already uses). Existing records unchanged. 10 assertions added to `ledger.test.ts` |
| 2026-08-08 | 48 GEO findings across 44 pages — missing Direct Answer blocks and capsule sentinels | Rolled out to all 44; 49/49 pages now satisfy the `geo-capsule` predicate with 0 answer-first ordering warnings, verified against built HTML |
| 2026-08-30 | Watchdog fired a false "TCA DEAD" **every morning since 2026-08-13** — it looked for `wiki/nightly/<today>.md` while the 17:00 nightly always writes `<yesterday>.md` | `checkReportFile()` in `deadmans-switch.ts` now accepts today **or** yesterday. Detection window unchanged at one missed cycle. Alarm body rewritten in plain English; title no longer prints a date it cannot mean |
| 2026-08-30 | `--no-narrative` nights rendered via `fallbackReport()`, so 6 nights in 7 the report announced **"The report writer failed"** and filed itself as the #1 item needing attention | New `skippedNarrativeReport()` in `nightly-report.ts`. Says the essay is weekly, and **lists** the escalated/regressed findings instead of only counting them. 10 assertions in `nightly-short-report.test.ts` |

## The seam problem

Two of this system's worst defects lived in the *seam between* components rather than inside one:

- The **heartbeat** — nightly wrote it, watchdog read it, neither was buggy, and it never crossed between them because `nightly.yml` didn't commit it.
- The **Saturday deploy** — Friday appends `data/token-log.jsonl` on `staging`, the weekday agents append it on `main`, and `saturday.yml`'s bare `git merge` conflicted on the overlap. Dead in 12 seconds since 2026-07-25, before any step that produces output.

- The **affiliate pull ordering** (2026-08-09) — `collectors/amazon.ts` reads `data/affiliate/latest.json`, but the pull was placed in the L2 probe block, which runs *after* `collect:all`. Both components were correct in isolation; the collector simply always read the previous night's file. The first live run showed the sharp version: the collector logged *"latest.json does not exist yet — the automated pull has not run successfully"* while the pull wrote that exact file minutes later **in the same job**. Fixed by moving the pull ahead of the collectors.

- The **predicate registry vs the ledger schema** (2026-08-09) — `visual-diff` was added to `scripts/lib/predicates/` (what may be FILED) but not to `scripts/schemas/ledger.ts` (what may be LOADED). The probe filed 10 real visual-regression findings and the next validated read of `data/ledger.jsonl` threw on every one. **The ledger became unreadable at the exact moment a new detector started working.** The `collector-healthy` comment one member earlier in that same file had already predicted it in writing — "the ledger would throw precisely when something had gone wrong, which is the worst possible time for the observation system to go blind." The nightly's own steps stayed green; `read-validated.test.ts`'s "every real data file satisfies its own contract right now" caught it, which is precisely why that assertion runs against real on-disk data rather than fixtures.

None of these is reachable by unit tests of either side. Three generalizable rules, all now recorded in the workflow itself:

1. **Any file a downstream component reads from `main` must be in `nightly.yml`'s commit loop.**
2. **Any file two branches append to needs a merge strategy in `.gitattributes`.**
3. **Any step that WRITES a file must run before the step that READS it** — obvious stated plainly, invisible when the writer is grouped with the probes because that is where its browser happened to be installed.
4. **Changing a schedule changes a filename, and something downstream is matching on that filename.** (2026-08-30) Moving the nightly from 03:00 to 17:00 silently changed which local date its report is named for, and the watchdog's date arithmetic — in a second repository, by design — went on assuming the old one for 17 days. Before changing any cron, grep for what reads the artifacts that cron produces, **including outside this repo**.

**A fifth, from the ledger-schema break: where a rule genuinely must live in two places, make disagreement fail the build.** The predicate kinds cannot be collapsed into one list — `schemas/` must stay free of the predicate layer's imports — so a test now asserts the two are identical and names which side is missing a kind. Same remedy as the frozen `BLOCKING_CLASSES` set and the `PREDICATE_KINDS` count, and the same disease as the A1 cooldown classifier that lived in two files with two different keyword lists: **any rule enforced in two places will eventually be two different rules.**

**A fourth, learned the same day and cutting across all of them: never let a file's mtime decide anything.** A CI checkout stamps every file it writes with "now", so mtime-derived freshness reads as current on every run — including the runs where the producing step failed and wrote nothing. This has now been caught in three separate components: the Amazon collector matching its own output, `readValidated()` preferring embedded timestamps, and `data/affiliate/latest.json`, where the fix is an explicit `fetchedAt` field inside the file.

**Both halves of that rule were applied again on 2026-08-09**, before they could bite:

- `raw/visual/baseline/` was added to the commit loop. Without it, every night would rediscover that a new page has no baseline, write one into the container, throw it away, and never once compare — a detector that runs forever and observes nothing. Exactly the heartbeat failure, in a new component.
- `data/edit-log.jsonl` was added to the commit loop *and* given a `merge=union` driver in `.gitattributes`, because the weekday agents append it on `main` while Friday's content agent appends it on `staging` — the token-log conflict that killed the Saturday deploy, in a new file.

## Revenue entered the nightly's field of view (2026-08-09)

~~The nightly saw traffic, behaviour, infrastructure and rendering every night — and affiliate revenue once a week, despite that being the number the kill-list gate decides on. `scripts/amazon-pull.ts --mode daily` now runs as a nightly step.~~

**REVERTED 2026-08-26 — the nightly's affiliate step is deleted along with the pull it called.** The session-replay automation was retired (see [[affiliate-performance]]); the nightly no longer acquires revenue data at all. Chromium is still installed in that slot, now for the render probe alone.

**The gap this reopens, stated plainly:** revenue is once again outside the nightly's field of view. The nightly sees GSC, GA4, Clarity and the probe every night, and affiliate earnings only when Jackson drops a CSV. `collectors/amazon.ts` reports that gap as export staleness at 7 days — it measures the *absence* of data, which is the honest thing to measure, but it is not the same as seeing the number.

**Both seam rules were applied again, pre-emptively:** `data/affiliate` is in the nightly commit loop (or the snapshot would live and die inside the runner, exactly like the heartbeat), and `history.jsonl` has a `merge=union` driver (the nightly appends it on `main` while `amazon-weekly` appends on `staging` — the token-log overlap that killed the Saturday deploy).

**And the mtime trap was avoided by design.** `latest.json` has no date in its name, so `collectors/amazon.ts` would have dated it by mtime — which a CI checkout resets to "now" — reporting the data fresh on every run forever, including runs where the pull failed. `fetchedAt` is written inside the file and the collector reads it from there. This is the third distinct component in which that failure mode has been caught; it is not an accident, it is what CI checkout does to every file.

## What P1 added to L2 (2026-08-09)

`npm run probe -- --visual` captures each page at **desktop 1366×900 and mobile 375×812** and diffs against `raw/visual/baseline/`. Mobile had **zero** coverage before this.

It obeys the same rules as the rest of the layer:

- **Capture runs last** in `probeUrl`, after every vital is read — resizing the viewport provokes layout shifts, and doing it earlier would make CLS measure the probe's own resize.
- **`diffPct: null` never files a finding.** No baseline, a failed screenshot and changed dimensions are all "no comparison happened", not "no difference" — and a freshly written baseline is `unevaluable`, since it would be comparing against itself.
- **Synthetic runs may not write baselines** (`allowBaselineWrite: !synthetic`). A preview build writing baselines would redefine "correct" as whatever an unmerged branch renders.
- **Advisory, not blocking.** `visual-regression` is deliberately absent from `BLOCKING_CLASSES` until the 2% threshold is calibrated on a week of real diffs.

## Related

[[gsc-performance]] · [[schema-markup]] · [[decisions-log]] · [[thesis]]

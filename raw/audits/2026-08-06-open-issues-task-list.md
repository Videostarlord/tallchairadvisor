# TCA Open Issues — Task List

**Generated:** 2026-08-06 (v2 — regenerated after the strategy classifier shipped)
**Amended:** 2026-08-06 — added **A9, A10, B10** from a review of what the Playwright probe harness is capable of but not currently asked to do, then **A11–A13** from asking whether finishing this list would actually make the system robust. It would not: this document records what the current detectors found, and A12/A13 are about what no detector watches. Not audit-derived; added by hand. **A11 is already done.**
**Sources:** `data/audit-findings.json` (14 in-scope + 14 held back), `data/ledger.jsonl`, `data/probes/2026-08-06.json`, GSC URL Inspection, full-week CI stress test

> **v1 of this file was contaminated and has been replaced.** It was built from audit
> findings produced while the auditor was receiving 1.4% of the strategy synthesis, so it
> recommended meta rewrites on AIO-suppressed pages the kill list has forbidden since
> 2026-07-24 — and called `/knee-pain-seat-depth/` "your largest traffic lever", which is
> the exact page the directive names as a trap. Jackson caught it. Root cause and fix:
> `wiki/synthesis/decisions-log.md`, 2026-08-06.

**Current strategy** (`wiki/synthesis/thesis.md` + decisions-log 2026-08-04): monetization mechanics are fixed and performing above category norms. The constraint has moved back to **traffic**, but the kill list still stands — *no meta/CTR iteration below pos 8, no AIO capsules on informational queries, no snippet work on AI-Overview-eaten pages.*

Every item carries its stable `findingId`. 14 further findings are recorded in `outOfStrategy[]` and listed at the end — real, not deleted, just not what the strategy is paying for right now.

---

# A. SYSTEM & WORKFLOW

## A-CRITICAL

### A1. Cooldown gate applies zero fixes
The stress test ran a full week: **29 findings → 6 planned → 5 dropped at plan time → 1 dropped at execution → zero applied.** The critical spec contradiction sat behind a 14-day timer because the page was touched 2 days earlier. The strategy agent argued for bypassing on technical grounds; deterministic enforcement overrode it.

- [ ] Let correctness classes (`spec-error`, `schema-invalid`, `canonical-*`) bypass the cooldown — they are not thrash, they are corrections
- [ ] Keep the cooldown for optimization classes
- [ ] Verify a factual fix lands within one cycle of being found

**Everything else is downstream of this.** The pipeline currently finds problems competently and ships none.

---

## A-HIGH

### A2. Nightly cannot see the agents' own execution logs
The week's most important event — the trust layer rejecting fabricated ASIN `B006H1QYBA` on a page that scored 100/100 — appears nowhere in the report. `reports/content-log.md` and `fixes-log.md` are not nightly sources.

- [ ] Add them as sources in `scripts/nightly-report.ts` with contracts

### A3. Clarity quota — structurally guaranteed to fail
10 requests/day/project; Monday spends 2, the nightly then 429s. Causes a recurring `regressed` ledger entry.

- [ ] Reuse the on-disk snapshot when <24h old instead of re-pulling
- [ ] Or request a higher quota

### A4. Architecture lint backlog — 163 known violations
76 `?? []`, 6 `?? {}`, 10 empty catch, 62 raw `JSON.parse`, 15 direct `messages.create`. New violations already fail the build; the backlog does not. Each `?? []` on parsed input is a latent copy of the reconciler bug.

- [ ] Migrate `JSON.parse` sites to `readValidated`, prioritizing the ones reading pipeline state
- [ ] Migrate the 15 `messages.create` sites to `meteredCreate` so cost accounting is complete
- [ ] Re-baseline as it drops; `--strict` is the end state

---

### A9. The probe only runs against production — it reports damage, it does not prevent it
`npm run probe` runs at 03:00 against the live site. So a change that kills a tag, a canonical, or a hero image ships, sits live for up to 24 hours, and *then* gets reported. The June 16 CSP incident is the reference case: a header change that no source-level review could have caught, and that a probe run against a preview URL would have caught in seconds.

Cloudflare Pages issues a preview URL per branch. The probe already accepts `--base`, so nothing new has to be built.

- [ ] Add a PR check running `npm run probe -- --base <preview-url> --limit 10 --no-ledger` over the money pages
- [ ] Fail the check only on tag-not-firing, canonical-not-self, and console errors — not on GEO or meta-length findings, which are strategy calls and not deploy blockers
- [ ] Keep the nightly full-inventory run as-is; this supplements it, it does not replace it

**Relationship to A1:** A1 is about fixes not being able to land. This is about regressions being able to land unchallenged. Opposite directions, same pipeline.

### A10. Nothing checks whether the affiliate links still resolve
Three separate layers touch affiliate links and none of them answer "is this link still alive today":

- `lint:content` validates ASINs against an allowlist — **static, build-time, source-level**
- The probe injects a *synthetic* Amazon link (`B0PROBE000`) to test the click handler — deliberately never touches the real ones, so the probe cannot corrupt affiliate data
- `verify-deploy.ts` checks presence, not liveness

So if Amazon delists an ASIN or a product goes permanently unavailable, the page keeps rendering the link, keeps sending clicks, and earns nothing — silently, indefinitely. `affiliate-missing` is already `alwaysInScope`; a *dead* affiliate link is the same loss as a missing one, and currently has no detector at all.

Amazon hard-blocks datacenter IPs, so this cannot run from CI under Playwright. Firecrawl is the right tool and the cost is negligible — ~15–20 ASINs monthly is <4% of the 500-page free tier, tracked by `collectors/quotas.ts`.

- [ ] Extract the live ASIN set from `src/pages/` (the `lint:content` allowlist is the source of truth)
- [ ] Monthly Firecrawl check: does `amazon.com/dp/<ASIN>` still resolve to a live, buyable product
- [ ] Emit a `affiliate-link-dead` finding into the ledger on failure, with the ASIN and the pages carrying it
- [ ] Meter it through `meterExternal` so it shows up in `cost:rollup` like every other external call

### A11. ~~CI runs none of the 11 test files~~ — DONE 2026-08-06
`scripts/**/*.test.ts` covered the ledger, the predicate evaluators, `read-validated`'s contract enforcement, and the probe's tag/vitals classification — the layers everything else trusts. There was no `test` script and no workflow invoked them. The code deciding whether a finding closes was unverified on every commit.

- [x] `scripts/run-tests.mjs` + `npm test`. Spawns each file and aggregates; `node --test` alone would have collected the 4 `node:test` probe files and **silently ignored the 7 standalone ones**, which is this codebase's signature failure mode
- [x] `.github/workflows/tests.yml` — push to main/staging, and every PR. Runs `npm test`, `lint:architecture`, `lint:content`. **No `continue-on-error` anywhere**, unlike the nightly: here a red run unambiguously means the code is wrong
- [x] 11/11 files pass in ~5.5s

**It immediately found two dead tests** (both in `read-validated.test.ts`, both invisible while nothing ran them):
1. The headline PRD §9 step-2 assertion — *"reconcileInterventions produces a NON-IDENTICAL rewrite"* — **was failing**, reporting the original reconciler bug as still present. It wasn't. The test replays against a copy of the real `data/interventions.jsonl`, the reconciler skips entries with `reconciledAt !== null` (`read-validated.ts:385`), and the nightly has since reconciled all 8 real entries. A one-shot acceptance assertion went order-dependent the moment production data moved past it.
2. Worse, *"a contract-violating snapshot leaves entries unreconciled"* was passing **vacuously** for the same reason — `before === after` held because there was nothing to reconcile, not because a failed contract was refused.

Fixed by rewinding the reconciliation fields in the fixture (`unreconciled()`), so the tests are hermetic regardless of what the nightly has done to `data/`. 17 passed / 1 failed → **18 passed / 0 failed**, and the second test now actually asserts something.

**Known coupling, deliberate:** `read-validated.test.ts` validates real `data/` files including freshness. SLAs are 8 days (`maxAgeHours: 8 * 24`), so this only trips if collection has been dead over a week. That is worth a red check — do not loosen the SLA to make it quiet.

### A12. Nothing has ever run on cron — unattended operation is unproven
`gh run list` shows **only `workflow_dispatch` runs** for both `nightly.yml` and the watchdog. Every green check to date was a human pressing a button. The entire premise of the build — that opening Claude Code to check on TCA should be unnecessary — has never once been demonstrated without a human present.

Unexercised: the cron expression itself, the PDT→PST drift the workflow comments acknowledge, the watchdog's 08:00 deadline logic against a real scheduled nightly, and whether the nightly's commit-and-push step behaves when it is not attached to a dispatch.

- [ ] Let one scheduled 10:00 UTC nightly run with no human, then read the report cold the next morning
- [ ] Confirm the watchdog's 15:10 UTC run sees that nightly and stays quiet
- [ ] Separately confirm the alarm path works by skipping one night on purpose — a dead-man's switch that has never fired is a hypothesis, not a switch

**Everything else in section A is theoretical until this passes.** Blockers are all cleared (secrets set, `Videostarlord/tca-godseye-watchdog` live); this needs a calendar day, not work.

### A13. No health check on the detectors themselves
Every incident in this system's history is a **measurement** failing quietly, not a page failing loudly: CSP killed GA4 behind healthy dashboards for a month; Friday's workflow committed nothing for 5 days; the auditor ran at `max_tokens: 4000` on 1.4% of the strategy synthesis for a month. **Jackson caught the last one, not the system.**

A1–A12 fix instances. The class has no detector. The nightly faithfully reports what it saw and holds no opinion about whether its own eyes degraded — and A11's two dead tests are the same shape at a smaller scale.

The `null`-not-zero discipline `probes/types.ts` already enforces, applied one level up to the agents:

- [ ] The nightly must refuse to report success when a prompt hit its token ceiling, a collector returned empty, or a quota was exhausted — those are `unevaluable`, not zero
- [ ] Assert per-agent input size against a floor: an auditor receiving 1.4% of synthesis should fail loudly, not proceed confidently on a fragment
- [ ] Record every agent's `stop_reason` and alarm on `max_tokens` — the single signal that would have caught the month-long truncation on day one

**A3 is the live example:** Clarity's 10/day quota is structurally guaranteed to fail, and a blind collector currently looks identical to a healthy one in a summary table.

---

## A-MEDIUM

- [ ] **A5.** Probe artifacts ~470KB/night (~14MB/month), no retention policy. Same question for the append-only `data/ledger.jsonl`.
- [ ] **A6.** `npm run cost:reconcile` never run against a real Anthropic invoice. Metered to date: $3.62 across 29 calls.
- [ ] **A7.** GSC URL Inspection adds ~6 min to the nightly (49 URLs × ~6s). Consider rotating 10/night.
- [ ] **A8.** `.env` name drift: `SERP_API_KEY`/`DATAFORSEO_USERNAME` vs vendor docs. `quotas.ts` accepts both, which masks it.

---

## A-RESOLVED TODAY (verify they stay fixed)

| Was | Now |
|---|---|
| Audit truncated findings every week for a month (`max_tokens: 4000`, 5/5 runs at ceiling) | Fixed → 28 findings |
| Auditor received 1.4% of synthesis, and the surviving slice argued FOR the abandoned strategy | Fixed → full context, 43,670 tokens |
| 8 context truncations across audit/strategy/wiki-utils | Removed; `assertPromptBudget()` throws instead |
| Kill-list violations reaching the planner | 3 → **0** via `strategy-filter.ts` |
| `audit-findings.json` never committed → Wednesday fell back to `slice(0, 3000)` | Fixed |
| `interventions.jsonl` never committed → reconciler had nothing to reconcile | Fixed |
| Workflows discarded entire runs on concurrent push | Fixed in 6 workflows |
| `reconcileInterventions` read a key that does not exist | Fixed → 8/8 entries enrich |
| Friday failing 3 weeks | Fixed → first success since 07-17 |
| Dead-man's alarm could never be delivered (em dash in HTTP header) | Fixed |

---

# B. WEBSITE — IN SCOPE

## B-CRITICAL

### B1. `/chairs/steelcase-leap-plus/seat-height/` — contradictory specs
**`32766b2a9f2c`** · Title says **15.5″–22.5″**; meta says **15.5″–20.5″**. One is wrong, on a spec page, about the exact number the page exists to answer.

- [ ] Get the real range from Steelcase source data
- [ ] Fix whichever is wrong
- [ ] **Blocked by A1** — currently waiting behind the cooldown

### B2. `/review/leap-plus/` — same contradiction, second page
**`9f9636eb65e2`** · Title/meta say 15.5″–22.5″ while the body states a 22.5″ ceiling and the sibling page disagrees. Same root fact, propagated.

- [ ] Fix together with B1 so both pages agree

---

## B-HIGH

### B3. Invalid schema blocking rich results on money pages
Five `schema-invalid` findings, all mechanically verifiable:

- [ ] **`dc65989fd486`** `/review/leap-plus/` — Product schema missing `@id`; `itemReviewed` missing from Review
- [ ] **`bd852d016763`** `/review/aeron-size-c/` — same, on the second-highest-CTR review
- [ ] **`7d502e933b53`** `/correct-chair-dimensions/` — **HowTo schema is dead code.** Google removed HowTo rich results in September 2023
- [ ] **`14beecb44bd0`** `/office-chairs-for-tall-people/` — Article missing `@id`, unresolved site-wide since May 10
- [ ] **`7a0984559a84`** `/chairs/herman-miller-aeron/` — Article uses `name` instead of `headline`

### B4. `/chairs/herman-miller-aeron/tall-people/` — no affiliate link
**`c48591dd56bd`** · pos 8.2, 1,163 impressions, **1.03% CTR** — one of your better-converting sub-pages, earning nothing.

- [ ] Add affiliate CTA with a **registered** ASIN from `data/verified-asins.json`

### B5. `/review/gesture/` — 8,415 impressions, 0.12% CTR at pos 8.0
**`018c617c0678`** · Your only first-person-tested page, and the strongest E-E-A-T asset on the site. In scope because it is at position 8.0, not below it.

- [ ] Rewrite title/meta to lead with the tested-at-6'4" angle

---

## B-MEDIUM

### B6. AIO suppression — needs GEO treatment, not snippet rewrites
Three findings confirming clicks are structurally suppressed. **Do not respond with meta rewrites** — that is what the kill list forbids.

- [ ] **`5c8d0d5e9574`** `/knee-pain-seat-depth/` — 40,752 impressions, 17 clicks (0.04%). Decide: citation capsule, or accept and stop spending on it
- [ ] **`ea09e7be3cda`** `/correct-chair-dimensions/` — Cornell query at pos 4.8, AIO-flagged
- [ ] **`f8b2943c8de7`** `/chairs/steelcase-gesture/seat-depth/` — spec query, 0% CTR at pos 8.8

**Context worth weighing:** AI assistants are already **16% of your sessions** (ChatGPT 44, Perplexity 6, Claude 3 — ~72% of Google organic volume) and that is the one surface AI Overviews cannot erode. The kill list bars capsules on *informational* queries; it does not bar them on money pages.

### B7. Other in-scope
- [ ] **`f88a6837b1c9`** `/office-chairs-for-6-foot-4/` — pos 5.8, 757 impressions, high buyer intent, under-linked into the funnel
- [ ] **`5663893947e9`** `/review/gesture/` — meta 158 chars (3 over)

### B8. Two pages 404 their own hero images
Ledger `9764cf8c99c4`, `b5cbab622428` — found by Playwright, invisible to every prior audit.

- [ ] `/review/sihoo-doro-s300/`
- [ ] `/shoulder-pain-tall-people/`

### B9. Four URLs not indexed (GSC URL Inspection, 45/49 PASS)
- [ ] `/chairs/herman-miller-aeron/size-guide/` — Discovered, not indexed
- [ ] `/lumbar-support-tall-people/` — Discovered, not indexed
- [ ] `/office-chair-return-policy/` — Crawled, not indexed
- [ ] `/standing-desk-height-tall-people/` — **unknown to Google.** Never discovered — check sitemap and internal links

### B10. The GEO worklist already exists in the probe output and nobody reads it
`data/probes/2026-08-06.json` measures `geo.directAnswerPresent` and `geo.citationCapsulePresent` on all 49 pages, every night. It has never been turned into a queue. Current state: **44 of 49 pages have at least one GEO gap.**

**This is scoped to money pages only.** The kill list bars capsules on *informational* queries — B6 already states it does not bar them on money pages, and `aio-suppression` is `alwaysInScope`. The 20 informational pages with gaps are **deliberately excluded below**; adding capsules there is the exact thing 2026-07-24 forbade.

Of the 24 buyer-intent pages with a gap, **21 have no direct answer** and **21 have no citation capsule** (overlapping but not identical sets):

- [ ] **Comparisons (4)** — highest intent, all four missing both: `/aeron-vs-gesture/`, `/gesture-vs-leap-plus/`, `/aeron-vs-leap-plus/`, `/aeron-size-c-vs-leap-plus/`
- [ ] **Height landers (5)** — all missing both: `/office-chairs-for-6-foot-3/` through `-7/`. `/office-chairs-for-6-foot-4/` is already flagged in B7 at pos 5.8 with 757 impressions
- [ ] **Chair hubs + spec pages (10)** — `/chairs/steelcase-gesture/`, `/chairs/steelcase-leap-plus/`, `/chairs/herman-miller-aeron/`, and their `seat-height` / `seat-depth` / `weight-limit` / `tall-people` children
- [ ] **Category pages (5)** — `/office-chairs-for-tall-people/`, `/heavy-duty-ergonomic-chairs-tall-people/`, `/refurbished-steelcase-leap-tall-people/`, `/best-big-and-tall-office-chairs/` (capsule only), `/chairs/herman-miller-aeron/size-guide/` (capsule only)
- [ ] Make the probe emit this as a finding class rather than leaving it inert in JSON — otherwise it silently rots the same way

**Three money pages have a capsule but no direct answer** — `/chairs/herman-miller-aeron/tall-people/`, `/chairs/steelcase-gesture/seat-depth/`, `/office-chairs-for-tall-people/`. Cheapest wins on the list. Note the second is the same page B6 flags at 0% CTR / pos 8.8, which suggests the capsule alone was not sufficient there.

**Why this is worth doing under the current strategy:** B6 already establishes AI assistants at 16% of sessions and structurally immune to AI Overview erosion. This is the concrete page list for acting on that, and it is measured rather than assumed.

---

# C. HELD BACK BY STRATEGY (recorded, not deleted)

14 findings in `data/audit-findings.json` → `outOfStrategy[]`. Each carries the rule and directive that classified it. **To act on any: edit `data/strategy-rules.json`** — they return on the next audit.

| Rule | Count | Directive |
|---|---|---|
| `no-ctr-iteration-below-position-8` | 11 | *no meta/CTR iteration below pos 8* |
| `no-snippet-work-on-aio-eaten-informational` | 2 | *stop farming AI-Overview-eaten informational queries; meta-tweaking suppressed pages* |
| `no-thin-content-expansion-during-content-freeze` | 1 | *freeze new content ~30 days* |

Mostly meta/title length on pages ranking worse than position 8 — where rank, not the snippet, is the binding constraint.

**Also permanently in scope regardless of strategy** (`alwaysInScope`): `spec-error`, `affiliate-missing`, `schema-*`, `canonical-*`, `duplicate-content`, `cannibalization`, `internal-linking`, `aio-suppression`. A factual error is wrong whatever the growth plan; a missing affiliate link is money already on the table.

---

# SUGGESTED ORDER

0. **A12** — let one nightly run on cron, unattended. Costs a calendar day and no work, and everything below is theoretical until it passes.
1. **A1** — unblock the pipeline. Nothing ships until fixes can land.
2. **B1 + B2** — the spec contradiction. It is wrong on the live site right now, on two pages.
3. **B3** — schema fixes. Deterministic, mechanically verifiable, directly affects rich results on money pages.
4. **B4 + A10** — the earning page with no affiliate link, and the detector for links that die later. Same failure mode, one found by audit and one currently found by nobody.
5. **B8 / B9** — broken images and unindexed URLs. Small and concrete.
6. **A9** — the pre-deploy probe gate. Cheap, and it stops this list from regrowing behind you.
7. **A2 / A3** — close the observability gaps.
8. **B5 / B6 / B10** — Gesture CTR, the AIO strategic decision, and the money-page GEO queue that decision governs. B6 is the call; B10 is the page list it applies to.
9. **A13** — detector health. The deepest item and the least urgent-feeling, which is exactly why it keeps losing. Every prior incident was a measurement failing quietly.
10. **A4** — lint backlog, continuously, as files are touched.

**On "is it robust once this list is empty?"** — no. An empty list means *no known breaks*, which is a weaker claim than robustness and is exactly what was true the day before the auditor was discovered to have been truncating for a month. A12 and A13 are the two items that change the answer; the rest change the score.

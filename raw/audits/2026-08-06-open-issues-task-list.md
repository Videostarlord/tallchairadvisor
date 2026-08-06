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

### A3. ~~Clarity quota — structurally guaranteed to fail~~ — DONE 2026-08-06
10 requests/day/project; Monday spends 2, the nightly then 429s. Causes a recurring `regressed` ledger entry.

The nightly was spending a request purely to re-prove a credential that had just been used successfully. A snapshot pulled in the last 24h *is* the liveness evidence — it could not exist unless the token worked.

- [x] `collectors/clarity.ts` now reads liveness off the artifact when `latest.json` is <24h old, and skips the ping entirely
- [x] `checkedAt` reports the snapshot's `pulledAt`, **not** `now()` — claiming we verified the credential at this instant would be the same species of lie as `gtagFired: false` meaning "we didn't look"
- [x] 28/28 collector tests pass
- [ ] Requesting a higher quota is still worth doing; this removes the recurring false alarm, not the ceiling

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

### A14. The audit and the probe disagree about the same pages, and nothing reconciles them — FIXED 2026-08-06
Found while working B7. `scripts/agents/audit.ts:50` read meta descriptions with a raw regex over the HTML and **never decoded HTML entities**. Astro escapes `"` to `&#34;`, so every quote counted as 5 characters instead of 1.

This site's meta descriptions are full of `6'4"` measurements, so the inflation is systemic. `/review/gesture/` measured **158 chars** and was filed as "3 over the limit". The text Google actually sees is **146** — comfortably in range. B7 was a fabricated task.

The Playwright probe never had this bug: `descEl.getAttribute('content')` returns the decoded value (`probes/probe-page.ts:204`), and its record for that page says 146, in range. **Both detectors ran on the same night, disagreed about the same page, and the wrong one generated the work item.** Nothing in the system noticed.

- [x] `decodeEntities()` added and applied to `title`, `desc`, `ogTitle`, `ogDesc` in `audit.ts`. `&amp;` is decoded last so `&amp;#34;` cannot collapse into a quote
- [ ] **The general problem is unfixed.** Two detectors measuring the same property with different methods, no cross-check. The probe should be the single source of truth for anything it already measures — `head`, tag firing, vitals — and the audit should consume that record rather than re-fetching and re-parsing pages itself
- [ ] Audit the other `.length` comparisons in `audit.ts` for the same class of error (titles are measured the same way)

**This is A13 in miniature, and it is the strongest argument for it:** the failure was silent, it manufactured work, and it was caught by a human reading a number, not by the system.

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

### B1 + B2. ~~Leap Plus contradictory seat-height specs~~ — ROOT FACT ESTABLISHED AND BOTH PAGES FIXED 2026-08-06
**`32766b2a9f2c`** (`/chairs/steelcase-leap-plus/seat-height/`) · **`9f9636eb65e2`** (`/review/leap-plus/`)

**Neither published number was correct.** From the Steelcase Seating Specification Guide, verified in two editions (Oct 2020 + 2017), each agreeing in three places internally — https://www.steelcase.com/content/uploads/2020/10/Seating-Leap-Seat.pdf:

| Configuration | Range |
|---|---|
| **Leap Plus, standard cylinder (default)** | **15.5″–19.5″** (4″ range) |
| Leap Plus, optional 5″ cylinder (~$63) | 17.5″–22.5″ — note the floor RISES |
| Standard Leap / v2 | 15.5″–20.5″ (5″ range) |
| Gesture | 21″ (higher w/ optional cylinder) |
| Aeron Size C | 16″–20.5″, hard limit |

- **`15.5″–22.5″` exists in no configuration.** It welds the standard cylinder's minimum to the optional cylinder's maximum.
- **`15.5″–20.5″` is the standard Leap v2 spec** — cross-contaminated from the other model. The giveaway was in the meta description itself, which carried the v2's "(5″ adjustment)" parenthetical verbatim.
- **The site's core claim was inverted.** Both pages sold the Leap Plus as having "the highest maximum seat height of any mainstream ergonomic chair." At its default 19.5″ ceiling it is **lower than both** the Gesture and the Aeron C.
- The Leap → Leap Plus comparison was backwards: the Plus is *lower* than the standard Leap by default. It trades seat-height range for width, back height, and capacity.

- [x] Both pages rewritten around "standard 15.5″–19.5″; 22.5″ requires the optional 5″ cylinder, specified at order time"
- [x] Thesis preserved honestly — still the right chair above 6'4″, but the buyer must order the cylinder
- [x] FAQPage JSON-LD and visible FAQ verified in sync on `/review/leap-plus/`
- [x] Refurb caveat added: refurbished units ship with whatever cylinder the original buyer ordered, and a tall buyer cannot specify it
- [x] Comparison table column changed from "Within Leap Plus range?" to "Cylinder required" — the honest answer to the old question is "depends what you ordered"
- [x] `astro.config.mjs` `pageLastmod` bumped; wiki chair page, site-page, index, log, and decisions-log all corrected
- [x] Not blocked by A1 after all — A1 blocks the *pipeline* from applying fixes; a human editing directly was never gated

### B11. The bad Leap Plus spec is on 31 more pages — 250+ statements — NEW, B-CRITICAL
Discovered while fixing B1/B2. The contradiction was never limited to two pages; those were just the two where the auditor happened to catch title and meta disagreeing with each other. **The false `22.5″` figure is repeated across 31 further files**, and on the height landing pages it is stated as an unqualified default.

This is the highest-stakes item on the list. `/office-chairs-for-6-foot-5/` through `-7/` are exactly where a 6'5″–6'7″ buyer lands, and they currently promise a ceiling the default chair cannot reach. A reader who follows that advice buys a chair that does not fit. It is also, per the research, why AI assistants confidently repeat the wrong figure — **they are citing this site as the authority.**

- [ ] **chairs/steelcase-leap-plus/tall-people.astro** — 15 statements
- [ ] **office-chairs-for-6-foot-6.astro** — 13 · **office-chairs-for-6-foot-5.astro** — 12 · **office-chairs-for-6-foot-7.astro** — 11 · **office-chairs-for-6-foot-4.astro** — 10 · **office-chairs-for-6-foot-3.astro** — 5 ← *do these first, highest buyer risk*
- [ ] **aeron-size-c-vs-leap-plus.astro** — 11 · **chairs/steelcase-leap-plus/index.astro** — 10 · **best-big-and-tall-office-chairs.astro** — 10
- [ ] **heavy-duty-ergonomic-chairs-tall-people.astro** — 8 · **gesture-vs-leap-plus.astro** — 8
- [ ] **seat-cushion-height-tall-people.astro** — 6 · **review/gesture.astro** — 6 · **office-chairs-for-tall-people.astro** — 6
- [ ] **wide-seat-office-chairs-tall-people.astro** — 5 · **refurbished-steelcase-leap-tall-people.astro** — 5 · **correct-chair-dimensions.astro** — 5
- [ ] **index.astro** — 4 · **chairs/steelcase-gesture/index.astro** — 4 · **chairs/herman-miller-aeron/size-guide.astro** — 4 · **aeron-vs-gesture.astro** — 4
- [ ] **chair-headrest-tall-people.astro** — 3 · **best-office-chairs-under-500.astro** — 3
- [ ] Long tail, 1–2 each: **office-chair-lower-back-pain-tall-people**, **chairs/steelcase-leap-plus/weight-limit**, **aeron-vs-leap-plus**, **why-standard-chairs-dont-fit**, **review/sihoo-doro-s300**, **leg-pain-circulation**, **how-to-adjust-chair**, **chairs/steelcase-gesture/weight-limit**

**Not a find-and-replace.** Some instances are comparison claims whose direction flips (the Gesture is 1.5″ *taller* than a default Leap Plus, not 1.5″ shorter), some are height-fit recommendations that change which chair is recommended, and some legitimately describe the optional configuration and are already correct in context. Two further errors surfaced in the same sweep: the standard Leap's maximum is quoted as 20″ in places where the spec guide says 20.5″, and a "1.5″ more seat height ceiling than the Gesture" claim is true only with the option.

**Also worth fixing the cause, not just the instances:** there is no canonical spec source in `data/`. The wiki chair page was the only internal source of truth and it was wrong and uncited, so every page that quoted it inherited the error. A `data/chair-specs.json` with cited sources, linted like `verified-asins.json`, would make this class of error impossible to propagate — the same argument that file's `_WHY` block already makes about hallucinated ASINs.

---

## B-HIGH

### B3. ~~Invalid schema blocking rich results on money pages~~ — 4 of 5 DONE 2026-08-06, 1 declined
Five `schema-invalid` findings, all mechanically verifiable. Existing site convention followed: site-rooted product entities (`/#product/<slug>`), matching `/review/gesture/`.

- [x] **`dc65989fd486`** `/review/leap-plus/` — added `@id` `/#product/steelcase-leap-plus` + `itemReviewed` referencing it
- [x] **`bd852d016763`** `/review/aeron-size-c/` — added `@id` `/#product/herman-miller-aeron-size-c` + `itemReviewed`
- [ ] **`7d502e933b53`** `/correct-chair-dimensions/` — **DECLINED, reasoning recorded in the file.** Google did drop HowTo rich results in Sept 2023, so it earns no widget — but the schema is valid, costs ~1.5KB, and this is one of B6's three AIO-suppressed pages where AI citation is the only remaining play. LLM crawlers parse JSON-LD. Deleting machine-readable procedural content from precisely that page optimises for a widget that no longer exists at the cost of a channel that still does. **Overrule if you disagree — it is a one-line deletion.**
- [x] **`14beecb44bd0`** `/office-chairs-for-tall-people/` — Article `@id` added
- [x] **`7a0984559a84`** `/chairs/herman-miller-aeron/` — the page carried BOTH `name` and `headline`. Removed the redundant `name`, added Article `@id`, and gave the author node the `#person` `@id` every other page uses

### B4. ~~`/chairs/herman-miller-aeron/tall-people/` — no affiliate link~~ — FINDING WAS STALE. Real gap fixed 2026-08-06
**`c48591dd56bd`** · pos 8.2, 1,163 impressions, **1.03% CTR**.

**The page already had two affiliate links** — `B01N32UFNT` (Aeron) and `B00TYE4QXU` (Leap Plus), both carrying `tag=tallchairadvi-20`, both registered in `verified-asins.json`, both added back in commit `014828f`. The finding as written was false.

The real gap was **placement**: the only CTA sat at line 317 of a 326-line page, after the verdict — roughly 120 lines below the point where a 6'0"–6'2" reader has just been told the chair is a strong fit for them. Highest-intent moment on the page, and nothing to click.

- [x] Mid-page Aeron CTA added directly after the "6'0"–6'2": Strong fit" section
- [x] Leap Plus CTA deliberately left at the bottom — that section is not recommending it

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
- [ ] **`f88a6837b1c9`** `/office-chairs-for-6-foot-4/` — pos 5.8, 757 impressions, high buyer intent, "under-linked into the funnel". **Questionable:** it already has 7 internal inbound links. Re-verify what "under-linked" was measuring before acting.
- [x] ~~**`5663893947e9`** `/review/gesture/` — meta 158 chars (3 over)~~ — **FALSE POSITIVE. Detector bug, fixed 2026-08-06.** See A14.

### B8. ~~Two pages 404 their own hero images~~ — DONE 2026-08-06
Ledger `9764cf8c99c4`, `b5cbab622428` — found by Playwright, invisible to every prior audit.

Root cause on both: the page shipped with a `<!-- NOTE: Image file must be sourced ... before deploying -->` placeholder that was never actioned. Each served a 404 hero, a 404 `og:image`, and a 404 schema `image` since 2026-03-17 — and `/shoulder-pain-tall-people/` also preloaded the missing file.

- [x] `/review/sihoo-doro-s300/` — figure, `ogImage`, and Product schema `image` removed. Layout falls back to `og-default.webp`. **Do not substitute a stock chair photo** — a Product schema for a specific model showing a different chair is a false statement; needs a real S300 photo
- [x] `/shoulder-pain-tall-people/` — same treatment. A licensed stock photo IS a legitimate fix here; the subject is generic
- [x] **Third broken image found by sweeping every `/images/` reference against `public/`:** `/images/logo.png` never existed, and `/shoulder-pain-tall-people/` used it as its schema publisher logo. Repointed to `og-default.webp`, matching every other page. The probe could not catch this one — it is schema-only and no browser ever fetches it

### B9. ~~Four URLs not indexed~~ — INVESTIGATED 2026-08-06, one claim is contradicted by your own data
- [ ] `/chairs/herman-miller-aeron/size-guide/` — Discovered, not indexed
- [ ] `/lumbar-support-tall-people/` — Discovered, not indexed
- [ ] `/office-chair-return-policy/` — Crawled, not indexed
- [x] ~~`/standing-desk-height-tall-people/` — **unknown to Google.** Never discovered~~ — **NOT TRUE.** Verified live: HTTP 200, `<meta name="robots">` = `index, follow`, self-referencing canonical, present in `sitemap-0.xml` (49 URLs), `robots.txt` fully open, and **5 internal inbound links**. It also has **307 impressions in `data/gsc/latest.json`**, which cannot happen for a URL Google has never discovered. The suggested action ("check sitemap and internal links") was already satisfied on both counts. No technical defect exists; nothing to fix.

  Worth noting for the other three: this page is linked from `/correct-chair-dimensions/` (18,707 impressions), so it is not weakly linked either. The remaining three are ordinary crawl-priority cases — request indexing in GSC, which is manual.

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
1. **B11** — the false Leap Plus seat height on 31 more pages, starting with the five height landing pages. A 6'5"–6'7" buyer is being told to buy a chair that does not fit them, and the site is the source AI assistants are quoting it from. Nothing else on this list costs a reader money.
2. **A1** — unblock the pipeline. Nothing ships until fixes can land.
3. ~~**B1 + B2**~~ — done 2026-08-06. Root fact established from the Steelcase spec guide; B11 is the remainder.
3. **B3** — schema fixes. Deterministic, mechanically verifiable, directly affects rich results on money pages.
4. **B4 + A10** — the earning page with no affiliate link, and the detector for links that die later. Same failure mode, one found by audit and one currently found by nobody.
5. **B8 / B9** — broken images and unindexed URLs. Small and concrete.
6. **A9** — the pre-deploy probe gate. Cheap, and it stops this list from regrowing behind you.
7. **A2 / A3** — close the observability gaps.
8. **B5 / B6 / B10** — Gesture CTR, the AIO strategic decision, and the money-page GEO queue that decision governs. B6 is the call; B10 is the page list it applies to.
9. **A13** — detector health. The deepest item and the least urgent-feeling, which is exactly why it keeps losing. Every prior incident was a measurement failing quietly.
10. **A4** — lint backlog, continuously, as files are touched.

**On "is it robust once this list is empty?"** — no. An empty list means *no known breaks*, which is a weaker claim than robustness and is exactly what was true the day before the auditor was discovered to have been truncating for a month. A12 and A13 are the two items that change the answer; the rest change the score.

# TCA Open Issues — Task List

**Generated:** 2026-08-06 · **Sources:** `data/audit-findings.json` (29 findings), `data/ledger.jsonl` (54 open, 1 regressed), `data/probes/2026-08-06.json` (49 URLs), `data/collectors/*.json`, full-week CI stress test

Every item below is drawn from machine-collected data, not judgment. Finding IDs are stable (`sha1(page|issueClass)`) — they can be quoted in `data/retractions.jsonl` if wrong.

Two sections: **A. System/pipeline** (things that break the machine) and **B. Website** (things that cost traffic and revenue).

---

# A. SYSTEM & WORKFLOW ISSUES

## A-CRITICAL

### A1. Cooldown gate blocks 100% of fixes, including factual errors
**Evidence:** This week the pipeline produced 29 findings → strategy planned 6 → **5 dropped at plan time**, 1 dropped at execution → **zero fixes applied.**
The critical spec contradiction (`32766b2a9f2c`) is blocked behind a 14-day timer because the page was edited 2 days ago. The strategy agent explicitly argued it should bypass the gate "on technical grounds"; deterministic enforcement overrode it.

- [ ] Add a bypass for `spec-error` and other factual-correctness classes in `assertSafeToAct` / the cooldown check in `execute-fixes.ts`
- [ ] Decide the rule: which issue classes are correctness (bypass) vs. optimization (respect cooldown)
- [ ] Verify a factual fix lands within one cycle of being found

**Why this is critical:** the whole pipeline currently finds problems and fixes none of them. Everything else in this document is downstream of this.

---

## A-HIGH

### A2. Nightly report cannot see the agents' own execution logs
**Evidence:** The week's single most important event — the trust layer rejecting fabricated ASIN `B006H1QYBA` on a page that scored 100/100 — appears **nowhere** in the nightly report. `grep -ci "asin" wiki/nightly/2026-08-06.md` → 0.
`reports/content-log.md`, `reports/fixes-log.md`, and `reports/weekly-plan.md` are not among the report's sources, so agent outcomes are invisible.

- [ ] Add `reports/content-log.md`, `reports/fixes-log.md` as nightly sources in `scripts/nightly-report.ts`
- [ ] Give them contracts so they can be `verified`, not `unverified`
- [ ] Confirm a blocked ASIN or a rejected page shows up in the next report

### A3. Clarity quota architecture — nightly is structurally guaranteed to fail
**Evidence:** `429 Too Many Requests — daily request limit reached (10/day/project; the Monday pull spends 2)`. Caused a `regressed` ledger entry (`d0c52e63b8fe`). The report itself diagnosed it: *"a quota architecture problem, not a missing token."*

- [ ] Make the nightly Clarity collector reuse the on-disk snapshot when it is <24h old instead of re-pulling
- [ ] Or request a higher quota from Microsoft Clarity
- [ ] Confirm `collector-healthy clarity` stops flapping between closed and regressed

### A4. Architecture lint backlog — 163 known violations
**Evidence:** `npm run lint:architecture` → 163 baselined (76 `?? []`, 6 `?? {}`, 10 empty catch, 62 raw `JSON.parse`, 15 direct `messages.create`).
New violations already fail the build; the backlog does not. Each `?? []` on parsed input is a latent copy of the reconciler bug that ran green for months.

- [ ] Migrate `JSON.parse` call sites to `readValidated` (highest value: the 15 that read pipeline state)
- [ ] Migrate the 15 `messages.create` sites to `meteredCreate` so cost accounting is complete
- [ ] Re-baseline as the count drops; `--strict` is the end-state gate

---

## A-MEDIUM

### A5. Probe artifacts grow ~14MB/month with no retention policy
**Evidence:** `data/probes/2026-08-06.json` is 470KB; 52% is retained JSON-LD held as closure evidence. Already forced one nightly to degrade before the summarizer fix.

- [ ] Decide retention (suggest: keep 30 days of full probe files, archive or prune older)
- [ ] Same question for `data/ledger.jsonl` (122 lines now, append-only forever)

### A6. Cost reconciliation has never been run against the Anthropic Console
**Evidence:** `npm run cost:reconcile` exists and is untested against a real invoice. Metered spend to date: **$3.62 / 29 calls**. PRD §9 requires reconciliation within 5%.

- [ ] Run `npm run cost:reconcile --month 2026-08 <actual-usd>` once a real Console figure exists
- [ ] Confirm drift >5% files itself as a finding

### A7. GSC URL Inspection makes the nightly ~6 minutes longer
**Evidence:** 49 URLs × ~6s round-trip = 366s of a ~7min run. Well inside the 45min timeout but dominates wall-clock.

- [ ] Consider inspecting on a rotation (e.g. 10 URLs/night) rather than all 49

### A8. `.env` name drift vs. repo secrets
**Evidence:** `.env` uses `SERP_API_KEY` / `DATAFORSEO_USERNAME`; the vendors' docs (and my first draft of `nightly.yml`) use `SERPAPI_KEY` / `DATAFORSEO_LOGIN`. `quotas.ts` accepts both, which masks the drift.

- [ ] Pick one spelling and normalize `.env`, repo secrets, and all workflows

---

## A-RESOLVED THIS SESSION (verify they stay fixed)

| Was | Status |
|---|---|
| Audit truncated findings every week for a month (`max_tokens: 4000`, 5/5 runs at ceiling) | Fixed → 29 findings at 6,405 tokens |
| `data/audit-findings.json` never committed → Wednesday fell back to `slice(0, 3000)` | Fixed |
| `data/interventions.jsonl` never committed → reconciler had nothing to reconcile | Fixed |
| Workflows discarded entire runs on concurrent push (no rebase in retry) | Fixed in 6 workflows |
| `reconcileInterventions` read `raw.pages ?? []` from a key that does not exist | Fixed → 8/8 entries enrich |
| Friday failing 3 weeks (creating a page at a 301 redirect source) | Fixed → first success since 07-17 |
| Dead-man's alarm could never be delivered (em dash in HTTP header) | Fixed |
| `nightly.yml` referenced 3 nonexistent secrets + never wrote the GSC credentials file | Fixed |

---

# B. WEBSITE ISSUES

## B-CRITICAL

### B1. `/knee-pain-seat-depth/` — 41% of all site impressions at 0.04% CTR
**ID `e56f5c82ad68`** (ctr-leak) + **`212811006ec2`** (title-length, 67 chars)
Highest-impression page on the site by a wide margin. Title is truncating in SERPs.

- [ ] Shorten title to ≤60 chars
- [ ] Rewrite meta description to earn the click
- [ ] This single page is the largest traffic lever you have

### B2. `/chairs/steelcase-leap-plus/seat-height/` — factual contradiction
**ID `32766b2a9f2c`** (spec-error)
Title says seat height is **15.5″–22.5″**; meta description says **15.5″–20.5″**. One is wrong. This is a spec page — the error directly undermines E-E-A-T on the exact thing the page exists to answer.

- [ ] Determine the correct range from Steelcase source data
- [ ] Fix whichever of title/meta is wrong
- [ ] **Currently blocked by issue A1 (cooldown)**

### B3. `/chairs/steelcase-leap-plus/seat-height/` — 527 impressions, 0 clicks
**ID `31788964418d`** (ctr-leak) · pos 8.8, commercial intent, zero clicks.

- [ ] Rewrite title/meta after fixing B2

### B4. `/chairs/herman-miller-aeron/` — 551 impressions, 0 clicks, pos 20.6
**ID `fae650db38e2`** (ctr-leak) · Position 20.6 suggests thin content / weak E-E-A-T suppressing rank, not just a snippet problem.

- [ ] Expand the hub page content
- [ ] Also `a6b8138171ac` (LOW): title is 49 chars, just under the 50-char minimum

---

## B-HIGH

### B5. Over-length titles truncating in SERPs
- [ ] `1760ee88a1cd` — `/office-chairs-for-tall-people/` — **75 chars**, the worst on the site, and it is your money hub
- [ ] `ef9fbd421bf3` — `/correct-chair-dimensions/` — 73 chars
- [ ] `212811006ec2` — `/knee-pain-seat-depth/` — 67 chars (see B1)
- [ ] `2afb01154404` — `/back-pain-spine-height/` — 42 chars, **too short**, wasting keyword signal

### B6. CTR leaks on well-ranked pages
- [ ] `9f99335dd373` — `/correct-chair-dimensions/` — 18,707 impressions, pos 9.6, **0.18% CTR**
- [ ] `018c617c0678` — `/review/gesture/` — 8,415 impressions, pos 8.0, **0.12% CTR** — your only first-person-tested page
- [ ] `822656ebbd96` — `/review/leap-plus/` — "steelcase leap plus" at pos 10.2, 1.01% CTR — just off page 1
- [ ] `5d47576a55b8` — `/chairs/steelcase-gesture/weight-limit/` — 682 impressions, 1 click
- [ ] `2f44da9be495` — `/chairs/steelcase-gesture/` — 615 impressions, 1 click

### B7. `/best-office-chairs-under-500/` — voice violation in meta
**ID `4d4660bb8c27`** (meta-quality)
Meta description uses first person about buying the Gesture on a page covering chairs Jackson has not tested. Conflicts with the CLAUDE.md testing constraint.

- [ ] Rewrite meta to research-based voice
- [ ] Also `f0baa4b52fb4` (MEDIUM): title is 45 chars, below the 50-char minimum

### B8. `/pain-ergonomics/` — thin content at pos 29.3
**ID `81bc473ec908`** · 487 impressions, 1 click. Google does not consider it authoritative.

- [ ] Expand substantially or consolidate into a stronger page

### B9. `/review/leap-plus/` meta is 170 chars
**ID `d0d72d28e7be`** — will truncate.

---

## B-MEDIUM

### B10. Meta descriptions outside the 130–155 range
Confirmed by **both** the audit and live Playwright probes (independent measurement):

- [ ] `6f2887c79740` — `/chairs/steelcase-gesture/` — 170 chars
- [ ] `c5a9b74a3b06` — `/office-chairs-for-tall-people/` — 168 chars
- [ ] `47248c01f0c3` — `/review/aeron-size-c/` — 166 chars
- [ ] `369f0d637ae2` — `/gesture-vs-leap-plus/` — 165 chars
- [ ] `5663893947e9` — `/review/gesture/` — 158 chars
- [ ] `16b4f4925969` — `/back-pain-spine-height/` — 132 chars (too short)

Probe-detected, open in ledger with predicates (auto-close when fixed):
- [ ] `546494da2ee8` — `/office-chair-return-policy/` — **187 chars**
- [ ] `397535e4e9a2` — `/monitor-arm-tall-people/` — 168 chars
- [ ] `0af010d9ff42` — `/best-big-and-tall-office-chairs/` — 167 chars
- [ ] `e5065a55dd76` — `/chairs/steelcase-gesture/seat-depth/` — 108 chars (too short)

### B11. Two pages 404 their own hero images
Ledger IDs `9764cf8c99c4`, `b5cbab622428` (no-console-errors) — found by Playwright, invisible to every prior audit.

- [ ] `/review/sihoo-doro-s300/` — 404 on hero image
- [ ] `/shoulder-pain-tall-people/` — 404 on hero image

### B12. Four URLs not indexed by Google
From the GSC URL Inspection API (49/49 inspected, 45 PASS / 4 NEUTRAL):

- [ ] `/chairs/herman-miller-aeron/size-guide/` — Discovered, currently not indexed
- [ ] `/lumbar-support-tall-people/` — Discovered, currently not indexed
- [ ] `/office-chair-return-policy/` — Crawled, currently not indexed
- [ ] `/standing-desk-height-tall-people/` — **URL is unknown to Google** (never discovered — check sitemap + internal links)

### B13. Other medium findings
- [ ] `abca2db3aac4` — `/chairs/steelcase-gesture/seat-depth/` — 969 impressions, 2 clicks, primary query 0% CTR at pos 8.8
- [ ] `e2e8be9482a4` — `/chairs/steelcase-leap-plus/tall-people/` — under-linked from hub and review pages
- [ ] `5c033f2e62af` — `/office-chairs-for-6-foot-4/` — HTML-encoded apostrophe (`&#39;`) in OG Title
- [ ] `ea09e7be3cda` — `/correct-chair-dimensions/` — top query is **AIO-suppressed**; meta rewrites cannot recover these clicks. Needs a GEO/citation-capsule approach, not a snippet fix

---

## B-LOW

- [ ] `e97fddd47a65` — `/chairs/steelcase-gesture/seat-depth/` — meta at 132 chars, at the lower boundary
- [ ] `a6b8138171ac` — `/chairs/herman-miller-aeron/` — title 49 chars (see B4)

---

## B-BACKLOG: 44 pages missing GEO capsules
Ledger holds 44 open `geo-capsule` findings — pages lacking a `<!-- tca-aio-capsule -->` marker and/or a Direct Answer block. Only 5 pages currently carry both.

Treat as a **campaign, not 44 tasks.** Sequence by impression volume; the capsule work only pays where AIO is actually suppressing clicks (see `ea09e7be3cda`).

- [ ] Pick the top 10 by impressions and add capsules
- [ ] Measure whether AIO citation actually improves before doing the remaining 34

---

# SUGGESTED ORDER

1. **A1** — unblock the pipeline. Nothing else ships until fixes can land.
2. **B2** — the factual error. It is wrong on the page right now.
3. **B1** — one page, 41% of your impressions, 0.04% CTR. Largest single lever.
4. **B5** — title lengths. Cheap, deterministic, mechanically verifiable.
5. **B11 / B12** — broken images and unindexed URLs. Small, concrete, real.
6. **A2 / A3** — close the observability gaps so the nightly stops lying by omission.
7. **B6 / B10** — the CTR and meta-length sweep, once fixes can actually ship.
8. **A4** — lint backlog, continuously, as files are touched.
9. **B-BACKLOG** — GEO capsules, measured before scaled.

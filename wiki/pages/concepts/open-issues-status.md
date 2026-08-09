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
| — | not in snapshot | **NEW: P3 Amazon Associates** scraper — ships inert, blocked on one human step (see below). |
| — | not in snapshot | **NEW: a cost-metering refactor** was recovered from the working tree, where it had sat uncommitted since 2026-08-09. Drives `lint:architecture` R5 from 15 → 0. |

### A1's real mechanism, because "the cooldown was too strict" is the wrong lesson

The 14-day window was never the problem. `git log --since=14d -- <file>` cannot distinguish "the strategist rewrote this page's argument" from "a sweep added one inbound link to 8 orphans". Because the pipeline's own fixes land as commits, **every sweep re-armed a lockout on everything it touched**, and the gate got tighter the more the system did.

Two classifiers had also drifted apart (`strategy.ts` exempted 11 keywords, `execute-fixes.ts` 8 different ones), and **neither covered the defects the system actually finds** — which is why the 2026-08-06 plan dropped its own spec correction while its prose said that fix bypassed cooldown on technical grounds.

Cooldown now governs **substantive revision** only. **Deterministic defects** — title/meta length, wrong specs, schema, canonical, redirects, dead affiliate tags, alt text, orphans — are exempt at any cadence. Content churn ("add a Fit Verdict callout") still waits, deliberately.

### A10's false positive is the finding, not the footnote

The first live run reported `B0CQ4K1KXT` (Hbada E3 Pro, on `/best-office-chairs-under-500/`) as DEAD on "Currently unavailable". That text belonged to the **"Newer Version Available" cross-sell block**; the product itself showed Add to Cart and In Stock. Acting on it would have stripped a working affiliate link off a money page.

Soft unavailability markers now only count when the page offers **no way to buy anything**. Findings stay advisory — a human confirms before any link is removed.

## Needs Jackson — one step, and it is deliberate

**P3 Amazon Associates** cannot activate until the session is captured. An agent must never handle this login; it is a live credential for a financial account.

```
npx playwright codegen --save-storage=amazon-state.json https://affiliate-program.amazon.com/home/reports
gh secret set AMAZON_STORAGE_STATE < amazon-state.json && rm amazon-state.json
```

Until then the weekly workflow exits 0 silently and `collectors/amazon.ts` keeps nagging at 7 days, so the gap stays tracked rather than forgotten.

**P2 needed nothing.** It was predicted to need `siteOwner`; a real submit succeeded under the existing `siteFullUser` with `lastSubmitted` advancing and zero errors. Recorded so it does not become a phantom blocker.

## Still open, unchanged

- **A2** Nightly cannot see the agents' own execution logs · **A5–A8** (medium) · **A13** No health check on the detectors themselves
- **B5** `/review/gesture/` — 8,415 impressions, 0.12% CTR at pos 8.0
- **B7** `/office-chairs-for-6-foot-4/` "under-linked" claim — re-verify what it measured; it already has 7 inbound links
- **B11** the Leap Plus spec sweep across 31 files (pre-existing instances)
- **C** 14 findings held back by strategy

## Ledger findings are not closed by hand

The 52 escalated items were **not** marked done. They close on their own evidence: the nightly re-probes the live site (`nightly.yml` runs `probe` before `ledger:evaluate`), and the `geo-capsule` predicate reads that fresh probe record. A manual close would be a close without evidence, which `MissingEvidenceError` exists to prevent.

Verified 2026-08-08: the real Playwright probe against the live site returns **0 failing assertions** on a sample of fixed pages. A local dry-run still showed failures only because the on-disk probe record was from 10:46Z, before deploy.

## Related

[[godseye-nightly]] · [[ai-citation-readiness]] · [[decisions-log]] · [[thesis]]

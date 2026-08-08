---
type: concept
last_updated: 2026-08-08
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
| — | not in snapshot | **NEW: Saturday deploy dead since 2026-07-25.** `git merge` conflict on `data/token-log.jsonl`. Fixed via `.gitattributes` union driver, bootstrapped onto `staging`. |
| — | not in snapshot | **NEW: closure predicate closed on noise.** `op:'<', value: beforeMetric` meant a 8.70 → 8.69 drift filed as a success. Now requires a 5% move. |

## ⚠️ Open deviation from the kill list — needs a decision

B10 scopes the GEO rollout to **money pages only**, and says of the informational pages: *"adding capsules there is the exact thing 2026-07-24 forbade."*

The 2026-08-08 rollout covered **45 pages: 23 inside that scope, 22 outside it.** Outside-scope pages now carrying a Direct Answer and/or capsule:

`/` · `/about/` · `/back-pain-spine-height/` · `/chair-headrest-tall-people/` · `/correct-chair-dimensions/` · `/fit-guides/` · `/how-to-adjust-chair/` · `/keyboard-tray-tall-people/` · `/knee-pain-seat-depth/` · `/leg-pain-circulation/` · `/lumbar-support-tall-people/` · `/monitor-arm-tall-people/` · `/office-chair-lower-back-pain-tall-people/` · `/office-chair-return-policy/` · `/pain-ergonomics/` · `/review/sihoo-doro-s300/` · `/seat-cushion-height-tall-people/` · `/shoulder-pain-tall-people/` · `/standing-desk-converter-tall-people/` · `/standing-desk-height-tall-people/` · `/why-standard-chairs-dont-fit/` · `/wide-seat-office-chairs-tall-people/`

**Not reverted, deliberately — this is Jackson's call.** The argument each way:

- **Keep:** the kill list is a directive about *where to spend effort*, and that effort is already spent and deployed. Removing 22 capsules costs more effort than leaving them. AI assistants are ~16% of sessions and are the one surface AI Overviews cannot erode; a capsule on an informational page still feeds that surface.
- **Revert:** the directive exists because informational-query clicks are structurally suppressed, and leaving the capsules in place normalizes ignoring the kill list. It also inflates the apparent GEO coverage number, hiding how much of it was sanctioned.

Until decided, treat "49/49 pages pass `geo-capsule`" as **23/23 sanctioned + 22 unsanctioned**, not as a clean win.

## Still open, unchanged

- **A1** (A-CRITICAL) Cooldown gate applies zero fixes — the pipeline finds problems competently and ships none. Everything else is downstream.
- **A2** Nightly cannot see the agents' own execution logs · **A5–A8** (medium) · **A13** No health check on the detectors themselves
- **A9** Probe only runs against production · **A10** Nothing checks affiliate links still resolve
- **B5** `/review/gesture/` — 8,415 impressions, 0.12% CTR at pos 8.0
- **B7** `/office-chairs-for-6-foot-4/` "under-linked" claim — re-verify what it measured; it already has 7 inbound links
- **B11** the Leap Plus spec sweep across 31 files (pre-existing instances)
- **C** 14 findings held back by strategy

## Ledger findings are not closed by hand

The 52 escalated items were **not** marked done. They close on their own evidence: the nightly re-probes the live site (`nightly.yml` runs `probe` before `ledger:evaluate`), and the `geo-capsule` predicate reads that fresh probe record. A manual close would be a close without evidence, which `MissingEvidenceError` exists to prevent.

Verified 2026-08-08: the real Playwright probe against the live site returns **0 failing assertions** on a sample of fixed pages. A local dry-run still showed failures only because the on-disk probe record was from 10:46Z, before deploy.

## Related

[[godseye-nightly]] · [[ai-citation-readiness]] · [[decisions-log]] · [[thesis]]

# Post-Consolidation GSC Analysis — 2026-07-21

**Question (Jackson):** "Ever since the consolidation, impressions have been lower, maybe clicks too. Is my strategy working out?"

**Consolidation date:** 2026-07-04 — `/best-office-chairs/` 301 → `/office-chairs-for-tall-people/`, plus 3 dead spec sub-pages 301'd to parents.

**Data:** 160 continuous days of `dailyTrend` merged from all `raw/gsc/gsc-*.json` snapshots (2026-02-09 → 2026-07-18) + page-level and pageQuery-level diffs across the Jul 06 / Jul 13 / Jul 20 90-day snapshots.

**Caveat:** Latest snapshot pulled 2026-07-20 00:03, covering through Jul 18. GSC has a 2–3 day finalization lag, so the final 1–2 days are likely understated. This makes the impression drop look slightly worse and the click gain slightly smaller than reality — conclusions below are therefore conservative.

---

## Verdict

**Impressions are down 27%. Clicks are up 8%. CTR is up 49%. The consolidation did not cause the impression drop — it accounts for 1.7% of it.**

| Metric | 21d PRE (Jun 14 – Jul 4) | 14d POST (Jul 5 – Jul 18) | Change |
|---|---|---|---|
| Clicks/day | 3.10 | 3.36 | **+8%** |
| Impressions/day | 1,833 | 1,331 | **−27%** |
| CTR | 0.169% | 0.252% | **+49%** |

Weekly clicks straddling the consolidation: 20 → 21 → **26**. The week ending Jul 18 is tied for the best click week in the last 10 weeks, and it produced those clicks on **6,793 impressions vs 15,979** four weeks earlier — same clicks, 57% fewer impressions.

Weekly series (Mon-anchored):

| Week | Clicks | Impressions | CTR |
|---|---|---|---|
| May 10–16 | 11 | 4,038 | 0.272% |
| May 17–23 | 9 | 3,683 | 0.244% |
| May 24–30 | 16 | 6,472 | 0.247% |
| May 31–Jun 6 | 17 | 5,879 | 0.289% |
| Jun 7–13 | 25 | 9,505 | 0.263% |
| Jun 14–20 | 19 | 10,134 | 0.187% |
| Jun 21–27 | 26 | 15,979 | 0.163% |
| Jun 28–Jul 4 | 20 | 12,370 | 0.162% |
| Jul 5–11 | 21 | 11,845 | 0.177% |
| **Jul 12–18** | **26** | **6,793** | **0.383%** |

The impression decline began ~Jul 9–10 (a transient spike Jun 24–28 peaked at 3,321/day, then deflated). Clicks/day have been effectively flat at ~3.2/day since June 1 regardless.

---

## Finding 1 — The impression drop is in pages the consolidation never touched

Weekly impression change, week ending Jul 20 vs week ending Jul 13 (total sitewide: −5,614):

| Page | Weekly impr Jul 13 → Jul 20 | Δ | Share of drop |
|---|---|---|---|
| `/knee-pain-seat-depth/` | 5,762 → 2,477 | **−3,285** | **58.5%** |
| `/review/leap-plus/` | 1,599 → 538 | −1,061 | 18.9% |
| `/correct-chair-dimensions/` | 1,839 → 1,199 | −640 | 11.4% |
| `/review/aeron-size-c/` | 468 → 200 | −268 | 4.8% |
| `/review/gesture/` | 506 → 275 | −231 | 4.1% |
| `/gesture-vs-leap-plus/` | 142 → 28 | −114 | 2.0% |
| **`/best-office-chairs/` (the killed page)** | 101 → 5 | **−96** | **1.7%** |

The consolidated page contributed ~14 impressions/day at the time it was killed. The sitewide drop is ~500/day. The arithmetic rules out consolidation as the cause.

Note `/knee-pain-seat-depth/` **improved** in position over the same window (6.1 → 5.7) while its impressions collapsed. That is a demand/SERP-surface change, not a ranking loss.

## Finding 2 — 97% of site impressions are anonymous and produce no clicks

| Snapshot (90d) | Total impressions | Top-200 query impressions | Query coverage |
|---|---|---|---|
| Jun 22 | 52,635 | 2,519 | 4.8% |
| Jun 29 | 67,673 | 2,558 | 3.8% |
| Jul 06 | 78,826 | 2,549 | 3.2% |
| Jul 13 | 89,422 | 2,487 | 2.8% |
| Jul 20 | 94,576 | 2,648 | 2.8% |

Query-attributable impressions have been **flat at ~2,500 for two months** while total impressions ballooned 52k → 94k and are now deflating. The entire impression balloon (and its deflation) lives in an anonymous, ~0% CTR bucket concentrated on two measurement/dimension pages.

`/knee-pain-seat-depth/` = 38,644 impressions (41% of site total) at position 5.7 with **18 clicks** — 0.047% CTR, which is impossible on a normal text SERP at that position. The signature (huge anonymized long-tail, good average position, near-zero CTR, on measurement/dimension pages) is consistent with zero-click informational surfacing where the answer is rendered in the SERP itself.

**Implication:** impressions are not a valid health metric for this site. They measure an anonymous zero-value pool, not demand. Clicks and CTR are the real signals, and both are up.

## Finding 3 — Consolidation mechanics are clean, but the goal is not yet delivered

Verified live 2026-07-21:
- `/best-office-chairs/` and no-slash variant → 301, single hop, correct target
- `/chairs/steelcase-gesture/seat-height/` → 301 to parent
- Sitemap: 43 URLs, zero killed URLs listed
- GSC page count 39 → 42 → 43 across the last three snapshots; **no pages fell out of the index**
- Survivor `/office-chairs-for-tall-people/` stable at position 8.1, weekly impressions flat-to-up (151 → 187), clicks 16 → 17 → 18

**But:** 17 days post-301, the entire "best office chair(s) for tall people" head-term family is **still attributed to the dead URL**:

| Query | Position (Jun 29 → Jul 20) | Clicks |
|---|---|---|
| best office chairs for tall people | 56.9 → 51.2 | 0 |
| best office chair for tall person | 71.6 → 68.1 | 0 |
| best office chair tall person | 72.3 → 67.2 | 0 |
| best office chairs for tall man | 47.0 → 40.6 | 0 |

Nothing has migrated to the survivor, whose queries remain purely Steelcase Leap V2 brand terms (69 / 24 / 21 impressions). This is normal 301 signal-consolidation latency (2–8 weeks) and is too early to call — the scheduled check was Aug 1, full evaluation Sep 1.

## Finding 4 — The stated success metric is not fit for purpose

Recorded metric: *"head-term family gains 3+ positions on the survivor within 4 weeks."*

Head terms currently sit at positions 40.6 – 68.1, and are already drifting up ~4–6 positions on the dead URL through rolling-average effects alone. A 3-position gain (e.g. 51 → 48) produces **zero** clicks. The metric can be fully satisfied while delivering nothing.

It should be restated as an absolute threshold — *any* head term entering the top 20, or first non-zero click on the family — not a relative movement.

The decisions-log already anticipated the likely answer: *"If head terms don't move by Sep 1, the constraint is domain authority, not architecture."* Current position data (40–70 on a site whose best commercial page sits at 8.1) supports the authority read.

---

## Recommendations

1. **Stop tracking impressions as a health metric.** Track clicks, CTR, and affiliate revenue. Impressions on this site are dominated by an anonymous zero-CTR pool that moves independently of anything done to the site.
2. **Rewrite the consolidation success metric** to an absolute threshold (top-20 entry or first head-term click), not "+3 positions."
3. **Hold the Sep 1 evaluation date.** Consolidation mechanics are correct; signal migration takes 2–8 weeks. No further restructuring before then.
4. **Do not restructure in response to the impression decline.** It is not caused by site changes.
5. **The click engine is `/review/leap-plus/`** (34 clicks/90d, the site's top click source) and the survivor is compounding slowly on Leap V2 brand terms. Depth on the Leap/Steelcase cluster is the highest-confidence lever, consistent with the standing monetization-first thesis.

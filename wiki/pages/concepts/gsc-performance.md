---
type: concept
last_updated: 2026-07-21
sources: [raw/audits/2026-07-21-weekly-audit.md]
tags: [gsc, performance, metrics, tracking]
---

# GSC Performance Tracking

## CRITICAL — impressions are not a valid health metric for this site (established 2026-07-21)

**97% of site impressions carry no query attribution and produce no clicks.** Query-attributable impressions have been flat at ~2,500 per 90d window for two months while total impressions ballooned 52k → 94k and then deflated:

| Snapshot (90d) | Total impr | Top-200 query impr | Query coverage |
|---|---|---|---|
| Jun 22 | 52,635 | 2,519 | 4.8% |
| Jun 29 | 67,673 | 2,558 | 3.8% |
| Jul 06 | 78,826 | 2,549 | 3.2% |
| Jul 13 | 89,422 | 2,487 | 2.8% |
| Jul 20 | 94,576 | 2,648 | 2.8% |

The pool is concentrated on two measurement/dimension pages. `/knee-pain-seat-depth/` alone is 38,644 impressions (41% of site total) at position 5.7 with **18 clicks** — 0.047% CTR, impossible on a normal text SERP at that position. Signature is consistent with zero-click informational surfacing.

**Rule: track clicks, CTR, and affiliate revenue. Do not treat impression movement as a signal, and never restructure the site in response to it.** Impressions here move independently of anything done to the site — `/knee-pain-seat-depth/` *improved* from pos 6.1 → 5.7 while its impressions collapsed 57%.

## Post-consolidation verdict (2026-07-21)

Jackson flagged falling impressions after the 2026-07-04 commercial-cluster consolidation. **Impressions −27%, clicks +8%, CTR +49%.** The consolidation is not the cause — the killed page accounts for 1.7% of the drop.

| Metric | 21d PRE (Jun 14–Jul 4) | 14d POST (Jul 5–18) | Change |
|---|---|---|---|
| Clicks/day | 3.10 | 3.36 | +8% |
| Impressions/day | 1,833 | 1,331 | −27% |
| CTR | 0.169% | 0.252% | +49% |

Weekly impression drop attribution (wk ending Jul 20 vs Jul 13, total −5,614): `/knee-pain-seat-depth/` −3,285 (58.5%), `/review/leap-plus/` −1,061 (18.9%), `/correct-chair-dimensions/` −640 (11.4%), **`/best-office-chairs/` (the killed page) −96 (1.7%)**.

Week ending Jul 18 was tied for the best click week in 10 weeks (26 clicks) on 6,793 impressions vs 15,979 four weeks prior — same clicks, 57% fewer impressions. Clicks/day have been flat at ~3.2 since June 1 through the entire impression balloon and deflation.

*Full analysis: `raw/audits/2026-07-21-post-consolidation-gsc-analysis.md`*

## Latest Snapshot (2026-07-21)

| Metric | Value |
|--------|-------|
| Total impressions | 94576 |
| Total clicks | 207 |
| Avg CTR | 0.22% |
| Avg position | 8.1 |

## Top Pages

| /knee-pain-seat-depth/ | 38644 impr | pos 5.7 | 0.05% CTR | 18 clicks |
| /correct-chair-dimensions/ | 16917 impr | pos 9.6 | 0.18% CTR | 30 clicks |
| /review/leap-plus/ | 11911 impr | pos 8.7 | 0.29% CTR | 34 clicks |
| /review/gesture/ | 9077 impr | pos 7.9 | 0.08% CTR | 7 clicks |
| /review/aeron-size-c/ | 4764 impr | pos 10.9 | 0.46% CTR | 22 clicks |
| /office-chairs-for-tall-people/ | 3233 impr | pos 8.1 | 0.56% CTR | 18 clicks |
| /best-office-chairs/ | 1952 impr | pos 17.7 | 0.46% CTR | 9 clicks |
| /chairs/herman-miller-aeron/tall-people/ | 1488 impr | pos 8.1 | 0.81% CTR | 12 clicks |
| /gesture-vs-leap-plus/ | 1339 impr | pos 10.5 | 0.45% CTR | 6 clicks |
| /best-office-chairs-under-500/ | 1284 impr | pos 9.1 | 0.86% CTR | 11 clicks |

*Full audit report: raw/audits/2026-07-21-weekly-audit.md*

## Historical Snapshots

### 2026-07-20

| Metric | Value |
|--------|-------|
| Total impressions | 94576 |
| Total clicks | 207 |
| Avg CTR | 0.22% |
| Avg position | 8.1 |

### 2026-07-14

| Metric | Value |
|--------|-------|
| Total impressions | 89422 |
| Total clicks | 188 |
| Avg CTR | 0.21% |
| Avg position | 8.1 |

### 2026-07-13

| Metric | Value |
|--------|-------|
| Total impressions | 89422 |
| Total clicks | 188 |
| Avg CTR | 0.21% |
| Avg position | 8.1 |

### 2026-07-07

| Metric | Value |
|--------|-------|
| Total impressions | 78826 |
| Total clicks | 167 |
| Avg CTR | 0.21% |
| Avg position | 8.3 |

### 2026-07-06

| Metric | Value |
|--------|-------|
| Total impressions | 78826 |
| Total clicks | 167 |
| Avg CTR | 0.21% |
| Avg position | 8.3 |

### 2026-06-29

| Metric | Value |
|--------|-------|
| Total impressions | 67673 |
| Total clicks | 150 |
| Avg CTR | 0.22% |
| Avg position | 8.5 |

### 2026-06-23

| Metric | Value |
|--------|-------|
| Total impressions | 52635 |
| Total clicks | 125 |
| Avg CTR | 0.24% |
| Avg position | 8.9 |

### 2026-06-22

| Metric | Value |
|--------|-------|
| Total impressions | 52635 |
| Total clicks | 125 |
| Avg CTR | 0.24% |
| Avg position | 8.9 |

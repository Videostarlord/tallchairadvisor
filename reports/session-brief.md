# Session Brief — 2026-10-18

_Generated 2026-10-18T04:02:21.541Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 54,056 impressions, **281 clicks**, CTR 0.520%, avg position 8.6
- **Momentum:** Impressions up 3% WoW (2019 vs 1960), clicks up 13% (26 vs 23), avg position declining (0.6 spots)
- **GA4 28d:** 717 sessions total — but Direct is 450 (63%), engagement 28.3%, 80s.
  **Treat ~270 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 450 (62.8%)
  - Organic Search: 161 (22.5%)
  - AI Assistant: 75 (10.5%)
  - Unassigned: 24 (3.3%)
  - Referral: 6 (0.8%)
  - Organic Social: 4 (0.6%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 401.5 | 1626 | 9617 | 8.1 |
| /chairs/herman-miller-aeron/ | content-depth | 295.5 | 591 | 591 | 16.1 |
| /pain-ergonomics/ | content-depth | 192.5 | 385 | 385 | 25.0 |
| /chairs/steelcase-leap-plus/tall-people/ | near-p1 | 150.6 | 580 | 580 | 7.7 |
| /chairs/steelcase-leap-plus/ | near-p1 | 139.3 | 557 | 557 | 8.0 |
| /chair-headrest-tall-people/ | near-p1 | 138.6 | 499 | 499 | 7.2 |
| /chairs/herman-miller-aeron/size-guide/ | content-depth | 129 | 258 | 258 | 27.6 |
| /office-chairs-for-6-foot-6/ | near-p1 | 125.5 | 502 | 502 | 8.0 |

**9 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/office-chairs-for-tall-people/` — 3,012 impressions, only 9.6% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/best-office-chairs-under-500/` — 1,743 impressions, only 12.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/correct-chair-dimensions/` — 9,170 impressions, only 10.7% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 4,152 impressions, only 7.3% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,972 impressions, only 2.9% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 11,238 impressions, only 3.7% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/aeron-size-c/` — 1,885 impressions, only 13.0% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/` — 1,050 impressions, only 6.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/seat-depth/` — 1,096 impressions, only 5.0% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 105 | 48 | 33% | 15% |
| / | 62 | 1 | 8% | 26% |
| /review/leap-plus/ | 43 | 7 | — | 32% |
| /review/gesture/ | 40 | 1 | — | 22% |
| /best-office-chairs-under-500/ | 35 | 8 | 7% | 26% |
| /chairs/herman-miller-aeron/tall-people/ | 27 | 0 | — | 24% |
| /chairs/herman-miller-aeron/size-guide/ | 22 | 0 | — | 26% |
| /chairs/steelcase-gesture/ | 22 | 1 | — | 34% |
| /review/aeron-size-c/ | 21 | 3 | — | 42% |
| /knee-pain-seat-depth/ | 20 | 3 | — | 20% |
| /review/sihoo-doro-s300/ | 19 | 0 | — | 28% |
| /correct-chair-dimensions/ | 18 | 1 | — | 16% |
| /best-big-and-tall-office-chairs/ | 17 | 9 | — | 23% |
| /chair-headrest-tall-people/ | 17 | 0 | — | 61% |
| /chairs/steelcase-leap-plus/weight-limit/ | 17 | 3 | — | 30% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 63, "escalated": 3, "regressed": 3, "total": 69, "retractedSkipped": 0}
  - **/best-office-chairs-under-500/** — position 9.5 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **collector:amazon** — collector amazon unhealthy — affiliate data is 31 days stale — newest export is raw/affiliate/2026-09-17-amazon-associates-report.md (2026-09-17, dated by filename), SLA is 7 days. Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not contain it, and a window that is guessed rather than recorded has already caused one export in this archive to be misread as a second positive month. Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers affiliate revenue.
  - **/correct-chair-dimensions/** — position 10.2 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 9.1 does not satisfy < 8.1
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

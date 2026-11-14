# Session Brief — 2026-11-14

_Generated 2026-11-14T05:52:26.583Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 41,190 impressions, **266 clicks**, CTR 0.646%, avg position 8.7
- **Momentum:** Impressions up 10.6% WoW (2366 vs 2139), clicks up 25% (25 vs 20), avg position improving (0.6 spots)
- **GA4 28d:** 650 sessions total — but Direct is 477 (73%), engagement 26.2%, 67s.
  **Treat ~174 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 477 (73.4%)
  - Organic Search: 138 (21.2%)
  - AI Assistant: 16 (2.5%)
  - Organic Social: 12 (1.8%)
  - Unassigned: 5 (0.8%)
  - Referral: 3 (0.5%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /monitor-arm-tall-people/ | near-p1 | 499.7 | 1574 | 2478 | 6.3 |
| /chairs/herman-miller-aeron/size-guide/ | content-depth | 383.5 | 346 | 767 | 24.4 |
| /review/leap-plus/ | near-p1 | 289.4 | 1143 | 6656 | 7.9 |
| /chairs/herman-miller-aeron/ | content-depth | 272.5 | 545 | 545 | 23.5 |
| /pain-ergonomics/ | content-depth | 152 | 304 | 304 | 15.9 |
| /chair-headrest-tall-people/ | near-p1 | 147.3 | 545 | 545 | 7.4 |
| /chairs/steelcase-gesture/weight-limit/ | near-p1 | 140.8 | 549 | 549 | 7.8 |
| /chairs/steelcase-leap-plus/tall-people/ | near-p1 | 135.7 | 502 | 502 | 7.4 |

**5 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/office-chairs-for-tall-people/` — 2,868 impressions, only 12.6% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/correct-chair-dimensions/` — 5,734 impressions, only 10.0% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,648 impressions, only 2.9% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 3,119 impressions, only 9.0% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 5,452 impressions, only 3.1% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 111 | 53 | 42% | 15% |
| / | 57 | 0 | 13% | 26% |
| /review/leap-plus/ | 48 | 7 | 77% | 32% |
| /review/gesture/ | 31 | 1 | — | 22% |
| /seat-cushion-height-tall-people/ | 28 | 3 | — | 72% |
| /correct-chair-dimensions/ | 27 | 0 | 23% | 16% |
| /best-office-chairs-under-500/ | 25 | 4 | 48% | 26% |
| /chairs/herman-miller-aeron/tall-people/ | 25 | 0 | — | 24% |
| /review/aeron-size-c/ | 24 | 1 | 39% | 42% |
| /chairs/steelcase-gesture/ | 21 | 1 | 99% | 34% |
| /chair-headrest-tall-people/ | 20 | 0 | — | 61% |
| /chairs/steelcase-gesture/weight-limit/ | 20 | 1 | — | 33% |
| /chairs/steelcase-leap-plus/ | 20 | 5 | 12% | 25% |
| /knee-pain-seat-depth/ | 20 | 0 | — | 20% |
| /office-chairs-for-6-foot-7/ | 20 | 0 | — | 20% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 64, "escalated": 2, "regressed": 3, "total": 69, "retractedSkipped": 0}
  - **collector:clarity** — collector clarity healthy, 26 row(s) at 2026-11-14T05:51:11.535Z
  - **/best-office-chairs-under-500/** — position 10.3 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **collector:amazon** — collector amazon unhealthy — affiliate data is 58 days stale — newest export is raw/affiliate/2026-09-17-amazon-associates-report.md (2026-09-17, dated by filename), SLA is 7 days. Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not contain it, and a window that is guessed rather than recorded has already caused one export in this archive to be misread as a second positive month. Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers affiliate revenue.
  - **/correct-chair-dimensions/** — position 10.1 does not satisfy < 9.6
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

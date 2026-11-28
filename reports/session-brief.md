# Session Brief — 2026-11-28

_Generated 2026-11-28T07:17:31.504Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 37,036 impressions, **271 clicks**, CTR 0.732%, avg position 8.5
- **Momentum:** Impressions up 1.7% WoW (2326 vs 2288), clicks down 7.7% (24 vs 26), avg position stable
- **GA4 28d:** 769 sessions total — but Direct is 534 (69%), engagement 29.8%, 78s.
  **Treat ~238 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 534 (69.4%)
  - Organic Search: 215 (28.0%)
  - AI Assistant: 12 (1.6%)
  - Unassigned: 7 (0.9%)
  - Referral: 4 (0.5%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /monitor-arm-tall-people/ | near-p1 | 670.8 | 2046 | 3038 | 6.1 |
| /chairs/herman-miller-aeron/size-guide/ | content-depth | 545 | 471 | 1090 | 21.5 |
| /chairs/herman-miller-aeron/ | content-depth | 297.5 | 255 | 595 | 25.3 |
| /review/leap-plus/ | near-p1 | 186.4 | 727 | 4772 | 7.8 |
| /office-chairs-for-6-foot-3/ | near-p1 | 150.4 | 534 | 534 | 7.1 |
| /chair-headrest-tall-people/ | near-p1 | 138.9 | 500 | 500 | 7.2 |
| /chairs/steelcase-gesture/weight-limit/ | near-p1 | 137.1 | 521 | 521 | 7.6 |
| /chairs/steelcase-leap-plus/tall-people/ | near-p1 | 126.5 | 487 | 487 | 7.7 |

**5 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/office-chairs-for-tall-people/` — 3,353 impressions, only 14.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/correct-chair-dimensions/` — 4,452 impressions, only 8.6% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,279 impressions, only 3.0% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 2,655 impressions, only 12.6% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 4,414 impressions, only 3.0% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 174 | 96 | 30% | 15% |
| /review/leap-plus/ | 52 | 6 | 5% | 32% |
| / | 46 | 0 | 7% | 26% |
| /review/gesture/ | 39 | 0 | 39% | 22% |
| /review/aeron-size-c/ | 35 | 3 | 51% | 42% |
| /correct-chair-dimensions/ | 33 | 1 | 41% | 16% |
| /chairs/steelcase-gesture/ | 30 | 3 | 68% | 34% |
| /chairs/herman-miller-aeron/tall-people/ | 29 | 0 | 92% | 24% |
| /knee-pain-seat-depth/ | 28 | 0 | — | 20% |
| /seat-cushion-height-tall-people/ | 27 | 3 | — | 72% |
| /office-chairs-for-6-foot-7/ | 25 | 1 | — | 20% |
| /review/sihoo-doro-s300/ | 24 | 3 | 26% | 28% |
| /chair-headrest-tall-people/ | 23 | 0 | — | 61% |
| /chairs/steelcase-leap-plus/ | 23 | 7 | 6% | 25% |
| /best-office-chairs-under-500/ | 21 | 12 | 86% | 26% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 65, "escalated": 1, "regressed": 3, "total": 69, "retractedSkipped": 0}
  - **/best-office-chairs-under-500/** — position 10.5 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **collector:amazon** — collector amazon unhealthy — affiliate data is 72 days stale — newest export is raw/affiliate/2026-09-17-amazon-associates-report.md (2026-09-17, dated by filename), SLA is 7 days. Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not contain it, and a window that is guessed rather than recorded has already caused one export in this archive to be misread as a second positive month. Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers affiliate revenue.
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]
  - **/best-office-chairs-under-500/** — position 10.5 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

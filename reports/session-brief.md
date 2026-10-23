# Session Brief — 2026-10-23

_Generated 2026-10-23T04:17:35.407Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 49,878 impressions, **273 clicks**, CTR 0.547%, avg position 8.8
- **Momentum:** Impressions down 3.5% WoW (1948 vs 2019), clicks down 57.7% (11 vs 26), avg position declining (1.1 spots)
- **GA4 28d:** 722 sessions total — but Direct is 468 (65%), engagement 26.9%, 67s.
  **Treat ~257 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 468 (64.8%)
  - Organic Search: 158 (21.9%)
  - AI Assistant: 55 (7.6%)
  - Unassigned: 22 (3.0%)
  - Organic Social: 16 (2.2%)
  - Referral: 6 (0.8%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 366.2 | 1483 | 8925 | 8.1 |
| /chairs/herman-miller-aeron/ | content-depth | 276 | 552 | 552 | 17.2 |
| /chairs/herman-miller-aeron/size-guide/ | content-depth | 191.5 | 383 | 383 | 27.6 |
| /pain-ergonomics/ | content-depth | 187.5 | 375 | 375 | 22.8 |
| /chairs/steelcase-leap-plus/tall-people/ | near-p1 | 147.1 | 559 | 559 | 7.6 |
| /chair-headrest-tall-people/ | near-p1 | 146.1 | 526 | 526 | 7.2 |
| /wide-seat-office-chairs-tall-people/ | near-p1 | 133.3 | 593 | 593 | 8.9 |
| /chairs/steelcase-leap-plus/ | near-p1 | 131.3 | 545 | 545 | 8.3 |

**8 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/office-chairs-for-tall-people/` — 2,936 impressions, only 9.7% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/best-office-chairs-under-500/` — 1,697 impressions, only 13.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/correct-chair-dimensions/` — 8,185 impressions, only 10.1% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 3,757 impressions, only 7.9% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,895 impressions, only 2.9% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 9,192 impressions, only 3.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/` — 1,002 impressions, only 7.4% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/aeron-size-c/` — 1,699 impressions, only 13.4% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 112 | 49 | 9% | 15% |
| / | 67 | 1 | 14% | 26% |
| /review/leap-plus/ | 40 | 7 | — | 32% |
| /best-office-chairs-under-500/ | 37 | 8 | — | 26% |
| /review/gesture/ | 35 | 1 | 14% | 22% |
| /chairs/herman-miller-aeron/size-guide/ | 25 | 0 | — | 26% |
| /chairs/herman-miller-aeron/tall-people/ | 25 | 0 | — | 24% |
| /chairs/herman-miller-aeron/ | 21 | 0 | — | 33% |
| /correct-chair-dimensions/ | 20 | 1 | — | 16% |
| /review/aeron-size-c/ | 20 | 2 | — | 42% |
| /chairs/steelcase-gesture/ | 19 | 1 | — | 34% |
| /chairs/steelcase-leap-plus/weight-limit/ | 18 | 3 | — | 30% |
| /review/sihoo-doro-s300/ | 18 | 0 | — | 28% |
| /knee-pain-seat-depth/ | 17 | 3 | — | 20% |
| /monitor-arm-tall-people/ | 17 | 0 | — | 60% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 63, "escalated": 3, "regressed": 3, "total": 69, "retractedSkipped": 0}
  - **/best-office-chairs-under-500/** — position 9.8 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **collector:amazon** — collector amazon unhealthy — affiliate data is 36 days stale — newest export is raw/affiliate/2026-09-17-amazon-associates-report.md (2026-09-17, dated by filename), SLA is 7 days. Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not contain it, and a window that is guessed rather than recorded has already caused one export in this archive to be misread as a second positive month. Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers affiliate revenue.
  - **/correct-chair-dimensions/** — position 10.3 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 9.1 does not satisfy < 8.1
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

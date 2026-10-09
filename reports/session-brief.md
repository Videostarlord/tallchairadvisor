# Session Brief — 2026-10-09

_Generated 2026-10-09T05:38:25.857Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 61,570 impressions, **279 clicks**, CTR 0.453%, avg position 8.5
- **Momentum:** Impressions down 46.7% WoW (1960 vs 3680), clicks flat (23 vs 23), avg position declining (1.4 spots)
- **GA4 28d:** 747 sessions total — but Direct is 462 (62%), engagement 29.5%, 87s.
  **Treat ~296 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 462 (61.8%)
  - Organic Search: 173 (23.2%)
  - AI Assistant: 99 (13.3%)
  - Unassigned: 15 (2.0%)
  - Cross-network: 5 (0.7%)
  - Referral: 4 (0.5%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 440 | 1804 | 10782 | 8.2 |
| /chairs/herman-miller-aeron/ | content-depth | 287 | 574 | 574 | 16.2 |
| /pain-ergonomics/ | content-depth | 206.5 | 413 | 413 | 26.1 |
| /chairs/steelcase-leap-plus/ | near-p1 | 153.9 | 577 | 577 | 7.5 |
| /chairs/steelcase-leap-plus/tall-people/ | near-p1 | 150.6 | 595 | 595 | 7.9 |
| /office-chairs-for-6-foot-6/ | near-p1 | 132.5 | 550 | 550 | 8.3 |
| /chair-headrest-tall-people/ | near-p1 | 131.4 | 473 | 473 | 7.2 |
| /office-chairs-for-6-foot-5/ | near-p1 | 118.1 | 437 | 437 | 7.4 |

**8 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/office-chairs-for-tall-people/` — 3,176 impressions, only 10.4% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/correct-chair-dimensions/` — 10,520 impressions, only 10.9% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/best-office-chairs-under-500/` — 1,665 impressions, only 9.1% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 4,679 impressions, only 6.6% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 2,003 impressions, only 3.1% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 15,431 impressions, only 4.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/` — 1,065 impressions, only 5.8% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/seat-depth/` — 1,130 impressions, only 5.0% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 115 | 52 | 31% | 15% |
| / | 63 | 0 | 13% | 26% |
| /review/leap-plus/ | 52 | 10 | — | 32% |
| /review/gesture/ | 47 | 1 | — | 22% |
| /best-office-chairs-under-500/ | 42 | 11 | 29% | 26% |
| /chairs/steelcase-gesture/ | 29 | 3 | 38% | 34% |
| /chairs/herman-miller-aeron/tall-people/ | 26 | 0 | — | 24% |
| /correct-chair-dimensions/ | 26 | 1 | 17% | 16% |
| /best-big-and-tall-office-chairs/ | 25 | 9 | 21% | 23% |
| /chairs/herman-miller-aeron/size-guide/ | 23 | 0 | — | 26% |
| /office-chairs-for-6-foot-5/ | 23 | 3 | — | 18% |
| /review/aeron-size-c/ | 21 | 3 | 71% | 42% |
| /office-chairs-for-6-foot-4/ | 18 | 6 | 57% | 19% |
| /refurbished-steelcase-leap-tall-people/ | 17 | 0 | — | 35% |
| /review/sihoo-doro-s300/ | 17 | 0 | 11% | 28% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 63, "escalated": 3, "regressed": 3, "total": 69, "retractedSkipped": 0}
  - **/best-office-chairs-under-500/** — position 9.3 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **collector:amazon** — collector amazon unhealthy — affiliate data is 22 days stale — newest export is raw/affiliate/2026-09-17-amazon-associates-report.md (2026-09-17, dated by filename), SLA is 7 days. Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not contain it, and a window that is guessed rather than recorded has already caused one export in this archive to be misread as a second positive month. Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers affiliate revenue.
  - **/correct-chair-dimensions/** — position 10.3 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 9.4 does not satisfy < 8.1
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

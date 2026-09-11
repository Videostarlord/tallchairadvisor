# Session Brief — 2026-09-11

_Generated 2026-09-11T04:06:50.954Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 97,282 impressions, **289 clicks**, CTR 0.297%, avg position 8.2
- **Momentum:** Impressions down 8.6% WoW (4749 vs 5198), clicks down 32.1% (19 vs 28), avg position improving (1.1 spots)
- **GA4 28d:** 1832 sessions total — but Direct is 1556 (85%), engagement 12.0%, 29s.
  **Treat ~282 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 1556 (84.9%)
  - Organic Search: 168 (9.2%)
  - AI Assistant: 92 (5.0%)
  - Unassigned: 12 (0.7%)
  - Referral: 7 (0.4%)
  - Organic Social: 3 (0.2%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 659.5 | 2836 | 15976 | 8.6 |
| /chairs/herman-miller-aeron/ | content-depth | 280.5 | 167 | 561 | 17.5 |
| /back-pain-spine-height/ | content-depth | 238 | 476 | 476 | 15.1 |
| /leg-pain-circulation/ | content-depth | 232.5 | 465 | 465 | 16.7 |
| /pain-ergonomics/ | content-depth | 230 | 460 | 460 | 28.5 |
| /review/aeron-size-c/ | near-p1 | 171.7 | 927 | 4318 | 10.8 |
| /office-chairs-for-tall-people/ | near-p1 | 123.6 | 581 | 4245 | 9.4 |
| /office-chairs-for-6-foot-5/ | near-p1 | 121.4 | 443 | 443 | 7.3 |

**6 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/correct-chair-dimensions/` — 18,568 impressions, only 10.0% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/best-office-chairs-under-500/` — 1,581 impressions, only 3.7% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,812 impressions, only 3.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 6,707 impressions, only 6.8% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 35,631 impressions, only 4.3% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/seat-depth/` — 1,180 impressions, only 6.4% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 111 | 40 | 47% | 15% |
| /review/gesture/ | 80 | 4 | 12% | 22% |
| /correct-chair-dimensions/ | 74 | 0 | 34% | 16% |
| /review/leap-plus/ | 66 | 6 | 38% | 32% |
| / | 60 | 0 | 9% | 26% |
| /best-big-and-tall-office-chairs/ | 59 | 8 | 16% | 23% |
| /review/sihoo-doro-s300/ | 54 | 0 | 8% | 28% |
| /office-chairs-for-6-foot-7/ | 50 | 4 | 91% | 20% |
| /best-office-chairs-under-500/ | 49 | 5 | 40% | 26% |
| /chairs/steelcase-gesture/ | 44 | 1 | 29% | 34% |
| /knee-pain-seat-depth/ | 44 | 0 | 23% | 20% |
| /review/aeron-size-c/ | 44 | 0 | — | 42% |
| /chairs/herman-miller-aeron/tall-people/ | 43 | 0 | — | 24% |
| /office-chairs-for-6-foot-5/ | 43 | 2 | 4% | 18% |
| /seat-cushion-height-tall-people/ | 40 | 0 | — | 72% |

## Money

- Latest hand export: `raw/affiliate/2026-08-30-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 64, "escalated": 3, "regressed": 2, "total": 69, "retractedSkipped": 0}
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **collector:amazon** — collector amazon unhealthy — affiliate data is 12 days stale — newest export is raw/affiliate/2026-08-30-amazon-associates-report.md (2026-08-30, dated by filename), SLA is 7 days. Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not contain it, and a window that is guessed rather than recorded has already caused one export in this archive to be misread as a second positive month. Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers affiliate revenue.
  - **/correct-chair-dimensions/** — position 9.8 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 9.4 does not satisfy < 8.1
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]
  - **/correct-chair-dimensions/** — position 9.8 does not satisfy < 9.6

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

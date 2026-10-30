# Session Brief — 2026-10-30

_Generated 2026-10-30T05:17:50.861Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 47,092 impressions, **268 clicks**, CTR 0.569%, avg position 8.8
- **Momentum:** Impressions down 13.3% WoW (1688 vs 1948), clicks up 54.5% (17 vs 11), avg position improving (1.1 spots)
- **GA4 28d:** 656 sessions total — but Direct is 430 (66%), engagement 27.0%, 71s.
  **Treat ~227 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 430 (65.5%)
  - Organic Search: 144 (22.0%)
  - AI Assistant: 40 (6.1%)
  - Unassigned: 22 (3.4%)
  - Organic Social: 16 (2.4%)
  - Referral: 5 (0.8%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 350.8 | 1403 | 8430 | 8.0 |
| /chairs/herman-miller-aeron/size-guide/ | content-depth | 260.5 | 521 | 521 | 25.9 |
| /chairs/herman-miller-aeron/ | content-depth | 258 | 516 | 516 | 18.2 |
| /pain-ergonomics/ | content-depth | 178.5 | 357 | 357 | 21.0 |
| /chair-headrest-tall-people/ | near-p1 | 152.9 | 558 | 558 | 7.3 |
| /chairs/steelcase-gesture/weight-limit/ | near-p1 | 152.4 | 602 | 602 | 7.9 |
| /chairs/steelcase-leap-plus/tall-people/ | near-p1 | 142.7 | 535 | 535 | 7.5 |
| /chairs/steelcase-leap-plus/ | near-p1 | 123.8 | 526 | 526 | 8.5 |

**7 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/office-chairs-for-tall-people/` — 2,908 impressions, only 9.6% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/best-office-chairs-under-500/` — 1,616 impressions, only 14.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/correct-chair-dimensions/` — 7,271 impressions, only 9.3% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 3,608 impressions, only 8.1% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,840 impressions, only 3.0% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 8,073 impressions, only 3.4% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/aeron-size-c/` — 1,521 impressions, only 12.8% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 98 | 37 | 55% | 15% |
| / | 56 | 1 | 22% | 26% |
| /review/leap-plus/ | 37 | 6 | 24% | 32% |
| /best-office-chairs-under-500/ | 34 | 7 | 19% | 26% |
| /review/gesture/ | 30 | 2 | 6% | 22% |
| /chairs/herman-miller-aeron/size-guide/ | 22 | 0 | — | 26% |
| /chairs/herman-miller-aeron/ | 20 | 0 | — | 33% |
| /review/aeron-size-c/ | 20 | 2 | — | 42% |
| /knee-pain-seat-depth/ | 19 | 3 | 60% | 20% |
| /chairs/herman-miller-aeron/tall-people/ | 18 | 0 | — | 24% |
| /chairs/steelcase-gesture/weight-limit/ | 17 | 1 | — | 33% |
| /correct-chair-dimensions/ | 17 | 0 | — | 16% |
| /review/sihoo-doro-s300/ | 17 | 0 | — | 28% |
| /chairs/steelcase-leap-plus/weight-limit/ | 16 | 1 | — | 30% |
| /chairs/steelcase-gesture/ | 14 | 1 | 92% | 34% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 63, "escalated": 3, "regressed": 3, "total": 69, "retractedSkipped": 0}
  - **collector:clarity** — collector clarity healthy, 43 row(s) at 2026-10-30T05:16:34.777Z
  - **/best-office-chairs-under-500/** — position 10 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **collector:amazon** — collector amazon unhealthy — affiliate data is 43 days stale — newest export is raw/affiliate/2026-09-17-amazon-associates-report.md (2026-09-17, dated by filename), SLA is 7 days. Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not contain it, and a window that is guessed rather than recorded has already caused one export in this archive to be misread as a second positive month. Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers affiliate revenue.
  - **/correct-chair-dimensions/** — position 10.2 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 8.9 does not satisfy < 8.1

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

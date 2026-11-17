# Session Brief — 2026-11-17

_Generated 2026-11-17T07:30:04.151Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 39,211 impressions, **277 clicks**, CTR 0.706%, avg position 8.6
- **Momentum:** Impressions down 3.3% WoW (2288 vs 2366), clicks up 4% (26 vs 25), avg position stable
- **GA4 28d:** 678 sessions total — but Direct is 497 (73%), engagement 28.0%, 82s.
  **Treat ~183 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 497 (73.3%)
  - Organic Search: 159 (23.5%)
  - AI Assistant: 17 (2.5%)
  - Unassigned: 5 (0.7%)
  - Referral: 2 (0.3%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /monitor-arm-tall-people/ | near-p1 | 654.4 | 1996 | 2959 | 6.1 |
| /chairs/herman-miller-aeron/size-guide/ | content-depth | 455 | 402 | 910 | 23.3 |
| /chairs/herman-miller-aeron/ | content-depth | 277.5 | 201 | 555 | 24.9 |
| /review/leap-plus/ | near-p1 | 247.9 | 967 | 5960 | 7.8 |
| /pain-ergonomics/ | content-depth | 151 | 302 | 302 | 15.6 |
| /office-chairs-for-6-foot-3/ | near-p1 | 148.2 | 541 | 541 | 7.3 |
| /chair-headrest-tall-people/ | near-p1 | 144.2 | 512 | 512 | 7.1 |
| /chairs/steelcase-gesture/weight-limit/ | near-p1 | 142.4 | 541 | 541 | 7.6 |

**5 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/office-chairs-for-tall-people/` — 3,065 impressions, only 14.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/correct-chair-dimensions/` — 4,940 impressions, only 9.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 2,929 impressions, only 10.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,458 impressions, only 2.8% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 4,908 impressions, only 3.1% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 128 | 67 | 29% | 15% |
| / | 46 | 0 | — | 26% |
| /review/leap-plus/ | 45 | 4 | 35% | 32% |
| /seat-cushion-height-tall-people/ | 34 | 3 | — | 72% |
| /review/gesture/ | 30 | 1 | — | 22% |
| /review/aeron-size-c/ | 27 | 3 | — | 42% |
| /chairs/herman-miller-aeron/tall-people/ | 26 | 0 | — | 24% |
| /chairs/steelcase-gesture/ | 26 | 3 | 25% | 34% |
| /correct-chair-dimensions/ | 26 | 0 | 6% | 16% |
| /knee-pain-seat-depth/ | 25 | 0 | 26% | 20% |
| /best-office-chairs-under-500/ | 23 | 11 | — | 26% |
| /chair-headrest-tall-people/ | 23 | 0 | — | 61% |
| /chairs/steelcase-leap-plus/ | 22 | 6 | 49% | 25% |
| /office-chairs-for-6-foot-5/ | 22 | 4 | 17% | 18% |
| /office-chairs-for-6-foot-7/ | 21 | 1 | — | 20% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 64, "escalated": 2, "regressed": 3, "total": 69, "retractedSkipped": 0}
  - **/best-office-chairs-under-500/** — position 10.4 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **collector:amazon** — collector amazon unhealthy — affiliate data is 61 days stale — newest export is raw/affiliate/2026-09-17-amazon-associates-report.md (2026-09-17, dated by filename), SLA is 7 days. Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not contain it, and a window that is guessed rather than recorded has already caused one export in this archive to be misread as a second positive month. Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers affiliate revenue.
  - **/correct-chair-dimensions/** — position 9.6 does not satisfy < 9.6
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]
  - **/best-office-chairs-under-500/** — position 10.4 does not satisfy < 9.1

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

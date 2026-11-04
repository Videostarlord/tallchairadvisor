# Session Brief — 2026-11-04

_Generated 2026-11-04T05:47:10.582Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 44,097 impressions, **270 clicks**, CTR 0.612%, avg position 8.7
- **Momentum:** Impressions up 26.7% WoW (2139 vs 1688), clicks up 17.6% (20 vs 17), avg position stable
- **GA4 28d:** 607 sessions total — but Direct is 415 (68%), engagement 24.4%, 64s.
  **Treat ~194 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 415 (68.4%)
  - Organic Search: 124 (20.4%)
  - AI Assistant: 27 (4.4%)
  - Unassigned: 23 (3.8%)
  - Organic Social: 16 (2.6%)
  - Referral: 4 (0.7%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 328.6 | 1298 | 7533 | 7.9 |
| /chairs/herman-miller-aeron/size-guide/ | content-depth | 326.5 | 301 | 653 | 24.8 |
| /monitor-arm-tall-people/ | near-p1 | 268.7 | 900 | 1746 | 6.7 |
| /chairs/herman-miller-aeron/ | content-depth | 256 | 512 | 512 | 20.5 |
| /pain-ergonomics/ | content-depth | 169 | 338 | 338 | 19.6 |
| /chair-headrest-tall-people/ | near-p1 | 160.8 | 587 | 587 | 7.3 |
| /office-chairs-for-6-foot-3/ | near-p1 | 159.2 | 597 | 597 | 7.5 |
| /chairs/steelcase-gesture/weight-limit/ | near-p1 | 147.7 | 576 | 576 | 7.8 |

**6 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/office-chairs-for-tall-people/` — 2,835 impressions, only 10.8% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/correct-chair-dimensions/` — 6,520 impressions, only 9.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 3,367 impressions, only 8.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,749 impressions, only 2.9% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 6,604 impressions, only 3.4% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/aeron-size-c/` — 1,305 impressions, only 12.9% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 99 | 36 | 44% | 15% |
| / | 46 | 1 | — | 26% |
| /review/leap-plus/ | 35 | 6 | — | 32% |
| /review/gesture/ | 25 | 1 | 20% | 22% |
| /best-office-chairs-under-500/ | 20 | 3 | — | 26% |
| /review/aeron-size-c/ | 20 | 0 | — | 42% |
| /knee-pain-seat-depth/ | 19 | 0 | — | 20% |
| /review/sihoo-doro-s300/ | 18 | 0 | — | 28% |
| /chairs/herman-miller-aeron/ | 17 | 0 | — | 33% |
| /chairs/steelcase-gesture/ | 17 | 0 | — | 34% |
| /chairs/steelcase-gesture/weight-limit/ | 17 | 1 | — | 33% |
| /chair-headrest-tall-people/ | 15 | 0 | — | 61% |
| /chairs/herman-miller-aeron/tall-people/ | 15 | 0 | — | 24% |
| /correct-chair-dimensions/ | 15 | 0 | 14% | 16% |
| /seat-cushion-height-tall-people/ | 14 | 0 | 32% | 72% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 63, "escalated": 3, "regressed": 3, "total": 69, "retractedSkipped": 0}
  - **/best-office-chairs-under-500/** — position 10.1 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **collector:amazon** — collector amazon unhealthy — affiliate data is 48 days stale — newest export is raw/affiliate/2026-09-17-amazon-associates-report.md (2026-09-17, dated by filename), SLA is 7 days. Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not contain it, and a window that is guessed rather than recorded has already caused one export in this archive to be misread as a second positive month. Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers affiliate revenue.
  - **/correct-chair-dimensions/** — position 10.2 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 8.5 does not satisfy < 8.1
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

# Session Brief — 2026-09-30

_Generated 2026-09-30T05:04:47.479Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 72,159 impressions, **273 clicks**, CTR 0.378%, avg position 8.3
- **Momentum:** Impressions down 11.1% WoW (3589 vs 4036), clicks up 64.3% (23 vs 14), avg position stable
- **GA4 28d:** 922 sessions total — but Direct is 606 (66%), engagement 25.9%, 74s.
  **Treat ~322 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 606 (65.7%)
  - Organic Search: 186 (20.2%)
  - AI Assistant: 115 (12.5%)
  - Unassigned: 9 (1.0%)
  - Referral: 5 (0.5%)
  - Cross-network: 4 (0.4%)
  - Organic Social: 3 (0.3%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 502.9 | 2087 | 12484 | 8.3 |
| /chairs/herman-miller-aeron/ | content-depth | 283.5 | 567 | 567 | 16.4 |
| /pain-ergonomics/ | content-depth | 218 | 436 | 436 | 26.9 |
| /chairs/steelcase-leap-plus/ | near-p1 | 150.3 | 571 | 571 | 7.6 |
| /chairs/steelcase-leap-plus/tall-people/ | near-p1 | 135.4 | 562 | 562 | 8.3 |
| /office-chairs-for-6-foot-6/ | near-p1 | 131.5 | 559 | 559 | 8.5 |
| /office-chairs-for-6-foot-5/ | near-p1 | 124.1 | 453 | 453 | 7.3 |
| /chair-headrest-tall-people/ | near-p1 | 113.5 | 420 | 420 | 7.4 |

**7 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/correct-chair-dimensions/` — 12,287 impressions, only 10.7% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/best-office-chairs-under-500/` — 1,618 impressions, only 7.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/office-chairs-for-tall-people/` — 3,394 impressions, only 10.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 2,007 impressions, only 3.0% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 5,423 impressions, only 5.8% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 21,770 impressions, only 4.6% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/seat-depth/` — 1,163 impressions, only 4.9% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 119 | 52 | 42% | 15% |
| / | 62 | 0 | 75% | 26% |
| /review/gesture/ | 59 | 1 | 28% | 22% |
| /correct-chair-dimensions/ | 51 | 1 | — | 16% |
| /review/leap-plus/ | 50 | 12 | 12% | 32% |
| /best-big-and-tall-office-chairs/ | 40 | 12 | — | 23% |
| /best-office-chairs-under-500/ | 38 | 6 | 72% | 26% |
| /chairs/steelcase-gesture/ | 37 | 2 | 97% | 34% |
| /office-chairs-for-6-foot-7/ | 33 | 5 | — | 20% |
| /office-chairs-for-6-foot-5/ | 32 | 4 | — | 18% |
| /review/sihoo-doro-s300/ | 26 | 0 | — | 28% |
| /chairs/herman-miller-aeron/tall-people/ | 25 | 0 | — | 24% |
| /review/aeron-size-c/ | 24 | 1 | — | 42% |
| /aeron-vs-gesture/ | 20 | 0 | — | 26% |
| /chairs/herman-miller-aeron/size-guide/ | 20 | 0 | 36% | 26% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 63, "escalated": 3, "regressed": 3, "total": 69, "retractedSkipped": 0}
  - **/best-office-chairs-under-500/** — position 9.5 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **collector:amazon** — collector amazon unhealthy — affiliate data is 13 days stale — newest export is raw/affiliate/2026-09-17-amazon-associates-report.md (2026-09-17, dated by filename), SLA is 7 days. Amazon Associates → Reports → Download Report (all four: Category, Linked Product, Top Sellers, Tracking ID). Drop the CSVs in raw/affiliate/YYYY-MM-DD-amazon-csv/ and RECORD THE SELECTED DATE RANGE — the CSV does not contain it, and a window that is guessed rather than recorded has already caused one export in this archive to be misread as a second positive month. Amazon Associates exposes no reporting API for individual associates (PRD §4, §10.2), and the 2026-08-09 session-replay workaround was retired 2026-08-26 — see wiki/synthesis/decisions-log.md. Affiliate data is hand-exported by Jackson. This collector reports export staleness only; it never pulls, estimates, or infers affiliate revenue.
  - **/correct-chair-dimensions/** — position 10.1 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 9.7 does not satisfy < 8.1
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

# Session Brief — 2026-09-21

_Generated 2026-09-21T04:26:14.294Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 92,266 impressions, **281 clicks**, CTR 0.305%, avg position 8.1
- **Momentum:** Impressions down 14.6% WoW (4056 vs 4749), clicks up 5.3% (20 vs 19), avg position improving (0.6 spots)
- **GA4 28d:** 1578 sessions total — but Direct is 1248 (79%), engagement 15.8%, 41s.
  **Treat ~344 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 1248 (79.1%)
  - Organic Search: 204 (12.9%)
  - AI Assistant: 111 (7.0%)
  - Unassigned: 17 (1.1%)
  - Referral: 7 (0.4%)
  - Organic Social: 3 (0.2%)
  - Cross-network: 2 (0.1%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 605.2 | 2572 | 15539 | 8.5 |
| /chairs/herman-miller-aeron/ | content-depth | 295 | 175 | 590 | 17.5 |
| /leg-pain-circulation/ | content-depth | 256.5 | 55 | 513 | 16.1 |
| /pain-ergonomics/ | content-depth | 227.5 | 455 | 455 | 28.0 |
| /review/aeron-size-c/ | near-p1 | 164.6 | 864 | 4068 | 10.5 |
| /chairs/steelcase-leap-plus/ | near-p1 | 128.1 | 493 | 493 | 7.7 |
| /office-chairs-for-6-foot-5/ | near-p1 | 121.6 | 444 | 444 | 7.3 |
| /refurbished-steelcase-leap-tall-people/ | near-p1 | 117 | 509 | 509 | 8.7 |

**7 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/correct-chair-dimensions/` — 16,837 impressions, only 10.1% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/best-office-chairs-under-500/` — 1,655 impressions, only 4.7% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/office-chairs-for-tall-people/` — 3,907 impressions, only 14.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,933 impressions, only 3.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 6,481 impressions, only 5.9% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 32,822 impressions, only 4.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/seat-depth/` — 1,227 impressions, only 6.4% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 127 | 48 | 29% | 15% |
| /review/gesture/ | 78 | 3 | 11% | 22% |
| /correct-chair-dimensions/ | 75 | 0 | — | 16% |
| /review/leap-plus/ | 70 | 8 | 25% | 32% |
| /best-big-and-tall-office-chairs/ | 58 | 10 | — | 23% |
| / | 55 | 0 | — | 26% |
| /best-office-chairs-under-500/ | 51 | 8 | — | 26% |
| /chairs/steelcase-gesture/ | 47 | 2 | — | 34% |
| /office-chairs-for-6-foot-5/ | 47 | 3 | — | 18% |
| /office-chairs-for-6-foot-7/ | 47 | 5 | — | 20% |
| /review/sihoo-doro-s300/ | 47 | 0 | 19% | 28% |
| /knee-pain-seat-depth/ | 40 | 0 | — | 20% |
| /review/aeron-size-c/ | 40 | 0 | — | 42% |
| /chairs/herman-miller-aeron/tall-people/ | 35 | 0 | 34% | 24% |
| /chairs/steelcase-leap-plus/ | 35 | 0 | — | 25% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 65, "escalated": 3, "regressed": 1, "total": 69, "retractedSkipped": 0}
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **/correct-chair-dimensions/** — position 9.8 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 9.7 does not satisfy < 8.1
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]
  - **/correct-chair-dimensions/** — position 9.8 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 9.7 does not satisfy < 8.1

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

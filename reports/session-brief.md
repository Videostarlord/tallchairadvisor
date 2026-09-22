# Session Brief — 2026-09-22

_Generated 2026-09-22T04:21:35.272Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 85,473 impressions, **282 clicks**, CTR 0.330%, avg position 8.1
- **Momentum:** Impressions down 2.1% WoW (3971 vs 4056), clicks down 20% (16 vs 20), avg position stable
- **GA4 28d:** 1266 sessions total — but Direct is 942 (74%), engagement 20.0%, 56s.
  **Treat ~331 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 942 (74.4%)
  - Organic Search: 199 (15.7%)
  - AI Assistant: 107 (8.5%)
  - Unassigned: 13 (1.0%)
  - Referral: 8 (0.6%)
  - Organic Social: 3 (0.2%)
  - Cross-network: 1 (0.1%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 542.4 | 2251 | 14732 | 8.3 |
| /chairs/herman-miller-aeron/ | content-depth | 295 | 171 | 590 | 17.0 |
| /leg-pain-circulation/ | content-depth | 280.5 | 56 | 561 | 15.4 |
| /pain-ergonomics/ | content-depth | 221 | 442 | 442 | 27.6 |
| /review/aeron-size-c/ | near-p1 | 148.8 | 729 | 3564 | 9.8 |
| /chairs/steelcase-leap-plus/ | near-p1 | 140.5 | 534 | 534 | 7.6 |
| /office-chairs-for-6-foot-5/ | near-p1 | 127.4 | 465 | 465 | 7.3 |
| /refurbished-steelcase-leap-tall-people/ | near-p1 | 124.4 | 541 | 541 | 8.7 |

**7 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/correct-chair-dimensions/` — 15,064 impressions, only 10.1% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/best-office-chairs-under-500/` — 1,684 impressions, only 6.1% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/office-chairs-for-tall-people/` — 3,671 impressions, only 10.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,973 impressions, only 3.4% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 6,204 impressions, only 5.4% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 29,116 impressions, only 4.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/seat-depth/` — 1,197 impressions, only 5.8% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 115 | 49 | 49% | 15% |
| /review/gesture/ | 71 | 2 | 13% | 22% |
| /review/leap-plus/ | 68 | 12 | 65% | 32% |
| /correct-chair-dimensions/ | 65 | 1 | 98% | 16% |
| / | 51 | 0 | 22% | 26% |
| /best-big-and-tall-office-chairs/ | 48 | 12 | 100% | 23% |
| /chairs/steelcase-gesture/ | 44 | 2 | 57% | 34% |
| /best-office-chairs-under-500/ | 42 | 5 | 61% | 26% |
| /office-chairs-for-6-foot-7/ | 40 | 5 | — | 20% |
| /review/sihoo-doro-s300/ | 39 | 0 | 11% | 28% |
| /office-chairs-for-6-foot-5/ | 37 | 4 | — | 18% |
| /chairs/steelcase-leap-plus/ | 33 | 0 | — | 25% |
| /review/aeron-size-c/ | 33 | 1 | 12% | 42% |
| /knee-pain-seat-depth/ | 31 | 0 | — | 20% |
| /chairs/herman-miller-aeron/tall-people/ | 29 | 0 | — | 24% |

## Money

- Latest hand export: `raw/affiliate/2026-09-17-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$20.55**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 64, "escalated": 3, "regressed": 2, "total": 69, "retractedSkipped": 0}
  - **/best-office-chairs-under-500/** — position 9.3 does not satisfy < 9.1
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **/correct-chair-dimensions/** — position 9.8 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 9.8 does not satisfy < 8.1
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]
  - **/best-office-chairs-under-500/** — position 9.3 does not satisfy < 9.1

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

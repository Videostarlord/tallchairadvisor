# Session Brief — 2026-09-06

_Generated 2026-09-06T04:03:58.699Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 99,939 impressions, **291 clicks**, CTR 0.291%, avg position 8.1
- **Momentum:** Impressions up 17% WoW (5198 vs 4441), clicks down 12.5% (28 vs 32), avg position stable
- **GA4 28d:** 2188 sessions total — but Direct is 1929 (88%), engagement 10.3%, 23s.
  **Treat ~268 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 1929 (88.2%)
  - Organic Search: 161 (7.4%)
  - AI Assistant: 85 (3.9%)
  - Unassigned: 13 (0.6%)
  - Referral: 9 (0.4%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 634.5 | 2760 | 15482 | 8.7 |
| /chairs/herman-miller-aeron/ | content-depth | 262.5 | 164 | 525 | 17.9 |
| /pain-ergonomics/ | content-depth | 238 | 139 | 476 | 28.3 |
| /leg-pain-circulation/ | content-depth | 201.5 | 403 | 403 | 16.1 |
| /review/aeron-size-c/ | near-p1 | 190.8 | 1040 | 4661 | 10.9 |
| /office-chairs-for-tall-people/ | near-p1 | 174.4 | 785 | 4616 | 9.0 |
| /office-chairs-for-6-foot-5/ | near-p1 | 113.5 | 420 | 420 | 7.4 |
| /chairs/steelcase-leap-plus/ | near-p1 | 105.3 | 421 | 421 | 8.0 |

**6 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/correct-chair-dimensions/` — 19,442 impressions, only 9.7% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/best-office-chairs-under-500/` — 1,568 impressions, only 2.5% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,623 impressions, only 3.3% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 38,004 impressions, only 4.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 6,724 impressions, only 7.3% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/seat-depth/` — 1,096 impressions, only 7.0% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 130 | 49 | 32% | 15% |
| /review/gesture/ | 90 | 4 | — | 22% |
| /correct-chair-dimensions/ | 75 | 0 | 49% | 16% |
| / | 70 | 0 | 13% | 26% |
| /review/leap-plus/ | 68 | 3 | 4% | 32% |
| /best-big-and-tall-office-chairs/ | 58 | 12 | 17% | 23% |
| /best-office-chairs-under-500/ | 58 | 16 | 48% | 26% |
| /review/sihoo-doro-s300/ | 55 | 0 | — | 28% |
| /knee-pain-seat-depth/ | 51 | 0 | 65% | 20% |
| /chairs/herman-miller-aeron/tall-people/ | 50 | 0 | 11% | 24% |
| /review/aeron-size-c/ | 49 | 0 | — | 42% |
| /chairs/steelcase-gesture/ | 47 | 1 | — | 34% |
| /office-chairs-for-6-foot-5/ | 47 | 0 | — | 18% |
| /seat-cushion-height-tall-people/ | 47 | 0 | — | 72% |
| /aeron-vs-gesture/ | 46 | 0 | — | 26% |

## Money

- Latest hand export: `raw/affiliate/2026-08-30-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$19.11**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 64, "escalated": 4, "regressed": 1, "total": 69, "retractedSkipped": 0}
  - **/correct-chair-dimensions/** — missing Direct Answer block
  - **/review/leap-plus/** — position 8.7 does not satisfy < 8.7
  - **/correct-chair-dimensions/** — position 9.7 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 9 does not satisfy < 8.1
  - **/chair-specs/** — meta description is 215 chars, outside [130, 165]
  - **/review/leap-plus/** — position 8.7 does not satisfy < 8.7

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

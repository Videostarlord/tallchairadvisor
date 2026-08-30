# Session Brief — 2026-08-30

_Generated 2026-08-30T04:54:34.841Z. Deterministic, no model call. Everything below is joined from the pipeline's own data._

## Constraints on this session (read before proposing anything)

- **`no-snippet-work-on-aio-eaten-informational`** — Absolutely stop: ... farming AI-Overview-eaten informational queries (knee-pain, correct-dimensions, spec pages); meta-tweaking suppressed pages
- **`no-ctr-iteration-below-position-8`** — no meta/CTR iteration below pos 8
- **`no-thin-content-expansion-during-content-freeze`** — freeze new content ~30 days ... ship the monetization pivot before writing anything new

## Traffic

- **GSC 90d:** 100,562 impressions, **283 clicks**, CTR 0.281%, avg position 8.1
- **Momentum:** Impressions up 7.6% WoW (4747 vs 4410), clicks up 39.1% (32 vs 23), avg position stable
- **GA4 28d:** 2050 sessions total — but Direct is 1786 (87%), engagement 11.1%, 26s.
  **Treat ~271 non-Direct sessions as the real number.** Site-wide GA4 engagement metrics are not trustworthy while Direct dominates.
  - Direct: 1786 (87.1%)
  - Organic Search: 160 (7.8%)
  - AI Assistant: 95 (4.6%)
  - Unassigned: 9 (0.4%)
  - Referral: 7 (0.3%)

## Opportunity (scored on ADDRESSABLE impressions)

| page | type | score | addressable | of total | pos |
|---|---|---:|---:|---:|---:|
| /review/leap-plus/ | near-p1 | 612.6 | 2665 | 14827 | 8.7 |
| /chairs/herman-miller-aeron/ | content-depth | 261.5 | 167 | 523 | 18.4 |
| /pain-ergonomics/ | content-depth | 240.5 | 149 | 481 | 29.1 |
| /review/aeron-size-c/ | near-p1 | 193 | 1052 | 4692 | 10.9 |
| /leg-pain-circulation/ | content-depth | 192 | 384 | 384 | 16.0 |
| /office-chairs-for-tall-people/ | near-p1 | 190.5 | 867 | 4772 | 9.1 |
| /aeron-vs-gesture/ | near-p1 | 113.6 | 460 | 460 | 8.1 |
| /office-chairs-for-6-foot-5/ | near-p1 | 110.1 | 413 | 413 | 7.5 |

**6 page(s) are AI/agent retrieval, not human demand — do not plan CTR work on these:**

- `/correct-chair-dimensions/` — 19,563 impressions, only 9.7% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/best-office-chairs-under-500/` — 1,586 impressions, only 2.3% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/herman-miller-aeron/tall-people/` — 1,548 impressions, only 3.4% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/knee-pain-seat-depth/` — 39,186 impressions, only 4.2% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/review/gesture/` — 6,722 impressions, only 7.8% carry a named query. GEO asset; judge on AI-assistant referrals.
- `/chairs/steelcase-gesture/seat-depth/` — 1,060 impressions, only 7.4% carry a named query. GEO asset; judge on AI-assistant referrals.

## Conversion join — affiliate clicks × scroll depth × CTA position

_The 2026-08-28 finding: the page with its first CTA at 16% took 49 of 96 site-wide affiliate clicks; every page past ~60% took 0–3._

_`1st CTA at` is a MARKUP measure and overstates depth — nav is verbose in HTML but short on screen. Good for ranking pages against each other; measure the rendered position in a browser before acting on any single number._

| page | sessions | aff clicks | avg scroll | 1st CTA at (markup) |
|---|---:|---:|---:|---:|
| /office-chairs-for-tall-people/ | 125 | 49 | 41% | 16% |
| /review/gesture/ | 88 | 5 | 53% | 22% |
| / | 70 | 0 | 23% | 26% |
| /correct-chair-dimensions/ | 67 | 0 | 56% | 22% |
| /review/leap-plus/ | 63 | 3 | 45% | 33% |
| /best-big-and-tall-office-chairs/ | 62 | 12 | 45% | 54% |
| /best-office-chairs-under-500/ | 56 | 16 | — | 46% |
| /review/aeron-size-c/ | 52 | 0 | 7% | 45% |
| /review/sihoo-doro-s300/ | 51 | 0 | 18% | 28% |
| /knee-pain-seat-depth/ | 48 | 0 | 52% | 67% |
| /chairs/herman-miller-aeron/tall-people/ | 47 | 1 | — | 53% |
| /office-chairs-for-6-foot-4/ | 47 | 0 | — | 76% |
| /office-chairs-for-6-foot-5/ | 45 | 0 | 13% | 50% |
| /aeron-vs-gesture/ | 44 | 0 | — | 26% |
| /chairs/steelcase-gesture/ | 44 | 1 | 40% | 34% |

## Money

- Latest hand export: `raw/affiliate/2026-08-28-amazon-associates-report.md` (0d old on disk)
- Pipeline spend this ledger: **$16.16**
- Kill-list gate: **$100/month for 2–3 consecutive months.** See `wiki/pages/concepts/affiliate-performance.md` for where the gate stands.

## Open work the pipeline is tracking

- Ledger: {"open": 0, "closed": 56, "escalated": 10, "regressed": 0, "total": 66, "retractedSkipped": 0}
  - **/review/leap-plus/** — position 8.7 does not satisfy < 8.7
  - **/correct-chair-dimensions/** — position 9.7 does not satisfy < 9.6
  - **/office-chairs-for-tall-people/** — position 9.1 does not satisfy < 8.1
  - **/chairs/herman-miller-aeron/size-guide/** — mobile render differs from baseline by 2.609% (threshold 2%)
  - **/chairs/steelcase-gesture/** — mobile render differs from baseline by 3.064% (threshold 2%)
  - **/monitor-arm-tall-people/** — mobile render differs from baseline by 3.678% (threshold 2%)

---

_Sections are generated from data only. Nothing here is a recommendation — the point is that a session starts from the same facts every time, in seconds rather than in twenty minutes of gathering._

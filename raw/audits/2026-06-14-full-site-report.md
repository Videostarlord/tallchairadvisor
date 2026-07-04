# TCA Full Site Report — June 14, 2026

**Data sources:** GSC (90-day ending Jun 14), GA4 (28-day ending Jun 14), Clarity (3-day ending Jun 14)

---

## Site-Wide Health at a Glance

| Metric | Value | Signal |
|--------|-------|--------|
| GSC Impressions (90d) | 42,738 | +85% vs prior period |
| GSC Clicks (90d) | 108 | +96% WoW surge |
| Avg CTR | 0.25% | Stuck — structural AIO problem |
| Avg Position | 9.2 | Improving (was 11.5 in May) |
| GA4 Sessions (28d) | 335 | Low absolute |
| Organic Share | 27.8% | Healthy for stage |
| Direct Share | 54.3% | Anomalous — likely misattributed ChatGPT |
| AI Assistant Sessions | 11 (GA4) + 56 ChatGPT | Site is getting cited |
| Affiliate Clicks (28d) | 20 | ~$0.10–$0.40 CPC estimated |
| Clarity Rage Clicks | 0 | No broken UX |
| Clarity Script Errors | 0 | Clean deploy |

**The single biggest story:** Impressions are growing fast (49.8% WoW) but CTR is locked at 0.25%. That gap is the whole problem. At pos 6.8 with 12,804 impressions, `/knee-pain-seat-depth/` should earn ~768 clicks at normal CTR. It's getting 13. AIO is eating ~98% of expected clicks on your top page.

---

## Complete Page Map — All 47 Pages

### TIER 1 — Working Pages (traffic + clicks + engagement)

| Page | GSC Impr | Pos | CTR | GA4 Sessions | Dwell | Affiliate Clicks | Clarity Scroll |
|------|----------|-----|-----|-------------|-------|-----------------|----------------|
| /review/leap-plus/ | 4,092 | 8.7 | 0.29% | 50 | 120s | 2 | 37% ⚠ |
| /best-office-chairs-under-500/ | n/a top-10 | — | — | 42 | 285s | 5 | n/a |
| /best-office-chairs/ | 1,490 | 21.1 | 0.27% | 34 | 88s | 8 | 100% |
| /review/aeron-size-c/ | 2,163 | 8.6 | 0.55% | 18 | 44s | 0 | 11% ⚠ |
| /office-chairs-for-tall-people/ | 2,224 | 10.5 | 0.58% | 18 | 47s | 0 | 48% |
| /correct-chair-dimensions/ | 6,505 | 10.9 | 0.15% | 13 | 245s | 0 | 57% |
| /chairs/steelcase-leap-plus/ | rising | 14.4 | — | 11 | 81s | 0 | n/a |

### TIER 2 — High Impressions, AIO Suppressed (broken CTR)

| Page | GSC Impr | Pos | CTR | Expected CTR | Clicks Stolen/90d |
|------|----------|-----|-----|-------------|-------------------|
| /knee-pain-seat-depth/ | 12,804 | 6.8 | 0.10% | ~6% | ~755 |
| /review/gesture/ | 6,299 | 7.9 | 0.10% | ~5% | ~305 |
| /correct-chair-dimensions/ | 6,505 | 10.9 | 0.15% | ~2.5% | ~153 |
| /chairs/steelcase-gesture/seat-depth/ | 1,125 | 8.0 | 0.09% | ~5% | ~55 |

These pages rank. Google's AI Overviews answer the query and users never click through. Meta rewrites won't fix this.

### TIER 3 — Rising Velocity (watch list)

| Page | Pos Now | Pos Prev | Δ | Impressions | Signal |
|------|---------|----------|---|-------------|--------|
| /office-chairs-for-tall-people/ | 15.7 | 18.6 | -2.9 | +305 | Strongest mover |
| /chairs/steelcase-leap-plus/ | 14.4 | 16.1 | -1.7 | +35 | Gaining |
| /aeron-vs-leap-plus/ | 8.7 | 9.5 | -0.8 | +56 | Near first page |
| /standing-desk-height-tall-people/ | 16.3 | 15.3 | +1.0 | +41 | Stable/early |
| /gesture-vs-leap-plus/ | 12.5 | — | — | 876 | Comparison page working |

### TIER 4 — Comparison/Stuck Pages

| Page | GSC Impr | Pos | CTR | Note |
|------|----------|-----|-----|------|
| /chairs/herman-miller-aeron/tall-people/ | 1,704 | 7.6 | 0.41% | Getting clicks, good |
| /aeron-vs-gesture/ | 876 | 8.5 | 0% | Zero clicks despite solid pos — SERP cannibalized |
| /chairs/herman-miller-aeron/ | ~51 | 15.7 | — | Rising stable |
| /chairs/steelcase-leap-plus/tall-people/ | low | — | — | ChatGPT landing (2 sessions) |

### TIER 5 — Dark Pages (no measurable traffic)

| Page | Status |
|------|--------|
| /shoulder-pain-tall-people/ | Invisible — written but not ranking |
| /back-pain-spine-height/ | Bot-only in Clarity (0 real sessions) |
| /leg-pain-circulation/ | No data anywhere |
| /heavy-duty-ergonomic-chairs-tall-people/ | New, no data yet |
| /why-standard-chairs-dont-fit/ | No GSC signal |
| /pain-ergonomics/ | No GSC signal |
| /how-to-adjust-chair/ | 2 Clarity sessions, low scroll (28%) |
| /office-chairs-for-6-foot-3/ through 6-foot-7/ | Barely visible; only /6-foot-4/ shows (1 Clarity session, 12% scroll) |
| /chairs/steelcase-gesture/tall-people/ | Fragmented, concentrated queries |
| /chairs/steelcase-gesture/seat-height/ | Minimal signal |
| /chairs/steelcase-leap-plus/seat-height/ | Minimal signal |
| /chairs/steelcase-leap-plus/weight-limit/ | 1 affiliate click (GA4) — some traffic |
| /chairs/herman-miller-aeron/seat-height/ | 2 Clarity sessions, 21% scroll |
| /chairs/herman-miller-aeron/size-guide/ | No GSC data yet (new page) |
| /fit-guides/ | 1 Clarity session, 63% scroll — engaged but invisible |
| /aeron-vs-leap-plus/ | 1 Clarity session, 15% scroll |
| /office-chair-return-policy/ | No data |

### Utility Pages (expected no traffic)
- /404/, /about/, /affiliate-disclosure/, /contact/, /privacy-policy/, /author/jackson-christopher/

---

## Clarity Behavioral Deep-Dive

**Device split:** 67.7% PC, 29% mobile, 3.2% tablet. Mobile scroll depth (40.9%) is slightly better than desktop (37.8%) — unusual, suggests desktop users are getting the answer fast from a table/spec and leaving.

**Dead clicks (only behavioral anomaly):**
- `/knee-pain-seat-depth/`: 2 dead clicks — users are clicking something that looks like a link but isn't (likely a spec number or heading)
- `/review/leap-plus/`: 1 dead click
- `/chairs/steelcase-leap-plus/tall-people/` (ChatGPT): 1 dead click

**No rage clicks, no script errors, no excessive scroll anywhere.** The site is technically clean.

**Scroll depth by page (ranked):**
1. `/best-office-chairs/` — 100%
2. `/review/leap-plus/?utm_source=chatgpt.com` — 79% (ChatGPT visitors read it)
3. `/knee-pain-seat-depth/` — 65%
4. `/fit-guides/` — 63%
5. `/correct-chair-dimensions/` — 57%
6. `/office-chairs-for-tall-people/` — 48%
7. `/aeron-vs-gesture/` — 36%
8. `/review/leap-plus/` — 37% (low scroll, high dwell — content front-loaded)
9. `/review/gesture/?utm_source=chatgpt.com` — 3% (ChatGPT visitors immediately leave)

---

## The 3 Biggest Findings

### 1. ChatGPT is sending real traffic but it's bouncing instantly on /review/gesture/

ChatGPT visits to `/review/gesture/?utm_source=chatgpt.com` scroll 3% and leave in 5 seconds. The same traffic on `/review/leap-plus/?utm_source=chatgpt.com` scrolls 79% and stays 123s. This is a content framing problem — ChatGPT is recommending the Gesture review to users who aren't ready to buy yet, and the page opens with something that doesn't match their intent. `/review/leap-plus/` opens with comparison content that satisfies comparison-stage buyers; `/review/gesture/` likely opens with first-person experience that works for late-stage buyers only.

**Action:** Add a "Who this review is for" or comparison hook in the first 200px of `/review/gesture/` to capture users arriving via ChatGPT who are still in the research phase.

### 2. /best-office-chairs-under-500/ is a hidden star with no GSC visibility

GA4 shows it as the #2 page by sessions (42), longest dwell time on the site (285s), 5 affiliate clicks — but it doesn't appear in the top-10 GSC. Traffic is coming from somewhere other than Google (direct, referral, or AI assistants). It's a high-intent page that's already engaging users and producing affiliate clicks, but Google hasn't ranked it yet.

**Action:** Build internal links into this page from `/best-office-chairs/`, `/office-chairs-for-tall-people/`, and the height-specific pages. It already converts; it needs ranking.

### 3. /best-office-chairs/ produces the most affiliate clicks (8 of 20) from pos 21

This is the money page stuck on page 2. Users who find it read 100% of it (Clarity) and click affiliate links at a higher rate than any other page. Moving from pos 21 to pos 10 could double affiliate revenue on its own.

**Action:** Full content expansion — "Why these specs matter at 6'+" section, a comparison table, internal links from all spec pages and reviews.

---

## Prioritized Recommendations

| Priority | Page | Action | Impact |
|----------|------|--------|--------|
| 1 | /knee-pain-seat-depth/ | AIO answer box at top (Cornell spec, prominent) | ~755 clicks/90d recovered if CTR goes to 1% |
| 2 | /review/gesture/ | Add comparison/research hook in first 200px | Retain ChatGPT visitors (currently 3% scroll) |
| 3 | /best-office-chairs-under-500/ | Internal link blitz + content expansion | Push from unranked → ranking |
| 4 | /best-office-chairs/ | Full content expansion for E-E-A-T | Most affiliate clicks, stuck pos 21 |
| 5 | /knee-pain-seat-depth/ | Fix dead click element | Remove friction, low effort |
| 6 | Tier 5 dark pages | Do not invest — let age or consolidate | Protect bandwidth |
| 7 | Direct traffic | Audit GA4 attribution on /best-office-chairs-under-500/ | Understand true channel split |

---

## Growth Trajectory

| Date | Impressions | Clicks | CTR | Position |
|------|-------------|--------|-----|----------|
| May 9 | 12,209 | 29 | 0.24% | 11.5 |
| May 18 | 19,437 | 46 | 0.24% | 10.6 |
| Jun 9 | 23,105 | 55 | 0.24% | 10.5 |
| Jun 14 | 42,738 | 108 | 0.25% | 9.2 |

The last week's jump (23K → 42K impressions, 55 → 108 clicks) in 5 days is the strongest signal since launch. Something Google processed recently caused a ranking surge across multiple pages. The site is in its best shape ever — but hundreds of clicks are being left on the table weekly due to AIO suppression on its biggest pages.

---
type: concept
last_updated: 2026-05-22
sources: [raw/audits/2026-05-22-semantic-intent-analysis.md]
tags: [gsc, semantic, identity, strategy, positioning]
---

# Semantic Intent Analysis — What Google Thinks TCA Is

**Data**: 90-day GSC (Feb 15 – May 16, 2026) | 17,877 impr | 41 clicks | 0.23% CTR

---

## Google's Current Semantic Model of TCA

Google is NOT filing TCA under "office chair reviews." It's filing TCA under **ergonomic measurement authority for oversize users** — specifically, a spec-verification source for tall users verifying fitment before a $1,000+ purchase.

Evidence: the dominant impression clusters are dimensional validation queries, not brand queries:
- "steelcase gesture seat depth range inches" (pos 4.2–6.1, 85 impr)
- "cornell ergonomics chair seat depth two fingers behind knee" (pos 7.6, 76 impr)
- "herman miller aeron size c seat height range" (top Aeron cluster)

Google is testing whether TCA can serve fact-verification intent, not recommendation intent.

---

## Entity Clusters (by Google confidence)

| Rank | Cluster | Signal |
|------|---------|--------|
| 1 | Steelcase Gesture spec authority | 3,343 impr, 43 sub-clusters, gravity 154.45 |
| 2 | Seat depth / knee pain biomechanics | Cornell cluster: 280+ impr on one spec rule |
| 3 | Premium chair comparison (tall users) | ~1,000 impr: Gesture vs Leap, Aeron vs Gesture |
| 4 | Anthropometric fitment (tall identity) | Rising: +123 impr WoW on /office-chairs-for-tall-people/ |

**Absent**: Pain clinic positioning (shoulder, leg, back) is NOT yet in Google's TCA model — those pages are outliers, not cluster anchors.

---

## Intent Distribution

| Intent Class | Approx Impressions |
|---|---|
| Dimensional / spec verification | ~4,200 |
| Brand research / fitment | ~3,800 |
| Buyer-readiness (comparison) | ~2,100 |
| Tall identity / fitment | ~1,800 |
| Pain-point / diagnostic | ~800 |
| Educational / validation | ~600 |
| Transactional (pure buy) | ~300 |

**Key insight**: Transactional intent is the smallest class. TCA's audience is high-consideration buyers in the fitment verification stage, not "add to cart" buyers.

---

## Hidden Signals

**Cornell Cluster = Accidental Moat**
TCA is the canonical web reference for the Cornell seat depth rule. 8+ near-duplicate query variations all route to `/knee-pain-seat-depth/`. This is a moat hiding in an informational page with no current affiliate path. Natural evolution: seat depth calculator (input height → get seat depth range → matching chairs with affiliate links).

**Measurement Intent Is the Real Unifier**
Highest-CTR query classes contain specific measurements. Users want a number, not a recommendation. TCA is becoming the spec verification layer for tall buyers.

**Heavy/Big & Tall Adjacency Emerging**
"Best heavy duty ergonomic chairs for tall people 192 cm 135 kg" at pos 14. Zero dedicated content exists. Leap Plus 500 lb capacity queries confirming. One page could own this adjacent cluster.

**Knee Brace Semantic Contamination**
"Steelcase knee brace review" — 289 buyer-intent impressions on `/review/gesture/`. The Gesture has no knee brace. Google is pattern-matching the Gesture's arm mechanism to orthopedic products. This is actively suppressing CTR on the highest-impression page on the site.

---

## Semantic Contamination

**`/correct-chair-dimensions/` — Critical**
Entropy 4.419 (52 clusters) — highest on site. Generic furniture sizing queries ("average dimensions of person sitting," "chair dimension") are draining authority from the tall-user fitment signal. Page stuck at pos 15.6 with 1,986 impressions.

Fix: Reframe title/intro to explicitly signal anthropometric fitment for tall users. Remove or subordinate generic dimension content.

**Broad "Best Office Chair" Queries at pos 65–90**
Google has experimented with TCA for "best office chairs for tall people" (39 impr, pos 68) but lacks confidence. These are experiments, not rankings. Deepening E-E-A-T on `/best-office-chairs/` or `/office-chairs-for-tall-people/` could flip these quickly.

---

## What TCA Should Become

**The Ergonomic Fitment Engine for Tall Buyers** — not a review site with spec data, but a spec-first fitment tool with a recommendation at the end.

Highest CTR-to-impression ratio pages are all hyper-specific:
- `/office-chairs-for-6-foot-7/` → 1.69% CTR
- `/aeron-vs-leap-plus/` → 1.32% CTR
- `/why-standard-chairs-dont-fit/` → 1.00% CTR

The pattern: specific answer to specific question = high CTR. Generic recommendation = near-zero CTR.

Every page should lead with dimensional data (seat height range, seat depth range, weight capacity) before any prose.

---

## Opportunity Ranking

| Rank | Page | Action | Leverage |
|------|------|--------|----------|
| 1 | /review/gesture/ | Rewrite with Jackson's body measurements (6'4") as lead | Highest impr volume, worst CTR (0.09%) |
| 2 | /gesture-vs-leap-plus/ | Push from pos 13.7 to top 6 | 94 buyer-intent impr; highest commercial density |
| 3 | /knee-pain-seat-depth/ | Build seat depth calculator | Cornell moat → affiliate conversion |
| 4 | /correct-chair-dimensions/ | Defragment (52→<10 clusters) | pos 15.6 → pos 8–10 likely |
| 5 | (new page) | Weight capacity guide for tall heavy users | No competition, adjacent moat |
| 6 | Height-specific pages | Add spec to title tags | pos 7–10, near-zero CTR → 2x |

---

## Competitive Defensibility

**Most defensible (AIO-resistant)**:
- Comparison queries with context-dependent answers (Gesture vs Leap Plus for *your* height/weight)
- First-person biomechanical data (Jackson's actual seat depth experience at 6'4")
- Spec comparison tables across multiple chairs (tools, not content)

**Least defensible**:
- Generic "best office chairs for tall people" listicles — AIO already synthesizes these. `/best-office-chairs/` 0% CTR at pos 22.4 is partially AIO suppression.

---

## Five Verdicts

| | |
|---|---|
| **What Google thinks TCA is** | Spec-verification authority for tall-user ergonomic chair fitment |
| **What TCA should become** | Spec-first fitment engine with interactive tools + first-person ME authority |
| **Highest leverage opportunity** | Expand /review/gesture/ with Jackson's actual body fitment data |
| **Biggest current weakness** | /correct-chair-dimensions/ entropy 4.419 draining authority |
| **Most important next step** | Rewrite Gesture review with concrete measurements from a real 6'4" body |
| **Long-term defensible moat** | Spec-verified fitment database for 6'+ users → interactive calculator → affiliate |

# SERP Analysis — Incognito Search Audit
**Date:** 2026-04-22  
**Method:** 18 incognito screenshots covering zero-CTR page-1 queries + money queries from GSC  
**Source data:** gsc-2026-04-20.json (7,096 impr, 19 clicks, 0.27% CTR)

---

## Queries Checked

### Zero-CTR, Position ≤ 15 (from GSC)

| Query | GSC Pos | GSC Impr | SERP Finding |
|---|---|---|---|
| herman miller aeron size c reviews | 9.0 | 14 | NYT, Wirecutter, Reddit dominate. TCA not visible. No AI Overview. |
| gesture vs aeron | 14.8 | 13 | Not checked directly but overlaps with aeron-vs-gesture SERP |
| human resources equipment for tall people | 9.5 | 12 | Irrelevant query — false match, low value |
| herman miller aeron size c height range | 9.0 | 10 | **CONFIRMED AI OVERVIEW** — answers spec question fully before organic results |
| aeron plus | 8.0 | 7 | Product panel + videos. No AI Overview but brand results dominate. TCA not visible. |
| steelcase gesture 360 armrests description | 7.8 | 4 | **CONFIRMED AI OVERVIEW** — direct answer at top, then Steelcase.com + Amazon |

### Money Queries (from GSC — buried at pos 65–79)

| Query | GSC Pos | SERP Finding |
|---|---|---|
| best office chair for tall people | 66.5 | Heavy shopping carousel above fold. Videos. People Also Ask. Organic below scroll. |
| best office chairs for tall people | 71.0 | Same pattern — shopping carousel dominates |
| office chair for tall person | 72.9 | Shopping carousel + PAA + organic. TCA not visible anywhere. |
| office chairs for tall people | 74.5 | Shopping carousel + videos + Hinomi/LogicFox organic. TCA not visible. |
| steelcase leap plus | 23.3 | Reddit r/OfficeChairs, BTOD YouTube, Human Solution, Steelcase direct. TCA not visible. |

---

## Key Findings

### 1. AI Overviews (confirmed)
- `herman miller aeron size c height range` — full AI Overview answers the question. Organic results irrelevant to user.
- `steelcase gesture 360 armrests description` — AI Overview present. Steelcase.com and Amazon follow.
- **Implication:** These queries cannot be fixed via meta description rewrites. The only play is getting cited inside the AI Overview (GEO optimization).

### 2. Shopping Carousel Suppression
Every "best office chair for tall people" variant shows a Google Shopping carousel above all organic results. This is the primary reason money queries don't convert — organic results are below the fold even at pos 3–5, let alone pos 65–79.
- **Implication:** TCA needs to rank AND the content format needs to match what Google shows (editorial, not transactional).

### 3. BTOD YouTube Dominance
BTOD appeared in the video carousel on nearly every SERP checked — Aeron queries, Leap Plus queries, tall people queries. This is a parallel traffic channel TCA has zero presence in.
- **Implication:** Video content is a real gap. (Note: Jackson has declined to pursue YouTube at this time.)

### 4. Reddit Organic Presence
Reddit r/OfficeChairs appeared organically in Leap Plus and product-level SERPs. This is a community-trust signal Google weights heavily.
- **Implication:** Authentic Reddit participation (not spam) has SERP reach.

### 5. Strong Incumbents on Aeron Queries
- "herman miller aeron size c reviews" → NYT, Wirecutter, Reddit. No path to the top 3 without DA far beyond current TCA level.
- **Implication:** Don't target generic Aeron review queries. Target height-specific sub-queries TCA can own.

### 6. Height-Specific Pages Are the Defensible Format
The height-specific pages (`/office-chairs-for-6-foot-5/` etc.) show editorial organic results without shopping carousels — Google treats them as informational, not commercial. This is TCA's clearest ranking opportunity.

---

## CTR Problem — Revised Diagnosis

**Previous hypothesis:** Meta descriptions need verdict-first rewrites.  
**Actual diagnosis:** Structural SERP suppression via two mechanisms:
1. AI Overviews eating informational spec queries where TCA ranks (pos 7–10)
2. Shopping carousels dominating money queries where TCA doesn't rank (pos 65–79)

Meta description quality is not the primary lever. It may help marginally on queries that escape both suppressors, but it cannot fix a structural SERP layout problem.

---

## Priority Actions (derived from this audit)

1. **GEO optimization** — restructure spec pages to get cited inside AI Overviews (height-bracket verdict tables, citation capsules)
2. **Height-specific page depth** — `/office-chairs-for-6-foot-[3-7]/` are the defensible format. Bring to 85+ score.
3. **PAA targeting** — every SERP had People Also Ask boxes. 40–60 word direct-answer sections on existing pages.
4. **Schema fix on /best-office-chairs/** — parse error currently blocks rich results eligibility.
5. **Reddit authentic participation** — ambient, low time cost, shows up in SERPs organically.

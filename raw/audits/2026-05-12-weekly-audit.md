# TCA Weekly Audit Report
**Generated:** 2026-05-12T10:33:04.701Z
**Data range:** 2026-02-10 → 2026-05-11

# TallChairAdvisor.com — SEO Audit Report
**Audit Date:** 2026-05-18 | **Data Window:** 90 days | **Auditor:** Jackson Christopher

---

## 1. Executive Summary

The site is generating 15,417 impressions against only 35 clicks (0.23% CTR) — structurally consistent with the 0.24% baseline from the May 10 wiki snapshot, meaning the impression growth engine is working but the click-capture layer is still almost entirely broken. Of 20 pages audited, **11 have zero clicks at position ≤ 10**, representing the primary revenue bottleneck. Two distinct suppression mechanisms remain active (AI Overviews on spec queries; Shopping shelf displacement on product head terms), but several zero-click pages — particularly `/office-chairs-for-6-foot-4/` at pos 5.3 — sit **outside AI Overview territory** and represent pure meta/title failures that are directly fixable this week. Three meta descriptions confirmed over the 155-char limit (known from wiki) remain unresolved; a fourth (`/chairs/steelcase-gesture/`) joins them at 170 chars. One title is under 50 chars, two are over 60 chars. The affiliate-tag and first-person-voice constraints introduce a separate editorial risk on `/aeron-vs-gesture/` that must be audited at the content level.

---

## 2. Critical CTR Leaks
*Position ≤ 10, 0 clicks — highest-priority SERP failures*

| Page | Pos | Impr | CTR | Suppression Type | Fixable? |
|---|---|---|---|---|---|
| /office-chairs-for-6-foot-4/ | 5.3 | 150 | 0% | Unknown — **no AIO flag, no Shopping flag** | ✅ **Yes — highest priority** |
| /aeron-vs-gesture/ | 8.6 | 388 | 0% | Possibly title mismatch / low CTR signal | ✅ Likely yes |
| /chairs/steelcase-leap-plus/tall-people/ | 8.6 | 481 | 0% | Possible AI Overview on brand queries | ⚠️ Partial |
| /chairs/steelcase-gesture/ | 9.2 | 434 | 0% | Possible AI Overview on spec queries | ⚠️ Partial |
| /back-pain-spine-height/ | 10.3 | 204 | 0% | Near-borderline; not confirmed AIO | ✅ Likely yes |
| /fit-guides/ | 8.4 | 197 | 0% | Broad navigational — low commercial signal | ⚠️ Partial |
| /chairs/steelcase-gesture/seat-height/ | 12.3 | 137 | 0% | Over pos 10 — deprioritize | ❌ Not priority |
| /chairs/herman-miller-aeron/ | 13.8 | 321 | 0% | Over pos 10 | ❌ Not priority |

> **Notable:** `/office-chairs-for-6-foot-4/` at **pos 5.3 with 150 impressions and 0 clicks** is the single most alarming data point in this audit. Page-5 ranking with zero clicks is a near-impossible outcome unless the title/meta is actively repelling clicks or the SERP has a rich feature eating all clicks. No AIO flag is present in the data. This must be investigated and rewritten first.

---

## 3. Issues by Severity

---

### 🔴 CRITICAL

---

**C-1 — `/office-chairs-for-6-foot-4/`: Pos 5.3, 150 impressions, 0 clicks**

The highest-ranked page on the site is generating zero clicks. At position 5 the expected CTR for an informational query is roughly 5–8%; 0% is statistically near-impossible without active suppression or a deeply unappealing SERP snippet.

*Diagnosis:*
- Title uses HTML entity `6&#39;4&#34;` which may render incorrectly in some SERP environments. Verify rendered output.
- Title "Best Office Chair for 6'4" | Tall Chair Advisor" is generic and non-differentiating at 56 chars — no urgency, no specificity signal.
- Meta desc leads with the Leap Plus recommendation — useful, but the 157-char length may be getting truncated mid-sentence in mobile SERPs, cutting off at a non-compelling point.
- **Action required:** Manually check this URL in incognito on mobile to confirm whether (a) an AI Overview or People Also Ask carousel is absorbing all clicks above the fold, or (b) the snippet itself is the problem.

*Immediate fix — rewrite title and meta:*

```
CURRENT TITLE (56 chars):
Best Office Chair for 6'4" | Tall Chair Advisor

REWRITE (58 chars):
Best Office Chair for 6'4" (2026): 3 Chairs That Fit
```

```
CURRENT META (157 chars):
At 6'4", the Leap Plus is the safest default: 22.5" seat height, 19.75" depth.
Full comparison with Gesture and Aeron — height-by-height verdict.

REWRITE (153 chars):
Leap Plus, Gesture, or Aeron at 6'4"? Seat height and depth specs compared
side-by-side. Which one fits — and the one to skip at this height.
```

The rewrite front-loads the comparison tension (highest CTR driver for this query type) and removes the soft "safest default" framing that signals a lukewarm recommendation.

---

**C-2 — `/aeron-vs-gesture/`: First-person voice used for chair Jackson has NOT personally tested**

*This is an editorial integrity and E-E-A-T risk, not purely a technical SEO issue.*

- Title: `"Aeron vs Gesture at 6'4": Why I Chose the Gesture"` — uses first-person "I chose"
- Schema headline: `"Aeron vs Gesture at 6'4\": Why I Chose the Steelcase Gesture"` — first-person in structured data
- Meta desc: `"At 6'4", I chose Gesture over Aeron"` — direct first-person claim about the Aeron

**Per site CRITICAL constraint:** Jackson has ONLY personally tested the Steelcase Gesture. The Aeron has not been personally tested. First-person comparative claims about the Aeron ("I chose X over Y") imply personal testing of both chairs. This is a factual misrepresentation that undermines E-E-A-T and creates FTC risk if the page contains affiliate links.

*Fix required:*

```
CURRENT TITLE:
Aeron vs Gesture at 6'4": Why I Chose the Gesture

REWRITE (57 chars):
Aeron vs Gesture at 6'4": Spec Verdict for Tall Users
```

```
CURRENT META (134 chars):
At 6'4", I chose Gesture over Aeron. Seat depth (18.75" vs 18.25"),
armrests, and price — the spec verdict for tall users.

REWRITE (151 chars):
Gesture vs Aeron head-to-head: seat depth (18.75" vs 18.25"), armrest
range, and price. Which spec sheet wins for users at 6'4" and above.
```

Schema headline must also be updated to remove "Why I Chose." Content body should be audited for first-person Aeron testing claims.

---

**C-3 — `/chairs/steelcase-gesture/`: Meta description 170 chars — over limit, 0 clicks**

Previously flagged in wiki as a known issue. Still unresolved.

```
CURRENT META (170 chars — ❌):
Gesture fits 6'0"–6'4" per Steelcase specs: 21" seat height, 18.75" adjustable
depth. Full tall-person fit analysis and comparison to Aeron and Leap Plus.

REWRITE (148 chars — ✅):
Gesture fits 6'0"–6'4": 21" seat height, 18.75" adjustable depth. Fit
analysis and comparison to Aeron and Leap Plus by height.
```

---

### 🟠 HIGH

---

**H-1 — `/review/leap-plus/`: Meta description 170 chars — over limit (known, unresolved since wiki)**

```
CURRENT META (170 chars — ❌):
Research-based spec analysis for tall users 6'0"–6'6". Seat depth 15.75"–19.75",
500 lb capacity, 22.5" seat height ceiling. Who fits and who doesn't.

REWRITE (149 chars — ✅):
Spec analysis for tall users 6'0"–6'6": seat depth 15.75"–19.75", 500-lb
capacity, 22.5" seat height max. Who fits and who doesn't.
```

---

**H-2 — `/review/aeron-size-c/`: Meta description 166 chars — over limit (known, unresolved since wiki)**

```
CURRENT META (166 chars — ❌):
Aeron Size C fits most 6'0"–6'3" users: seat height reaches 20.5", depth is
fixed at 18.5". Who it fits, who should step up to the Leap Plus, and why.

REWRITE (152 chars — ✅):
Aeron Size C fits 6'0"–6'3": 20.5" seat height, fixed 18.5" depth. Who it
fits, who should step up to the Leap Plus, and why.
```

---

**H-3 — `/gesture-vs-leap-plus/`: Meta description 165 chars — over limit (known, unresolved since wiki)**

```
CURRENT META (165 chars — ❌):
Seat depth (18.75" vs 19.75"), back height, and armrest comparison for users
6'0"–6'6". Which one wins depends on your exact height — verdict inside.

REWRITE (150 chars — ✅):
Seat depth 18.75" vs 19.75", back height, armrests: full spec comparison for
6'0"–6'6". Which one wins depends on your exact height.
```

---

**H-4 — `/review/gesture/`: Meta description 158 chars — 3 chars over limit**

Small overage but should be corrected to prevent truncation.

```
CURRENT META (158 chars — ❌):
Independent review by a 6'4" owner. Seat depth, armrests, back height verdict
for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.

REWRITE (154 chars — ✅):
Owner review by a 6'4" ME student. Seat depth, armrests, back height verdict
for tall users 6'1"–6'7". Who the Gesture fits — and who it doesn't.
```

*(Note: "Independent review by a 6'4" owner" is accurate here since Jackson has tested the Gesture — this is one of the few pages where first-person framing is permissible.)*

---

**H-5 — `/chairs/steelcase-leap-plus/tall-people/`: 481 impressions, pos 8.6, 0 clicks**

The page is ranking on branded queries (`steelcase leap plus`, `steelcase leap tall`, `leap plus`) — these are likely AI Overview candidates per the pattern established in the wiki for spec/branded queries at pos 7–10. However, the meta description is also weak for commercial intent:

Current meta leads with "fit analysis" framing but the queries suggest users want a quick yes/no on whether this chair fits tall people. Rewrite to verdict-first format:

```
CURRENT META (156 chars):
Steelcase Leap Plus fit analysis for tall users 6'0-6'7+. 22.5-in seat height,
4-in adjustable seat depth, height-by-height breakdown, and who it fits best.

REWRITE (148 chars — ✅):
Leap Plus fits most 6'0"–6'7" users: 22.5" max seat height, 4" adjustable
depth. Height-by-height verdict — who it fits and who it doesn't.
```

---

**H-6 — `/best-office-chairs/`: Pos 22.5, 776 impressions, 0 clicks — content depth problem**

At pos 22, this is a content authority issue, not a meta issue. The page is competing on the highest-competition queries on the site (`best office chairs for tall people`) from a domain still building authority.

*Issues:*
- Position 22 is below the fold for most SERP layouts. Meta optimization will have minimal impact until position improves.
- The content-depth opportunity flag is accurate. This page needs the hub treatment: comparison tables with specs by height, individual chair sections with exact measurements, internal links to all review pages.
- Schema is `Article` — consider whether `ItemList` schema would be more appropriate for a "best of" roundup, which Google tends to reward with sitelinks/rich results.

---

**H-7 — `/office-chairs-for-tall-people/` and `/best-office-chairs/`: Cannibalization risk**

Both pages target near-identical head terms:
- `/best-office-chairs/` → "best office chairs for tall people"
- `/office-chairs-for-tall-people/` → "best office chair for tall people", "office chair for tall person"

Both sit at pos 22+. Google is likely splitting crawl/ranking signals between them. One of these pages should be consolidated into the other, or they need clearly differentiated intents (e.g., one is a buyer's guide, one is a category/directory page with different schema).

---

### 🟡 MEDIUM

---

**M-1 — `/knee-pain-seat-depth/`: Query leak — "cornell ergonomics chair seat depth two fingers behind knee" cluster**

Three variants of the same query are leaking (68 + 57 + 35 = **160 impressions, 0 clicks**). The pos 7.8–9.8 range suggests AIO suppression is partially responsible, but pos 7.8 is borderline. The title does not contain "two fingers" or "Cornell" explicitly — adding the Cornell reference to the title (it's already in the title) is correct, but the meta should mirror the query more precisely.

```
CURRENT META (144 chars — ✅ length):
Seat edge pressure on the back of your knees is the cause. Here's how to measure
the right seat depth for your height and which chairs reach it.

REWRITE to target Cornell query cluster (143 chars — ✅):
The Cornell "two fingers behind the knee" rule explained: how to measure seat
depth for your height and which chairs actually reach the minimum.
```

---

**M-2 — `/correct-chair-dimensions/`: Title at 60 chars — at limit, and includes brand name wasting space**

```
CURRENT TITLE (60 chars — at limit):
Office Chair Dimensions for Tall People | Tall Chair Advisor

REWRITE (57 chars):
Office Chair Dimensions for Tall People: 6'0"–6'7" Guide
```

Removes brand name (redundant in title tag for SEO purposes) and adds specificity that improves CTR for height-targeted queries.

Also: page is at pos 15.8 on generic queries like "average dimensions of person sitting" and "office chair dimensions" — these are not tall-person-specific queries. The content may be ranking on the wrong terms, suggesting a keyword targeting mismatch. Audit the H1 and first 200 words.

---

**M-3 — `/back-pain-spine-height/`: Title 42 chars — under 50-char minimum, low CTR signal**

```
CURRENT TITLE (42 chars — ❌ under minimum):
Back Pain From Your Chair? A Tall User Fix

REWRITE (54 chars):
Office Chair Back Pain for Tall People: Lumbar Fix Guide
```

The current title reads like a blog post headline rather than an authoritative resource. The rewrite targets the actual query intent while staying within spec. Page is at pos 10.3 — borderline
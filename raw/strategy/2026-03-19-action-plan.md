# TallChairAdvisor — Action Plan
**Updated:** March 19, 2026
**Current SEO Score:** 88/100
**Source Audit:** tallchairadvisor-seo-audit-mar19.md

---

## Status Key
- [ ] Not started
- [~] In progress
- [x] Done

---

## IMMEDIATE (Fix Today — High ROI, Small Changes)

- [ ] **Add FAQPage schema to /gesture-vs-leap-plus/**
  - File: `tall-chair-advisor/src/pages/gesture-vs-leap-plus.astro`
  - Copy FAQPage schema pattern from `aeron-vs-gesture.astro`
  - Add 3-5 Q&A pairs about Gesture vs Leap Plus fit for tall people
  - Why: Only comparison page missing FAQPage schema; all others have it

- [ ] **Add lastmod for 8 new pages in astro.config.mjs**
  - File: `tall-chair-advisor/astro.config.mjs`
  - Add to `pageLastmod` map (date: `2026-03-17`):
    - /review/sihoo-doro-s300/
    - /shoulder-pain-tall-people/
    - /best-office-chairs-under-500/
    - /office-chairs-for-6-foot-3/ through /office-chairs-for-6-foot-7/ (5 pages)
  - Why: Missing lastmod signals to Google that Googlebot should prioritize recrawl

- [ ] **Fix sitemap priority for shoulder-pain and budget-under-500**
  - File: `tall-chair-advisor/astro.config.mjs`
  - Move to 0.8 priority block + change changefreq to "monthly"
  - Both currently fall into the default `else` → 0.3 / "yearly" bucket
  - Why: These are high-quality content pages equivalent to review pages

- [ ] **Fix /best-office-chairs 308 redirect**
  - In Cloudflare dashboard → Bulk Redirect Rules
  - Verify /best-office-chairs is covered by redirect rule
  - Test: `curl -I https://tallchairadvisor.com/best-office-chairs` — should return 301
  - 5 of 6 GSC-flagged URLs now return 301; this is the one remaining exception

---

## THIS WEEK (High Impact — CTR + Core Web Vitals)

- [ ] **Fix LCP image on homepage**
  - File: `tall-chair-advisor/src/pages/index.astro`
  - Add `preloadImage="/images/jackson-christopher.webp"` prop to Layout
  - Change img tag: `loading="lazy"` → `loading="eager"` + add `fetchpriority="high"`
  - Why: First above-fold image loads lazy — needlessly delays LCP

- [ ] **Fix LCP image on /best-office-chairs/**
  - File: `tall-chair-advisor/src/pages/best-office-chairs.astro`
  - Add `preloadImage="/images/aeron-size-c-hero.webp"` prop to Layout
  - First product img: change to `loading="eager"` + `fetchpriority="high"`
  - Remaining product imgs can stay lazy
  - Why: 3 above-fold product images all loading lazy

- [ ] **Optimize /chairs/herman-miller-aeron/tall-people/ title + meta**
  - File: `tall-chair-advisor/src/pages/chairs/herman-miller-aeron/tall-people.astro`
  - **MOST URGENT CTR FIX** — 83 impr, pos 7.4, 0 clicks (should be ~2-3% CTR at pos 7)
  - New title: `Herman Miller Aeron Size C: Tall People Fit Analysis` (52 chars)
  - New desc: `At 6'0–6'6, the Aeron's fixed 18.25" seat depth is the key trade-off. Height-by-height verdict: who it fits, who should choose the Leap Plus instead.` (152 chars)
  - Why: Current "Fit Guide" title is generic; desc mentions competitors in a way that may redirect clicks

- [ ] **Fix title for /chairs/steelcase-gesture/seat-depth/**
  - File: `tall-chair-advisor/src/pages/chairs/steelcase-gesture/seat-depth.astro`
  - New title: `Steelcase Gesture Seat Depth Range: 15.75"–18.75"` (50 chars — down from 63)
  - 85 impr, pos 10.06, 0 clicks — query includes exact spec numbers
  - Desc at 160 chars (borderline) — trim by 1-2 words to clear the limit

---

## THIS MONTH (Medium Priority)

### Title Tags Over 60 Chars (fix by impression volume priority)

- [ ] `/office-chairs-for-6-foot-5/` — 84 chars
  - Current: `Best Office Chair for 6'5" — Fit Analysis and Top Pick | Tall Chair Advisor`
  - Target: ≤60 chars. Suggested: `Best Office Chair for 6'5" | Fit Analysis`

- [ ] `/office-chairs-for-6-foot-3/` — 82 chars
  - Current: `Best Office Chair for 6'3" Person: 3 Chairs Compared | Tall Chair Advisor`
  - Target: ≤60 chars. Suggested: `Best Office Chair for 6'3": 3 Chairs Compared`

- [ ] `/office-chairs-for-6-foot-6/` — 71 chars
  - Current: `Best Office Chair for 6'6" — What Actually Fits at This Height`
  - Target: ≤60 chars. Suggested: `Best Office Chair for 6'6" — What Actually Fits`

- [ ] `/office-chairs-for-6-foot-7/` — 68 chars
  - Current: `Best Office Chair for 6'7" Tall (2026) | Tall Chair Advisor`
  - Target: ≤60 chars. Suggested: `Best Office Chair for 6'7" (2026)`

- [ ] `/chairs/steelcase-gesture/tall-people/` — 66 chars
  - Current: `Gesture for Tall People: Fit at 6'4" | Tall Chair Advisor`
  - Target: ≤60 chars. Suggested: `Steelcase Gesture Fit for Tall People (6'4" Test)`

- [ ] `/chairs/steelcase-leap-plus/seat-height/` — 65 chars
  - Current: `Leap Plus Seat Height: Is 22.5" Enough? | Tall Chair Advisor`
  - New: `Steelcase Leap Plus Seat Height: 15.5"–22.5" Range` (52 chars)

- [ ] `/shoulder-pain-tall-people/` — 62 chars
  - Current: `Why Tall People Get Shoulder Pain at Desks — And How to Fix It`
  - Target: ≤60 chars. Suggested: `Why Tall People Get Shoulder Pain at Desks`

- [ ] `/back-pain-spine-height/` — 61 chars
  - Current: `Back Pain From Your Chair? Tall User Fix | Tall Chair Advisor`
  - Target: ≤60 chars. Suggested: `Back Pain From Your Chair? A Tall User Fix`

### Meta Descriptions Over 160 Chars

- [ ] `/office-chairs-for-6-foot-4/` — 181 chars
  - Trim: remove spec numbers from desc, keep the value prop. Target ≤155 chars.

- [ ] `/office-chairs-for-6-foot-5/` — 171 chars
  - Trim: similar approach. Target ≤155 chars.

- [ ] `/correct-chair-dimensions/` — 161 chars
  - Just 1 char over. Remove 1-2 words from the end.

### Additional CTR Improvements

- [ ] **Optimize /review/gesture/ meta desc for "independent review" queries**
  - Query "steelcase gesture review independent" at pos 8.91, 11 impr, 0 clicks
  - New desc: `Daily-use review by a 6'4" ME student who owns the Gesture. Seat depth, armrests, and back height verdict by height — who it fits, who should look at the Leap Plus.`

- [ ] **Add internal links from /office-chairs-for-6-foot-[X]/ to /correct-chair-dimensions/**
  - /correct-chair-dimensions/ at pos 35, 186 impr — needs more internal link equity
  - Add contextual links in all 5 height-specific pages

---

## CONTENT QUEUE

- [ ] **Write /standing-desk-height-tall-people/**
  - Zero competition, fits ME background + tall-person expertise perfectly
  - No testing claim needed (spec/formula-based content)
  - Target: 2,000+ words, FAQPage schema, height-by-height recommendations

- [ ] **Deepen /review/gesture/**
  - Highest impression page, only true first-person authority content
  - Priority: ensure "independent" framing appears in visible content early

---

## DONE (Resolved Issues — Keep for Reference)

- [x] Trailing-slash redirects fixed for 5 of 6 GSC-flagged URLs (all return 301 now)
- [x] /review/gesture/ LCP: fetchpriority=high + preload link added
- [x] Noindex pages excluded from sitemap (/contact/, /privacy-policy/, /affiliate-disclosure/)
- [x] All review pages have AggregateRating schema
- [x] AI bots allowed in robots.txt (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, anthropic-ai)
- [x] All article pages have visible byline with name, credentials, publish/update dates
- [x] All 38 sitemap URLs use trailing slash (no no-slash URLs in sitemap)
- [x] All pages have self-referencing canonicals
- [x] New pages live: sihoo-doro-s300 (3,111w), shoulder-pain (3,233w), budget-500 (2,921w), 6-foot-3 through 6-foot-7
- [x] /chairs/steelcase-leap-plus/ content expanded to 1,561 words

---

*Last updated: March 19, 2026*

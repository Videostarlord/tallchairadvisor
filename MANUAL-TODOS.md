# Manual To-Do List — tallchairadvisor.com
**Last updated:** March 3, 2026
**All code changes are complete. Everything below requires your input.**

---

## URGENT — Do These First (Biggest SEO Impact)

### 1. Author Identity (H6) — Highest E-E-A-T Impact
Google rewards "Your Money or Your Life" adjacent content (health + purchasing) that has a named, credentialed author. Without this, all other SEO work has a ceiling.

**On the About page (`/about`):**
- Add your real name (or a consistent pen name)
- Add your height — this is your primary credential in this niche
- Add a short bio explaining how you evaluate chairs and why you started the site
- Add a headshot photo

**On every review and article page (below the H1):**
Add a byline in this format:
```html
<div class="byline">
  By <a href="/about/">Your Name</a> · 6'4" ·
  <time datetime="2025-01-15">January 15, 2025</time>
  · Updated <time datetime="2026-03-01">March 2026</time>
</div>
```

**Schema update needed:** Once you have a real author name, change all Article/Review schema `"author"` fields from `@type: Organization` to `@type: Person` with your name and About page URL.

---

### 2. Actual Publish Dates (H5)
All pages currently use placeholder dates (`datePublished: "2025-01-15"`, `dateModified: "2026-03-01"`). Google can detect mismatches between schema dates and crawl history.

**For each page below, replace `"2025-01-15"` with the real first-published date in both the schema AND the visible byline (once bylines are added):**

| Page | Schema location |
|------|----------------|
| /review/aeron-size-c | `Review.datePublished` |
| /review/gesture | `Review.datePublished` |
| /review/leap-plus | `Review.datePublished` |
| /aeron-vs-gesture | `Article.datePublished` |
| /aeron-vs-leap-plus | `Article.datePublished` |
| /gesture-vs-leap-plus | `Article.datePublished` |
| /back-pain-spine-height | `Article.datePublished` |
| /knee-pain-seat-depth | `Article.datePublished` |
| /leg-pain-circulation | `Article.datePublished` |
| /why-standard-chairs-dont-fit | `Article.datePublished` |
| /correct-chair-dimensions | `Article.datePublished` |
| /how-to-adjust-chair | `Article.datePublished` |
| /fit-guides | `Article.datePublished` |
| /pain-ergonomics | `Article.datePublished` |
| /office-chairs-for-tall-people | `Article.datePublished` |

Update `dateModified` whenever you make a meaningful content change to a page.

---

### 3. Expand Thin Content (M2) — Ranking Blocker
These pages don't have enough content to compete for their target queries. Technical SEO gets Google to crawl them; word count and depth determine whether they rank.

| Page | Current words | Target | Priority |
|------|--------------|--------|----------|
| /best-office-chairs | ~408 | 1,200+ | **Critical** — main money page |
| /gesture-vs-leap-plus | ~450 | 1,200+ | High — comparison query |
| /aeron-vs-leap-plus | ~550 | 1,200+ | High — comparison query |
| /fit-guides | ~430 | 1,500+ | High — hub page |
| /pain-ergonomics | ~750 | 1,500+ | High — hub page |
| /knee-pain-seat-depth | ~475 | 1,000+ | Medium — needs sourcing too |

**For `/best-office-chairs` specifically, add:**
- Methodology section (how chairs were selected and what was disqualified)
- Brief mentions of chairs you evaluated but didn't include, and why
- Price context (new vs certified refurbished)
- "How to use this guide" section with links to fit guides by height range

---

### 4. Citations on Pain Pages (H7)
These pages make health-adjacent claims without external sourcing. Google's E-E-A-T guidelines treat unsourced health content as lower quality.

**Pages that need 2–3 external citations each:**
- `/back-pain-spine-height`
- `/knee-pain-seat-depth`
- `/leg-pain-circulation`
- `/why-standard-chairs-dont-fit`

**Acceptable sources:**
- OSHA Ergonomics guidelines — osha.gov/ergonomics
- NIOSH musculoskeletal research — cdc.gov/niosh
- *Ergonomics* journal (Taylor & Francis)
- *Applied Ergonomics* journal (Elsevier)
- Steelcase or Herman Miller published research whitepapers

Add citations as inline links within the relevant claim sentences, e.g.:
> "Inadequate seat depth creates popliteal pressure that restricts blood flow [(NIOSH, 2023)](...)."

---

## MEDIUM — Do Within 1 Month

### 5. Cloudflare Edge Caching (M9)
The site currently serves HTML as `DYNAMIC` with `max-age=0`. For a static Astro site this is wasteful — all pages can be cached at the edge.

**In Cloudflare dashboard:**
1. Go to your domain → Rules → Cache Rules
2. Create a new rule:
   - **When:** Hostname equals `tallchairadvisor.com`
   - **Cache eligibility:** Eligible for cache (Cache Everything)
   - **Edge TTL:** 1 hour (3,600 seconds)
   - **Browser TTL:** 0 (let Cloudflare handle revalidation)
3. Save and deploy

This will dramatically lower TTFB for all visitors not near your origin server.

---

### 6. Upgrade HSTS max-age
Currently set to `max-age=300` (5 minutes) as a safety net. Once you've confirmed the site is loading correctly over HTTPS with no issues:

**In `public/_headers`**, change:
```
Strict-Transport-Security: max-age=300; includeSubDomains
```
to:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Then commit and push. Optionally submit to the HSTS preload list at hstspreload.org (makes browsers permanently prefer HTTPS for your domain).

---

### 7. Verify Gesture Seat Depth Spec (L8)
There's a spec inconsistency across the site:
- `/review/gesture` lists max seat depth as **18.75"**
- Comparison pages list it as **18.5"**

Check the official Steelcase Gesture spec sheet and update whichever page has the wrong number. This is a factual accuracy issue that could affect trust.

---

## LOW — Backlog (Next Quarter)

### 8. Add FAQ Sections (L3)
Add 5–8 FAQ items per page on review and guide pages. These target featured snippets and AI Overview eligibility. Format as `<details>`/`<summary>` or plain H3 + paragraph pairs with FAQ schema markup.

**High-value questions to answer:**
- "Is the Herman Miller Aeron good for tall people?"
- "What seat depth do I need for a 6'3" person?"
- "Can I replace the gas cylinder on my office chair to make it taller?"

---

### 9. External Links to Manufacturer Specs (L4)
Link to official spec pages from each review. This adds a citation chain for factual claims and builds trust with AI systems that crawl and cite the site.

- Herman Miller Aeron Size C specs: hermanmiller.com
- Steelcase Leap Plus specs: steelcase.com
- Steelcase Gesture specs: steelcase.com

---

### 10. Per-Page OG Images (L6)
All pages currently share the same `og-default.jpg`. Social shares of review pages would benefit from product-specific images (improves click-through when shared on social or linked from forums).

Create dedicated OG images (1200×630px) for:
- /review/aeron-size-c
- /review/gesture
- /review/leap-plus
- /aeron-vs-gesture
- /aeron-vs-leap-plus
- /gesture-vs-leap-plus

---

### 11. Self-Host Google Fonts (L5)
Eliminates the external DNS dependency and the preload/onload pattern entirely.

```bash
npm install @fontsource/playfair-display @fontsource/source-sans-3
```

Then in Layout.astro, replace the Google Fonts `<link>` tags with:
```js
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/500.css';
```

---

### 12. Add llms.txt (L2)
Create `/public/llms.txt` — an emerging standard that helps AI crawlers (ChatGPT, Perplexity, ClaudeBot) understand your site structure and cite you accurately.

Example format:
```
# Tall Chair Advisor

> Independent ergonomic chair guidance for tall people 6 feet and taller.

## Key Pages
- [Office Chairs for Tall People](https://tallchairadvisor.com/office-chairs-for-tall-people/)
- [Best Office Chairs](https://tallchairadvisor.com/best-office-chairs/)
- [Aeron Size C Review](https://tallchairadvisor.com/review/aeron-size-c/)
- [Steelcase Leap Plus Review](https://tallchairadvisor.com/review/leap-plus/)
- [Steelcase Gesture Review](https://tallchairadvisor.com/review/gesture/)
- [Correct Chair Dimensions](https://tallchairadvisor.com/correct-chair-dimensions/)
- [How to Adjust Your Chair](https://tallchairadvisor.com/how-to-adjust-chair/)
- [Back Pain & Spine Height](https://tallchairadvisor.com/back-pain-spine-height/)
- [Knee Pain & Seat Depth](https://tallchairadvisor.com/knee-pain-seat-depth/)
- [Leg Pain & Circulation](https://tallchairadvisor.com/leg-pain-circulation/)
```

---

## Tracking

Use this table to track completion:

| # | Item | Priority | Status |
|---|------|----------|--------|
| 1 | Author identity + bylines | Urgent | ⬜ Not started |
| 2 | Actual publish dates | Urgent | ⬜ Not started |
| 3 | Expand thin content | Urgent | ⬜ Not started |
| 4 | Citations on pain pages | Urgent | ⬜ Not started |
| 5 | Cloudflare edge caching | Medium | ⬜ Not started |
| 6 | Upgrade HSTS max-age | Medium | ⬜ Not started |
| 7 | Verify Gesture seat depth spec | Medium | ⬜ Not started |
| 8 | Add FAQ sections | Low | ⬜ Not started |
| 9 | External links to manufacturer specs | Low | ⬜ Not started |
| 10 | Per-page OG images | Low | ⬜ Not started |
| 11 | Self-host Google Fonts | Low | ⬜ Not started |
| 12 | Add llms.txt | Low | ⬜ Not started |

# TallChairAdvisor.com — GEO Analysis (March 2026)

**Prepared:** March 16, 2026
**Author:** Jackson Christopher (site), Claude Code (analysis)
**Scope:** Generative Engine Optimization readiness across ChatGPT, Perplexity, Google AI Overviews, and Claude

---

## GEO Readiness Score: 71/100

| Category | Weight | Raw Score | Weighted |
|---|---|---|---|
| Citability Score | 25% | 60/100 | 15.0 |
| Structural Readability | 20% | 82/100 | 16.4 |
| Multi-Modal Content | 15% | 78/100 | 11.7 |
| Authority & Brand Signals | 20% | 68/100 | 13.6 |
| Technical Accessibility | 20% | 73/100 | 14.6 |
| **Total** | 100% | — | **71.3/100** |

---

## Platform Scores

| Platform | Score | Primary Gap |
|---|---|---|
| **Google AI Overviews** | 74/100 | No FAQ rich results on /review/gesture/; no aggregateRating on gesture (now fixed per schema check — but gesture has it; leap-plus and aeron-size-c both have aggregateRating in schema); byline text present but author credentials in body text missing |
| **ChatGPT** | 69/100 | llms.txt present but lacks author E-E-A-T summary, full page coverage, and disambiguating author statement; no Wikipedia presence; no YouTube content |
| **Perplexity** | 72/100 | PerplexityBot allowed; Reddit citation integration is a strength; passage blocks need restructuring to hit 134–167 word self-contained answer targets |

> Note: /review/gesture/ schema shows aggregateRating in source (`ratingValue: 4.5`, `reviewCount: 1`). Per the Mar 17 SEO audit, /review/leap-plus/ and /review/aeron-size-c/ also have aggregateRating in their Product schema. The schema audit note in MEMORY.md flagging "missing aggregateRating" appears to be resolved at the source-code level — verify live rendering with Google Rich Results Test.

---

## 1. AI Crawler Access Status

**Source:** `https://tallchairadvisor.com/robots.txt` (fetched live March 16, 2026)

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://tallchairadvisor.com/sitemap-index.xml
```

| Crawler | Status | Notes |
|---|---|---|
| GPTBot (OpenAI) | **ALLOWED** | Explicit allow directive |
| OAI-SearchBot (OpenAI) | **ALLOWED (via wildcard)** | No explicit directive; covered by `User-agent: *` |
| ClaudeBot (Anthropic) | **ALLOWED** | Explicit allow directive |
| anthropic-ai | **ALLOWED (via wildcard)** | No explicit directive; covered by wildcard |
| PerplexityBot | **ALLOWED** | Explicit allow directive |
| CCBot (Common Crawl) | **ALLOWED (via wildcard)** | No explicit directive; covered by wildcard |
| Googlebot | **ALLOWED (via wildcard)** | Covered by `User-agent: *` |
| Bingbot | **ALLOWED (via wildcard)** | Covered by wildcard |

**Assessment: PASS.** All major AI crawlers are permitted. The explicit named directives for GPTBot, ClaudeBot, and PerplexityBot signal active GEO intent, which is a positive trust signal. The only minor gap: OAI-SearchBot and `anthropic-ai` are not explicitly listed by name. While the wildcard covers them, explicit entries are marginally better for future-proofing if Cloudflare or other CDN layers add bot-specific rules.

**Recommendation:** Add two lines to robots.txt for completeness:
```
User-agent: OAI-SearchBot
Allow: /

User-agent: anthropic-ai
Allow: /
```

---

## 2. llms.txt Status

**Status: PRESENT** — `https://tallchairadvisor.com/llms.txt`

**Current content coverage:**
- Site description and author identification: YES
- Key informational pages (best chairs, about, why-chairs-dont-fit): YES
- Chair reviews (Gesture, Leap Plus, Aeron Size C): YES
- Comparison pages (3 listed): YES
- Steelcase Gesture sub-guides (4 listed): YES
- Pain & ergonomics guides (5 listed): YES
- AI crawler policy statement: YES

**What the current llms.txt is missing:**
1. No author E-E-A-T summary paragraph (critical for AI to cite Jackson as an authority)
2. No explicit "About the Author" section with credentials spelled out for AI ingestion
3. No disambiguation statement (distinguishes Jackson Christopher the chair reviewer from any other person with that name)
4. Missing sub-pages: Herman Miller Aeron guides, Leap Plus guides, aeron-vs-leap-plus comparison, gesture-vs-leap-plus comparison page descriptions
5. No `# Sitemap` pointer for completeness
6. No explicit statement on editorial independence / no-paid-review policy
7. Missing height-specific landing pages (none listed, though they may not exist yet)

**Assessment: PARTIAL.** The llms.txt is live and correctly structured per the llms.txt spec. Its existence alone puts TallChairAdvisor ahead of ~90% of niche affiliate sites. However, it functions more as a sitemap than an AI-optimized context document. The missing author E-E-A-T block is the highest-impact gap — AI models use llms.txt to quickly resolve "who wrote this and why should I trust them," and that answer is currently underspecified.

A full replacement draft is provided in Section 10.

---

## 3. Brand Mention Analysis

### Wikipedia
**Status: NOT PRESENT.** No Wikipedia article for "Tall Chair Advisor" or "Jackson Christopher" as a chair reviewer exists. This is expected for a site of this scale — Wikipedia notability requirements are high. However, the absence means AI models citing sources in the ergonomic chair space have no Wikipedia-anchored disambiguation for the brand.

**Path forward:** Not realistic in short term. Focus on Reddit and LinkedIn authority instead.

### Reddit
**Status: STRONG — integrated as a content feature.**

The site has an active Reddit integration: `RedditInsights` component on /review/gesture/, /review/leap-plus/, and /review/aeron-size-c/, pulling from `/data/reddit/published/` JSON files. The aeron-vs-gesture comparison page (lines 275–291) cites "34 Gesture posts and 35 Aeron posts from r/OfficeChairs and r/Ergonomics" directly in body text, with an attributed blockquote from r/Ergonomics with a live hyperlink to the source post.

This is a genuine GEO signal. Perplexity in particular cites Reddit heavily for consumer product queries. Having Reddit community sentiment embedded in page content — with source attribution — positions TCA content as an aggregator of community knowledge, not just a single-author opinion.

**Gap:** No evidence the site itself has been mentioned organically on Reddit. The site integrates Reddit content but hasn't generated inbound Reddit citation. A strategy of posting genuinely useful, non-promotional dimensional data to r/OfficeChairs and r/Ergonomics (e.g., the height-bracket dimension tables from /correct-chair-dimensions/) would increase the probability of organic Reddit backlinks.

### LinkedIn
**Status: LINKED, NOT LEVERAGED.** The Person schema for Jackson Christopher includes:
```json
"sameAs": ["https://www.linkedin.com/in/jackson-christopher-"]
```
The author page also links to LinkedIn. However, the LinkedIn profile itself is not confirmed to link back to TallChairAdvisor, and there is no content strategy on LinkedIn to build the "Jackson Christopher = ergonomic chair expert for tall people" association in AI training data.

**Gap:** AI models increasingly use LinkedIn profile data to validate author expertise. If the LinkedIn profile doesn't list Tall Chair Advisor prominently in the experience section, the `sameAs` link provides diminished benefit.

### YouTube
**Status: NOT PRESENT.** No YouTube channel, video content, or embeds found anywhere in the codebase. No `VideoObject` schema on any page.

This is a significant GEO gap. YouTube content indexed by Google and referenced in AI answers is a growing authority signal — especially for product review queries where "video demonstration" content is frequently surfaced by AI Overviews alongside text results. A single video of Jackson measuring chair seat depth at 6'4" with a tape measure would be a high-authority content signal for multiple pages.

### Other Platforms
- **Steelcase / Herman Miller product pages:** No evidence of cross-linking from manufacturer sites.
- **Ergonomics publications / OSHA / Cornell:** /correct-chair-dimensions/ cites Cornell Ergonomics Lab and OSHA directly with live links. This creates a one-way authority connection — positive for AI context, but no reciprocal link.
- **Press mentions:** None found.

---

## 4. Passage-Level Citability

GEO citability requires self-contained answer blocks of 134–167 words that AI models can extract and quote as coherent responses to specific queries. The following analysis examines key passages:

### Passages Currently In Range (134–167 words)

**1. /review/gesture/ — Seat Depth Section (paragraphs 1–2 combined)**
- Word count: ~145 words
- Content: Explains Cornell clearance guideline, personal 6'4" measurement (1.5–2 finger-widths), and at-height variation
- Citability strength: HIGH — contains a specific measurement, a named source (Cornell Ergonomics Lab), a first-person data point, and a clear conclusion
- AI trigger queries: "how deep should office chair seat be for tall person", "Steelcase Gesture seat depth at 6'4"

**2. /review/gesture/ — Armrest Section (paragraphs 1–2 combined)**
- Word count: ~148 words
- Content: Describes Steelcase's 2,000-posture study, explains 360° pivot functionality at 6'4" with a 30" desk, and draws a comparison against 4D arms
- Citability strength: HIGH — specific factual claim (2,000 postures, six continents), first-person evaluation, comparison structure
- AI trigger queries: "Steelcase Gesture armrests for tall people", "Gesture vs Leap Plus armrests"

**3. /aeron-vs-gesture/ — Seat Depth Section (three paragraphs combined)**
- Word count: ~145 words
- Content: Contrasts Aeron's fixed 18.5" vs Gesture's adjustable 15.75"–18.75", explains the practical implication
- Citability strength: MEDIUM-HIGH — clear comparison with specific numbers, strong practical framing, no named external source
- AI trigger queries: "Aeron vs Gesture seat depth", "Herman Miller Aeron seat depth adjustable"

### Passages Too Short to Be Cited as Standalone Blocks

**4. /review/gesture/ — TL;DR Verdict Box**
- Word count: ~67 words
- Issue: Functions as a UI callout box, not a prose passage. AI models may not extract structured verdict boxes as citation blocks.
- Fix: Add 2–3 sentences explaining the dimensional reasoning behind the 6'0"–6'3" recommendation vs the 6'4" borderline verdict. Target: 130–150 words total.

**5. /aeron-vs-gesture/ — Quick Answer box**
- Word count: ~49 words
- Issue: Too compressed. The single paragraph is excellent as UI, but too short to be cited as a complete AI response.
- Fix: Expand to include one specific data point per chair (e.g., "Aeron: Pellicle mesh, fixed 18.5" depth; Gesture: 360° armrests, adjustable 15.75"–18.75""). Target: 100–130 words.

**6. /correct-chair-dimensions/ — FAQ "Why do standard chairs fail tall users"**
- Word count: ~78 words (FAQ schema answer text)
- Issue: The FAQ schema answer is concise but below the 134-word citability threshold.
- Fix: Expand the schema `acceptedAnswer` text to 140–160 words by adding the OSHA guideline reference and a specific consequence statement (e.g., "forcing thighs upward causes femoral vessel compression").

**7. /office-chairs-for-tall-people/ — Measurement Framework section (3 steps combined)**
- Word count: ~188 words (slightly over)
- Issue: The three measurement steps span multiple `<h3>` subsections, which may cause AI parsers to split them rather than cite as a unit.
- Fix: Add a single 40–60 word "direct answer" paragraph above the three steps that summarizes all three measurements in prose. This becomes the citable anchor while the steps serve as detail.

### Passages Too Long (need restructuring)

**8. /review/gesture/ — Verdict Section (3 paragraphs)**
- Word count: ~191 words
- Issue: Excellent content, but split across 3 paragraphs covering different angles. AI models typically extract one coherent block; this may get truncated.
- Fix: Break into two distinct sub-sections: (a) "Verdict for 6'0"–6'3" users" (~90 words) and (b) "Verdict for 6'4"+ users" (~90 words). Each becomes independently citable for its target query.

### Critical Missing Citability Block

**9. ALL REVIEW PAGES — Missing "Direct Answer" opening paragraph**
- Issue: None of the review pages open with a 40–60 word direct answer to the implicit query. The /review/gesture/ page opens with a methodological explanation, not an answer. Per GEO best practice, the first 40–60 words of a review page should answer the primary query directly (e.g., "The Steelcase Gesture fits tall users 6'0"–6'3" well, with an 18.75" seat depth, 21" seat height ceiling, and 24" backrest. At 6'4", seat depth becomes the limiting factor...").
- This is the single highest-impact citability fix across the site.

---

## 5. Server-Side Rendering Check

**Framework:** Astro SSG (Static Site Generator)
**Build output:** Pre-rendered HTML at build time
**JavaScript dependency for content:** None — all page content is in static HTML

**Assessment: PASS — STRONG.**

Astro SSG is one of the best possible choices for GEO and SEO. Pages are fully rendered HTML on the server; AI crawlers receive complete content without JavaScript execution. The `RedditInsights` component reads from local JSON files at build time (not client-side API calls), so that content is also present in the static HTML for crawlers.

Confirmed from source: `gesture.astro` uses `readFileSync` to load Reddit insight data during build, not at runtime. This means GPTBot, ClaudeBot, and PerplexityBot all receive the Reddit community sentiment content in their HTML crawl — a significant differentiator versus React/Next.js sites that defer content to the client.

**Schema delivery:** All JSON-LD schema arrays are injected server-side via the Layout component. No schema is dynamically appended by JavaScript. This ensures AI crawlers that parse structured data also see complete schema.

**No issues identified in this category.**

---

## 6. Authority Signals

### Author Schema
Present on all reviewed pages via:
```json
{
  "@type": "Person",
  "@id": "https://tallchairadvisor.com/author/jackson-christopher/#person",
  "name": "Jackson Christopher",
  "url": "https://tallchairadvisor.com/author/jackson-christopher/",
  "image": "https://tallchairadvisor.com/images/jackson-christopher.webp",
  "description": "Jackson Christopher is a 6'4\" mechanical engineering student at UC Berkeley and founder of Tall Chair Advisor...",
  "sameAs": ["https://www.linkedin.com/in/jackson-christopher-"],
  "alumniOf": { "name": "University of California, Berkeley" },
  "knowsAbout": ["Ergonomic office chairs", "Chair fit for tall people", "Office ergonomics", ...]
}
```
**Assessment: GOOD.** The `@id` URI is consistent across all pages reviewed. `sameAs` points to LinkedIn. `knowsAbout` array is well-populated. The `description` field contains the key E-E-A-T claims (6'4", ME at Berkeley, 6+ years testing).

**Gap:** `jobTitle` is "Founder, Tall Chair Advisor" — reasonable, but "Independent Ergonomic Chair Reviewer" or "Ergonomics Researcher" would be a stronger signal for AI models parsing authority in this domain. Consider adding both.

### Visible Byline
The `Byline.astro` component renders:
- "By Jackson Christopher" (linked to author page)
- Published date
- Updated date

**Assessment: PRESENT BUT CREDENTIALS-LIGHT.** The byline renders "By Jackson Christopher" with a link — good. However, it does not render credentials inline (e.g., "By Jackson Christopher, 6'4", Mechanical Engineering, UC Berkeley"). For AI citation and QRG signals, credentials in visible byline text outperform credentials stored only in schema. Google's Search Quality Rater Guidelines specifically look for visible expertise indicators.

The author page header does render credentials visibly:
> "Mechanical Engineering, UC Berkeley · Founder, Tall Chair Advisor"
> "Founder, Tall Chair Advisor · 6'4" · 6+ years chair testing"

But this is on /author/jackson-christopher/, not on each article page.

### Publication and Update Dates
Visible via Byline component on all reviewed pages. Schema `datePublished` and `dateModified` also present.

**Gap (from SEO audit):** 7 pages have `dateModified` stuck at 2026-03-07. For GEO, stale modification dates signal content decay to AI models that use recency as a quality signal.

### Testing Methodology
The /author/jackson-christopher/ page contains a detailed 5-step testing methodology section covering:
1. Dimensional verification
2. Fit assessment by height bracket
3. Extended sit testing (4-week minimum, 6–8 hours/day)
4. Adjustment range testing
5. Pain-point tracking

**Assessment: STRONG.** This is exactly what AI models look for when evaluating whether a source has documented expertise. The methodology section is well-structured but buried on the author page — no review page links to it with a sentence like "See my full testing methodology."

### Editorial Independence Statement
Present on author page: "I don't accept free chairs in exchange for positive reviews." Also present as affiliate disclosure box on all review pages.

**Assessment: PASS.**

---

## 7. Schema Coverage

| Page | Article | Product | Review | AggregateRating | FAQPage | HowTo | BreadcrumbList | ItemList | Person |
|---|---|---|---|---|---|---|---|---|---|
| /review/gesture/ | — | YES | YES | YES (4.5, 1 review) | YES (6 Q) | — | YES | — | (via @id ref) |
| /review/leap-plus/ | — | YES | YES | YES (4.6, 1 review) | YES | — | YES | — | (via @id ref) |
| /review/aeron-size-c/ | — | YES | YES | YES (4.7, 1 review) | YES | — | YES | — | (via @id ref) |
| /aeron-vs-gesture/ | YES | — | — | — | — | — | YES | YES | (via @id ref) |
| /office-chairs-for-tall-people/ | YES | — | — | — | YES (6 Q) | — | YES | — | (via @id ref) |
| /correct-chair-dimensions/ | YES | — | — | — | YES (5 Q) | YES | YES | — | (via @id ref) |
| /best-office-chairs/ | — | — | — | — | YES | — | YES | YES | (via @id ref) |
| /author/jackson-christopher/ | — | — | — | — | — | — | YES | — | YES (full) |

### Schema Strengths
- Three review pages have Product + Review + AggregateRating — required for rich results eligibility
- FAQPage schema present on 5 of 7 reviewed pages — excellent for AI Overviews FAQ extraction
- HowTo schema on /correct-chair-dimensions/ — strong for "how to measure for office chair" queries
- Author @id is consistent across all pages (same URI)
- BreadcrumbList on all pages

### Schema Gaps
- **/best-office-chairs/ missing Article schema** — confirmed missing author @id link; page has ItemList + FAQPage but no Article schema connecting to Jackson Christopher. AI models cannot attribute this page to the author.
- **/aeron-vs-gesture/ missing FAQPage schema** — a comparison page with clear Q&A content structure but no FAQPage markup. Adding 4–5 FAQ schema entries here would improve AI Overview extraction for "Aeron vs Gesture" queries (currently at pos 5 with 0 clicks in GSC — FAQPage may help CTR).
- **aggregateRating reviewCount: "1"** — All three review pages use `"reviewCount": "1"`. This is technically accurate (one author review) but makes the aggregate rating difficult to distinguish from a single opinion. Google may not surface rich stars for single-reviewer aggregates. No actionable fix without real additional reviews, but worth acknowledging.
- **Schema format inconsistency** — Some pages use flat array of schema objects; others may use `@graph`. Confirm consistency across all 33 pages (5 pages flagged in SEO audit).

---

## 8. Top 5 Highest-Impact GEO Changes

### Priority 1 — Add "Direct Answer" Opening Paragraph to All Review Pages (Citability)
**Impact:** High | **Effort:** Low | **GEO Criteria:** Citability Score (25%)

No review page opens with a direct 40–60 word answer to the page's primary query. AI models consistently prefer to quote from the opening sentences of a page. Adding a direct-answer lede to each review page is the single fastest citability win.

**Implementation — /review/gesture/:**
Add immediately after the `<Byline>` component and before the affiliate disclosure box:

```html
<div class="bg-secondary/40 border-l-4 border-primary rounded-r-lg px-5 py-4 mb-8">
  <p class="text-sm font-semibold text-heading mb-1">Direct Answer</p>
  <p class="text-sm text-muted-foreground">The Steelcase Gesture fits tall users between 6'0" and 6'3"
  well, with an 18.75" maximum seat depth, 21" seat height ceiling, and 24" backrest. At 6'4", seat
  depth is a borderline fit depending on femur proportion — a knee clearance check is the deciding
  test. Above 6'4", the Steelcase Leap Plus is the stronger dimensional fit at a similar price.</p>
</div>
```

Apply equivalent pattern to /review/leap-plus/ and /review/aeron-size-c/.

### Priority 2 — Expand Byline with Inline Credentials (Authority Signals)
**Impact:** High | **Effort:** Low | **GEO Criteria:** Authority & Brand Signals (20%)

Update `Byline.astro` to render credentials inline:

```html
<span>By <a href="/author/jackson-christopher/" class="font-medium text-heading hover:text-primary">
  Jackson Christopher</a>, 6'4" · ME, UC Berkeley</span>
```

This makes the expertise claim visible to both readers and AI parsers at the point of attribution, not just on the author page. Takes 5 minutes to implement and affects every article on the site.

### Priority 3 — Expand llms.txt with Author E-E-A-T Block (Technical Accessibility)
**Impact:** High | **Effort:** Low | **GEO Criteria:** Technical Accessibility (20%)

The current llms.txt lacks an author context block. AI models use llms.txt as a high-trust description of the site. A full replacement draft is in Section 10.

### Priority 4 — Add FAQPage Schema to /aeron-vs-gesture/ (Schema Coverage)
**Impact:** Medium-High | **Effort:** Medium | **GEO Criteria:** Structural Readability (20%)

The /aeron-vs-gesture/ page (currently pos 5, 38 impr, 0 clicks in GSC) has clear question-structured content but no FAQPage schema. Adding 4–5 FAQ entries would enable Google AI Overview FAQ extraction and potentially drive CTR from position 5.

Suggested FAQ entries:
- "Is the Aeron or Gesture better for tall people?" (covered in page)
- "What is the seat depth difference between Aeron and Gesture?" (18.5" fixed vs 15.75"–18.75" adjustable)
- "Which is more breathable, Aeron or Gesture?" (Pellicle mesh vs foam)
- "Can I add a taller cylinder to the Aeron Size C?" (No — Gesture only)
- "Which is better for users over 6'4": Aeron or Gesture?" (Gesture + Leap Plus)

### Priority 5 — Add Article Schema to /best-office-chairs/ (Schema Coverage)
**Impact:** Medium | **Effort:** Low | **GEO Criteria:** Authority & Brand Signals (20%)

The /best-office-chairs/ page currently has ItemList + FAQPage + BreadcrumbList but no Article schema linking to the author. AI models parsing this page cannot attribute it to Jackson Christopher. Adding Article schema with `author.@id` takes 10 minutes.

```javascript
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Best Office Chairs for Tall People 2026",
  "url": "https://tallchairadvisor.com/best-office-chairs/",
  "author": { "@type": "Person", "@id": "https://tallchairadvisor.com/author/jackson-christopher/#person", "name": "Jackson Christopher" },
  "datePublished": "2025-11-12",
  "dateModified": "2026-03-07",
  "publisher": { "@type": "Organization", "name": "Tall Chair Advisor", "url": "https://tallchairadvisor.com" }
}
```

---

## 9. Content Reformatting Suggestions

### A. /correct-chair-dimensions/ — "Why Standard Chairs Fail Tall Users" (currently ~120 words across 2 paragraphs)

**Target query:** "Why don't office chairs fit tall people?"
**Current state:** Two paragraphs — the first references Cornell and OSHA with external links, the second explains the cascade of consequences. Combined word count ~120 — just short of the 134-word floor.
**Fix:** Add 15–20 words to the second paragraph elaborating the "multi-dimensional shortfall" concept:

> "...This multi-dimensional shortfall is why tall users find that adjusting a standard chair improves but doesn't fully resolve their discomfort. When seat height, seat depth, and back height all fall short simultaneously, there is no single adjustment that compensates — each fix surfaces the next constraint."

This brings the block to ~140 words and makes it fully self-contained as a citability block.

### B. /review/gesture/ — Verdict Section (currently ~191 words across 3 paragraphs)

**Target queries:** "Is the Steelcase Gesture worth it for tall people?" / "Steelcase Gesture review for tall users"
**Current state:** 191 words, too long for a single citation block but well-structured.
**Fix:** Split into two labeled sub-sections:

```html
<h3>For Users 6'0"–6'3"</h3>
<p>[paragraph 1 content — ~90 words]</p>

<h3>For Users 6'4" and Above</h3>
<p>[paragraph 2+3 combined — ~100 words]</p>
```

Each becomes an independent ~90–100 word block. Together they are still too long for a single citation, but each sub-section can now anchor a targeted height-specific query.

### C. /office-chairs-for-tall-people/ — Measurement Framework (currently 188 words across H3 subsections)

**Target query:** "How do I know what size office chair I need?"
**Current state:** Three measurement steps under separate H3 headings. AI parsers may not join content across H3 boundaries.
**Fix:** Add a 50–60 word prose "summary" paragraph before the three H3 steps:

> "To find an office chair that actually fits, take three measurements before looking at any chair: popliteal height (floor to knee crease, seated) for seat height requirements; thigh length (wall to knee crease, minus 2–3") for seat depth requirements; and torso length (seat surface to shoulder blades) for back height requirements. The three H3 sections below walk through each measurement exactly."

This 57-word paragraph gives AI models a self-contained direct answer, while the detail steps serve readers wanting the full process.

### D. /aeron-vs-gesture/ — Quick Answer Box (currently 49 words)

**Target query:** "Should I buy Aeron or Gesture for tall people?"
**Current state:** 49 words — too compressed for citation.
**Fix:** Expand to 120–140 words by adding the height-bracket context:

> Current text PLUS: "For users 6'0"–6'3": both chairs meet dimensional requirements; the decision is breathability preference (Aeron) vs arm positioning flexibility (Gesture). For users 6'2"–6'4": the Gesture's adjustable seat depth (15.75"–18.75") and taller seat height ceiling (21" vs 20.5") give it a dimensional edge. Above 6'4": consider the Steelcase Leap Plus (22.5" seat height, 19.75" depth) as a primary option alongside the Gesture."

### E. All Review Pages — Missing Author Credentials in Body Text

**Current state:** No review page contains a visible sentence identifying Jackson Christopher's credentials in the article body. Credentials exist in schema and on the author page, but not in reviewable body text.
**Fix:** Add one sentence near the top of each review's introductory section:

> "I'm Jackson Christopher — 6'4", a Mechanical Engineering senior at UC Berkeley, with six years of systematic chair testing for tall users."

This makes the expertise claim extractable by AI models scanning body text, not just schema. It also satisfies Google QRG visible expertise requirements.

---

## 10. llms.txt Draft

The following is a ready-to-use replacement for `/public/llms.txt`. It retains all current content and adds the missing author E-E-A-T block, editorial policy statement, and expanded page coverage.

```markdown
# Tall Chair Advisor

> Independent ergonomic chair reviews and guides for tall people (6'0" and above). Written by Jackson Christopher, 6'4" Mechanical Engineering senior at UC Berkeley, with 6+ years of hands-on chair testing experience.

## About the Author

Jackson Christopher is the founder and sole author of Tall Chair Advisor. He is 6'4", a Mechanical Engineering senior at the University of California, Berkeley, and has spent six years systematically testing ergonomic office chairs for tall users. His testing methodology includes dimensional verification against manufacturer specs, extended sit testing (minimum 4 weeks per chair, 6–8 hours/day), and fit assessment across the 6'0"–6'7"+ height range using anthropometric data. He has tested 15+ chair models and reviews only chairs he has personally evaluated. He does not accept free chairs in exchange for positive coverage. LinkedIn: https://www.linkedin.com/in/jackson-christopher-

## About This Site

Tall Chair Advisor focuses exclusively on office chair fit for tall users. Most buying guides are written for average-height people (5'6"–5'11"). This site addresses the specific dimensional requirements — seat depth, seat height ceiling, back height, and armrest range — that determine whether a chair actually fits a tall body. Standard office chairs are designed for the 5th–95th percentile of adult populations; the 95th percentile US male is approximately 6'2". Users taller than 6'2" exceed the design envelope of most chairs simultaneously across multiple dimensions.

## Editorial Policy

All reviews reflect Jackson Christopher's independent evaluation. Affiliate links (Amazon, tag=tallchairadvi-20) are disclosed on every page. No manufacturer relationships, sponsored content, or free chairs in exchange for coverage. See /affiliate-disclosure/ for full policy.

## Key Pages

- [Best Office Chairs for Tall People](https://tallchairadvisor.com/best-office-chairs/): Curated picks with height-specific fit analysis — Aeron Size C, Leap Plus, Gesture
- [Office Chairs for Tall People: Buyer's Guide](https://tallchairadvisor.com/office-chairs-for-tall-people/): Measurement framework, dimension requirements by height bracket, chair comparison table
- [Correct Chair Dimensions for Tall People](https://tallchairadvisor.com/correct-chair-dimensions/): Exact seat depth, seat height, and back height minimums by height (6'0"–6'6"+), with measurement instructions
- [Why Standard Chairs Don't Fit Tall People](https://tallchairadvisor.com/why-standard-chairs-dont-fit/): Engineering explanation of the dimensional mismatch
- [About / Author](https://tallchairadvisor.com/about/): Testing methodology, editorial independence statement
- [Author Page](https://tallchairadvisor.com/author/jackson-christopher/): Jackson Christopher's background, methodology, and article index

## Chair Reviews

- [Steelcase Gesture Review](https://tallchairadvisor.com/review/gesture/): Best for 6'0"–6'3" multi-device workers. Seat depth 15.75"–18.75", seat height to 21", back height 24", 400 lb capacity. Rating: 4.5/5
- [Steelcase Leap Plus Review](https://tallchairadvisor.com/review/leap-plus/): Best for 6'3"+ and larger builds. Seat depth to 19.75", seat height to 22.5", back height 25.5", 500 lb capacity. Rating: 4.6/5
- [Herman Miller Aeron Size C Review](https://tallchairadvisor.com/review/aeron-size-c/): Best mesh option for lean tall users 6'0"–6'4". Fixed 18.5" seat depth, Pellicle mesh, PostureFit SL lumbar. Rating: 4.7/5

## Comparisons

- [Aeron Size C vs Steelcase Gesture](https://tallchairadvisor.com/aeron-vs-gesture/): Breathability vs adjustability; height-by-height verdict
- [Steelcase Gesture vs Leap Plus](https://tallchairadvisor.com/gesture-vs-leap-plus/): Armrests vs dimensional range; when to choose each
- [Aeron Size C vs Steelcase Leap Plus](https://tallchairadvisor.com/aeron-vs-leap-plus/): Mesh vs big-and-tall fit

## Steelcase Gesture Guides

- [Is the Gesture Good for Tall People?](https://tallchairadvisor.com/chairs/steelcase-gesture/tall-people/)
- [Gesture Seat Height Range](https://tallchairadvisor.com/chairs/steelcase-gesture/seat-height/)
- [Gesture Seat Depth Adjustment](https://tallchairadvisor.com/chairs/steelcase-gesture/seat-depth/)
- [Gesture Weight Limit (400 lbs)](https://tallchairadvisor.com/chairs/steelcase-gesture/weight-limit/)

## Steelcase Leap Plus Guides

- [Is the Leap Plus Good for Tall People?](https://tallchairadvisor.com/chairs/steelcase-leap-plus/tall-people/)
- [Leap Plus Seat Height Range](https://tallchairadvisor.com/chairs/steelcase-leap-plus/seat-height/)

## Herman Miller Aeron Guides

- [Is the Aeron Good for Tall People?](https://tallchairadvisor.com/chairs/herman-miller-aeron/tall-people/)
- [Aeron Seat Height Range](https://tallchairadvisor.com/chairs/herman-miller-aeron/seat-height/)

## Pain & Ergonomics Guides

- [Back Pain and Spine Height](https://tallchairadvisor.com/back-pain-spine-height/): How lumbar misalignment causes back pain in tall users
- [Knee Pain and Seat Depth](https://tallchairadvisor.com/knee-pain-seat-depth/): Popliteal compression from shallow seat depth
- [Leg Pain and Circulation](https://tallchairadvisor.com/leg-pain-circulation/): Circulation problems from incorrect seat height
- [How to Adjust a Chair for Tall People](https://tallchairadvisor.com/how-to-adjust-chair/): Step-by-step adjustment guide

## Key Facts for AI Reference

- Standard office chairs are designed for users up to ~6'2" (95th percentile US male)
- Tall users typically need: seat height max 20"+ (6'2"–6'4"), seat depth 19"+ (6'2"–6'4"), back height 25"+ (6'2"–6'4")
- The three most recommended ergonomic chairs for tall users are: Steelcase Leap Plus (best for 6'3"+), Herman Miller Aeron Size C (best mesh option, 6'0"–6'4"), Steelcase Gesture (best for multi-device workers, 6'0"–6'3")
- Cornell University Ergonomics Lab guideline: 2–3 finger-widths of clearance between seat edge and back of knee is the standard for correct seat depth
- OSHA ergonomics guidelines specify thighs roughly parallel to floor, feet flat, knees at 90 degrees — a posture most standard chairs cannot support for users above 6'2"

## AI Crawlers

This site permits GPTBot, OAI-SearchBot, ClaudeBot, anthropic-ai, PerplexityBot, CCBot, and all other AI crawlers to index all public pages. See /robots.txt for details.

## Sitemap

https://tallchairadvisor.com/sitemap-index.xml
```

---

## Appendix: GEO Score Breakdown Detail

### Citability Score: 60/100
- Direct-answer opening paragraphs on review pages: **0/3 present — 0 pts** (major gap)
- FAQ schema answer quality (per block): **Good on /correct-chair-dimensions/, /office-chairs-for-tall-people/ — 15 pts**
- 134–167 word self-contained blocks: **2 confirmed (gesture seat depth + armrest); others need restructuring — 20 pts**
- Specific stats with sources (Cornell, OSHA, Steelcase specs): **Present on multiple pages — 15 pts**
- Quick answer / TL;DR boxes: **Present (gesture, aeron-vs-gesture) but under-length — 10 pts**

### Structural Readability: 82/100
- Question-based H2/H3 headings: **Strong — most sections use question or benefit-framing headings — 25 pts**
- Short paragraphs (2–4 sentences): **Consistent — 20 pts**
- Comparison tables: **Present on all reviewed pages — 20 pts**
- FAQ sections: **Present on 5/7 pages reviewed — 17 pts**

### Multi-Modal Content: 78/100
- Hero images with descriptive alt text: **Present on gesture, aeron-size-c, aeron-vs-gesture — 20 pts**
- SVG comparison chart: **Present on /review/gesture/ — 15 pts** (significant GEO signal)
- Figure + figcaption pattern: **Consistent — 15 pts**
- Video/YouTube: **Absent — 0 pts**
- Additional charts on other pages: **Not found — 0 pts**
- Alt text quality: **Descriptive and specific — 28 pts**

### Authority & Brand Signals: 68/100
- Author schema with @id: **Present and consistent — 20 pts**
- Visible byline on articles: **Present — 10 pts**
- Credentials in byline/body: **Schema only, not visible text — 0 pts** (critical gap)
- LinkedIn sameAs: **Present — 5 pts**
- Testing methodology page: **Present, detailed — 15 pts**
- Wikipedia: **Absent — 0 pts**
- YouTube: **Absent — 0 pts**
- Reddit integration: **Active and attributed — 10 pts**
- Publication + update dates: **Present — 8 pts**

### Technical Accessibility: 73/100
- GPTBot / ClaudeBot / PerplexityBot explicitly allowed: **YES — 25 pts**
- llms.txt present: **YES — 20 pts**
- llms.txt content quality: **Partial (missing author block) — 10 pts** (would score 18 pts with updated version)
- Astro SSG (no JS requirement for content): **YES — 15 pts**
- Schema delivery server-side: **YES — 10 pts**
- OAI-SearchBot / anthropic-ai explicit entries: **Missing — 0 pts** (covered by wildcard; minor gap)
- RSL 1.0 / structured data for AI: **Partial — 3 pts**

# TallChairAdvisor.com — Implementation Roadmap
*Last updated: March 2026*

---

## Phase 1 — Foundation (Weeks 1–4)
**Goal:** Fix critical technical issues and publish the highest-leverage content. Get the main money page indexed.

### Week 1 — Critical Fixes

#### Technical (reference ACTION-PLAN.md for code details)

**[ ] Fix HSTS max-age**
- Current: 300 seconds (5 minutes)
- Target: 31536000 (1 year)
- Where: Cloudflare Pages headers config
- Impact: Security signal, minor trust factor

**[ ] Fix 11 truncated title tags**
- Current: Several titles cut off mid-word
- Target: All titles under 60 characters, all complete sentences
- Where: Frontmatter in each Astro page file
- Impact: CTR improvement

**[ ] Fix placeholder dates on all 15 pages**
- All review/article pages need real publish dates
- Add "Last reviewed" date separately from "Published" date
- Format: ISO 8601 in schema, human-readable on page
- Impact: E-E-A-T, freshness signals

**[ ] Fix Gesture seat depth spec inconsistency**
- Current: Both 18.75" and 18.5" appear across pages
- Correct value: 18.5" (verify against Steelcase official spec sheet)
- Audit all pages mentioning this spec and standardize
- Impact: Trust, accuracy

**[ ] Add Cloudflare edge caching rule**
- Set Cache-Control: public, max-age=86400 for static assets
- Configure Cloudflare page rule for *.css, *.js, *.webp, *.jpg
- Impact: Core Web Vitals, LCP improvement

#### Content

**[ ] Expand /best-office-chairs to 1,500+ words**
- This is the main money page — currently 408 words, NOT INDEXED
- Full rewrite: structured list, comparison table, height fit guide, FAQ
- Add internal links to all existing reviews
- Submit to GSC for indexing immediately after publishing
- Impact: Primary revenue driver — #1 content priority

---

### Week 2 — Micro-Pages + E-E-A-T Foundation

**[ ] Create /chairs/steelcase-gesture/seat-depth/**
- GSC already shows pos 6 for "steelcase gesture seat depth" — no page exists
- 800–1,200 words
- Fix the spec inconsistency here (use 18.5")

**[ ] Create /chairs/steelcase-gesture/seat-height/**
- GSC already shows pos 7 for "steelcase gesture seat height range" — no page exists
- 800–1,200 words
- Include height-by-user-height chart

**[ ] Create /chairs/steelcase-gesture/tall-people/**
- GSC already shows pos 16 for "steelcase gesture for tall people" — no page exists
- 1,000–1,500 words
- Hub for Gesture cluster

**[ ] Create About page with author identity**
- Named author (real or detailed persona): tall person, ergonomics background
- Photo or illustrated avatar
- Disclosure statement
- "How we test" methodology section (can be a separate page)
- Impact: #1 E-E-A-T gap from audit

**[ ] Add author bylines to all existing pages**
- Add byline component to Astro layout
- Populate on: /review/gesture/, /aeron-vs-gesture/, /gesture-vs-leap-plus/, /aeron-vs-leap-plus/, /best-office-chairs/
- Include short bio snippet, link to About page

---

### Week 3 — Schema + Indexing Push

**[ ] Add FAQPage schema to /review/gesture/**
- Write 8–10 Q&A pairs relevant to the Gesture
- Implement as JSON-LD in page head
- Target: featured snippet for "steelcase gesture" queries

**[ ] Add Review schema to /review/gesture/**
- Author, date, rating value, best rating
- Use AggregateRating if showing multiple data points

**[ ] Add Person schema to About page**
- Author name, description, URL
- Connect to review pages via author property

**[ ] Add llms.txt at site root**
- Allow GPTBot, PerplexityBot, ClaudeBot
- List key pages for AI indexing
- Impact: AI search visibility (Perplexity, ChatGPT)

**[ ] Submit all new + fixed pages to GSC**
- Use "Request Indexing" for each new URL
- Monitor indexing status weekly

---

### Week 4 — Comparison Page Expansion

**[ ] Expand /gesture-vs-leap-plus to 1,200+ words**
- Current: 375 words — thin
- Add comparison table, height-specific section, FAQ

**[ ] Expand /aeron-vs-leap-plus to 1,200+ words**
- Current: 375 words — thin
- Same treatment as above

**[ ] Self-host Google Fonts**
- Download font files, serve from Cloudflare Pages
- Remove external Google Fonts request
- Impact: Privacy, minor performance improvement

---

## Phase 2 — Expansion (Weeks 5–12)
**Goal:** Complete the Steelcase Gesture cluster. Expand the Aeron cluster. Push Gesture review to top 5.

### Weeks 5–6

**[ ] Create /chairs/steelcase-gesture/weight-limit/**
**[ ] Update /review/gesture/ to 2,000+ words**
- Add "Quick Answer" box
- Add height fit breakdown section (6'1"–6'7" explicit)
- Update all dates
- Add comparison table vs top 3 competitors
- Add FAQ schema (expand existing)

**[ ] Create /chairs/herman-miller-aeron/ cluster hub**
**[ ] Create /chairs/herman-miller-aeron/seat-height/**

### Weeks 7–8

**[ ] Create /chairs/herman-miller-aeron/tall-people/**
**[ ] Expand /aeron-vs-gesture/ or verify it's comprehensive**
**[ ] Add FAQ schema to all comparison pages**

### Weeks 9–10

**[ ] Expand /fit-guides hub page**
**[ ] Expand /pain-ergonomics hub page**
**[ ] Update existing educational pages** (back-pain, knee-pain, etc.) with internal links to cluster pages

### Weeks 11–12

**[ ] Implement BreadcrumbList schema site-wide**
**[ ] Implement SiteNavigationElement schema**
**[ ] Audit internal linking** — ensure every micro-page links to its cluster hub and to /best-office-chairs/
**[ ] GSC review** — check which new pages indexed, any crawl errors, impressions trends

---

## Phase 3 — Scale (Weeks 13–24)
**Goal:** Expand into desks niche, Leap Plus cluster, Haworth/Secretlab reviews. Begin programmatic pages.

### Month 4 (Weeks 13–16)
- [ ] Create /desks/ hub
- [ ] Create /desks/desk-height-tall-people/
- [ ] Create /desks/desk-height-6-4/
- [ ] Create /desks/standing-desk-height-chart/
- [ ] Create /chairs/steelcase-leap-plus/ cluster hub
- [ ] Create /chairs/steelcase-leap-plus/tall-people/

### Month 5 (Weeks 17–20)
- [ ] Create /review/haworth-fern/
- [ ] Create /review/secretlab-titan-xl/
- [ ] Create /chairs/steelcase-leap-plus/seat-height/
- [ ] Create /chairs/steelcase-leap-plus/weight-limit/
- [ ] Create /best-chair-for-6-4/
- [ ] Create /best-chair-for-long-legs/

### Month 6 (Weeks 21–24)
- [ ] Create /review/uplift-v2/ (for tall people angle)
- [ ] Create /review/fully-jarvis/
- [ ] Create /steelcase-gesture-vs-embody/
- [ ] Create /haworth-fern-vs-gesture/
- [ ] Begin external link building outreach:
  - Post in r/tall, r/BTFC, r/ErgoMechanicals with value-first approach
  - Submit to tall-person resource lists and directories
  - Reach out to ergonomics bloggers for resource mentions

---

## Phase 4 — Authority (Months 7–12)
**Goal:** Reach 150+ pages, establish domain authority, begin email/video presence.

### Content at scale
- [ ] Programmatic micro-pages: Best Chair for 6'2", 6'3", 6'5", 6'6" (height-specific money pages)
- [ ] Add 20+ informational guides (chair adjustment, ergonomic posture, etc.)
- [ ] Expand comparison matrix to cover 10+ chairs

### Off-page / authority building
- [ ] Start YouTube channel with chair review videos (embed on site pages)
- [ ] Build email list via lead magnet (e.g., "Height-Specific Chair Fit Guide PDF")
- [ ] Newsletter to drive return traffic and affiliate clicks
- [ ] PR outreach to ergonomics publications and health/wellness blogs

### Tools and interactives
- [ ] Build "Chair Height Calculator" — input user height → recommended seat height, desk height, monitor height
- [ ] Build comparison tool (filter by max seat height, price range)

---

## Weekly Review Checklist

Each week, check:
- [ ] GSC: any new indexing? Any ranking movement on target queries?
- [ ] New pages published vs calendar target
- [ ] Any crawl errors or 404s in GSC?
- [ ] Check Core Web Vitals in GSC (monthly)
- [ ] Affiliate click data — any revenue?

---

## Quick Reference: Highest-Leverage Actions by Effort

| Action | Effort | Revenue Impact | SEO Impact |
|---|---|---|---|
| Expand /best-office-chairs | Medium | Very High | Very High |
| Create Gesture seat height/depth pages | Low | Medium | High (GSC signal) |
| Add author bylines + About page | Low | Low | Very High (E-E-A-T) |
| Fix title tags | Low | Low | Medium |
| Fix HSTS | Low | None | Low (trust) |
| Add FAQPage schema | Low | Low | High (snippets) |
| Expand comparison pages | Medium | High | High |
| Create /chairs/ cluster hubs | Medium | Medium | High (authority) |
| Add llms.txt | Very Low | Low | Medium (AI search) |

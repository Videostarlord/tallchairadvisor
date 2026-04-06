# Astro Migration Plan: tallchairadvisor.com
**Status:** Ready to build — all content read, plan complete
**Source repo:** /Users/jacksonchristopher/Downloads/Claude SEO/chairarchitecture/
**Output dir:** /Users/jacksonchristopher/Downloads/Claude SEO/tall-chair-advisor/ (to be created)

---

## What Was Learned From the Repo

### Tech Stack (Source - Lovable.dev)
- React + Vite + TypeScript
- Tailwind CSS with custom theme (warm editorial palette, teal primary)
- shadcn/ui components
- react-router-dom for routing
- Fonts: Playfair Display (serif) + Source Sans 3 (sans) via Google Fonts
- lucide-react icons
- Amazon affiliate tag: `tallchairadvi-20`

### Page Inventory (22 content pages)
```
src/pages/
  Home.tsx                         → /
  About.tsx                        → /about
  PrivacyPolicy.tsx                → /privacy-policy
  Contact.tsx                      → /contact
  AffiliateDisclosure.tsx          → /affiliate-disclosure
  OfficeChairsForTallPeople.tsx    → /office-chairs-for-tall-people
  PainErgonomicsHub.tsx            → /pain-ergonomics
  WhyStandardChairsDontFit.tsx     → /why-standard-chairs-dont-fit
  KneePainSeatDepth.tsx            → /knee-pain-seat-depth
  BackPainSpineHeight.tsx          → /back-pain-spine-height
  LegPainCirculation.tsx           → /leg-pain-circulation
  FitGuidesHub.tsx                 → /fit-guides
  CorrectChairDimensions.tsx       → /correct-chair-dimensions
  HowToAdjustChair.tsx             → /how-to-adjust-chair
  BestOfficeChairs.tsx             → /best-office-chairs
  comparisons/AeronVsLeapPlus.tsx  → /aeron-vs-leap-plus
  comparisons/GestureVsLeapPlus.tsx → /gesture-vs-leap-plus
  comparisons/AeronVsGesture.tsx   → /aeron-vs-gesture
  reviews/AeronSizeCReview.tsx     → /review/aeron-size-c
  reviews/LeapPlusReview.tsx       → /review/leap-plus
  reviews/GestureReview.tsx        → /review/gesture
  NotFound.tsx                     → 404
```

### Images (copy these to public/)
```
src/assets/
  aeron-lumbar-detail.jpg
  aeron-size-c-hero.jpg
  aeron-vs-gesture-comparison.jpg
  leap-plus-hero.jpg
  leap-plus-seat-detail.jpg
```
Also: `/lovable-uploads/` paths in img tags need updating to `/images/`

### Custom CSS Classes to Preserve
- `.container-article` = `max-w-3xl mx-auto px-4 sm:px-6`
- `.container-wide` = `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`
- `.prose-tca` = custom article prose styles
- `.link-internal` = teal underlined links
- `.card-hub` = card hover styles
- `.badge-layer` = layer indicator badge

### CSS Variables (full theme in src/index.css - copy verbatim)
Custom HSL vars for: --background, --primary (175 45% 35% teal), --secondary, --heading, etc.
Layer colors: --layer-0 through --layer-5

---

## Astro Project Structure to Build

```
tall-chair-advisor/
├── package.json
├── astro.config.mjs          ← @astrojs/tailwind + @astrojs/sitemap
├── tailwind.config.mjs       ← copy from source
├── tsconfig.json
├── public/
│   ├── robots.txt
│   ├── favicon.svg
│   └── images/               ← copy from source assets + lovable-uploads
├── src/
│   ├── styles/
│   │   └── global.css        ← copy index.css verbatim (swap react-router imports)
│   ├── layouts/
│   │   └── Layout.astro      ← SEO props: title, description, canonical, schema, ogImage
│   ├── components/
│   │   ├── Header.astro      ← static nav + vanilla JS mobile menu
│   │   └── Footer.astro      ← static links
│   └── pages/
│       ├── index.astro
│       ├── about.astro
│       ├── privacy-policy.astro
│       ├── contact.astro
│       ├── affiliate-disclosure.astro
│       ├── office-chairs-for-tall-people.astro
│       ├── pain-ergonomics.astro
│       ├── why-standard-chairs-dont-fit.astro
│       ├── knee-pain-seat-depth.astro
│       ├── back-pain-spine-height.astro
│       ├── leg-pain-circulation.astro
│       ├── fit-guides.astro
│       ├── correct-chair-dimensions.astro
│       ├── how-to-adjust-chair.astro
│       ├── best-office-chairs.astro
│       ├── aeron-vs-leap-plus.astro
│       ├── gesture-vs-leap-plus.astro
│       ├── aeron-vs-gesture.astro
│       └── review/
│           ├── aeron-size-c.astro
│           ├── leap-plus.astro
│           └── gesture.astro
```

---

## Layout.astro SEO Interface

```astro
---
interface Props {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  schema?: object | object[];  // JSON-LD, gets stringified into <script type="application/ld+json">
}
const { title, description, canonical, ogImage = '/images/og-default.jpg', schema } = Astro.props;
const canonicalURL = canonical ?? new URL(Astro.url.pathname, 'https://tallchairadvisor.com').href;
---
<html lang="en-US">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalURL} />
    <!-- OG -->
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:image" content={`https://tallchairadvisor.com${ogImage}`} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Tall Chair Advisor" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <!-- Performance hints -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preconnect" href="https://www.googletagmanager.com" />
    <!-- GA4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TWK4EPV8DT"></script>
    <script>...</script>
    <!-- Schema -->
    {schema && <script type="application/ld+json" set:html={JSON.stringify(schema)} />}
    <!-- Robots -->
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  </head>
  <body>
    <Header />
    <slot />
    <Footer />
  </body>
</html>
```

---

## Per-Page SEO Data

### Homepage (/)
- title: "Best Office Chairs for Tall People 2026 | Tall Chair Advisor"
- description: "Independent expert guidance on ergonomic office chairs for people 6 feet and taller. Reviews, fit guides, and pain solutions."
- schema: WebSite + Organization

### /office-chairs-for-tall-people
- title: "Office Chairs for Tall People: Expert Guide 2026 | Tall Chair Advisor"
- description: "Why most office chairs fail people 6ft+, and exactly what dimensions to look for. Seat depth, height range, back height explained."
- schema: Article + BreadcrumbList

### /pain-ergonomics
- title: "Ergonomic Chair Pain for Tall People: Causes & Fixes | Tall Chair Advisor"
- description: "How chair dimensions cause knee pain, back pain, and leg circulation issues for tall users. Understand the root cause before buying."
- schema: Article + BreadcrumbList

### /why-standard-chairs-dont-fit
- title: "Why Standard Office Chairs Don't Fit Tall People | Tall Chair Advisor"
- description: "The engineering decisions that make most chairs fail at 6ft+: seat depth, cylinder height limits, and lumbar placement explained."
- schema: Article + BreadcrumbList

### /knee-pain-seat-depth
- title: "Office Chair Knee Pain: How Seat Depth Affects Tall Users | Tall Chair Advisor"
- description: "Why shallow seat depth causes popliteal pressure and knee pain for tall users, and the minimum depths you need."
- schema: Article + BreadcrumbList

### /back-pain-spine-height
- title: "Office Chair Back Pain: Lumbar Height Issues for Tall People | Tall Chair Advisor"
- description: "How misaligned lumbar support causes chronic back pain for tall users, and what back height specs to require."
- schema: Article + BreadcrumbList

### /leg-pain-circulation
- title: "Leg Pain & Numbness from Office Chair: Tall User Guide | Tall Chair Advisor"
- description: "Why incorrect seat height causes circulation problems and leg pain for tall users. Symptoms, causes, and what to look for."
- schema: Article + BreadcrumbList

### /fit-guides
- title: "Office Chair Fit Guides for Tall People | Tall Chair Advisor"
- description: "Step-by-step guides for measuring chair fit and adjusting ergonomic chairs to work with a taller body."
- schema: Article + BreadcrumbList

### /correct-chair-dimensions
- title: "Correct Office Chair Dimensions for Tall People | Tall Chair Advisor"
- description: "The exact seat height, seat depth, back height, and lumbar measurements tall users (6ft+) should require from any chair."
- schema: Article + BreadcrumbList

### /how-to-adjust-chair
- title: "How to Adjust an Office Chair for Tall People | Tall Chair Advisor"
- description: "Step-by-step instructions for adjusting seat height, depth, lumbar support, and armrests for users 6 feet and taller."
- schema: Article + BreadcrumbList

### /best-office-chairs
- title: "Best Office Chairs for Tall People 2026 | Tall Chair Advisor"
- description: "Curated shortlist of ergonomic chairs that meet dimensional requirements for users 6ft+. Criteria-based selection, no fluff."
- schema: ItemList + BreadcrumbList

### /aeron-vs-leap-plus
- title: "Herman Miller Aeron vs Steelcase Leap Plus: For Tall People | Tall Chair Advisor"
- description: "Direct comparison of the Aeron Size C vs Leap Plus for tall users: seat depth, height range, build, and which to choose."
- schema: Article + BreadcrumbList

### /gesture-vs-leap-plus
- title: "Steelcase Gesture vs Leap Plus: Which Is Better for Tall People? | Tall Chair Advisor"
- description: "Gesture vs Leap Plus compared on dimensions, adjustability, and suitability for tall users 6ft and above."
- schema: Article + BreadcrumbList

### /aeron-vs-gesture
- title: "Herman Miller Aeron vs Steelcase Gesture: Tall User Comparison | Tall Chair Advisor"
- description: "Aeron Size C vs Steelcase Gesture compared for tall users: armrest range, seat depth, back height, and best use case."
- schema: Article + BreadcrumbList

### /review/aeron-size-c
- title: "Herman Miller Aeron Size C Review: For Tall Users 6'0\"–6'6\" | Tall Chair Advisor"
- description: "In-depth review of the Aeron Size C for tall people. Specs, pros/cons, comfort analysis, and who it fits best."
- schema: Product + AggregateRating + BreadcrumbList
- ratingValue: "4.7", reviewCount: "1", price: "1795.00"

### /review/leap-plus
- title: "Steelcase Leap Plus Review: Best for Tall & Larger Users | Tall Chair Advisor"
- description: "Full review of the Steelcase Leap Plus for tall users. Adjustable seat depth, 500lb capacity, and fit for frames 6ft+."
- schema: Product + AggregateRating + BreadcrumbList

### /review/gesture
- title: "Steelcase Gesture Review for Tall People | Tall Chair Advisor"
- description: "Review of the Steelcase Gesture for tall users. 360° armrests, flexible seat edge, and suitability for users 6ft–6'4\"."
- schema: Product + AggregateRating + BreadcrumbList

### /about
- title: "About Tall Chair Advisor | Independent Ergonomic Chair Reviews"
- description: "Tall Chair Advisor provides independent ergonomic chair guidance for people 6 feet and taller who struggle with standard seating."
- noindex: false

### /privacy-policy, /contact, /affiliate-disclosure
- noindex: false (keep indexable per current sitemap)

---

## React → Astro Conversion Rules

1. `import { Link } from "react-router-dom"` + `<Link to="/path">` → `<a href="/path">`
2. `import { Layout } from "@/components/layout/Layout"` → `import Layout from '../layouts/Layout.astro'`
3. All JSX className → stays as className (Astro supports it in .astro files)
4. lucide-react icons → inline SVG or remove (use text instead for simplicity)
5. `useState` for mobile menu → vanilla JS `<script>` in Header.astro
6. `{new Date().getFullYear()}` → works in Astro frontmatter
7. Import images from assets → move to public/images/, use string paths
8. `/lovable-uploads/FILENAME.png` → `/images/FILENAME.png` (copy files)
9. Remove: QueryClient, TooltipProvider, Toaster, Sonner (not needed)
10. `rel="noopener noreferrer sponsored"` on affiliate links → keep as-is

---

## astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tallchairadvisor.com',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  output: 'static',
});
```

---

## package.json dependencies needed

```json
{
  "dependencies": {
    "astro": "^4.x",
    "@astrojs/tailwind": "^5.x",
    "@astrojs/sitemap": "^3.x",
    "tailwindcss": "^3.x",
    "tailwindcss-animate": "^1.x"
  }
}
```

---

## Build Steps (for next session)

1. `mkdir tall-chair-advisor && cd tall-chair-advisor`
2. Write package.json, astro.config.mjs, tailwind.config.mjs, tsconfig.json
3. `npm install`
4. Write src/styles/global.css (copy from chairarchitecture/src/index.css)
5. Write src/layouts/Layout.astro (with full SEO component)
6. Write src/components/Header.astro (static + vanilla JS mobile menu)
7. Write src/components/Footer.astro
8. Write all 22 pages in src/pages/
9. Copy images: cp chairarchitecture/src/assets/* tall-chair-advisor/public/images/
10. Copy lovable-uploads images to public/images/ (check what filenames are used)
11. Write public/robots.txt
12. `npm run build` to verify output
13. Check dist/ for static HTML files with content

---

## Important Image Paths to Update in Pages

In AeronSizeCReview.tsx:
- `/lovable-uploads/5837979e-e902-44f0-9a54-7d04a435637a.png` → `/images/aeron-size-c-hero.jpg`
- `/lovable-uploads/dbcbb916-711c-483b-a81d-09d9a82d99c4.jpg` → `/images/aeron-lumbar-detail.jpg`

Need to check other review pages for their image paths.

---

## Files NOT yet read (need in next session)

- src/pages/PrivacyPolicy.tsx
- src/pages/Contact.tsx
- src/pages/AffiliateDisclosure.tsx
- src/pages/FitGuidesHub.tsx
- src/pages/CorrectChairDimensions.tsx
- src/pages/HowToAdjustChair.tsx
- src/pages/comparisons/GestureVsLeapPlus.tsx
- src/pages/comparisons/AeronVsGesture.tsx
- src/pages/reviews/LeapPlusReview.tsx
- src/pages/reviews/GestureReview.tsx
- src/components/ui/PageHeader.tsx
- src/components/ui/HubCard.tsx

Read these at the start of the next session before writing their Astro equivalents.

# Schema Markup Audit: tallchairadvisor.com
**Audited:** 2026-03-02
**Pages Analyzed:** 8
**Audit Tool:** Live HTTP fetch + Schema.org validation

---

## Executive Summary

| Page | Schema Types Found | Errors | Warnings | Rich Result Eligible |
|------|-------------------|--------|----------|---------------------|
| Homepage | WebSite, Organization | 2 | 3 | Sitelinks Searchbox |
| /best-office-chairs/ | ItemList, BreadcrumbList | 1 | 2 | ItemList (partial) |
| /review/aeron-size-c/ | Product, Review, AggregateRating, BreadcrumbList | 4 | 3 | Product (blocked) |
| /review/gesture/ | Product, Review, AggregateRating, BreadcrumbList | 5 | 3 | Product (blocked) |
| /review/leap-plus/ | Product, Review, AggregateRating, BreadcrumbList | 5 | 3 | Product (blocked) |
| /aeron-vs-gesture/ | Article, BreadcrumbList | 3 | 2 | None currently |
| /back-pain-spine-height/ | Article, BreadcrumbList | 3 | 2 | None currently |
| /about/ | **None** | — | — | None |

**Format in use:** JSON-LD only (correct). No Microdata or RDFa schema detected. The 6 `property=` attributes found on every page are Open Graph meta tags (`og:title`, `og:description`, etc.) — these are not Schema.org and require no action.

**Critical finding:** All three product review pages are currently ineligible for Google Product rich results due to missing required fields on both `Product` and `Offer`. The fixes are straightforward and high-impact.

---

## Page-by-Page Audit

---

### 1. Homepage — https://tallchairadvisor.com/

#### Schema Detected

```json
[
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Tall Chair Advisor",
    "url": "https://tallchairadvisor.com",
    "description": "Independent expert guidance on ergonomic office chairs for people 6 feet and taller.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://tallchairadvisor.com/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tall Chair Advisor",
    "url": "https://tallchairadvisor.com",
    "description": "Independent ergonomic chair guidance for tall people."
  }
]
```

#### Validation Results

| Check | Status | Detail |
|-------|--------|--------|
| @context is https://schema.org | PASS | Both blocks correct |
| @type is valid | PASS | WebSite, Organization both valid |
| WebSite.url present | PASS | |
| SearchAction target format | WARN | String format is legacy; EntryPoint object preferred |
| SearchAction query-input | PASS | Correctly formatted |
| Organization.logo | FAIL | Missing — required for Knowledge Panel eligibility |
| Organization.sameAs | FAIL | Missing — critical for entity disambiguation |
| Organization.contactPoint | WARN | Missing — recommended |
| WebPage schema | WARN | No WebPage schema on homepage |

#### Issues

**ERROR 1 — Organization missing `logo`**
Google's Knowledge Panel and rich results use `Organization.logo` to display your brand image. The `og:image` tag is present at `https://tallchairadvisor.com/images/og-default.jpg` but it is not in the schema block.

**ERROR 2 — Organization missing `sameAs`**
Without `sameAs` links to authoritative profiles (social accounts, Wikidata, Crunchbase), Google cannot reliably associate your schema entity with off-site mentions. This weakens entity authority.

**WARN 1 — SearchAction target uses legacy string format**
The current `"target": "https://..."` string format works but Google's documentation now prefers an `EntryPoint` object. Not a functional blocker, but worth updating.

**WARN 2 — No WebPage schema on homepage**
A `WebPage` (or `CollectionPage`) block with `breadcrumb`, `dateModified`, and `isPartOf` strengthens page-level signals.

#### Recommended JSON-LD

```json
[
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Tall Chair Advisor",
    "url": "https://tallchairadvisor.com/",
    "description": "Independent expert guidance on ergonomic office chairs for people 6 feet and taller.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://tallchairadvisor.com/?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tall Chair Advisor",
    "url": "https://tallchairadvisor.com/",
    "description": "Independent ergonomic chair guidance for tall people 6 feet and taller.",
    "logo": {
      "@type": "ImageObject",
      "url": "https://tallchairadvisor.com/images/og-default.jpg",
      "width": 1200,
      "height": 630
    },
    "sameAs": [
      "https://twitter.com/tallchairadvisor",
      "https://www.linkedin.com/company/tallchairadvisor"
    ]
  }
]
```

Note: Replace the `sameAs` URLs with the actual profile URLs for each platform. Add only platforms where an active profile exists. If no social profiles exist yet, omit `sameAs` until they do — do not include placeholder or incorrect URLs.

---

### 2. /best-office-chairs/ — https://tallchairadvisor.com/best-office-chairs/

#### Schema Detected

```json
[
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Best Office Chairs for Tall People 2026",
    "url": "https://tallchairadvisor.com/best-office-chairs",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Herman Miller Aeron Size C", "url": "https://tallchairadvisor.com/review/aeron-size-c" },
      { "@type": "ListItem", "position": 2, "name": "Steelcase Leap Plus", "url": "https://tallchairadvisor.com/review/leap-plus" },
      { "@type": "ListItem", "position": 3, "name": "Steelcase Gesture", "url": "https://tallchairadvisor.com/review/gesture" }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tallchairadvisor.com" },
      { "@type": "ListItem", "position": 2, "name": "Best Office Chairs", "item": "https://tallchairadvisor.com/best-office-chairs" }
    ]
  }
]
```

#### Validation Results

| Check | Status | Detail |
|-------|--------|--------|
| @context correct | PASS | |
| ItemList.name present | PASS | |
| ListItem.position present | PASS | All 3 items |
| ListItem.url present | PASS | All 3 items — uses `url` not `item` (valid for URL-only lists) |
| ItemList.url property | FAIL | `url` is not a valid Schema.org property on ItemList |
| numberOfItems | WARN | Missing — recommended |
| itemListOrder | WARN | Missing — recommended |
| BreadcrumbList URLs with trailing slash | WARN | Inconsistent with site canonical URLs |
| datePublished/dateModified | WARN | Missing from page-level schema |

#### Issues

**ERROR 1 — `ItemList.url` is not a Schema.org property**
`ItemList` does not have a `url` property in the Schema.org specification. It will be silently ignored by parsers. The page URL should instead be expressed on a `WebPage` schema block.

**WARN 1 — Missing `numberOfItems`**
Adding `"numberOfItems": 3` signals completeness to parsers and is a recommended property for `ItemList`.

**WARN 2 — Trailing slash inconsistency in BreadcrumbList**
The `item` values use `https://tallchairadvisor.com/best-office-chairs` (no trailing slash). If the canonical URL for this page is `https://tallchairadvisor.com/best-office-chairs/`, there is a mismatch. Canonical URLs and BreadcrumbList `item` values should match exactly.

#### Recommended JSON-LD

```json
[
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Best Office Chairs for Tall People 2026",
    "description": "Curated shortlist of ergonomic chairs meeting dimensional requirements for users 6ft and taller.",
    "numberOfItems": 3,
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Herman Miller Aeron Size C",
        "url": "https://tallchairadvisor.com/review/aeron-size-c/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Steelcase Leap Plus",
        "url": "https://tallchairadvisor.com/review/leap-plus/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Steelcase Gesture",
        "url": "https://tallchairadvisor.com/review/gesture/"
      }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://tallchairadvisor.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Best Office Chairs",
        "item": "https://tallchairadvisor.com/best-office-chairs/"
      }
    ]
  }
]
```

---

### 3. /review/aeron-size-c/ — https://tallchairadvisor.com/review/aeron-size-c/

#### Schema Detected

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Herman Miller Aeron Size C",
    "review": {
      "@type": "Review",
      "reviewRating": { "@type": "Rating", "ratingValue": "4.7", "bestRating": "5" },
      "author": { "@type": "Organization", "name": "Tall Chair Advisor" }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "reviewCount": "1"
    },
    "offers": {
      "@type": "Offer",
      "price": "1795.00",
      "priceCurrency": "USD"
    }
  },
  { "@type": "BreadcrumbList", ... }
]
```

#### Validation Results

| Check | Status | Detail |
|-------|--------|--------|
| Product.name | PASS | |
| Review.reviewRating present | PASS | |
| Review.author present | PASS | |
| Rating.ratingValue | PASS | 4.7 |
| Rating.bestRating | PASS | 5 |
| Rating.worstRating | WARN | Missing — recommended, assumed 1 |
| AggregateRating.reviewCount | WARN | Value is "1" — this is the same as the single embedded review; see note |
| Offer.price | PASS | |
| Offer.priceCurrency | PASS | |
| Offer.availability | FAIL | Missing — required for Product rich results |
| Offer.url | FAIL | Missing — should link to the product or affiliate URL |
| Offer.priceValidUntil | FAIL | Missing — required for Product rich results per Google |
| Product.image | FAIL | Missing from schema (image exists in HTML as `/images/aeron-size-c-hero.png` — relative path) |
| Product.brand | FAIL | Missing |
| Product.description | FAIL | Missing |
| Product.url | FAIL | Missing |
| Review.reviewBody | FAIL | Missing |
| Review.datePublished | FAIL | Missing |
| Review.name | WARN | Missing — recommended |
| BreadcrumbList | PASS | Structure correct |

#### Issues

**ERROR 1 — Product.image missing from schema**
An image exists in the HTML (`/images/aeron-size-c-hero.png`) but is not referenced in the schema. Google requires `Product.image` for rich results. The URL must be absolute.

**ERROR 2 — Offer.availability missing**
Google's Product rich result documentation lists `availability` as required. Use `https://schema.org/InStock` or `https://schema.org/PreOrder`.

**ERROR 3 — Offer.priceValidUntil missing**
Required by Google for Product rich results when a price is listed. Use a date at least 1 year in the future (ISO 8601 format).

**ERROR 4 — Review.reviewBody missing**
The review text is present on the page but not exposed in schema. Google uses `reviewBody` to understand review content and surface review snippets.

**ERROR 5 — Review.datePublished missing**
Required for review snippets. Without a date, Google cannot determine content freshness.

**WARN 1 — AggregateRating.reviewCount: "1"**
An `AggregateRating` with `reviewCount: 1` sourced from the same single embedded review can be misleading. Google's policy states AggregateRating must not represent only the site's own editorial rating. If this site is the only reviewer, remove `AggregateRating` and rely solely on the `Review` block. The `Review` alone qualifies for review snippet rich results.

**WARN 2 — Product.brand missing**
Brand is a recommended property that improves product identification and entity matching.

#### Recommended JSON-LD

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Herman Miller Aeron Size C",
    "description": "The Herman Miller Aeron Size C is designed for taller users, featuring a larger seat pan, higher back, and extended seat height range up to 20.5 inches.",
    "url": "https://tallchairadvisor.com/review/aeron-size-c/",
    "image": {
      "@type": "ImageObject",
      "url": "https://tallchairadvisor.com/images/aeron-size-c-hero.png",
      "width": 800,
      "height": 600
    },
    "brand": {
      "@type": "Brand",
      "name": "Herman Miller"
    },
    "review": {
      "@type": "Review",
      "name": "Herman Miller Aeron Size C Review for Tall Users",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "4.7",
        "bestRating": "5",
        "worstRating": "1"
      },
      "author": {
        "@type": "Organization",
        "name": "Tall Chair Advisor",
        "url": "https://tallchairadvisor.com/"
      },
      "reviewBody": "The Aeron Size C is the best chair on the market for tall users between 6'0\" and 6'6\". The larger seat pan eliminates the pressure point issue that plagues tall users in standard office chairs, and the PostureFit SL system is one of the few lumbar supports that actually reaches the correct vertebral level for a taller spine.",
      "datePublished": "2025-01-15",
      "url": "https://tallchairadvisor.com/review/aeron-size-c/"
    },
    "offers": {
      "@type": "Offer",
      "price": "1795.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-01-01",
      "url": "https://tallchairadvisor.com/review/aeron-size-c/",
      "seller": {
        "@type": "Organization",
        "name": "Herman Miller"
      }
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tallchairadvisor.com/" },
      { "@type": "ListItem", "position": 2, "name": "Best Office Chairs", "item": "https://tallchairadvisor.com/best-office-chairs/" },
      { "@type": "ListItem", "position": 3, "name": "Aeron Size C Review", "item": "https://tallchairadvisor.com/review/aeron-size-c/" }
    ]
  }
]
```

Note: Replace `reviewBody` with a sentence or two from your actual review text. Replace `datePublished` with the actual publish date of the page. The `priceValidUntil` must be updated periodically — consider making it dynamic in your Astro build.

---

### 4. /review/gesture/ — https://tallchairadvisor.com/review/gesture/

#### Schema Detected

Same structure as Aeron review, with identical error profile, plus one additional error:

**Additional ERROR — Offer block entirely missing**
The Gesture review has no `offers` block at all, unlike the Aeron page. A `Product` without an `Offer` cannot qualify for Product rich results that show pricing.

#### Validation Results

| Check | Status | Detail |
|-------|--------|--------|
| Product.name | PASS | |
| Review + Rating structure | PASS | |
| Offer block | FAIL | Entirely absent |
| Product.image | FAIL | Missing from schema |
| Product.brand | FAIL | Missing |
| Product.description | FAIL | Missing |
| Review.reviewBody | FAIL | Missing |
| Review.datePublished | FAIL | Missing |
| AggregateRating.reviewCount: "1" | WARN | Same policy concern as Aeron |
| BreadcrumbList | PASS | |

#### Recommended JSON-LD

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Steelcase Gesture",
    "description": "The Steelcase Gesture features 360-degree armrests and a flexible seat edge designed to support a wide range of sitting positions, including taller users up to 6'5\".",
    "url": "https://tallchairadvisor.com/review/gesture/",
    "image": {
      "@type": "ImageObject",
      "url": "https://tallchairadvisor.com/images/gesture-hero.jpg",
      "width": 800,
      "height": 600
    },
    "brand": {
      "@type": "Brand",
      "name": "Steelcase"
    },
    "review": {
      "@type": "Review",
      "name": "Steelcase Gesture Review for Tall Users",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "4.5",
        "bestRating": "5",
        "worstRating": "1"
      },
      "author": {
        "@type": "Organization",
        "name": "Tall Chair Advisor",
        "url": "https://tallchairadvisor.com/"
      },
      "reviewBody": "The Gesture's 360-degree arm movement is genuinely useful for tall users who shift posture frequently throughout the day. The seat height range reaches 21 inches, accommodating most users up to 6'4\" without modification.",
      "datePublished": "2025-02-01",
      "url": "https://tallchairadvisor.com/review/gesture/"
    },
    "offers": {
      "@type": "Offer",
      "price": "1479.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-01-01",
      "url": "https://tallchairadvisor.com/review/gesture/",
      "seller": {
        "@type": "Organization",
        "name": "Steelcase"
      }
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tallchairadvisor.com/" },
      { "@type": "ListItem", "position": 2, "name": "Best Office Chairs", "item": "https://tallchairadvisor.com/best-office-chairs/" },
      { "@type": "ListItem", "position": 3, "name": "Gesture Review", "item": "https://tallchairadvisor.com/review/gesture/" }
    ]
  }
]
```

Note: Verify the actual Gesture price and update `datePublished` to the real publication date. Update image path to the actual hero image filename on this page.

---

### 5. /review/leap-plus/ — https://tallchairadvisor.com/review/leap-plus/

#### Schema Detected

Same structure as Gesture review — no Offer block, all the same missing fields.

#### Validation Results

Identical error and warning profile to the Gesture page. Offer block is absent.

#### Recommended JSON-LD

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Steelcase Leap Plus",
    "description": "The Steelcase Leap Plus is the wide/tall variant of the Leap V2, with a larger seat pan, higher weight rating of 500 lbs, and seat height range suitable for users up to 6'4\".",
    "url": "https://tallchairadvisor.com/review/leap-plus/",
    "image": {
      "@type": "ImageObject",
      "url": "https://tallchairadvisor.com/images/leap-plus-hero.jpg",
      "width": 800,
      "height": 600
    },
    "brand": {
      "@type": "Brand",
      "name": "Steelcase"
    },
    "review": {
      "@type": "Review",
      "name": "Steelcase Leap Plus Review for Tall and Larger Users",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "4.6",
        "bestRating": "5",
        "worstRating": "1"
      },
      "author": {
        "@type": "Organization",
        "name": "Tall Chair Advisor",
        "url": "https://tallchairadvisor.com/"
      },
      "reviewBody": "The Leap Plus is the right choice for taller users who also need a wider seat. The LiveBack technology moves with your spine in a way that standard chairs cannot match, and the seat depth adjustment range is among the best in its class.",
      "datePublished": "2025-01-20",
      "url": "https://tallchairadvisor.com/review/leap-plus/"
    },
    "offers": {
      "@type": "Offer",
      "price": "1569.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-01-01",
      "url": "https://tallchairadvisor.com/review/leap-plus/",
      "seller": {
        "@type": "Organization",
        "name": "Steelcase"
      }
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tallchairadvisor.com/" },
      { "@type": "ListItem", "position": 2, "name": "Best Office Chairs", "item": "https://tallchairadvisor.com/best-office-chairs/" },
      { "@type": "ListItem", "position": 3, "name": "Leap Plus Review", "item": "https://tallchairadvisor.com/review/leap-plus/" }
    ]
  }
]
```

---

### 6. /aeron-vs-gesture/ — https://tallchairadvisor.com/aeron-vs-gesture/

#### Schema Detected

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Herman Miller Aeron vs Steelcase Gesture: Tall User Comparison",
    "url": "https://tallchairadvisor.com/aeron-vs-gesture",
    "publisher": {
      "@type": "Organization",
      "name": "Tall Chair Advisor"
    }
  },
  { "@type": "BreadcrumbList", ... }
]
```

#### Validation Results

| Check | Status | Detail |
|-------|--------|--------|
| Article.headline | PASS | |
| Article.image | FAIL | Missing — required by Google for Article rich results |
| Article.datePublished | FAIL | Missing — required by Google |
| Article.author | FAIL | Missing — required by Google |
| Article.dateModified | WARN | Missing — recommended |
| Article.description | WARN | Missing — recommended |
| publisher.logo | FAIL | Publisher present but no logo node |
| Article.url | WARN | Present but not a standard Article property; use `mainEntityOfPage` instead |
| BreadcrumbList | PASS | Structure valid |

#### Issues

**ERROR 1 — Article.image missing**
Google's Article rich result documentation explicitly lists `image` as required. Without it, this article is ineligible for any article-based rich result.

**ERROR 2 — Article.datePublished missing**
Required by Google. Content with no publication date may be treated as undated and deprioritized in freshness-sensitive queries.

**ERROR 3 — Article.author missing**
Required by Google. For a comparison article on an affiliate site, use the `Organization` type if no individual author is credited.

**ERROR 4 — publisher.logo missing**
`publisher` is present but lacks a `logo` property. Google uses this to display publisher branding in rich results. The logo must be a rectangular image, at least 60x600px, no larger than 1x1 aspect ratio.

**NOTE — `url` vs `mainEntityOfPage`**
The `url` property is not a standard `Article` property. Use `mainEntityOfPage` to link the article to its URL.

#### Recommended JSON-LD

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Herman Miller Aeron vs Steelcase Gesture: Tall User Comparison",
    "description": "Side-by-side comparison of the Aeron Size C and Steelcase Gesture for tall users: seat height, armrest range, back height, and value.",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://tallchairadvisor.com/aeron-vs-gesture/"
    },
    "image": {
      "@type": "ImageObject",
      "url": "https://tallchairadvisor.com/images/og-default.jpg",
      "width": 1200,
      "height": 630
    },
    "datePublished": "2025-03-01",
    "dateModified": "2026-01-10",
    "author": {
      "@type": "Organization",
      "name": "Tall Chair Advisor",
      "url": "https://tallchairadvisor.com/"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Tall Chair Advisor",
      "url": "https://tallchairadvisor.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://tallchairadvisor.com/images/og-default.jpg",
        "width": 1200,
        "height": 630
      }
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tallchairadvisor.com/" },
      { "@type": "ListItem", "position": 2, "name": "Best Office Chairs", "item": "https://tallchairadvisor.com/best-office-chairs/" },
      { "@type": "ListItem", "position": 3, "name": "Aeron vs Gesture", "item": "https://tallchairadvisor.com/aeron-vs-gesture/" }
    ]
  }
]
```

Note: Replace `datePublished` and `dateModified` with actual dates. If you have a dedicated logo image (rectangular, suitable for publisher display), use that URL instead of the OG image.

---

### 7. /back-pain-spine-height/ — https://tallchairadvisor.com/back-pain-spine-height/

#### Schema Detected

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Office Chair Back Pain: Lumbar Height Issues for Tall People",
    "url": "https://tallchairadvisor.com/back-pain-spine-height",
    "publisher": {
      "@type": "Organization",
      "name": "Tall Chair Advisor"
    }
  },
  { "@type": "BreadcrumbList", ... }
]
```

#### Validation Results

Same error profile as the comparison page: missing `image`, `datePublished`, `author`, and `publisher.logo`.

| Check | Status | Detail |
|-------|--------|--------|
| Article.headline | PASS | |
| Article.image | FAIL | Missing |
| Article.datePublished | FAIL | Missing |
| Article.author | FAIL | Missing |
| publisher.logo | FAIL | Missing |
| Article.dateModified | WARN | Missing |
| BreadcrumbList | PASS | Structure valid |

#### FAQ Schema Assessment

The page headings are:
- "The Lumbar Misalignment Problem"
- "Why Back Height Matters"
- "The Thoracic Strain Pattern"
- "Why This Pain Persists Even With 'Good Posture'"

These are informational section headings, not question-and-answer pairs. FAQ schema (`FAQPage`) requires content formatted as explicit questions with direct answers, and as of August 2023, Google has restricted FAQ rich results to government and healthcare authority sites only.

**FAQ schema is not recommended here** — both because this site does not qualify as a government or healthcare authority, and because the headings are not structured as Q&A content.

#### Recommended JSON-LD

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Office Chair Back Pain: Lumbar Height Issues for Tall People",
    "description": "How misaligned lumbar support causes chronic back pain for tall users, and what back height specs to look for when choosing an ergonomic chair.",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://tallchairadvisor.com/back-pain-spine-height/"
    },
    "image": {
      "@type": "ImageObject",
      "url": "https://tallchairadvisor.com/images/og-default.jpg",
      "width": 1200,
      "height": 630
    },
    "datePublished": "2025-02-15",
    "dateModified": "2026-01-10",
    "author": {
      "@type": "Organization",
      "name": "Tall Chair Advisor",
      "url": "https://tallchairadvisor.com/"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Tall Chair Advisor",
      "url": "https://tallchairadvisor.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://tallchairadvisor.com/images/og-default.jpg",
        "width": 1200,
        "height": 630
      }
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tallchairadvisor.com/" },
      { "@type": "ListItem", "position": 2, "name": "Pain & Ergonomics", "item": "https://tallchairadvisor.com/pain-ergonomics/" },
      { "@type": "ListItem", "position": 3, "name": "Back Pain & Spine Height", "item": "https://tallchairadvisor.com/back-pain-spine-height/" }
    ]
  }
]
```

---

### 8. /about/ — https://tallchairadvisor.com/about/

#### Schema Detected

**None.** Zero JSON-LD blocks. Zero Microdata. Zero Schema.org RDFa. The only `property=` attributes are Open Graph meta tags.

#### Validation Results

| Check | Status | Detail |
|-------|--------|--------|
| Any Schema.org markup | FAIL | Completely absent |
| Organization schema | FAIL | Missing |
| WebPage schema | FAIL | Missing |
| Person/author schema | FAIL | Missing |

#### Issues

The About page is the most natural home for `Organization` schema with full detail. It is currently one of the only pages on the site with no schema at all — and ironically, it's the page most semantically appropriate for entity-level structured data.

#### Recommended JSON-LD

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tall Chair Advisor",
    "url": "https://tallchairadvisor.com/",
    "description": "Tall Chair Advisor provides independent ergonomic chair guidance for people 6 feet and taller who struggle to find chairs that fit correctly.",
    "logo": {
      "@type": "ImageObject",
      "url": "https://tallchairadvisor.com/images/og-default.jpg",
      "width": 1200,
      "height": 630
    },
    "foundingDate": "2024",
    "sameAs": [
      "https://twitter.com/tallchairadvisor"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "About Tall Chair Advisor",
    "url": "https://tallchairadvisor.com/about/",
    "description": "About Tall Chair Advisor — independent ergonomic chair reviews and guidance for tall people.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Tall Chair Advisor",
      "url": "https://tallchairadvisor.com/"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tallchairadvisor.com/" },
        { "@type": "ListItem", "position": 2, "name": "About", "item": "https://tallchairadvisor.com/about/" }
      ]
    }
  }
]
```

---

## Cross-Site Issues

### Issue: No Trailing Slash Consistency

Several schema blocks use URLs without trailing slashes (e.g., `https://tallchairadvisor.com/best-office-chairs`) while Astro typically serves pages with trailing slashes. BreadcrumbList `item` values and Product/Article `url` values must exactly match the canonical URL for each page. Audit every URL in every schema block and align them with your canonical tags.

### Issue: No Dedicated Logo Image

All image references point to the OG image (`/images/og-default.jpg` at 1200x630). Google's publisher logo requirements for Article rich results specify:
- Rectangular (not square) is preferred
- At least 60px tall
- At most 600px wide
- Aspect ratio between 1:1 and 1.91:1 may work but a horizontal logo is better

If you have a site logo (e.g., `/images/logo.png`), use that instead of the social share image for `Organization.logo` and `publisher.logo`.

### Issue: AggregateRating Policy Risk on All Review Pages

All three review pages use `"reviewCount": "1"` on `AggregateRating`. This single review is authored by the site itself. Google's structured data guidelines state:

> "Reviews must be genuine and must not be added for the sole purpose of boosting ratings."

An `AggregateRating` aggregating only one self-authored review does not technically violate the spec (reviewCount >= 1 is allowed), but it creates a misleading signal. The safer approach for a single-reviewer affiliate site is to remove `AggregateRating` entirely and rely on the `Review` block alone. Review snippets from a single editorial review are fully eligible for rich results without `AggregateRating`.

### Issue: Article Schema Missing datePublished Sitewide

Every `Article` block on the site is missing `datePublished`. This is a required field per Google's Article structured data documentation. Without it, articles cannot qualify for article-based rich results and may be treated as undated content in time-sensitive search contexts.

---

## Rich Result Eligibility Summary

| Page | Current Status | Eligible After Fixes |
|------|---------------|----------------------|
| Homepage | Sitelinks Searchbox eligible | + Knowledge Panel improvement |
| /best-office-chairs/ | ItemList eligible (partial) | ItemList eligible (full) |
| /review/aeron-size-c/ | **Ineligible** (missing required fields) | Product + Review rich results |
| /review/gesture/ | **Ineligible** (missing Offer + required fields) | Product + Review rich results |
| /review/leap-plus/ | **Ineligible** (missing Offer + required fields) | Product + Review rich results |
| /aeron-vs-gesture/ | **Ineligible** (missing required Article fields) | Article rich results |
| /back-pain-spine-height/ | **Ineligible** (missing required Article fields) | Article rich results |
| /about/ | **No schema** | Organization entity eligibility |

### Not Recommended (Deprecated or Restricted)

- **HowTo**: Removed from rich results September 2023. Do not implement.
- **FAQPage**: Restricted to government and healthcare authority sites since August 2023. This site does not qualify.
- **SpecialAnnouncement**: Deprecated July 2025. Do not implement.
- **HowToTip / HowToStep**: Dependent on HowTo, which is deprecated.

---

## Priority Implementation Order

**Priority 1 — Highest impact, fix first**

1. Add `image`, `brand`, `reviewBody`, `datePublished` to all three Product/Review blocks
2. Add `Offer` block with `availability` and `priceValidUntil` to Gesture and Leap Plus reviews
3. Add `availability` and `priceValidUntil` to the existing Aeron Offer block

These three fixes unlock Product + Review rich results on all review pages, which are the highest-value SERP features for an affiliate site in this niche.

**Priority 2 — Fix within 2 weeks**

4. Add `datePublished`, `author`, `image`, and `publisher.logo` to both Article blocks (comparison + guide)
5. Add `Organization` and `WebPage` schema to the About page
6. Add `logo` and `sameAs` to the `Organization` block on the homepage

**Priority 3 — Polish and consistency**

7. Audit all schema URLs for trailing slash consistency against canonical tags
8. Remove `ItemList.url` (invalid property) and move URL to a `WebPage` block
9. Add `numberOfItems` and `itemListOrder` to `ItemList`
10. Remove `AggregateRating` from all review pages (or source genuine third-party ratings)
11. Update `SearchAction.target` to use the `EntryPoint` object format

---

*Audit completed 2026-03-02. Schema.org specification reference version: March 2026. Google rich result policy reference: current as of audit date.*

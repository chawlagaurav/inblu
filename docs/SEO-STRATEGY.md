# Inblu Filters - Complete SEO Strategy & Implementation Guide

## Table of Contents
1. [Keyword Research](#keyword-research)
2. [On-Page SEO](#on-page-seo)
3. [Technical SEO](#technical-seo)
4. [Structured Data](#structured-data)
5. [Google Search Appearance](#google-search-appearance)
6. [Content Strategy](#content-strategy)
7. [Competitor Analysis](#competitor-analysis)
8. [Backlink Strategy](#backlink-strategy)
9. [Implementation Checklist](#implementation-checklist)

---

## 1. Keyword Research <a name="keyword-research"></a>

### Primary Keywords (High-Intent, Transactional)
| Keyword | Search Intent | Monthly Volume (AU) | Priority |
|---------|--------------|---------------------|----------|
| RO water filter Australia | Transactional | High | ⭐⭐⭐ |
| reverse osmosis filter Australia | Transactional | High | ⭐⭐⭐ |
| water purifier Australia | Transactional | High | ⭐⭐⭐ |
| best water filter Australia | Research | High | ⭐⭐⭐ |
| buy water filter Australia | Transactional | Medium | ⭐⭐⭐ |
| home water filtration system | Transactional | Medium | ⭐⭐⭐ |

### Secondary Keywords (Category-Specific)

#### Countertop Filters
- countertop water filter Australia
- benchtop water filter
- countertop RO system
- portable water filter Australia
- no installation water filter

#### Undersink Filters
- undersink water filter Australia
- under sink RO system
- undersink reverse osmosis
- kitchen water filter installation
- under counter water purifier

#### RO Systems
- RO purifier Australia
- reverse osmosis system Australia
- tankless RO filter
- best RO water purifier
- RO water filter price Australia

#### Water Ionisers
- water ioniser Australia
- alkaline water filter
- hydrogen water maker
- ionised water system

### Long-Tail Keywords (Buyer Intent)
| Keyword | Intent | Competition |
|---------|--------|-------------|
| best RO water filter for home Australia 2026 | Transactional | Low |
| buy reverse osmosis filter online Australia | Transactional | Medium |
| water filter free installation Sydney | Transactional | Low |
| countertop RO filter no installation | Transactional | Low |
| remove fluoride from tap water Australia | Informational | Low |
| best water purifier for Australian tap water | Research | Medium |
| water filter for hard water Australia | Transactional | Low |

### Local SEO Keywords
- water filter Sydney
- water filter Melbourne
- water filter Brisbane
- water filter Perth
- water filter Adelaide
- RO filter installation NSW

---

## 2. On-Page SEO <a name="on-page-seo"></a>

### Implemented Meta Tags

#### Homepage
```html
<title>Water Filters Australia | RO Purifiers & Filtration Systems | Inblu</title>
<meta name="description" content="Shop premium RO water purifiers, countertop filters & undersink systems. Free installation Australia-wide. Pure, clean drinking water for your home. Shop now!">
```

#### Products Page
```html
<title>Water Filters & Purifiers | Shop RO Systems | Inblu Australia</title>
<meta name="description" content="Browse our range of RO water purifiers, countertop filters, undersink systems & water ionisers. Free shipping & installation. Best prices in Australia.">
```

#### About Page
```html
<title>About Us | Australia's Trusted Water Filter Experts | Inblu</title>
<meta name="description" content="Learn about Inblu Filters - Australia's premium water filtration specialists. 5K+ installations, certified quality, and expert support nationwide.">
```

#### Contact Page
```html
<title>Contact Us | Get Expert Water Filter Advice | Inblu Australia</title>
<meta name="description" content="Contact Inblu Filters for expert water filtration advice. Call +61 431 318 665 or visit us at The Ponds, NSW. Free consultation available.">
```

### H1-H6 Structure Recommendations

```
H1: Primary keyword-focused page title (one per page)
  H2: Main sections
    H3: Subsections
      H4: Details/Features
```

Example for Products page:
```
H1: Water Filters & Purification Systems
  H2: Shop by Category
    H3: Countertop RO Filters
    H3: Undersink Water Filters
    H3: Water Ionisers
  H2: Best Sellers
  H2: Why Choose Inblu?
```

### Internal Linking Strategy
1. Link from homepage to all category pages
2. Link from product pages to related products
3. Link from blog posts to relevant products
4. Use keyword-rich anchor text (e.g., "RO water purifiers" instead of "click here")
5. Add breadcrumbs on all pages (✅ Implemented)

---

## 3. Technical SEO <a name="technical-seo"></a>

### Implemented Files

#### sitemap.xml (✅ Auto-generated at /sitemap.xml)
- Includes all static pages with priority settings
- Includes all active products with dynamic lastModified dates
- Includes category filter URLs
- Updates automatically when products change

#### robots.txt (✅ Auto-generated at /robots.txt)
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /order/
Disallow: /profile/
Disallow: /auth/

Sitemap: https://inblu.com.au/sitemap.xml
```

### Page Speed Recommendations
1. **Image Optimization**: Use WebP format, lazy loading (already using Next.js Image)
2. **Code Splitting**: Already implemented via Next.js
3. **Caching**: Leverage Next.js static generation and revalidation
4. **CDN**: Use Vercel Edge Network or Cloudflare
5. **Font Loading**: Using next/font for optimized font loading

### Mobile Optimization Checklist
- [x] Responsive design
- [x] Touch-friendly buttons (min 48x48px)
- [x] Readable font sizes (min 16px)
- [x] Viewport meta tag
- [x] No horizontal scroll
- [x] Fast mobile load times

### Canonical Tags
All pages now include canonical URLs via Next.js metadata:
```tsx
alternates: {
  canonical: '/products',
}
```

---

## 4. Structured Data <a name="structured-data"></a>

### Implemented JSON-LD Schemas

#### Organization Schema (✅ On all pages)
```json
{
  "@type": "Organization",
  "name": "Inblu Filters",
  "url": "https://inblu.com.au",
  "logo": "https://inblu.com.au/logo.png",
  "telephone": "+61 431 318 665",
  "email": "info@inblu.com.au",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "22 Wentworth Street",
    "addressLocality": "The Ponds",
    "addressRegion": "NSW",
    "postalCode": "2769",
    "addressCountry": "AU"
  }
}
```

#### LocalBusiness Schema (✅ On all pages)
- Includes opening hours
- Includes geo coordinates
- Includes aggregate rating

#### Product Schema (✅ On product detail pages)
- Product name, description, image
- Price and currency (AUD)
- Availability status
- Shipping details (free shipping AU)
- SKU and category

#### FAQ Schema (✅ On homepage)
8 FAQ items covering common questions about water filters

#### Breadcrumb Schema (✅ On products and about pages)
- Helps Google show breadcrumb navigation in search results

#### WebSite Schema (✅ On all pages)
- Includes SearchAction for sitelinks search box

### Testing Structured Data
Test your schema at: https://search.google.com/test/rich-results

---

## 5. Google Search Appearance <a name="google-search-appearance"></a>

### How to Get Sitelinks
1. **Clear site structure**: ✅ Implemented with clear navigation
2. **Descriptive page titles**: ✅ Each page has unique, descriptive title
3. **Internal linking**: ✅ Breadcrumbs and navigation links
4. **XML Sitemap**: ✅ Auto-generated sitemap
5. **Wait time**: Sitelinks appear automatically after Google indexes your site

### Featured Snippets Strategy
Target these formats:
1. **Paragraph snippets**: Answer "what is" questions in 40-60 words
2. **List snippets**: Use ordered/unordered lists for "how to" content
3. **Table snippets**: Compare products/features in tables

Example FAQ to target featured snippets:
- "What is the best water filter for Australian homes?"
- "Do I need a water filter in Australia?"
- "How much does a water filter cost in Australia?"

### Google Business Profile Optimization
1. **Claim your business**: https://business.google.com
2. **Complete all fields**:
   - Business name: Inblu Filters
   - Category: Water Filtration Equipment Supplier
   - Address: 22 Wentworth Street, The Ponds NSW 2769
   - Phone: +61 431 318 665
   - Hours: Mon-Fri 9am-6pm, Sat 10am-4pm
   - Website: https://inblu.com.au
3. **Add photos**: Products, storefront, team
4. **Get reviews**: Ask satisfied customers to leave Google reviews
5. **Post updates**: Share new products, offers, and content

### Product Rich Results
With ProductSchema implemented, Google can show:
- Product price in search results
- Availability status
- Star ratings (when reviews are added)
- Shipping information

---

## 6. Content Strategy <a name="content-strategy"></a>

### Blog Topics (Priority Order)

| # | Title | Target Keyword | Intent | Priority |
|---|-------|---------------|--------|----------|
| 1 | Best RO Water Filters in Australia (2026 Complete Guide) | best RO filter Australia | Transactional | ⭐⭐⭐ |
| 2 | Do You Really Need a Water Filter in Australia? | water filter necessary Australia | Informational | ⭐⭐⭐ |
| 3 | Countertop vs Undersink Water Filters: Which is Right for You? | countertop vs undersink filter | Informational | ⭐⭐ |
| 4 | How to Remove Fluoride from Tap Water in Australia | remove fluoride tap water | Informational | ⭐⭐⭐ |
| 5 | Water Filter Installation Guide: DIY vs Professional | water filter installation | Informational | ⭐⭐ |
| 6 | Understanding TDS in Drinking Water: What Australians Should Know | TDS drinking water | Informational | ⭐⭐ |
| 7 | Best Water Filters for Hard Water in Australia | hard water filter Australia | Transactional | ⭐⭐ |
| 8 | RO Water Filter Maintenance: Complete Guide | RO filter maintenance | Informational | ⭐ |
| 9 | Water Filters for Apartments & Renters in Australia | apartment water filter | Transactional | ⭐⭐⭐ |
| 10 | Alkaline Water Benefits: Facts vs Myths | alkaline water benefits | Informational | ⭐⭐ |

### Content Guidelines
- **Length**: 1,500-2,500 words for pillar content
- **Structure**: Use H2/H3 headers with keywords
- **Images**: Include product images with alt text
- **Internal links**: Link to products and related articles
- **CTA**: Include calls-to-action to product pages

---

## 7. Competitor Analysis <a name="competitor-analysis"></a>

### Waterdrop Filter Australia (waterdropfilter.com.au)

#### Strengths
- Strong product variety (RO systems, countertop, undersink)
- Media attention logos (Tom's Guide, National Geographic)
- Customer reviews prominently displayed
- Subscription model for replacement filters
- Active blog with SEO content
- Promotional offers (up to $700 off)
- Fast shipping promise (2-8 days)

#### Keywords They Target
- "RO water filter"
- "Countertop RO system"
- "Tankless reverse osmosis"
- "Best water filter Australia"
- "Water filter pitchers"

#### Content Gaps to Exploit
1. **Local focus**: Waterdrop is a global brand - Inblu can emphasize "Australian-owned"
2. **Installation service**: Waterdrop doesn't offer professional installation
3. **Specific city targeting**: "Water filter Sydney", "Water filter Melbourne"
4. **Comparison content**: "Waterdrop vs Inblu" comparison articles
5. **Australian water quality**: Content specific to Australian tap water issues

### How Inblu Can Outperform

1. **Free Professional Installation** - Major differentiator
2. **Local Support** - Emphasize Australian-based customer service
3. **Service Reminders** - Proactive filter replacement service
4. **City-Specific Pages** - Create landing pages for Sydney, Melbourne, Brisbane
5. **Australian Certifications** - Highlight WaterMark and other AU certifications

---

## 8. Backlink Strategy <a name="backlink-strategy"></a>

### Australian Business Directories
Submit to these free directories:

| Directory | URL | Priority |
|-----------|-----|----------|
| Yellow Pages AU | yellowpages.com.au | High |
| True Local | truelocal.com.au | High |
| Yelp Australia | yelp.com.au | High |
| Hotfrog | hotfrog.com.au | Medium |
| AussieWeb | aussieweb.com.au | Medium |
| StartLocal | startlocal.com.au | Medium |
| Cylex Australia | cylex.net.au | Low |
| EnFinder | enfinder.com.au | Low |

### Industry-Specific Directories
- Australian Building Directory
- Home Improvement directories
- Plumbing supplier directories
- Health & wellness directories

### Guest Posting Opportunities
1. **Home improvement blogs**: DIY renovation sites
2. **Health & wellness sites**: Clean living, detox blogs
3. **Parenting blogs**: Child health, family wellness
4. **Sustainability blogs**: Eco-friendly living, plastic reduction
5. **Local business blogs**: Sydney/Melbourne business features

### Local Link Building
1. **Sponsor local events**: Community events, sports teams
2. **Partner with plumbers**: Referral partnerships
3. **Chamber of commerce**: Join local business associations
4. **Local news**: Press releases for new products/services

### Content-Based Link Building
1. **Create infographics**: "Australian Water Quality by State"
2. **Publish original research**: "Water Quality Survey Results"
3. **Expert roundups**: Interview water quality experts
4. **Resource pages**: "Ultimate Guide to Water Filtration"

---

## 9. Implementation Checklist <a name="implementation-checklist"></a>

### ✅ Completed (Implemented in Code)

- [x] Enhanced metadata for all main pages
- [x] Organization schema on all pages
- [x] LocalBusiness schema on all pages
- [x] Website schema with SearchAction
- [x] Product schema on product detail pages
- [x] FAQ schema on homepage
- [x] Breadcrumb schema on products/about pages
- [x] Dynamic sitemap.xml generation
- [x] robots.txt configuration
- [x] Canonical URLs on all pages
- [x] Open Graph tags for social sharing
- [x] Twitter Card meta tags
- [x] PWA manifest.json
- [x] Australian locale (en-AU) set
- [x] Viewport configuration
- [x] Improved page titles with keywords
- [x] Meta descriptions under 155 chars

### 🔲 Manual Steps Required

#### Immediate (Week 1)
- [ ] **Google Search Console**: Submit sitemap
  1. Go to https://search.google.com/search-console
  2. Add property: https://inblu.com.au
  3. Verify ownership via DNS or HTML file
  4. Submit sitemap: https://inblu.com.au/sitemap.xml

- [ ] **Google Business Profile**: Create/claim listing
  1. Go to https://business.google.com
  2. Add or claim "Inblu Filters"
  3. Complete all business information
  4. Add photos (logo, products, storefront)
  5. Request reviews from existing customers

- [ ] **Google Analytics 4**: Set up tracking
  1. Create GA4 property
  2. Add measurement ID to environment variables
  3. Implement tracking code

#### Short-term (Week 2-4)
- [ ] Submit to Australian business directories (see list above)
- [ ] Create "Water Filter Sydney" landing page
- [ ] Create "Water Filter Melbourne" landing page
- [ ] Write first blog post: "Best RO Water Filters in Australia 2026"
- [ ] Add customer reviews/testimonials to product pages
- [ ] Implement review schema when reviews are available

#### Medium-term (Month 2-3)
- [ ] Publish 4-6 blog posts from content strategy
- [ ] Create city-specific landing pages
- [ ] Build 10-20 directory backlinks
- [ ] Create product comparison pages
- [ ] Implement AggregateRating schema with real review data
- [ ] Guest post on 2-3 relevant Australian blogs

#### Ongoing
- [ ] Monitor rankings weekly in Google Search Console
- [ ] Update blog content monthly
- [ ] Respond to Google Business reviews
- [ ] Build backlinks through content marketing
- [ ] Update product pages with new reviews

### Verification Codes (Add to metadata)
After verification, add these to `src/app/layout.tsx`:
```tsx
verification: {
  google: 'your-google-verification-code',
  // other search engines as needed
},
```

---

## Quick Wins Summary

1. **Submit to Google Search Console** - Ensures your site is indexed
2. **Create Google Business Profile** - Appears in local search and maps
3. **Request customer reviews** - Builds trust and ratings
4. **Submit to 5-10 directories** - Quick backlinks
5. **Publish one high-quality blog post** - Target main keyword

---

## Measuring Success

### Key Metrics to Track
- Organic search traffic (Google Analytics)
- Keyword rankings (Google Search Console)
- Click-through rate (Search Console)
- Backlinks (Ahrefs/Moz)
- Local pack appearances (Track manually)

### Expected Timeline
- **Month 1**: Site indexed, initial rankings appear
- **Month 2-3**: Rankings improve for long-tail keywords
- **Month 3-6**: Rankings for competitive keywords
- **Month 6+**: Established authority, stable rankings

---

*Document created: May 2026*
*Last updated: May 2026*

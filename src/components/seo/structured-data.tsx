import { SEO_CONFIG, FAQ_DATA } from '@/lib/seo'

// ============================================================
// ORGANIZATION SCHEMA (For Google Business Panel)
// ============================================================
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SEO_CONFIG.siteUrl}/#organization`,
    name: SEO_CONFIG.businessInfo.name,
    legalName: SEO_CONFIG.businessInfo.legalName,
    url: SEO_CONFIG.siteUrl,
    logo: `${SEO_CONFIG.siteUrl}/logo.png`,
    image: `${SEO_CONFIG.siteUrl}/og-image.png`,
    description: SEO_CONFIG.defaultDescription,
    telephone: SEO_CONFIG.businessInfo.phone,
    email: SEO_CONFIG.businessInfo.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SEO_CONFIG.businessInfo.address.street,
      addressLocality: SEO_CONFIG.businessInfo.address.city,
      addressRegion: SEO_CONFIG.businessInfo.address.state,
      postalCode: SEO_CONFIG.businessInfo.address.postalCode,
      addressCountry: 'AU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SEO_CONFIG.businessInfo.geo.latitude,
      longitude: SEO_CONFIG.businessInfo.geo.longitude,
    },
    sameAs: [
      SEO_CONFIG.businessInfo.socialMedia.facebook,
      SEO_CONFIG.businessInfo.socialMedia.instagram,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SEO_CONFIG.businessInfo.phone,
      contactType: 'customer service',
      email: SEO_CONFIG.businessInfo.email,
      areaServed: 'AU',
      availableLanguage: ['English'],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================================
// LOCAL BUSINESS SCHEMA (For Local SEO)
// ============================================================
export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SEO_CONFIG.siteUrl}/#localbusiness`,
    name: SEO_CONFIG.businessInfo.name,
    image: `${SEO_CONFIG.siteUrl}/og-image.png`,
    url: SEO_CONFIG.siteUrl,
    telephone: SEO_CONFIG.businessInfo.phone,
    email: SEO_CONFIG.businessInfo.email,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SEO_CONFIG.businessInfo.address.street,
      addressLocality: SEO_CONFIG.businessInfo.address.city,
      addressRegion: SEO_CONFIG.businessInfo.address.state,
      postalCode: SEO_CONFIG.businessInfo.address.postalCode,
      addressCountry: 'AU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SEO_CONFIG.businessInfo.geo.latitude,
      longitude: SEO_CONFIG.businessInfo.geo.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '10:00',
        closes: '16:00',
      },
    ],
    areaServed: {
      '@type': 'Country',
      name: 'Australia',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================================
// WEBSITE SCHEMA (For Sitelinks Search Box)
// ============================================================
export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SEO_CONFIG.siteUrl}/#website`,
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    description: SEO_CONFIG.defaultDescription,
    publisher: {
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SEO_CONFIG.siteUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================================
// FAQ SCHEMA (For Featured Snippets / FAQ Rich Results)
// ============================================================
export function FAQSchema({ faqs = FAQ_DATA }: { faqs?: typeof FAQ_DATA }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================================
// BREADCRUMB SCHEMA (For Breadcrumb Rich Results)
// ============================================================
interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================================
// PRODUCT SCHEMA (For Product Rich Results)
// ============================================================
interface ProductSchemaProps {
  name: string
  description: string
  image: string
  price: number
  currency?: string
  sku?: string
  category?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  brand?: string
  rating?: number
  reviewCount?: number
  url: string
}

export function ProductSchema({
  name,
  description,
  image,
  price,
  currency = 'AUD',
  sku,
  category,
  availability = 'InStock',
  brand = 'Inblu',
  rating,
  reviewCount,
  url,
}: ProductSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        name: SEO_CONFIG.businessInfo.name,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'AUD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'AU',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'd',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 7,
            unitCode: 'd',
          },
        },
      },
    },
  }

  if (sku) {
    schema.sku = sku
  }

  if (category) {
    schema.category = category
  }

  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================================
// PRODUCT LIST SCHEMA (For Category Pages)
// ============================================================
interface ProductListItem {
  name: string
  url: string
  image: string
  price: number
}

export function ProductListSchema({
  name,
  description,
  products,
}: {
  name: string
  description: string
  products: ProductListItem[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        url: product.url,
        image: product.image,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'AUD',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================================
// ARTICLE SCHEMA (For Blog Posts)
// ============================================================
interface ArticleSchemaProps {
  title: string
  description: string
  image: string
  datePublished: string
  dateModified?: string
  author?: string
  url: string
}

export function ArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  author = 'Inblu Filters',
  url,
}: ArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author,
      url: SEO_CONFIG.siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: SEO_CONFIG.businessInfo.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SEO_CONFIG.siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ============================================================
// HOW-TO SCHEMA (For Tutorial Content)
// ============================================================
interface HowToStep {
  name: string
  text: string
  image?: string
}

export function HowToSchema({
  name,
  description,
  steps,
  totalTime,
}: {
  name: string
  description: string
  steps: HowToStep[]
  totalTime?: string // ISO 8601 duration format, e.g., "PT30M" for 30 minutes
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    totalTime,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

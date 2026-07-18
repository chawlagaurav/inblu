import prisma from '@/lib/prisma'

/**
 * Google Merchant Center product feed.
 *
 * Exposed at `/google-feed.xml` (App Router treats the folder name literally,
 * so the trailing `.xml` is part of the public path). Point Google Merchant
 * Center's *Scheduled Fetch* at:
 *
 *     https://<your-domain>/google-feed.xml
 *
 * The feed is an RSS 2.0 document using the `g:` (base.google.com) namespace,
 * regenerated on every request from the live Supabase data via Prisma.
 */

// Always render dynamically — the feed must reflect current stock/pricing, so
// we opt out of static generation and route caching entirely.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
//
// Brand and Google product category are read from environment variables so
// they can be changed WITHOUT a code deploy. To change them in the future:
//
//   1. Edit the values in your environment (.env locally, or your host's
//      dashboard in production) — see .env.example for the variable names.
//   2. Redeploy / restart so the new env values are picked up.
//
//   GOOGLE_MERCHANT_BRAND    -> value emitted in every <g:brand> tag.
//   GOOGLE_MERCHANT_CATEGORY -> value emitted in every <g:google_product_category>.
//                               Must be a valid Google product taxonomy string:
//                               https://support.google.com/merchants/answer/6324436
//
// Neither is hardcoded; the constants below are only fallbacks used when the
// corresponding env var is unset.

// Store-level constants surfaced in the feed.
const STORE_TITLE = 'Inblu Filters'
const STORE_DESCRIPTION = 'Google Merchant Product Feed'
const CURRENCY = 'AUD'

// Brand — from GOOGLE_MERCHANT_BRAND, with a sensible default.
const BRAND = process.env.GOOGLE_MERCHANT_BRAND?.trim() || 'Inblu'

// Google product taxonomy value applied to every item — from
// GOOGLE_MERCHANT_CATEGORY, with a sensible default. Change via env (above).
const GOOGLE_PRODUCT_CATEGORY =
  process.env.GOOGLE_MERCHANT_CATEGORY?.trim() ||
  'Home & Garden > Kitchen & Dining > Kitchen Appliances > Water Filters'

/**
 * Resolve the public site origin from NEXT_PUBLIC_SITE_URL.
 *
 * This is intentionally strict: rather than silently falling back to another
 * domain (which would emit wrong <link>/<image_link> URLs and get the feed
 * rejected), we throw. The GET handler catches this and returns a 500 so the
 * misconfiguration is surfaced instead of shipping a broken feed to Google.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL is not set. It is required to build absolute ' +
        'product URLs for the Google Merchant feed. See .env.example.',
    )
  }
  return raw.replace(/\/+$/, '') // strip any trailing slash so we can append paths
}

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------

/**
 * Escape the five XML-significant characters so arbitrary product text can be
 * embedded safely inside element bodies and attribute values.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Strip HTML tags and collapse whitespace from a product description, then
 * decode the handful of common named entities a rich-text editor might emit.
 * The result is plain text suitable for `<g:description>` (Google rejects HTML
 * markup and truncates at 5000 chars, so we clamp defensively).
 */
function sanitizeDescription(raw: string | null | undefined): string {
  if (!raw) return ''
  const text = raw
    .replace(/<[^>]*>/g, ' ') // drop tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ') // collapse runs of whitespace
    .trim()
  return text.length > 5000 ? text.slice(0, 4997) + '...' : text
}

/**
 * Format a numeric/Decimal price into Google's required "<amount> <currency>"
 * form, e.g. `49.99 AUD`. Returns null for missing or non-positive prices so
 * callers can skip the product.
 */
function formatPrice(amount: number | null | undefined): string | null {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null
  return `${amount.toFixed(2)} ${CURRENCY}`
}

/** Build the canonical public URL for a product's detail page. */
function productUrl(siteUrl: string, slug: string | null, id: string): string {
  // The storefront route is /products/[slug]; fall back to id when a product
  // has no slug so we never emit a broken link.
  return `${siteUrl}/products/${encodeURIComponent(slug || id)}`
}

/**
 * Render a single `<item>` block. Returns null when the product fails a
 * required-field check (title, price, image) so it is skipped from the feed.
 */
function renderItem(
  siteUrl: string,
  p: {
    id: string
    slug: string | null
    name: string
    description: string
    price: number
    salePrice: number | null
    isOnSale: boolean
    imageUrl: string | null
    images: string[]
    sku: string | null
    category: string | null
    stock: number
    isSoldOut: boolean
  },
): string | null {
  // --- Required fields: skip the item if any are missing/invalid -----------
  const title = p.name?.trim()
  if (!title) return null

  const imageLink = (p.imageUrl && p.imageUrl.trim()) || p.images?.find((i) => i && i.trim())
  if (!imageLink) return null

  const basePrice = formatPrice(p.price)
  if (!basePrice) return null

  // --- Pricing: base price is always present; add sale_price only if valid -
  // A sale price is included only when the product is on sale AND the sale
  // amount is a valid positive number below the regular price.
  const saleFormatted =
    p.isOnSale && p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price
      ? formatPrice(p.salePrice)
      : null

  // --- Availability --------------------------------------------------------
  const availability = p.isSoldOut || p.stock <= 0 ? 'out of stock' : 'in stock'

  // --- Identifiers ---------------------------------------------------------
  // We have no GTIN. The SKU is a valid manufacturer part number (MPN) when
  // present. Per Google's rules, `identifier_exists=false` is emitted only
  // when BOTH GTIN and MPN are absent; MPN/GTIN tags are omitted (never empty)
  // when we don't have a value.
  const mpn = p.sku?.trim() || null
  const hasIdentifier = Boolean(mpn) // no GTIN in our schema

  // --- Product type: use the product's own store category ------------------
  const productType = p.category?.trim() || null

  // Assemble the child elements, appending optional ones conditionally so we
  // never produce empty tags.
  const parts: string[] = [
    `<g:id>${escapeXml(p.id)}</g:id>`,
    `<g:title>${escapeXml(title)}</g:title>`,
    `<g:description>${escapeXml(sanitizeDescription(p.description))}</g:description>`,
    `<g:link>${escapeXml(productUrl(siteUrl, p.slug, p.id))}</g:link>`,
    `<g:image_link>${escapeXml(imageLink)}</g:image_link>`,
    `<g:availability>${availability}</g:availability>`,
    `<g:condition>new</g:condition>`,
    `<g:price>${escapeXml(basePrice)}</g:price>`,
  ]

  // Sale price (optional).
  if (saleFormatted) {
    parts.push(`<g:sale_price>${escapeXml(saleFormatted)}</g:sale_price>`)
  }

  parts.push(`<g:brand>${escapeXml(BRAND)}</g:brand>`)
  parts.push(`<g:google_product_category>${escapeXml(GOOGLE_PRODUCT_CATEGORY)}</g:google_product_category>`)

  if (productType) {
    parts.push(`<g:product_type>${escapeXml(productType)}</g:product_type>`)
  }

  // Identifiers: emit MPN when we have it; otherwise declare no identifiers.
  if (mpn) {
    parts.push(`<g:mpn>${escapeXml(mpn)}</g:mpn>`)
  }
  if (!hasIdentifier) {
    parts.push(`<g:identifier_exists>false</g:identifier_exists>`)
  }

  return `    <item>\n      ${parts.join('\n      ')}\n    </item>`
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(): Promise<Response> {
  try {
    // Resolve (and validate) the site URL first — throws if NEXT_PUBLIC_SITE_URL
    // is missing, which we catch below and surface as a 500.
    const siteUrl = resolveSiteUrl()

    // Fetch only ACTIVE products. Ordering is cosmetic but keeps the feed
    // stable between runs (helpful when diffing GMC fetch results).
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        price: true,
        salePrice: true,
        isOnSale: true,
        imageUrl: true,
        images: true,
        sku: true,
        category: true,
        stock: true,
        isSoldOut: true,
      },
    })

    // Map each product to an <item>, dropping any that fail required-field
    // validation (renderItem returns null). Prisma Decimals are converted to
    // plain numbers here.
    const items = products
      .map((p) =>
        renderItem(siteUrl, {
          ...p,
          price: Number(p.price),
          salePrice: p.salePrice != null ? Number(p.salePrice) : null,
        }),
      )
      .filter((item): item is string => item !== null)

    // Assemble the full RSS 2.0 document with the Google `g:` namespace.
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n` +
      `  <channel>\n` +
      `    <title>${escapeXml(STORE_TITLE)}</title>\n` +
      `    <link>${escapeXml(siteUrl)}</link>\n` +
      `    <description>${escapeXml(STORE_DESCRIPTION)}</description>\n` +
      `${items.join('\n')}\n` +
      `  </channel>\n` +
      `</rss>\n`

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // Let Google (and any CDN) cache briefly; the route itself is dynamic.
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    // Never leak internals to Google's crawler; log server-side and return a
    // minimal, still-valid empty feed with a 500 so the fetch is retried.
    // (This also covers a missing NEXT_PUBLIC_SITE_URL.)
    console.error('Failed to generate Google Merchant feed:', error)
    const fallback =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n` +
      `  <channel>\n` +
      `    <title>${escapeXml(STORE_TITLE)}</title>\n` +
      `    <description>Feed temporarily unavailable</description>\n` +
      `  </channel>\n` +
      `</rss>\n`
    return new Response(fallback, {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }
}

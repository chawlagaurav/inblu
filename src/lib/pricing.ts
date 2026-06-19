/**
 * Single source of truth for "what does this product cost the customer?"
 *
 * Products store an original `price` plus optional discount fields:
 *   - `isOnSale` — toggles the discount on/off
 *   - `salePrice` — fixed override price (mutually exclusive with discountPercent)
 *   - `discountPercent` — percentage off the original price (1..99)
 *
 * Use this helper everywhere a price is rendered or charged. The server uses
 * it at checkout to compute the actual amount billed (so a tampered client-side
 * price can never leak through). The storefront uses it via <PriceDisplay> to
 * render the strikethrough + sale price + percent-off badge consistently.
 */

export interface PriceableProduct {
  price: number
  isOnSale?: boolean
  discountPercent?: number | null
  salePrice?: number | null
}

export interface PriceBreakdown {
  /** The product's regular (struck-through) price. */
  originalPrice: number
  /** What the customer is actually charged per unit. */
  effectivePrice: number
  /** True only when a *valid* discount applies. Malformed states fall back to false. */
  isOnSale: boolean
  /** originalPrice - effectivePrice. Always >= 0. */
  discountAmount: number
  /** Re-derived integer percent (0..99) for badge display, regardless of admin's input mode. */
  discountPercent: number
  /** Which input the admin used. Useful for choosing badge wording. */
  mode: 'percent' | 'fixed' | 'none'
}

const round2 = (n: number): number => Math.round(n * 100) / 100

/**
 * Compute the effective (charged) unit price for a product. Defensive against
 * malformed discount data — if `isOnSale` is true but the value is missing or
 * out of range, returns the original price.
 */
export function getEffectivePrice(p: PriceableProduct): number {
  return getPriceBreakdown(p).effectivePrice
}

/**
 * Full pricing breakdown for both rendering and billing.
 */
export function getPriceBreakdown(p: PriceableProduct): PriceBreakdown {
  const originalPrice = Number(p.price) || 0

  const noSale: PriceBreakdown = {
    originalPrice,
    effectivePrice: originalPrice,
    isOnSale: false,
    discountAmount: 0,
    discountPercent: 0,
    mode: 'none',
  }

  if (!p.isOnSale) return noSale

  // Fixed sale price takes precedence when both are somehow set, but the admin
  // form prevents that state from ever being saved.
  const sp = p.salePrice == null ? null : Number(p.salePrice)
  if (sp != null && sp > 0 && sp < originalPrice) {
    const effective = round2(sp)
    const savings = round2(originalPrice - effective)
    return {
      originalPrice,
      effectivePrice: effective,
      isOnSale: true,
      discountAmount: savings,
      discountPercent: Math.round((savings / originalPrice) * 100),
      mode: 'fixed',
    }
  }

  const pct = p.discountPercent ?? null
  if (pct != null && pct >= 1 && pct <= 99) {
    const effective = round2(originalPrice * (1 - pct / 100))
    const savings = round2(originalPrice - effective)
    return {
      originalPrice,
      effectivePrice: effective,
      isOnSale: true,
      discountAmount: savings,
      // Re-derive from the rounded effective price so percent-mode and
      // fixed-mode badges stay consistent.
      discountPercent: Math.round((savings / originalPrice) * 100),
      mode: 'percent',
    }
  }

  // Sale flag is on but no usable value — safest fallback is "no sale".
  return noSale
}

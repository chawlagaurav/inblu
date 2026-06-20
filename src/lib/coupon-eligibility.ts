/**
 * Determines which cart lines a coupon is allowed to discount.
 *
 * Two layers of restriction combine:
 *   1. A product-level flag (`excludeFromCoupons`) — when true, no coupon
 *      may ever discount that product.
 *   2. Per-coupon allow/deny lists — `applicableProductIds` (when non-empty,
 *      only those products are eligible) and `excludedProductIds`.
 *
 * Eligibility predicate (a product is eligible if ALL of):
 *   - `!product.excludeFromCoupons`
 *   - `coupon.applicableProductIds.length === 0` OR id is in it
 *   - id is NOT in `coupon.excludedProductIds`
 *
 * Returns integer cents so the checkout route can keep its existing
 * cents-based math exact. Uses the same `getEffectivePrice` helper the
 * storefront and cart use, so per-product sale prices feed naturally
 * (a 10% coupon on an $80 sale-priced item discounts $8, not $10).
 *
 * Items whose product can't be found in the catalog map (e.g. deleted
 * products) are silently treated as ineligible, so the coupon still works
 * on the rest of the cart instead of erroring.
 */

import { getEffectivePrice, type PriceableProduct } from './pricing'

export interface CouponEligibilityProduct extends PriceableProduct {
  id: string
  name: string
  excludeFromCoupons: boolean
}

export interface CouponRestrictions {
  applicableProductIds: string[]
  excludedProductIds: string[]
}

export interface EligibilityItem {
  productId: string
  quantity: number
}

export interface EligibilityResult {
  /** Sum of (effective price × quantity) for eligible lines, in integer cents. */
  eligibleSubtotalCents: number
  /** Sum for ineligible lines, in integer cents. */
  ineligibleSubtotalCents: number
  /** Names of products that were excluded — for the cart's "(excludes …)" footnote. */
  excludedItemNames: string[]
}

export function getCouponEligibleItems(
  items: EligibilityItem[],
  coupon: CouponRestrictions,
  productsById: Map<string, CouponEligibilityProduct>,
): EligibilityResult {
  const allowList = coupon.applicableProductIds ?? []
  const denyList = coupon.excludedProductIds ?? []
  const denySet = new Set(denyList)
  const allowSet = new Set(allowList)
  const hasAllowList = allowList.length > 0

  let eligibleCents = 0
  let ineligibleCents = 0
  const excludedNames: string[] = []
  const seenExcludedIds = new Set<string>()

  for (const item of items) {
    const product = productsById.get(item.productId)
    if (!product) {
      // Unknown product — silently ineligible. We don't know its price or name
      // either, so don't surface it as an excluded item to the customer.
      continue
    }

    const lineCents = Math.round(getEffectivePrice(product) * 100) * item.quantity

    const isEligible =
      !product.excludeFromCoupons &&
      (!hasAllowList || allowSet.has(product.id)) &&
      !denySet.has(product.id)

    if (isEligible) {
      eligibleCents += lineCents
    } else {
      ineligibleCents += lineCents
      if (!seenExcludedIds.has(product.id)) {
        seenExcludedIds.add(product.id)
        excludedNames.push(product.name)
      }
    }
  }

  return {
    eligibleSubtotalCents: eligibleCents,
    ineligibleSubtotalCents: ineligibleCents,
    excludedItemNames: excludedNames,
  }
}

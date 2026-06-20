import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCouponEligibleItems, type CouponEligibilityProduct } from '@/lib/coupon-eligibility'
import { getEffectivePrice } from '@/lib/pricing'

interface ValidateBody {
  code?: string
  items?: Array<{ productId?: string; quantity?: number }>
}

/**
 * POST — validate a coupon code against the customer's current cart.
 *
 * The body is the cart's `{productId, quantity}` lines, NOT a client-supplied
 * subtotal. The server fetches product prices and eligibility from the DB
 * itself so a tampered total can't fake the min-order check or inflate the
 * discount. (The full checkout route applies the same rule again — this
 * endpoint is the cart UI's mirror so the displayed discount matches what
 * the customer will actually be charged.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidateBody
    const code = typeof body.code === 'string' ? body.code.trim() : ''

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    const items = Array.isArray(body.items) ? body.items : []
    // Sanitise: drop entries with bad shape, coerce quantity to a positive int.
    const sanitisedItems = items
      .map((item) => ({
        productId: typeof item.productId === 'string' ? item.productId : '',
        quantity: Number.isFinite(item.quantity) ? Math.max(0, Math.floor(item.quantity as number)) : 0,
      }))
      .filter((item) => item.productId && item.quantity > 0)

    if (sanitisedItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 })
    }

    const now = new Date()
    if (coupon.startDate && now < coupon.startDate) {
      return NextResponse.json({ error: 'This coupon is not yet active' }, { status: 400 })
    }
    if (coupon.endDate && now > coupon.endDate) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
    }

    // Fetch product pricing + eligibility in one query.
    const productIds = sanitisedItems.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        isOnSale: true,
        discountPercent: true,
        salePrice: true,
        excludeFromCoupons: true,
      },
    })

    const productsById = new Map<string, CouponEligibilityProduct>(
      products.map((p) => [p.id, {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        isOnSale: p.isOnSale,
        discountPercent: p.discountPercent,
        salePrice: p.salePrice == null ? null : Number(p.salePrice),
        excludeFromCoupons: p.excludeFromCoupons,
      }])
    )

    // Full cart subtotal (cents) — used only for the min-order check, so a
    // customer can clear "min $50" even if some items aren't coupon-eligible.
    let fullSubtotalCents = 0
    for (const item of sanitisedItems) {
      const product = productsById.get(item.productId)
      if (!product) continue
      fullSubtotalCents += Math.round(getEffectivePrice(product) * 100) * item.quantity
    }
    const fullSubtotalDollars = fullSubtotalCents / 100

    if (coupon.minOrderAmount !== null && fullSubtotalDollars < Number(coupon.minOrderAmount)) {
      return NextResponse.json(
        { error: `Minimum order amount of $${Number(coupon.minOrderAmount).toFixed(2)} required` },
        { status: 400 }
      )
    }

    const eligibility = getCouponEligibleItems(
      sanitisedItems,
      {
        applicableProductIds: coupon.applicableProductIds,
        excludedProductIds: coupon.excludedProductIds,
      },
      productsById,
    )

    if (eligibility.eligibleSubtotalCents === 0) {
      return NextResponse.json(
        { error: "This coupon doesn't apply to any items in your cart." },
        { status: 400 }
      )
    }

    // Compute the discount against the eligible subtotal only.
    let discountCents: number
    if (coupon.discountType === 'percentage') {
      discountCents = Math.round((eligibility.eligibleSubtotalCents * Number(coupon.discountValue)) / 100)
      if (coupon.maxDiscountAmount !== null) {
        discountCents = Math.min(discountCents, Math.round(Number(coupon.maxDiscountAmount) * 100))
      }
    } else {
      discountCents = Math.min(
        Math.round(Number(coupon.discountValue) * 100),
        eligibility.eligibleSubtotalCents,
      )
    }

    const discountAmount = discountCents / 100

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount,
      description: coupon.description,
      eligibleSubtotal: eligibility.eligibleSubtotalCents / 100,
      excludedItemNames: eligibility.excludedItemNames,
    })
  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
  }
}

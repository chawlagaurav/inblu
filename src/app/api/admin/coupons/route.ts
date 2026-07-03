import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') return null
  return user
}

/**
 * Validate the coupon's product-eligibility arrays:
 * - Mutually exclusive (only one of allow/deny may be non-empty).
 * - Each id must reference a real Product (prevents dangling ids).
 * Returns null on success or an error message string for a 400 response.
 */
async function validateCouponProductEligibility(
  applicable: unknown,
  excluded: unknown,
): Promise<string | null> {
  const allow = Array.isArray(applicable) ? applicable.filter((x): x is string => typeof x === 'string') : []
  const deny = Array.isArray(excluded) ? excluded.filter((x): x is string => typeof x === 'string') : []

  if (allow.length > 0 && deny.length > 0) {
    return 'applicableProductIds and excludedProductIds are mutually exclusive'
  }

  const allIds = Array.from(new Set([...allow, ...deny]))
  if (allIds.length === 0) return null

  const found = await prisma.product.findMany({
    where: { id: { in: allIds } },
    select: { id: true },
  })
  if (found.length !== allIds.length) {
    return 'One or more selected products no longer exist'
  }
  return null
}

// GET all coupons
export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(coupons)
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

// POST - Create a new coupon
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      maxUses,
      isActive,
      startDate,
      endDate,
      applicableProductIds,
      excludedProductIds,
    } = body

    if (!code || !discountType || discountValue == null) {
      return NextResponse.json({ error: 'Code, discount type, and discount value are required' }, { status: 400 })
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json({ error: 'Discount type must be "percentage" or "fixed"' }, { status: 400 })
    }

    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json({ error: 'Percentage must be between 0 and 100' }, { status: 400 })
    }

    if (discountValue < 0) {
      return NextResponse.json({ error: 'Discount value must be positive' }, { status: 400 })
    }

    const eligibilityError = await validateCouponProductEligibility(applicableProductIds, excludedProductIds)
    if (eligibilityError) {
      return NextResponse.json({ error: eligibilityError }, { status: 400 })
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    })

    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description || null,
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount || null,
        maxDiscountAmount: maxDiscountAmount || null,
        maxUses: maxUses || null,
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        applicableProductIds: Array.isArray(applicableProductIds) ? applicableProductIds : [],
        excludedProductIds: Array.isArray(excludedProductIds) ? excludedProductIds : [],
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}

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

  if (dbUser?.role !== 'ADMIN') return null
  return user
}

/** See `src/app/api/admin/coupons/route.ts` for documentation. */
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

// PUT - Update a coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    if (discountType && !['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json({ error: 'Discount type must be "percentage" or "fixed"' }, { status: 400 })
    }

    if (discountType === 'percentage' && discountValue != null && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json({ error: 'Percentage must be between 0 and 100' }, { status: 400 })
    }

    if (discountValue != null && discountValue < 0) {
      return NextResponse.json({ error: 'Discount value must be positive' }, { status: 400 })
    }

    // Validate eligibility arrays only when at least one is being updated.
    if (applicableProductIds !== undefined || excludedProductIds !== undefined) {
      // For mutual-exclusivity check we need to know what the FINAL state would
      // look like — load the existing row when only one side is being updated.
      const existing = await prisma.coupon.findUnique({
        where: { id },
        select: { applicableProductIds: true, excludedProductIds: true },
      })
      const finalApplicable = applicableProductIds !== undefined ? applicableProductIds : existing?.applicableProductIds ?? []
      const finalExcluded = excludedProductIds !== undefined ? excludedProductIds : existing?.excludedProductIds ?? []
      const eligibilityError = await validateCouponProductEligibility(finalApplicable, finalExcluded)
      if (eligibilityError) {
        return NextResponse.json({ error: eligibilityError }, { status: 400 })
      }
    }

    // Check for duplicate code if code is being changed
    if (code) {
      const existing = await prisma.coupon.findFirst({
        where: {
          code: code.toUpperCase().trim(),
          NOT: { id },
        },
      })
      if (existing) {
        return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 })
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase().trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(discountType && { discountType }),
        ...(discountValue != null && { discountValue }),
        ...(minOrderAmount !== undefined && { minOrderAmount: minOrderAmount || null }),
        ...(maxDiscountAmount !== undefined && { maxDiscountAmount: maxDiscountAmount || null }),
        ...(maxUses !== undefined && { maxUses: maxUses || null }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(applicableProductIds !== undefined && { applicableProductIds: Array.isArray(applicableProductIds) ? applicableProductIds : [] }),
        ...(excludedProductIds !== undefined && { excludedProductIds: Array.isArray(excludedProductIds) ? excludedProductIds : [] }),
      },
    })

    return NextResponse.json(coupon)
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

// DELETE - Delete a coupon
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.coupon.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}

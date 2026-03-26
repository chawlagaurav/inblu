import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST - Validate a coupon code
export async function POST(request: NextRequest) {
  try {
    const { code, orderSubtotal } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 })
    }

    // Check date range
    const now = new Date()
    if (coupon.startDate && now < coupon.startDate) {
      return NextResponse.json({ error: 'This coupon is not yet active' }, { status: 400 })
    }
    if (coupon.endDate && now > coupon.endDate) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
    }

    // Check usage limit
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
    }

    // Check minimum order amount
    if (coupon.minOrderAmount !== null && orderSubtotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json({
        error: `Minimum order amount of $${Number(coupon.minOrderAmount).toFixed(2)} required`,
      }, { status: 400 })
    }

    // Calculate discount
    let discountAmount: number
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderSubtotal * Number(coupon.discountValue)) / 100
      // Apply max discount cap if set
      if (coupon.maxDiscountAmount !== null) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount))
      }
    } else {
      // Fixed amount
      discountAmount = Math.min(Number(coupon.discountValue), orderSubtotal)
    }

    discountAmount = Math.round(discountAmount * 100) / 100

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount,
      description: coupon.description,
    })
  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}

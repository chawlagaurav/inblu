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

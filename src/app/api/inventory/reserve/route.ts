import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

interface CartItem {
  productId: string
  quantity: number
}

const RESERVATION_DURATION_MINUTES = 10 // Stock held for 10 minutes

export async function POST(request: NextRequest) {
  try {
    const { items, sessionId: existingSessionId } = await request.json() as { 
      items: CartItem[]
      sessionId?: string 
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    // Generate or use existing session ID
    const sessionId = existingSessionId || crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + RESERVATION_DURATION_MINUTES * 60 * 1000)

    // First, clean up any expired reservations
    await prisma.stockReservation.deleteMany({
      where: {
        expiresAt: { lt: now },
        orderId: null
      }
    })

    // Release any existing reservations for this session
    await prisma.stockReservation.deleteMany({
      where: {
        sessionId,
        orderId: null
      }
    })

    const productIds = items.map(item => item.productId)

    // Get current stock and check availability
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true, isActive: true }
    })

    // Get active reservations (excluding our own session)
    const reservations = await prisma.stockReservation.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        expiresAt: { gt: now },
        orderId: null,
        sessionId: { not: sessionId }
      },
      _sum: {
        quantity: true
      }
    })

    const reservedMap = new Map(
      reservations.map(r => [r.productId, r._sum.quantity || 0])
    )

    // Check if all items can be reserved
    const unavailableItems: Array<{
      productId: string
      productName: string
      reason: string
      requested: number
      available: number
    }> = []

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      
      if (!product) {
        unavailableItems.push({
          productId: item.productId,
          productName: 'Unknown Product',
          reason: 'Product not found',
          requested: item.quantity,
          available: 0
        })
        continue
      }

      if (!product.isActive) {
        unavailableItems.push({
          productId: item.productId,
          productName: product.name,
          reason: 'Product is no longer available',
          requested: item.quantity,
          available: 0
        })
        continue
      }

      const reserved = reservedMap.get(item.productId) || 0
      const availableQuantity = Math.max(0, product.stock - reserved)

      if (availableQuantity < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          productName: product.name,
          reason: availableQuantity === 0 
            ? 'Out of stock' 
            : `Only ${availableQuantity} available`,
          requested: item.quantity,
          available: availableQuantity
        })
      }
    }

    if (unavailableItems.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Some items are not available',
        unavailableItems
      }, { status: 409 }) // Conflict
    }

    // Create reservations for all items
    await prisma.stockReservation.createMany({
      data: items.map(item => ({
        sessionId,
        productId: item.productId,
        quantity: item.quantity,
        expiresAt
      }))
    })

    return NextResponse.json({
      success: true,
      sessionId,
      expiresAt: expiresAt.toISOString(),
      reservationDurationMinutes: RESERVATION_DURATION_MINUTES,
      message: `Stock reserved for ${RESERVATION_DURATION_MINUTES} minutes`
    })
  } catch (error) {
    console.error('Stock reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to reserve stock' },
      { status: 500 }
    )
  }
}

// DELETE - Release reservations for a session
export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json() as { sessionId: string }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Only delete reservations that haven't been converted to orders
    const result = await prisma.stockReservation.deleteMany({
      where: {
        sessionId,
        orderId: null
      }
    })

    return NextResponse.json({
      success: true,
      released: result.count
    })
  } catch (error) {
    console.error('Stock release error:', error)
    return NextResponse.json(
      { error: 'Failed to release stock' },
      { status: 500 }
    )
  }
}

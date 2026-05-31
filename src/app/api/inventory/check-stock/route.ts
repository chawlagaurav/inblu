import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface CartItem {
  productId: string
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json() as { items: CartItem[] }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const productIds = items.map(item => item.productId)
    
    // Get current stock for all products
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true, isActive: true }
    })

    // Get active reservations (not expired) for these products
    const now = new Date()
    const reservations = await prisma.stockReservation.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        expiresAt: { gt: now },
        orderId: null, // Only count pending reservations (not yet converted to orders)
      },
      _sum: {
        quantity: true
      }
    })

    // Create a map of reserved quantities
    const reservedMap = new Map(
      reservations.map(r => [r.productId, r._sum.quantity || 0])
    )

    // Check each item
    const stockStatus = items.map(item => {
      const product = products.find(p => p.id === item.productId)
      
      if (!product) {
        return {
          productId: item.productId,
          available: false,
          reason: 'Product not found',
          requested: item.quantity,
          inStock: 0,
          reserved: 0,
          availableQuantity: 0
        }
      }

      if (!product.isActive) {
        return {
          productId: item.productId,
          productName: product.name,
          available: false,
          reason: 'No longer available',
          requested: item.quantity,
          inStock: product.stock,
          reserved: 0,
          availableQuantity: 0
        }
      }

      const reserved = reservedMap.get(item.productId) || 0
      const availableQuantity = Math.max(0, product.stock - reserved)
      const isAvailable = availableQuantity >= item.quantity

      // Customer-friendly messages - don't mention reservations
      let reason: string | null = null
      if (!isAvailable) {
        if (availableQuantity === 0) {
          reason = 'Sold out'
        } else {
          reason = `Only ${availableQuantity} in stock`
        }
      }

      return {
        productId: item.productId,
        productName: product.name,
        available: isAvailable,
        reason,
        requested: item.quantity,
        inStock: product.stock,
        reserved,
        availableQuantity
      }
    })

    const allAvailable = stockStatus.every(s => s.available)
    const unavailableItems = stockStatus.filter(s => !s.available)

    return NextResponse.json({
      available: allAvailable,
      items: stockStatus,
      unavailableItems
    })
  } catch (error) {
    console.error('Stock check error:', error)
    return NextResponse.json(
      { error: 'Failed to check stock' },
      { status: 500 }
    )
  }
}

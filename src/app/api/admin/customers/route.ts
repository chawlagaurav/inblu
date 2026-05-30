import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// DELETE - Bulk delete customers
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerIds, customerType } = body as { 
      customerIds: string[]
      customerType: 'registered' | 'guest' | 'mixed'
    }

    if (!customerIds || customerIds.length === 0) {
      return NextResponse.json({ error: 'No customers selected' }, { status: 400 })
    }

    let deletedCount = 0

    if (customerType === 'registered' || customerType === 'mixed') {
      // Delete registered customers (Users)
      // First, we need to handle their orders
      const registeredIds = customerIds.filter(id => !id.includes('@'))
      
      if (registeredIds.length > 0) {
        // Set userId to null on orders (keep order history)
        await prisma.order.updateMany({
          where: { userId: { in: registeredIds } },
          data: { userId: null },
        })

        // Delete users
        const result = await prisma.user.deleteMany({
          where: { 
            id: { in: registeredIds },
            role: 'CUSTOMER', // Safety: don't delete admins
          },
        })
        deletedCount += result.count
      }
    }

    if (customerType === 'guest' || customerType === 'mixed') {
      // For guest customers (identified by email), we can optionally delete their orders
      // or just mark them somehow. For now, we'll delete guest orders if specifically requested
      const guestEmails = customerIds.filter(id => id.includes('@'))
      
      if (guestEmails.length > 0) {
        // Delete order items first, then orders
        const ordersToDelete = await prisma.order.findMany({
          where: { 
            email: { in: guestEmails },
            isGuest: true,
          },
          select: { id: true },
        })

        const orderIds = ordersToDelete.map(o => o.id)

        if (orderIds.length > 0) {
          await prisma.orderItem.deleteMany({
            where: { orderId: { in: orderIds } },
          })

          const result = await prisma.order.deleteMany({
            where: { id: { in: orderIds } },
          })
          deletedCount += result.count
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${deletedCount} customer(s)`,
      deletedCount,
    })
  } catch (error) {
    console.error('Error deleting customers:', error)
    return NextResponse.json(
      { error: 'Failed to delete customers' },
      { status: 500 }
    )
  }
}

// GET - Fetch all customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search') || ''
    const typeFilter = searchParams.get('type') || 'all'

    // Get registered customers
    const registeredCustomers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        ...(searchQuery ? {
          OR: [
            { email: { contains: searchQuery, mode: 'insensitive' } },
            { name: { contains: searchQuery, mode: 'insensitive' } },
          ]
        } : {}),
      },
      include: {
        orders: {
          where: { paymentStatus: 'SUCCEEDED' },
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            shippingAddress: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get guest orders (only paid orders)
    const guestOrders = await prisma.order.findMany({
      where: {
        isGuest: true,
        paymentStatus: 'SUCCEEDED',
        ...(searchQuery ? {
          OR: [
            { email: { contains: searchQuery, mode: 'insensitive' } },
            { customerName: { contains: searchQuery, mode: 'insensitive' } },
          ]
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group guest orders by email
    const guestCustomersMap = new Map<string, {
      email: string
      name: string
      phone: string | null
      orders: typeof guestOrders
      totalSpent: number
      address: Record<string, string> | null
    }>()

    guestOrders.forEach(order => {
      const existing = guestCustomersMap.get(order.email)
      if (existing) {
        existing.orders.push(order)
        existing.totalSpent += Number(order.totalAmount)
      } else {
        guestCustomersMap.set(order.email, {
          email: order.email,
          name: order.customerName,
          phone: order.phone,
          orders: [order],
          totalSpent: Number(order.totalAmount),
          address: order.shippingAddress as Record<string, string> | null,
        })
      }
    })

    const guestCustomers = Array.from(guestCustomersMap.values())

    // Build response based on filter
    const formatRegistered = (c: typeof registeredCustomers[0]) => ({
      type: 'registered' as const,
      id: c.id,
      email: c.email,
      name: c.name || c.email.split('@')[0],
      phone: c.phone,
      orderCount: c.orders.length,
      totalSpent: c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      lastOrder: c.orders[0]?.createdAt,
      createdAt: c.createdAt,
      address: (c.orders[0]?.shippingAddress as Record<string, string> | null) || null,
    })

    const formatGuest = (c: typeof guestCustomers[0]) => ({
      type: 'guest' as const,
      id: c.email,
      email: c.email,
      name: c.name,
      phone: c.phone,
      orderCount: c.orders.length,
      totalSpent: c.totalSpent,
      lastOrder: c.orders[0]?.createdAt,
      createdAt: c.orders[c.orders.length - 1]?.createdAt,
      address: c.address,
    })

    let allCustomers
    if (typeFilter === 'registered') {
      allCustomers = registeredCustomers.map(formatRegistered)
    } else if (typeFilter === 'guests') {
      allCustomers = guestCustomers.map(formatGuest)
    } else {
      allCustomers = [
        ...registeredCustomers.map(formatRegistered),
        ...guestCustomers.map(formatGuest),
      ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    }

    return NextResponse.json({
      customers: allCustomers,
      stats: {
        total: registeredCustomers.length + guestCustomers.length,
        registered: registeredCustomers.length,
        guests: guestCustomers.length,
      },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

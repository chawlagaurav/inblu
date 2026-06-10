import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET current user's orders
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Enforce the 24h "complete payment" window: an unpaid order (a payment was
    // attempted but never succeeded) can be completed for 24h, after which it is
    // cleared. Lazily delete this user's expired unpaid orders on read so they
    // stop showing a "Complete Payment" option even if the cron hasn't run.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await prisma.order.deleteMany({
      where: {
        OR: [
          { userId: user.id },
          { email: user.email ?? '' },
        ],
        status: 'PENDING',
        paymentStatus: { in: ['PENDING', 'PROCESSING', 'FAILED'] },
        createdAt: { lt: cutoff },
      },
    })

    // First, try to find orders by user_id
    // If user doesn't exist in our users table yet, also check by email
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: user.id },
          { email: user.email ?? '' },
        ],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format the response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: Number(order.totalAmount),
      subtotal: Number(order.subtotal),
      gst: Number(order.gst),
      shippingCost: Number(order.shippingCost),
      stripePaymentIntent: order.stripePaymentIntent,
      shippingAddress: order.shippingAddress as Record<string, unknown>,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
        },
      })),
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

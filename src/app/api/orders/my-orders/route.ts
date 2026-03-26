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

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

// POST - Create a manual order (for offline orders)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      customerName,
      email,
      phone,
      address,
      city,
      state,
      postcode,
      items, // Array of { productId, quantity, price }
      totalAmount,
      subtotal,
      shippingCost,
      discountAmount,
      couponCode,
      status,
      paymentStatus,
      notes,
      installationDate,
      orderDate,
    } = body

    // Validate required fields
    if (!customerName || !email || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer name, email, and at least one item are required' },
        { status: 400 }
      )
    }

    // Calculate GST (10% of subtotal)
    const calculatedSubtotal = subtotal || items.reduce((sum: number, item: { price: number; quantity: number }) => 
      sum + (item.price * item.quantity), 0)
    const gst = calculatedSubtotal * 0.1
    const calculatedTotal = totalAmount || (calculatedSubtotal + (shippingCost || 0) - (discountAmount || 0))

    // Create the order
    const order = await prisma.order.create({
      data: {
        customerName,
        email,
        phone: phone || null,
        shippingAddress: {
          address: address || '',
          city: city || '',
          state: state || '',
          postcode: postcode || '',
          country: 'Australia',
        },
        totalAmount: calculatedTotal,
        subtotal: calculatedSubtotal,
        gst,
        shippingCost: shippingCost || 0,
        discountAmount: discountAmount || 0,
        couponCode: couponCode || null,
        status: status || 'DELIVERED',
        paymentStatus: paymentStatus || 'SUCCEEDED',
        notes: notes || null,
        installationDate: installationDate ? new Date(installationDate) : null,
        isGuest: true, // Manual orders are treated as guest orders
        createdAt: orderDate ? new Date(orderDate) : new Date(),
        deliveredAt: status === 'DELIVERED' ? (orderDate ? new Date(orderDate) : new Date()) : null,
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating manual order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

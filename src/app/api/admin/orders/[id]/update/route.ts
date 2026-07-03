import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// Middleware to verify admin
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'ADMIN' && userData?.role !== 'SUPER_ADMIN') {
    return null
  }

  return user
}

// PUT /api/admin/orders/[id]/update - Full order update
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
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
      items,
      totalAmount,
      subtotal,
      shippingCost,
      discountAmount,
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

    // Update the order in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Delete existing order items
      await tx.orderItem.deleteMany({
        where: { orderId: id },
      })

      // Update the order
      const order = await tx.order.update({
        where: { id },
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
          status: status || existingOrder.status,
          paymentStatus: paymentStatus || existingOrder.paymentStatus,
          notes: notes || null,
          installationDate: installationDate ? new Date(installationDate) : null,
          ...(orderDate && { createdAt: new Date(orderDate) }),
          ...(status === 'DELIVERED' && !existingOrder.deliveredAt && { deliveredAt: new Date() }),
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

      return order
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

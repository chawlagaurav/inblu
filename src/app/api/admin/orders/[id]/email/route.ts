import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { sendOrderConfirmationEmail } from '@/lib/email'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'ADMIN') return null

  return user
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { type } = body

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const shippingAddress = order.shippingAddress as {
      firstName: string
      lastName: string
      address: string
      apartment?: string
      city: string
      state: string
      postcode: string
      country: string
    }

    const emailData = {
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.email,
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shippingCost),
      gst: Number(order.gst),
      total: Number(order.totalAmount),
      shippingAddress,
      orderDate: order.createdAt,
      isGuest: order.isGuest,
    }

    if (type === 'confirmation') {
      await sendOrderConfirmationEmail(emailData)
    } else if (type === 'shipped') {
      // Send shipped notification (you can create a specific function for this)
      console.log('Sending shipped notification to:', order.email)
      // await sendShippedEmail(emailData, order.trackingNumber)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

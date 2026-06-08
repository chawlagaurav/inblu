import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Fetch the existing failed order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        paymentStatus: 'FAILED',
        OR: [{ userId: user.id }, { email: user.email ?? '' }],
      },
      include: {
        items: { include: { product: { select: { id: true, stock: true } } } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found or not eligible for retry' }, { status: 404 })
    }

    // Create a new Stripe payment intent for the same amount
    const amountCents = Math.round(Number(order.totalAmount) * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        userId: user.id,
        customerEmail: order.email,
        isRetry: 'true',
      },
      receipt_email: order.email,
    })

    // Reset order to PROCESSING so webhook can update it on success
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PROCESSING',
        stripePaymentIntent: paymentIntent.id,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error('Retry payment error:', error)
    return NextResponse.json({ error: 'Failed to create retry payment' }, { status: 500 })
  }
}

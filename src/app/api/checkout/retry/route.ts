import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { buildCheckoutMetadata, type CheckoutPayload } from '@/lib/checkout-intent'

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

    // Fetch the existing incomplete order. An order is eligible for payment retry
    // whenever it has not yet been paid: this covers explicitly FAILED payments as
    // well as orders the customer abandoned on the Stripe page (which stay PENDING
    // or PROCESSING because Stripe never fires payment_failed for an abandoned page).
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        status: 'PENDING',
        paymentStatus: { in: ['FAILED', 'PENDING', 'PROCESSING'] },
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

    // Carry the full order payload in metadata so the webhook can finalize the
    // retried order the same way as a fresh checkout. Idempotent on the new intent
    // id, which we also store on the order below, so it converges on this order.
    const retryPayload: CheckoutPayload = {
      userId: order.userId,
      email: order.email,
      customerName: order.customerName,
      phone: order.phone,
      isGuest: order.isGuest,
      isBacklog: order.isBacklog,
      couponCode: order.couponCode,
      subtotal: Number(order.subtotal),
      gst: Number(order.gst),
      shippingCost: Number(order.shippingCost),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      shippingAddress: order.shippingAddress as Record<string, unknown>,
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      reservationSessionId: order.id,
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      metadata: buildCheckoutMetadata(retryPayload),
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

    // Create a fresh stock reservation so the complete-payment page behaves like a
    // normal checkout (10-minute hold + countdown timer).
    const RESERVATION_DURATION_MINUTES = 10
    const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000)
    const sessionId = order.id

    await prisma.stockReservation.deleteMany({
      where: { sessionId, orderId: null },
    })
    await prisma.stockReservation.createMany({
      data: order.items.map(item => ({
        sessionId,
        productId: item.productId,
        quantity: item.quantity,
        expiresAt,
        orderId: null,
      })),
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
      reservationSessionId: sessionId,
      reservationExpiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Retry payment error:', error)
    return NextResponse.json({ error: 'Failed to create retry payment' }, { status: 500 })
  }
}

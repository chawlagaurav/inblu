import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'

/**
 * Cancel an in-progress checkout: release the stock reservation and cancel the
 * unpaid PaymentIntent. No order exists yet (deferred creation), so there is
 * nothing to delete — the customer's cart is kept client-side. Called from the
 * "cancel checkout" confirmation and, best-effort, from the tab-close beacon.
 */
export async function POST(request: NextRequest) {
  try {
    // Accept both JSON fetch bodies and sendBeacon (text) payloads.
    let reservationSessionId: string | undefined
    let paymentIntentId: string | undefined
    try {
      const body = await request.json()
      reservationSessionId = body.reservationSessionId
      paymentIntentId = body.paymentIntentId
    } catch {
      // ignore malformed/empty body
    }

    if (reservationSessionId) {
      await prisma.stockReservation.deleteMany({
        where: { sessionId: reservationSessionId, orderId: null },
      })
    }

    if (stripe && paymentIntentId) {
      try {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
        // Only cancel intents that haven't been paid/processed.
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(intent.status)) {
          await stripe.paymentIntents.cancel(paymentIntentId)
        }
      } catch (err) {
        // Intent may already be succeeded/canceled — nothing to do.
        console.error('Cancel payment intent failed (non-fatal):', err)
      }
    }

    return NextResponse.json({ cancelled: true })
  } catch (error) {
    console.error('Checkout cancel error:', error)
    return NextResponse.json({ error: 'Failed to cancel checkout' }, { status: 500 })
  }
}

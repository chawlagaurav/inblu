import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import stripe from '@/lib/stripe'
import {
  parseCheckoutMetadata,
  recordSucceededOrder,
  recordFailedOrder,
} from '@/lib/checkout-intent'

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment processing is not configured' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment succeeded:', paymentIntent.id)

      try {
        // The order is created here (deferred creation): build it from the intent
        // metadata, mark it paid, decrement stock and send confirmation emails.
        const payload = parseCheckoutMetadata(paymentIntent.metadata as Record<string, string>)
        if (!payload) {
          console.error('Missing checkout metadata for payment intent:', paymentIntent.id)
          break
        }

        const orderId = await recordSucceededOrder(payload, paymentIntent.id)
        console.log('Order processed successfully:', orderId)
      } catch (error) {
        console.error('Error processing payment_intent.succeeded:', error)
      }

      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id)

      try {
        // A real payment attempt failed → create the order as PENDING/FAILED so the
        // customer can retry it from their profile. (Pure abandonment never fires
        // this event, so it leaves no order.)
        const payload = parseCheckoutMetadata(paymentIntent.metadata as Record<string, string>)
        if (payload) {
          await recordFailedOrder(payload, paymentIntent.id)
        }
      } catch (error) {
        console.error('Error updating failed payment:', error)
      }

      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Checkout session completed:', session.id)
      // This is kept for backward compatibility if using Checkout Sessions
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

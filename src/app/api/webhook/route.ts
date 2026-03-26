import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email'

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
        // Find the order by payment intent ID
        const order = await prisma.order.findUnique({
          where: { stripePaymentIntent: paymentIntent.id },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        })

        if (!order) {
          console.error('Order not found for payment intent:', paymentIntent.id)
          break
        }

        // Update order status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'PROCESSING',
            paymentStatus: 'SUCCEEDED',
          },
        })

        // Update product stock
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        }

        // Parse shipping address
        const shippingAddress = order.shippingAddress as {
          firstName: string
          lastName: string
          address: string
          apartment?: string
          city: string
          state: string
          postcode: string
          country: string
          phone?: string
        }

        // Prepare email data
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
          shippingAddress: shippingAddress,
          orderDate: order.createdAt,
          isGuest: order.isGuest,
        }

        // Send confirmation email to customer
        await sendOrderConfirmationEmail(emailData)

        // Send admin notification
        await sendAdminOrderNotification(emailData)

        console.log('Order processed successfully:', order.id)
      } catch (error) {
        console.error('Error processing payment_intent.succeeded:', error)
      }

      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id)

      try {
        // Update order payment status to failed
        await prisma.order.updateMany({
          where: { stripePaymentIntent: paymentIntent.id },
          data: {
            paymentStatus: 'FAILED',
          },
        })
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

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email'

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${data.error_description || 'Unknown error'}`)
  }
  return data.access_token
}

// POST - Capture a PayPal order after approval
export async function POST(request: NextRequest) {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'PayPal is not configured' },
      { status: 503 }
    )
  }

  try {
    const { paypalOrderId, orderId } = await request.json()

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { error: 'PayPal order ID and order ID are required' },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()

    // Capture the payment
    const captureResponse = await fetch(
      `${PAYPAL_API_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const captureData = await captureResponse.json()

    if (!captureResponse.ok) {
      console.error('PayPal capture error:', JSON.stringify(captureData, null, 2))
      
      // Update order as failed
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED' },
      })

      return NextResponse.json(
        { error: 'Failed to capture PayPal payment' },
        { status: 500 }
      )
    }

    const captureStatus = captureData.status

    if (captureStatus === 'COMPLETED') {
      // Payment succeeded — update order
      const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'SUCCEEDED',
          status: 'PROCESSING',
          stripePaymentIntent: `paypal_capture_${captureId || paypalOrderId}`,
        },
      })

      // Reduce stock for each item
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      if (order) {
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }

        // Parse shipping address and send confirmation email
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

        // Send confirmation email to customer
        await sendOrderConfirmationEmail(emailData)

        // Send admin notification
        await sendAdminOrderNotification(emailData)
      }

      return NextResponse.json({
        status: 'COMPLETED',
        orderId,
        captureId,
      })
    } else {
      // Payment not completed
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PENDING' },
      })

      return NextResponse.json({
        status: captureStatus,
        orderId,
      })
    }
  } catch (error) {
    console.error('PayPal capture error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to capture PayPal payment' },
      { status: 500 }
    )
  }
}

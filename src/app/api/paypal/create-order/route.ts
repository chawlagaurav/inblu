import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

// POST - Create a PayPal order
export async function POST(request: NextRequest) {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'PayPal is not configured' },
      { status: 503 }
    )
  }

  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Fetch the existing order from the database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const accessToken = await getPayPalAccessToken()

    // Calculate item total from actual items (PayPal strictly validates this)
    const itemTotal = order.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    )
    const shippingCost = Number(order.shippingCost)
    const discountAmount = Number(order.discountAmount) || 0
    const totalAmount = Number(order.totalAmount)

    // Build breakdown — PayPal requires: total = item_total + shipping - discount
    const breakdown: Record<string, { currency_code: string; value: string }> = {
      item_total: {
        currency_code: 'AUD',
        value: itemTotal.toFixed(2),
      },
      shipping: {
        currency_code: 'AUD',
        value: shippingCost.toFixed(2),
      },
    }

    if (discountAmount > 0) {
      breakdown.discount = {
        currency_code: 'AUD',
        value: discountAmount.toFixed(2),
      }
    }

    const paypalOrder = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: order.id,
            description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
            amount: {
              currency_code: 'AUD',
              value: totalAmount.toFixed(2),
              breakdown,
            },
            items: order.items.map((item) => ({
              name: item.product.name,
              unit_amount: {
                currency_code: 'AUD',
                value: Number(item.price).toFixed(2),
              },
              quantity: item.quantity.toString(),
              category: 'PHYSICAL_GOODS',
            })),
            shipping: {
              name: {
                full_name: order.customerName,
              },
              address: {
                address_line_1: (order.shippingAddress as Record<string, string>).address,
                address_line_2: (order.shippingAddress as Record<string, string>).apartment || undefined,
                admin_area_2: (order.shippingAddress as Record<string, string>).city,
                admin_area_1: (order.shippingAddress as Record<string, string>).state,
                postal_code: (order.shippingAddress as Record<string, string>).postcode,
                country_code: 'AU',
              },
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'Inblu',
              shipping_preference: 'SET_PROVIDED_ADDRESS',
              user_action: 'PAY_NOW',
              return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/order/success?order_id=${order.id}`,
              cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout`,
            },
          },
        },
      }),
    })

    const paypalData = await paypalOrder.json()

    if (!paypalOrder.ok) {
      console.error('PayPal create order error:', JSON.stringify(paypalData, null, 2))
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: 500 }
      )
    }

    // Store the PayPal order ID on our order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeSessionId: `paypal_${paypalData.id}`, // Reuse this field for PayPal order ID
        paymentStatus: 'PROCESSING',
      },
    })

    return NextResponse.json({
      paypalOrderId: paypalData.id,
    })
  } catch (error) {
    console.error('PayPal create order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}

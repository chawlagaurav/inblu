import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import {
  buildCheckoutMetadata,
  parseCheckoutMetadata,
  recordSucceededOrder,
  type CheckoutPayload,
} from '@/lib/checkout-intent'

const SHIPPING_THRESHOLD = 100
const SHIPPING_COST = 995 // in cents
const GST_RATE = 0.1

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

interface ShippingAddress {
  firstName: string
  lastName: string
  address: string
  apartment?: string
  city: string
  state: string
  postcode: string
  country: string
  phone: string
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { items, shippingAddress, email, isGuest, couponCode, reservationSessionId } = body as {
      items: CartItem[]
      shippingAddress: ShippingAddress
      email: string
      isGuest?: boolean
      couponCode?: string | null
      reservationSessionId?: string
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    if (!email || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const productIds = items.map(item => item.productId)

    // ===== STOCK VALIDATION =====
    // Clean up expired reservations first
    const now = new Date()
    await prisma.stockReservation.deleteMany({
      where: {
        expiresAt: { lt: now },
        orderId: null
      }
    })

    // Get current stock for all products
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true, isActive: true, price: true }
    })

    // Get active reservations (excluding our session if we have one)
    const reservations = await prisma.stockReservation.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        expiresAt: { gt: now },
        orderId: null,
        ...(reservationSessionId ? { sessionId: { not: reservationSessionId } } : {})
      },
      _sum: {
        quantity: true
      }
    })

    const reservedMap = new Map(
      reservations.map(r => [r.productId, r._sum.quantity || 0])
    )

    // Check stock availability
    const unavailableItems: Array<{
      productId: string
      productName: string
      reason: string
      requested: number
      available: number
      isStockIssue: boolean // true if just a stock issue, false if product is missing/inactive
    }> = []

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      
      if (!product) {
        unavailableItems.push({
          productId: item.productId,
          productName: 'Unknown Product',
          reason: 'Product not found',
          requested: item.quantity,
          available: 0,
          isStockIssue: false
        })
        continue
      }

      if (!product.isActive) {
        unavailableItems.push({
          productId: item.productId,
          productName: product.name,
          reason: 'Product is no longer available',
          requested: item.quantity,
          available: 0,
          isStockIssue: false
        })
        continue
      }

      const reserved = reservedMap.get(item.productId) || 0
      const availableQuantity = Math.max(0, product.stock - reserved)

      if (availableQuantity < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          productName: product.name,
          reason: availableQuantity === 0 
            ? 'Out of stock' 
            : `Only ${availableQuantity} available`,
          requested: item.quantity,
          available: availableQuantity,
          isStockIssue: true // This is a stock issue, can be backlog
        })
      }
    }

    // Critical issues (product not found or inactive) should still reject the order
    const criticalIssues = unavailableItems.filter(item => !item.isStockIssue)
    if (criticalIssues.length > 0) {
      return NextResponse.json({
        error: 'Some items are no longer available',
        unavailableItems
      }, { status: 409 })
    }
    // ===== END STOCK VALIDATION =====

    // Get authenticated user if not guest
    let userId: string | null = null
    if (!isGuest) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user exists by ID or email
        let dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        
        if (!dbUser && user.email) {
          // Check if user exists by email (might have been created differently)
          dbUser = await prisma.user.findUnique({ where: { email: user.email } })
        }
        
        if (!dbUser) {
          // Create new user
          dbUser = await prisma.user.create({
            data: {
              id: user.id,
              email: user.email || email,
              role: 'CUSTOMER',
            },
          })
        }
        
        userId = dbUser.id
      }
    }

    // Create a map of product prices
    const productPriceMap = new Map(
      products.map(p => [p.id, Number(p.price)])
    )

    // Validate items and get prices (fallback to frontend price if not in DB - for development)
    const validatedItems = items.map(item => {
      const serverPrice = productPriceMap.get(item.productId)
      if (serverPrice === undefined) {
        // In production, you should throw an error here
        // For development with hardcoded products, use frontend price with warning
        console.warn(`Product ${item.productId} not found in database, using frontend price`)
        return {
          ...item,
          price: item.price,
        }
      }
      return {
        ...item,
        price: serverPrice, // Use server-side price
      }
    })

    // Calculate totals on server (never trust frontend prices)
    const subtotalCents = validatedItems.reduce(
      (sum, item) => sum + Math.round(item.price * 100 * item.quantity),
      0
    )
    const subtotalDollars = subtotalCents / 100

    const shippingCostCents = subtotalDollars >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
    const shippingCostDollars = shippingCostCents / 100

    // Validate and apply coupon if provided
    let discountCents = 0
    let validatedCouponCode: string | null = null

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      })

      if (coupon && coupon.isActive) {
        const now = new Date()
        const isDateValid = (!coupon.startDate || now >= coupon.startDate) && (!coupon.endDate || now <= coupon.endDate)
        const isUsageValid = coupon.maxUses === null || coupon.usedCount < coupon.maxUses
        const isMinAmountValid = coupon.minOrderAmount === null || subtotalDollars >= Number(coupon.minOrderAmount)

        if (isDateValid && isUsageValid && isMinAmountValid) {
          if (coupon.discountType === 'percentage') {
            discountCents = Math.round(subtotalCents * Number(coupon.discountValue) / 100)
            if (coupon.maxDiscountAmount !== null) {
              discountCents = Math.min(discountCents, Math.round(Number(coupon.maxDiscountAmount) * 100))
            }
          } else {
            discountCents = Math.min(Math.round(Number(coupon.discountValue) * 100), subtotalCents)
          }
          validatedCouponCode = coupon.code
          // NOTE: coupon usage is incremented only when payment actually succeeds
          // (see finalizePaidOrder), so abandoned checkouts don't consume coupons.
        }
      }
    }

    const discountDollars = discountCents / 100
    const afterDiscountCents = subtotalCents - discountCents
    const totalCents = afterDiscountCents + shippingCostCents
    const totalDollars = totalCents / 100

    // GST is included in the price (Australian standard)
    const gstDollars = totalDollars * GST_RATE / (1 + GST_RATE)
    const netSubtotal = totalDollars - gstDollars

    const customerName = `${shippingAddress.firstName} ${shippingAddress.lastName}`

    // Determine if this is a backlog order (has stock issues but no critical issues)
    const stockIssues = unavailableItems.filter(item => item.isStockIssue)
    const isBacklog = stockIssues.length > 0

    // We do NOT create an Order here. The order is only created once a payment is
    // actually attempted (Stripe webhook / PayPal capture), so abandoning the
    // payment page never leaves a stranded PENDING order. The full order payload is
    // carried in the PaymentIntent metadata instead.
    const sessionId = reservationSessionId || randomUUID()

    const checkoutPayload: CheckoutPayload = {
      userId,
      email,
      customerName,
      phone: shippingAddress.phone || null,
      isGuest: isGuest ?? !userId,
      isBacklog,
      couponCode: validatedCouponCode,
      subtotal: netSubtotal,
      gst: gstDollars,
      shippingCost: shippingCostDollars,
      discountAmount: discountDollars,
      totalAmount: totalDollars,
      shippingAddress: JSON.parse(JSON.stringify(shippingAddress)),
      items: validatedItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      reservationSessionId: sessionId,
    }

    // Create Stripe Payment Intent with automatic payment methods (includes Apple Pay, Google Pay, etc.)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'aud',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: buildCheckoutMetadata(checkoutPayload),
      receipt_email: email,
      shipping: {
        name: customerName,
        phone: shippingAddress.phone || '',
        address: {
          line1: shippingAddress.address,
          line2: shippingAddress.apartment || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postcode,
          country: 'AU',
        },
      },
    })

    // Create stock reservations for the payment page (keyed by the checkout session,
    // not an order — the order doesn't exist yet).
    const RESERVATION_DURATION_MINUTES = 10
    const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000)

    await prisma.stockReservation.deleteMany({
      where: { sessionId, orderId: null }
    })

    await prisma.stockReservation.createMany({
      data: validatedItems.map(item => ({
        sessionId,
        productId: item.productId,
        quantity: item.quantity,
        expiresAt,
        orderId: null // Will be cleaned up when payment succeeds
      }))
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      reservationSessionId: sessionId,
      reservationExpiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve order details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const paymentIntentId = searchParams.get('payment_intent')

    if (!orderId && !paymentIntentId) {
      return NextResponse.json({ error: 'Order ID or Payment Intent ID required' }, { status: 400 })
    }

    let order = await prisma.order.findFirst({
      where: orderId
        ? { id: orderId }
        : { stripePaymentIntent: paymentIntentId! },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Deferred-creation fallback: when looked up by payment intent and no order
    // exists yet (webhook not delivered, or success page raced it), inspect the
    // intent. If it succeeded, create the order now from its metadata; otherwise
    // report the in-flight payment status so the success page can react.
    if (!order && paymentIntentId && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        const payload = parseCheckoutMetadata(paymentIntent.metadata as Record<string, string>)

        if (payload && paymentIntent.status === 'succeeded') {
          const createdOrderId = await recordSucceededOrder(payload, paymentIntent.id)
          order = await prisma.order.findUnique({
            where: { id: createdOrderId },
            include: { items: { include: { product: true } } },
          })
        } else {
          // No order, payment not completed → tell the client it's pending/failed.
          return NextResponse.json({
            order: null,
            paymentStatus: paymentIntent.status,
          })
        }
      } catch (stripeError) {
        console.error('Failed to verify payment intent:', stripeError)
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fallback for an existing order whose webhook hasn't marked it paid yet.
    if (stripe && order.stripePaymentIntent &&
        (order.paymentStatus === 'PENDING' || order.paymentStatus === 'PROCESSING') &&
        !order.stripePaymentIntent.startsWith('paypal_')) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntent)
        const payload = parseCheckoutMetadata(paymentIntent.metadata as Record<string, string>)

        if (payload && paymentIntent.status === 'succeeded') {
          console.log('Webhook fallback: finalizing successful payment for order', order.id)
          await recordSucceededOrder(payload, paymentIntent.id)
          order = await prisma.order.findUnique({
            where: { id: order.id },
            include: { items: { include: { product: true } } },
          })
        }
      } catch (stripeError) {
        console.error('Failed to verify payment intent:', stripeError)
        // Continue to return the order even if Stripe check fails
      }
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve order' },
      { status: 500 }
    )
  }
}

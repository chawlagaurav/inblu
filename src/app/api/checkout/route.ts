import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePrice } from '@/lib/pricing'
import { getCouponEligibleItems } from '@/lib/coupon-eligibility'
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

    // Get current stock + pricing for all products. Including the discount
    // fields lets us compute the effective (charged) price server-side, so
    // a client can never bill themselves at a stale or tampered price.
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        stock: true,
        isActive: true,
        isSoldOut: true,
        price: true,
        isOnSale: true,
        discountPercent: true,
        salePrice: true,
        excludeFromCoupons: true,
      }
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

      // Sold-out flag is a deliberate admin override — independent of stock.
      // We block server-side too so a stale cart entry (added before the
      // toggle was flipped) can't be checked out.
      if (product.isSoldOut) {
        unavailableItems.push({
          productId: item.productId,
          productName: product.name,
          reason: `${product.name} is sold out`,
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

    // Build a pricing map keyed by product id. Each entry holds enough to
    // compute the effective (sale-aware) price via the same helper the
    // storefront uses, so cart-displayed totals and what we charge agree.
    // Also carries `name` and `excludeFromCoupons` so we can feed it directly
    // into the coupon-eligibility helper below without a second DB round-trip.
    const productPricingMap = new Map(
      products.map(p => [p.id, {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        isOnSale: p.isOnSale,
        discountPercent: p.discountPercent,
        salePrice: p.salePrice == null ? null : Number(p.salePrice),
        excludeFromCoupons: p.excludeFromCoupons,
      }])
    )

    // Resolve every cart line to its server-side effective price. A missing
    // product id means the cart references something we don't sell anymore —
    // reject rather than trust whatever the client posted.
    const validatedItems: CartItem[] = []
    for (const item of items) {
      const pricing = productPricingMap.get(item.productId)
      if (!pricing) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        )
      }
      validatedItems.push({
        ...item,
        price: getEffectivePrice(pricing),
      })
    }

    // Calculate totals on server (never trust frontend prices)
    const subtotalCents = validatedItems.reduce(
      (sum, item) => sum + Math.round(item.price * 100 * item.quantity),
      0
    )
    const subtotalDollars = subtotalCents / 100

    const shippingCostCents = subtotalDollars >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
    const shippingCostDollars = shippingCostCents / 100

    // Validate and apply coupon if provided. Discount is computed against the
    // ELIGIBLE subtotal (per `getCouponEligibleItems`) so a coupon never
    // discounts a product flagged `excludeFromCoupons` or one that the coupon's
    // own allow/deny lists exclude. Min-order is checked against the FULL
    // subtotal so customers with mixed carts can still hit the threshold.
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
          const eligibility = getCouponEligibleItems(
            items.map(i => ({ productId: i.productId, quantity: i.quantity })),
            {
              applicableProductIds: coupon.applicableProductIds,
              excludedProductIds: coupon.excludedProductIds,
            },
            productPricingMap,
          )

          // Soft-drop: if no item is eligible, the order proceeds at full price
          // rather than 4xx-rejecting the whole checkout. The cart re-validation
          // effect prevents this state in normal flow; this is defence-in-depth.
          if (eligibility.eligibleSubtotalCents > 0) {
            if (coupon.discountType === 'percentage') {
              discountCents = Math.round(eligibility.eligibleSubtotalCents * Number(coupon.discountValue) / 100)
              if (coupon.maxDiscountAmount !== null) {
                discountCents = Math.min(discountCents, Math.round(Number(coupon.maxDiscountAmount) * 100))
              }
            } else {
              discountCents = Math.min(
                Math.round(Number(coupon.discountValue) * 100),
                eligibility.eligibleSubtotalCents,
              )
            }
            validatedCouponCode = coupon.code
            // NOTE: coupon usage is incremented only when payment actually succeeds
            // (see finalizePaidOrder), so abandoned checkouts don't consume coupons.
          }
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

// Authorize access to an order's details (which include customer PII). A bare
// order id is NOT enough — the caller must prove they are the buyer via one of:
//   1. the PayPal capture/order token stored on the order (unguessable), or
//   2. the Stripe PaymentIntent client_secret (a buyer-only secret), or
//   3. an authenticated session that owns the order.
async function authorizeOrderAccess(
  order: { userId: string | null; email: string; stripePaymentIntent: string | null; stripeSessionId: string | null },
  proof: { clientSecret: string | null; paypalToken: string | null }
): Promise<boolean> {
  const { clientSecret, paypalToken } = proof

  // 1. PayPal token proof
  if (
    paypalToken &&
    (order.stripePaymentIntent === `paypal_capture_${paypalToken}` ||
      order.stripeSessionId === `paypal_${paypalToken}`)
  ) {
    return true
  }

  // 2. Stripe client_secret proof — prefix check first (cheap), then confirm the
  // secret is genuinely this intent's secret via Stripe (prevents forgery from a
  // known intent id).
  if (
    clientSecret &&
    stripe &&
    order.stripePaymentIntent &&
    !order.stripePaymentIntent.startsWith('paypal_') &&
    clientSecret.startsWith(`${order.stripePaymentIntent}_secret_`)
  ) {
    try {
      const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntent)
      if (pi.client_secret && pi.client_secret === clientSecret) return true
    } catch (err) {
      console.error('authz: failed to verify client secret', err)
    }
  }

  // 3. Authenticated owner
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user && (order.userId === user.id || (!!order.email && order.email === user.email))) {
      return true
    }
  } catch {
    // not authenticated
  }

  return false
}

// GET endpoint to retrieve order details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const paymentIntentId = searchParams.get('payment_intent')
    const clientSecret = searchParams.get('payment_intent_client_secret')
    const paypalToken = searchParams.get('paypal_token')

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
    // report the in-flight payment status so the success page can react. Access is
    // gated on holding the intent's client_secret (a buyer-only secret).
    if (!order && paymentIntentId && stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

        if (!clientSecret || paymentIntent.client_secret !== clientSecret) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

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

    // Don't leak customer PII to anyone who merely knows an order id.
    const authorized = await authorizeOrderAccess(order, { clientSecret, paypalToken })
    if (!authorized) {
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

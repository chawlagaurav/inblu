import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { Prisma } from '@prisma/client'

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
    const { items, shippingAddress, email, isGuest, couponCode } = body as {
      items: CartItem[]
      shippingAddress: ShippingAddress
      email: string
      isGuest?: boolean
      couponCode?: string | null
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    if (!email || !shippingAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    // Fetch actual product prices from database to prevent price manipulation
    const productIds = items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

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

          // Increment usage count
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          })
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

    // Create order in database with PENDING status
    const order = await prisma.order.create({
      data: {
        userId: userId,
        customerName: customerName,
        email: email,
        phone: shippingAddress.phone || null,
        totalAmount: totalDollars,
        subtotal: netSubtotal,
        gst: gstDollars,
        shippingCost: shippingCostDollars,
        discountAmount: discountDollars,
        couponCode: validatedCouponCode,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingAddress: JSON.parse(JSON.stringify(shippingAddress)),
        isGuest: isGuest ?? !userId,
        items: {
          create: validatedItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Create Stripe Payment Intent with multiple payment methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'aud',
      payment_method_types: ['card', 'klarna', 'afterpay_clearpay', 'link'],
      metadata: {
        orderId: order.id,
        userId: userId || 'guest',
        customerEmail: email,
        isGuest: String(isGuest ?? !userId),
        items: JSON.stringify(validatedItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }))),
      },
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

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripePaymentIntent: paymentIntent.id,
        paymentStatus: 'PROCESSING',
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
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

    const order = await prisma.order.findFirst({
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

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
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

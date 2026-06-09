import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email'

/**
 * Helpers for the "defer order creation until payment is attempted" flow.
 *
 * No Order row is created when the customer reaches the payment page. Instead the
 * full order payload is stored in the Stripe PaymentIntent's metadata. The Order is
 * only created when a payment is actually attempted:
 *   - Stripe success  -> webhook / success-page fallback creates a SUCCEEDED order
 *   - Stripe failure   -> webhook creates a PENDING order with FAILED payment (retryable)
 *   - PayPal           -> create-order builds the order from the same metadata
 *
 * If the customer just closes the tab without attempting payment, no order ever
 * exists and their cart items are kept client-side so they can check out again.
 */

export interface CheckoutItemPayload {
  productId: string
  quantity: number
  price: number
}

export interface CheckoutPayload {
  userId: string | null
  email: string
  customerName: string
  phone: string | null
  isGuest: boolean
  isBacklog: boolean
  couponCode: string | null
  subtotal: number
  gst: number
  shippingCost: number
  discountAmount: number
  totalAmount: number
  shippingAddress: Record<string, unknown>
  items: CheckoutItemPayload[]
  reservationSessionId: string
}

// Stripe metadata values are capped at 500 chars each; keep items/address compact.
export function buildCheckoutMetadata(payload: CheckoutPayload): Record<string, string> {
  return {
    userId: payload.userId ?? '',
    email: payload.email,
    customerName: payload.customerName,
    phone: payload.phone ?? '',
    isGuest: String(payload.isGuest),
    isBacklog: String(payload.isBacklog),
    couponCode: payload.couponCode ?? '',
    subtotal: payload.subtotal.toString(),
    gst: payload.gst.toString(),
    shippingCost: payload.shippingCost.toString(),
    discountAmount: payload.discountAmount.toString(),
    totalAmount: payload.totalAmount.toString(),
    addr: JSON.stringify(payload.shippingAddress),
    items: JSON.stringify(
      payload.items.map(i => ({ p: i.productId, q: i.quantity, r: i.price }))
    ),
    sid: payload.reservationSessionId,
  }
}

type RawMetadata = Record<string, string> | null | undefined

export function parseCheckoutMetadata(metadata: RawMetadata): CheckoutPayload | null {
  if (!metadata || !metadata.email || !metadata.items || !metadata.addr) {
    return null
  }
  try {
    const items = (JSON.parse(metadata.items) as Array<{ p: string; q: number; r: number }>).map(
      i => ({ productId: i.p, quantity: i.q, price: i.r })
    )
    return {
      userId: metadata.userId || null,
      email: metadata.email,
      customerName: metadata.customerName || '',
      phone: metadata.phone || null,
      isGuest: metadata.isGuest === 'true',
      isBacklog: metadata.isBacklog === 'true',
      couponCode: metadata.couponCode || null,
      subtotal: Number(metadata.subtotal),
      gst: Number(metadata.gst),
      shippingCost: Number(metadata.shippingCost),
      discountAmount: Number(metadata.discountAmount),
      totalAmount: Number(metadata.totalAmount),
      shippingAddress: JSON.parse(metadata.addr),
      items,
      reservationSessionId: metadata.sid || '',
    }
  } catch (err) {
    console.error('Failed to parse checkout metadata:', err)
    return null
  }
}

/**
 * Create the Order row from a checkout payload if it doesn't already exist.
 * Idempotent on `stripePaymentIntent` (paymentRef), so the webhook, the success-page
 * fallback and concurrent calls all converge on a single order.
 */
async function upsertOrder(
  payload: CheckoutPayload,
  opts: {
    paymentRef: string
    status: 'PENDING' | 'PROCESSING'
    paymentStatus: 'PENDING' | 'PROCESSING' | 'FAILED' | 'SUCCEEDED'
    stripeSessionId?: string | null
  }
): Promise<{ orderId: string; created: boolean }> {
  const existing = await prisma.order.findUnique({
    where: { stripePaymentIntent: opts.paymentRef },
    select: { id: true },
  })
  if (existing) {
    return { orderId: existing.id, created: false }
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: payload.userId,
        customerName: payload.customerName,
        email: payload.email,
        phone: payload.phone,
        totalAmount: payload.totalAmount,
        subtotal: payload.subtotal,
        gst: payload.gst,
        shippingCost: payload.shippingCost,
        discountAmount: payload.discountAmount,
        couponCode: payload.couponCode,
        status: opts.status,
        paymentStatus: opts.paymentStatus,
        isBacklog: payload.isBacklog,
        isGuest: payload.isGuest,
        stripePaymentIntent: opts.paymentRef,
        stripeSessionId: opts.stripeSessionId ?? null,
        shippingAddress: payload.shippingAddress as Prisma.InputJsonValue,
        items: {
          create: payload.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      select: { id: true },
    })
    return { orderId: order.id, created: true }
  } catch (err) {
    // Unique violation: another call created it first — converge on that row.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const order = await prisma.order.findUnique({
        where: { stripePaymentIntent: opts.paymentRef },
        select: { id: true },
      })
      if (order) return { orderId: order.id, created: false }
    }
    throw err
  }
}

/** Side effects that must run exactly once when an order becomes paid. */
async function finalizePaidOrder(orderId: string, payload: CheckoutPayload) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  })
  if (!order) return

  // Decrement stock
  for (const item of order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  // Link & clean up reservations for this checkout session
  if (payload.reservationSessionId) {
    await prisma.stockReservation.deleteMany({
      where: { sessionId: payload.reservationSessionId, orderId: null },
    })
  }

  // Consume the coupon only now that payment actually succeeded
  if (order.couponCode) {
    await prisma.coupon.updateMany({
      where: { code: order.couponCode },
      data: { usedCount: { increment: 1 } },
    })
  }

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

  await sendOrderConfirmationEmail(emailData).catch(err =>
    console.error('Failed to send order confirmation:', err)
  )
  await sendAdminOrderNotification(emailData).catch(err =>
    console.error('Failed to send admin notification:', err)
  )
}

/**
 * Record a successful payment: create the order if needed and run the paid-order
 * side effects exactly once (guarded by an atomic status transition).
 * `paymentRef` is the unique reference stored on the order (Stripe intent id, or a
 * `paypal_capture_*` id). Returns the order id.
 */
export async function recordSucceededOrder(
  payload: CheckoutPayload,
  paymentRef: string,
  opts?: { stripeSessionId?: string | null }
): Promise<string> {
  const { orderId } = await upsertOrder(payload, {
    paymentRef,
    status: 'PROCESSING',
    paymentStatus: 'PROCESSING',
    stripeSessionId: opts?.stripeSessionId,
  })

  // Atomically claim the SUCCEEDED transition so side effects run only once.
  const claim = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { not: 'SUCCEEDED' } },
    data: { status: 'PROCESSING', paymentStatus: 'SUCCEEDED' },
  })

  if (claim.count === 1) {
    await finalizePaidOrder(orderId, payload)
  }

  return orderId
}

/**
 * Create a not-yet-paid order for a payment attempt that is in progress (used by
 * PayPal create-order, where the order must exist before capture). Idempotent.
 */
export async function recordPendingOrder(
  payload: CheckoutPayload,
  paymentRef: string,
  stripeSessionId?: string | null
): Promise<string> {
  const { orderId } = await upsertOrder(payload, {
    paymentRef,
    status: 'PROCESSING',
    paymentStatus: 'PROCESSING',
    stripeSessionId,
  })
  return orderId
}

/**
 * Record a failed payment attempt: create the order as PENDING/FAILED so the
 * customer can retry it from their profile. Never downgrades an already-paid order.
 */
export async function recordFailedOrder(
  payload: CheckoutPayload,
  paymentRef: string
): Promise<string> {
  const { orderId } = await upsertOrder(payload, {
    paymentRef,
    status: 'PENDING',
    paymentStatus: 'FAILED',
  })
  return orderId
}

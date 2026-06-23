import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  if (dbUser?.role !== 'ADMIN') return null
  return user
}

interface RouteParams {
  params: Promise<{ email: string }>
}

/**
 * GET /api/admin/customers/[email]
 *
 * Returns the consolidated customer history for a single email. Works for
 * both registered customers (matched on `User.email`) and guest customers
 * (no User row — synthesized from order history). The route param is the
 * URL-encoded email; we match it case-insensitively against everything.
 *
 * Service requests are matched by email exactly because the ServiceRequest
 * model isn't FK-linked to User — a request can come from a guest who never
 * placed an order via the registered account, or from someone whose request
 * was filed before they registered.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email: rawEmail } = await params
    const email = decodeURIComponent(rawEmail).toLowerCase().trim()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Look up the registered customer if one exists. We use `findFirst` with a
    // case-insensitive match because emails in the DB aren't normalised on write.
    const registered = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    })

    // Pull the most recent paid orders for this email — covers both the
    // registered (via Order.userId) and guest paths because Order also carries
    // `email` directly. Filtering on `email` is the union of both.
    const recentOrders = await prisma.order.findMany({
      where: {
        email: { equals: email, mode: 'insensitive' },
        paymentStatus: 'SUCCEEDED',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        customerName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    })

    const recentServiceRequests = await prisma.serviceRequest.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        ticketNumber: true,
        serviceType: true,
        productName: true,
        status: true,
        priority: true,
        scheduledDate: true,
        completedAt: true,
        createdAt: true,
      },
    })

    // Pull a fallback name/phone from the most recent order if the customer
    // isn't registered — guests have no User row but we still want to render
    // something useful in the header.
    let displayName = registered?.name ?? ''
    let displayPhone = registered?.phone ?? ''
    if (!registered) {
      const latestOrder = await prisma.order.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        select: { customerName: true, phone: true },
      })
      displayName = latestOrder?.customerName ?? ''
      displayPhone = latestOrder?.phone ?? ''
    }

    // If we have neither a registered User nor any order/service-request rows,
    // the email doesn't correspond to a customer at all.
    if (!registered && recentOrders.length === 0 && recentServiceRequests.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      customer: {
        email,
        name: displayName,
        phone: displayPhone,
        registered: !!registered,
        joinedAt: registered?.createdAt.toISOString() ?? null,
      },
      recentOrders: recentOrders.map((o) => ({
        ...o,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt.toISOString(),
      })),
      recentServiceRequests: recentServiceRequests.map((sr) => ({
        ...sr,
        createdAt: sr.createdAt.toISOString(),
        scheduledDate: sr.scheduledDate?.toISOString() ?? null,
        completedAt: sr.completedAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    console.error('Error fetching customer detail:', error)
    return NextResponse.json({ error: 'Failed to load customer' }, { status: 500 })
  }
}

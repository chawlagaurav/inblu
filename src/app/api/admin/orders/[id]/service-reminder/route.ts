import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { sendServiceReminderEmail } from '@/lib/email'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'ADMIN') return null
  return user
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { select: { name: true, serviceTenureMonths: true } } },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status !== 'DELIVERED' || !order.deliveredAt) {
    return NextResponse.json({ error: 'Order has not been delivered yet' }, { status: 400 })
  }

  const success = await sendServiceReminderEmail({
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.email,
    items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
    dueDate: body.dueDate || order.deliveredAt.toISOString(),
    daysLeft: body.daysLeft ?? 0,
  })

  if (!success) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

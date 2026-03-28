import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { OrdersList } from '@/components/admin/orders-list'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Orders - Admin',
  description: 'Manage your orders',
}

export default async function AdminOrdersPage() {
  const [orders, orderStats] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
        user: true,
      },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  const totalCount = orders.length
  const statCounts = {
    all: totalCount,
    PENDING: orderStats.find((s) => s.status === 'PENDING')?._count || 0,
    PROCESSING: orderStats.find((s) => s.status === 'PROCESSING')?._count || 0,
    SHIPPED: orderStats.find((s) => s.status === 'SHIPPED')?._count || 0,
    DELIVERED: orderStats.find((s) => s.status === 'DELIVERED')?._count || 0,
    CANCELLED: orderStats.find((s) => s.status === 'CANCELLED')?._count || 0,
  }

  // Serialize Decimal and Date for client component
  const serializedOrders = orders.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    email: o.email,
    phone: o.phone,
    totalAmount: Number(o.totalAmount),
    status: o.status,
    paymentStatus: o.paymentStatus,
    isGuest: o.isGuest,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      price: Number(i.price),
      product: { name: i.product.name },
    })),
    shippingAddress: o.shippingAddress as Record<string, string> | null,
    user: o.user ? { name: o.user.name, email: o.user.email } : null,
  }))

  return <OrdersList orders={serializedOrders} statCounts={statCounts} />
}

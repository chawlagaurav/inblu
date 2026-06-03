import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { OrdersList } from '@/components/admin/orders-list'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Orders - Admin',
  description: 'Manage your orders',
}

export default async function AdminOrdersPage() {
  const [orders, orderStats, backlogCount] = await Promise.all([
    prisma.order.findMany({
      where: {
        paymentStatus: 'SUCCEEDED', // Only show orders with successful payment
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { name: true, serviceTenureMonths: true } } },
        },
        user: true,
      },
    }),
    prisma.order.groupBy({
      where: {
        paymentStatus: 'SUCCEEDED', // Only count orders with successful payment
      },
      by: ['status'],
      _count: true,
    }),
    prisma.order.count({
      where: {
        paymentStatus: 'SUCCEEDED',
        isBacklog: true,
      },
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
    BACKLOG: backlogCount,
  }

  // Serialize Decimal and Date for client component
  const serializedOrders = orders.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    email: o.email,
    phone: o.phone,
    totalAmount: Number(o.totalAmount),
    shippingCost: Number(o.shippingCost),
    discountAmount: Number(o.discountAmount),
    status: o.status,
    paymentStatus: o.paymentStatus,
    isGuest: o.isGuest,
    createdAt: o.createdAt.toISOString(),
    deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : null,
    serviceDueDate: o.serviceDueDate ? o.serviceDueDate.toISOString() : null,
    notes: o.notes,
    installationDate: o.installationDate ? o.installationDate.toISOString() : null,
    isBacklog: o.isBacklog,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      quantity: i.quantity,
      price: Number(i.price),
      product: { name: i.product.name, serviceTenureMonths: i.product.serviceTenureMonths },
    })),
    shippingAddress: o.shippingAddress as Record<string, string> | null,
    user: o.user ? { name: o.user.name, email: o.user.email } : null,
  }))

  return <OrdersList orders={serializedOrders} statCounts={statCounts} />
}

import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'
import { DashboardStats } from '@/components/admin/dashboard-stats'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Manage your store',
}

// Enable dynamic rendering but cache the data
export const dynamic = 'force-dynamic'

// Cache dashboard data for 30 seconds
const getCachedDashboardData = unstable_cache(
  async () => {
    // Run all independent queries in parallel
    const [
      orders,
      customers,
      lowStockProducts,
      recentOrders,
      orderStatuses,
      topProductItems,
      purchaseOrders,
    ] = await Promise.all([
      // Get all orders for filtering (only paid orders)
      prisma.order.findMany({
        where: { paymentStatus: 'SUCCEEDED' },
        select: {
          id: true,
          customerName: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Get all customers
      prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: { id: true, createdAt: true },
      }),
      // Low stock products
      prisma.product.findMany({
        where: { stock: { lte: 5 } },
        orderBy: { stock: 'asc' },
        take: 5,
        select: { id: true, name: true, category: true, stock: true },
      }),
      // Recent orders (only paid orders)
      prisma.order.findMany({
        where: { paymentStatus: 'SUCCEEDED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          customerName: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      }),
      // Order statuses (only paid orders)
      prisma.order.groupBy({
        where: { paymentStatus: 'SUCCEEDED' },
        by: ['status'],
        _count: { status: true },
      }),
      // Top products
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Purchase orders
      prisma.purchaseOrder.findMany({
        select: {
          id: true,
          totalCost: true,
          createdAt: true,
        },
      }),
    ])

    // Fetch all top product details in one query instead of N+1
    const productIds = topProductItems.map(item => item.productId)
    const products = productIds.length > 0 
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, price: true },
        })
      : []
    
    const productMap = new Map(products.map(p => [p.id, p]))
    const topProducts = topProductItems.map(item => {
      const product = productMap.get(item.productId)
      return {
        name: product?.name || 'Unknown Product',
        quantity: item._sum.quantity || 0,
        revenue: (item._sum.quantity || 0) * Number(product?.price || 0),
      }
    })

    return {
      orders: orders.map(o => ({
        id: o.id,
        customerName: o.customerName,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      customers: customers.map(c => ({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
      })),
      purchaseOrders: purchaseOrders.map(po => ({
        id: po.id,
        totalCost: Number(po.totalCost),
        createdAt: po.createdAt.toISOString(),
      })),
      topProducts,
      orderStatuses,
      lowStockProducts,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        customerName: o.customerName,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
    }
  },
  ['admin-dashboard'],
  { revalidate: 30, tags: ['admin-dashboard'] }
)

export default async function AdminDashboard() {
  const data = await getCachedDashboardData()

  return (
    <DashboardStats
      orders={data.orders}
      customers={data.customers}
      purchaseOrders={data.purchaseOrders}
      lowStockProducts={data.lowStockProducts}
      topProducts={data.topProducts}
      orderStatuses={data.orderStatuses}
      recentOrders={data.recentOrders}
    />
  )
}

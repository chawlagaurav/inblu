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
      expenses,
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
      // Customers — sourced from paid orders rather than the User table so the
      // count includes guest checkouts (which have no User row). We project
      // (email, createdAt) and dedupe by lowercased email in JS so the same
      // person counts once whether they checked out as guest or registered.
      prisma.order.findMany({
        where: { paymentStatus: 'SUCCEEDED' },
        select: { email: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
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
      // Top products - only from paid orders, with actual sale data
      prisma.orderItem.findMany({
        where: {
          order: { paymentStatus: 'SUCCEEDED' },
        },
        select: {
          productId: true,
          quantity: true,
          price: true,
          product: { select: { id: true, name: true } },
        },
      }),
      // Purchase orders (legacy — superseded by Expense ledger which already
      // includes PO-linked rows. Kept for the existing chart, will be removed
      // once we're sure nothing else reads `data.purchaseOrders`).
      prisma.purchaseOrder.findMany({
        select: {
          id: true,
          totalCost: true,
          createdAt: true,
        },
      }),
      // Expenses (manual + PO-linked) — drives the dashboard P&L. Filtered by
      // `date` (admin-entered) on the client to match the existing date-range
      // selector pattern.
      prisma.expense.findMany({
        select: {
          id: true,
          date: true,
          category: true,
          amount: true,
          sourceType: true,
        },
      }),
    ])

    // Aggregate top products in JS: sum quantity and revenue (price × qty) per product
    const productAggMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    for (const item of topProductItems) {
      const existing = productAggMap.get(item.productId)
      const qty = item.quantity
      const rev = Number(item.price) * qty
      if (existing) {
        existing.quantity += qty
        existing.revenue += rev
      } else {
        productAggMap.set(item.productId, {
          name: item.product.name,
          quantity: qty,
          revenue: rev,
        })
      }
    }
    const topProducts = Array.from(productAggMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Dedupe customers by lowercased email, keeping the earliest order date.
    // The dashboard then bucketizes by `createdAt` to compute "new customers
    // in the selected period", treating each unique email as one customer.
    const firstOrderByEmail = new Map<string, Date>()
    for (const o of customers) {
      const key = o.email.toLowerCase()
      const existing = firstOrderByEmail.get(key)
      if (!existing || o.createdAt < existing) {
        firstOrderByEmail.set(key, o.createdAt)
      }
    }

    return {
      orders: orders.map(o => ({
        id: o.id,
        customerName: o.customerName,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      customers: Array.from(firstOrderByEmail.entries()).map(([email, createdAt]) => ({
        id: email,
        createdAt: createdAt.toISOString(),
      })),
      purchaseOrders: purchaseOrders.map(po => ({
        id: po.id,
        totalCost: Number(po.totalCost),
        createdAt: po.createdAt.toISOString(),
      })),
      expenses: expenses.map(e => ({
        id: e.id,
        date: e.date.toISOString(),
        category: e.category,
        amount: Number(e.amount),
        sourceType: e.sourceType,
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
      expenses={data.expenses}
      lowStockProducts={data.lowStockProducts}
      topProducts={data.topProducts}
      orderStatuses={data.orderStatuses}
      recentOrders={data.recentOrders}
    />
  )
}

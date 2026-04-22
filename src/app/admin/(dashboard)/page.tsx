import { Metadata } from 'next'
import Link from 'next/link'
import { Package, ShoppingCart, ShoppingBag, Users, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, AlertTriangle, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import prisma from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Manage your store',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

async function getDashboardData() {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    thisMonthOrders,
    lastMonthOrders,
    newCustomersThisMonth,
    newCustomersLastMonth,
    lowStockProducts,
    recentOrders,
    orderStatuses,
    topProductItems,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: thisMonth } },
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: lastMonth, lte: lastMonthEnd } },
    }),
    prisma.user.count({ where: { createdAt: { gte: thisMonth }, role: 'CUSTOMER' } }),
    prisma.user.count({ where: { createdAt: { gte: lastMonth, lte: lastMonthEnd }, role: 'CUSTOMER' } }),
    prisma.product.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: 'asc' },
      take: 5,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: { include: { product: true } } },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ])

  // Revenue
  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const revenueChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 100

  // Order count
  const thisMonthOrderCount = thisMonthOrders.length
  const lastMonthOrderCount = lastMonthOrders.length
  const orderChange = lastMonthOrderCount > 0
    ? ((thisMonthOrderCount - lastMonthOrderCount) / lastMonthOrderCount) * 100
    : 100

  // Customers
  const customerChange = newCustomersLastMonth > 0
    ? ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100
    : 100

  // Avg order value
  const avgOrderValue = thisMonthOrderCount > 0 ? thisMonthRevenue / thisMonthOrderCount : 0
  const lastAvgOrderValue = lastMonthOrderCount > 0 ? lastMonthRevenue / lastMonthOrderCount : 0
  const avgOrderChange = lastAvgOrderValue > 0
    ? ((avgOrderValue - lastAvgOrderValue) / lastAvgOrderValue) * 100
    : 100

  // Daily revenue (last 7 days)
  const dailyRevenue = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    const dayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } },
    })
    dailyRevenue.push({
      date: startOfDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      orders: dayOrders.length,
    })
  }

  // Top selling products
  const topProducts = await Promise.all(
    topProductItems.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, price: true },
      })
      return {
        name: product?.name || 'Unknown Product',
        quantity: item._sum.quantity || 0,
        revenue: (item._sum.quantity || 0) * Number(product?.price || 0),
      }
    })
  )

  return {
    thisMonthRevenue,
    revenueChange,
    thisMonthOrderCount,
    orderChange,
    newCustomersThisMonth,
    customerChange,
    avgOrderValue,
    avgOrderChange,
    dailyRevenue,
    topProducts,
    orderStatuses,
    lowStockProducts,
    recentOrders,
  }
}

function ChangeBadge({ value }: { value: number }) {
  if (value >= 0) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
        <ArrowUpRight className="h-3 w-3 mr-1" />
        {Math.abs(value).toFixed(1)}%
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-red-100 text-red-700">
      <ArrowDownRight className="h-3 w-3 mr-1" />
      {Math.abs(value).toFixed(1)}%
    </Badge>
  )
}

export default async function AdminDashboard() {
  const data = await getDashboardData()
  const maxRevenue = Math.max(...data.dailyRevenue.map(d => d.revenue), 1)
  const maxStatusCount = Math.max(...data.orderStatuses.map(s => s._count.status), 1)

  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome to your admin dashboard</p>
        </div>
      </FadeIn>

      {/* KPI Cards with month-over-month trends */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">Revenue (This Month)</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(data.thisMonthRevenue)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <ChangeBadge value={data.revenueChange} />
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">Orders (This Month)</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{data.thisMonthOrderCount}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <ChangeBadge value={data.orderChange} />
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">New Customers</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{data.newCustomersThisMonth}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <ChangeBadge value={data.customerChange} />
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">Avg Order Value</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(data.avgOrderValue)}</p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <ChangeBadge value={data.avgOrderChange} />
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Revenue (Last 7 Days)</CardTitle>
              <CardDescription>Daily revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.dailyRevenue.map((day, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 shrink-0">{day.date}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-20 text-right">
                      {formatCurrency(day.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Order Status */}
        <FadeIn delay={0.15}>
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Distribution of order statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.orderStatuses.map((status) => (
                  <div key={status.status} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 shrink-0">
                      {statusLabels[status.status] || status.status}
                    </span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          status.status === 'DELIVERED' ? 'bg-green-500' :
                          status.status === 'CANCELLED' ? 'bg-red-400' :
                          status.status === 'SHIPPED' ? 'bg-purple-500' :
                          status.status === 'PROCESSING' ? 'bg-blue-500' :
                          'bg-amber-400'
                        }`}
                        style={{ width: `${(status._count.status / maxStatusCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-8 text-right">
                      {status._count.status}
                    </span>
                  </div>
                ))}
                {data.orderStatuses.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Middle Row: Top Products + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performers by quantity sold</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No sales data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-blue-600 w-6">#{index + 1}</span>
                        <div>
                          <p className="font-medium text-slate-900">{product.name}</p>
                          <p className="text-sm text-slate-500">{product.quantity} units sold</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(product.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Low Stock Alerts */}
        <FadeIn delay={0.25}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Low Stock Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/products">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.lowStockProducts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">All products are well stocked</p>
              ) : (
                <div className="space-y-3">
                  {data.lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.category}</p>
                      </div>
                      <Badge variant={product.stock === 0 ? 'destructive' : 'secondary'}>
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Recent Orders */}
      <FadeIn delay={0.3}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      <p className="text-sm text-slate-500">{formatDate(order.createdAt.toISOString())}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(Number(order.totalAmount))}</span>
                      <Badge className={statusColors[order.status]}>{order.status}</Badge>
                      <Eye className="h-4 w-4 text-slate-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

import { Metadata } from 'next'
import { TrendingUp, DollarSign, ShoppingBag, Users, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import prisma from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Analytics - Admin',
  description: 'View store analytics and insights',
}

async function getAnalyticsData() {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  // These could be used for additional analytics in the future
  // const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  // const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // This month's orders
  const thisMonthOrders = await prisma.order.findMany({
    where: { createdAt: { gte: thisMonth } },
    include: { items: true },
  })

  // Last month's orders
  const lastMonthOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: lastMonth, lte: lastMonthEnd },
    },
  })

  // Calculate revenue
  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const revenueChange = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 100

  // Order counts
  const thisMonthOrderCount = thisMonthOrders.length
  const lastMonthOrderCount = lastMonthOrders.length
  const orderChange = lastMonthOrderCount > 0
    ? ((thisMonthOrderCount - lastMonthOrderCount) / lastMonthOrderCount) * 100
    : 100

  // New customers this month
  const newCustomersThisMonth = await prisma.user.count({
    where: { createdAt: { gte: thisMonth }, role: 'CUSTOMER' },
  })
  const newCustomersLastMonth = await prisma.user.count({
    where: { createdAt: { gte: lastMonth, lte: lastMonthEnd }, role: 'CUSTOMER' },
  })
  const customerChange = newCustomersLastMonth > 0
    ? ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100
    : 100

  // Average order value
  const avgOrderValue = thisMonthOrderCount > 0 ? thisMonthRevenue / thisMonthOrderCount : 0
  const lastAvgOrderValue = lastMonthOrderCount > 0 ? lastMonthRevenue / lastMonthOrderCount : 0
  const avgOrderChange = lastAvgOrderValue > 0
    ? ((avgOrderValue - lastAvgOrderValue) / lastAvgOrderValue) * 100
    : 100

  // Daily revenue for chart (last 7 days)
  const dailyRevenue = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    
    const dayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
    })
    
    dailyRevenue.push({
      date: startOfDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      orders: dayOrders.length,
    })
  }

  // Top selling products
  const orderItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  })

  const topProducts = await Promise.all(
    orderItems.map(async (item) => {
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

  // Order status breakdown
  const orderStatuses = await prisma.order.groupBy({
    by: ['status'],
    _count: { status: true },
  })

  // Products low on stock
  const lowStockCount = await prisma.product.count({
    where: { stock: { lte: 10 } },
  })

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
    lowStockCount,
  }
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData()
  const maxRevenue = Math.max(...data.dailyRevenue.map(d => d.revenue), 1)

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Track your store performance</p>
        </div>
      </FadeIn>

      {/* KPI Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">Revenue (This Month)</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatCurrency(data.thisMonthRevenue)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {data.revenueChange >= 0 ? (
                  <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {Math.abs(data.revenueChange).toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    {Math.abs(data.revenueChange).toFixed(1)}%
                  </Badge>
                )}
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
                <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-sky-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {data.orderChange >= 0 ? (
                  <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {Math.abs(data.orderChange).toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    {Math.abs(data.orderChange).toFixed(1)}%
                  </Badge>
                )}
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
                {data.customerChange >= 0 ? (
                  <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {Math.abs(data.customerChange).toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    {Math.abs(data.customerChange).toFixed(1)}%
                  </Badge>
                )}
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
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatCurrency(data.avgOrderValue)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {data.avgOrderChange >= 0 ? (
                  <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {Math.abs(data.avgOrderChange).toFixed(1)}%
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    {Math.abs(data.avgOrderChange).toFixed(1)}%
                  </Badge>
                )}
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

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
                        className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-500"
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

        {/* Order Status Breakdown */}
        <FadeIn delay={0.15}>
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Current order distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.orderStatuses.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No orders yet</p>
                ) : (
                  data.orderStatuses.map((status) => {
                    const total = data.orderStatuses.reduce((sum, s) => sum + s._count.status, 0)
                    const percentage = total > 0 ? (status._count.status / total) * 100 : 0
                    
                    const statusColors: Record<string, string> = {
                      PENDING: 'bg-amber-500',
                      PROCESSING: 'bg-blue-500',
                      SHIPPED: 'bg-purple-500',
                      DELIVERED: 'bg-green-500',
                      CANCELLED: 'bg-red-500',
                      REFUNDED: 'bg-slate-500',
                    }

                    return (
                      <div key={status.status} className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 w-24 shrink-0 capitalize">
                          {status.status.toLowerCase()}
                        </span>
                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${statusColors[status.status] || 'bg-sky-500'} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 w-12 text-right">
                          {status._count.status}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

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
                <p className="text-slate-500 text-center py-8">No sales data yet</p>
              ) : (
                <div className="space-y-4">
                  {data.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-sky-600">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.quantity} sold</p>
                      </div>
                      <p className="font-medium text-green-600">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Quick Stats */}
        <FadeIn delay={0.25}>
          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
              <CardDescription>Items that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-900">Low Stock Items</p>
                      <p className="text-sm text-amber-700">Products with 10 or fewer units</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-200 text-amber-800">
                    {data.lowStockCount}
                  </Badge>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <a 
                      href="/admin/products?filter=low-stock" 
                      className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                      <Package className="h-4 w-4" />
                      View low stock
                    </a>
                    <a 
                      href="/admin/orders?status=PENDING" 
                      className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Pending orders
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}

import { Metadata } from 'next'
import Link from 'next/link'
import { Package, ShoppingCart, Users, DollarSign, ArrowUpRight, AlertTriangle, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default async function AdminDashboard() {
  // Fetch real data from database
  const [
    totalOrders,
    totalRevenue,
    totalCustomers,
    totalProducts,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: 'SUCCEEDED' }
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count(),
    prisma.product.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: 'asc' },
      take: 5,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: {
          include: { product: true }
        }
      }
    }),
  ])

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(Number(totalRevenue._sum.totalAmount || 0)),
      icon: DollarSign,
      href: '/admin/orders',
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingCart,
      href: '/admin/orders',
    },
    {
      title: 'Total Products',
      value: totalProducts.toString(),
      icon: Package,
      href: '/admin/products',
    },
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      icon: Users,
      href: '/admin/customers',
    },
  ]

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome to your admin dashboard</p>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StaggerItem key={stat.title}>
            <Link href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-sky-600" />
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <FadeIn delay={0.1}>
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
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">All products are well stocked</p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
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

        {/* Recent Orders */}
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/orders">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <Link 
                      key={order.id} 
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{order.customerName}</p>
                        <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">{formatCurrency(Number(order.totalAmount))}</p>
                        <Badge className={statusColors[order.status]}>
                          {order.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}

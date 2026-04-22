import { Metadata } from 'next'
import Link from 'next/link'
import { Search, Mail, Phone, ShoppingBag, DollarSign, Users, UserX, Download, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import prisma from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Customers - Admin',
  description: 'Manage your customers',
}

interface PageProps {
  searchParams: Promise<{ search?: string; type?: string }>
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const searchQuery = params.search
  const typeFilter = params.type || 'all'

  // Get registered customers with their order stats
  const registeredCustomers = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      ...(searchQuery ? {
        OR: [
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { name: { contains: searchQuery, mode: 'insensitive' } },
        ]
      } : {}),
    },
    include: {
      orders: {
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          shippingAddress: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get guest customers from orders
  const guestOrders = await prisma.order.findMany({
    where: {
      isGuest: true,
      ...(searchQuery ? {
        OR: [
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { customerName: { contains: searchQuery, mode: 'insensitive' } },
        ]
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group guest orders by email
  const guestCustomersMap = new Map<string, {
    email: string
    name: string
    phone: string | null
    orders: typeof guestOrders
    totalSpent: number
    address: Record<string, string> | null
  }>()

  guestOrders.forEach(order => {
    const existing = guestCustomersMap.get(order.email)
    if (existing) {
      existing.orders.push(order)
      existing.totalSpent += Number(order.totalAmount)
    } else {
      guestCustomersMap.set(order.email, {
        email: order.email,
        name: order.customerName,
        phone: order.phone,
        orders: [order],
        totalSpent: Number(order.totalAmount),
        address: order.shippingAddress as Record<string, string> | null,
      })
    }
  })

  const guestCustomers = Array.from(guestCustomersMap.values())

  // Calculate totals
  const totalRegistered = registeredCustomers.length
  const totalGuests = guestCustomers.length

  const allCustomers = typeFilter === 'registered' 
    ? registeredCustomers.map(c => ({
        type: 'registered' as const,
        id: c.id,
        email: c.email,
        name: c.name || c.email.split('@')[0],
        phone: c.phone,
        orderCount: c.orders.length,
        totalSpent: c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
        lastOrder: c.orders[0]?.createdAt,
        createdAt: c.createdAt,
        address: (c.orders[0]?.shippingAddress as Record<string, string> | null) || null,
      }))
    : typeFilter === 'guests'
    ? guestCustomers.map(c => ({
        type: 'guest' as const,
        id: c.email,
        email: c.email,
        name: c.name,
        phone: c.phone,
        orderCount: c.orders.length,
        totalSpent: c.totalSpent,
        lastOrder: c.orders[0]?.createdAt,
        createdAt: c.orders[c.orders.length - 1]?.createdAt,
        address: c.address,
      }))
    : [
        ...registeredCustomers.map(c => ({
          type: 'registered' as const,
          id: c.id,
          email: c.email,
          name: c.name || c.email.split('@')[0],
          phone: c.phone,
          orderCount: c.orders.length,
          totalSpent: c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
          lastOrder: c.orders[0]?.createdAt,
          createdAt: c.createdAt,
          address: (c.orders[0]?.shippingAddress as Record<string, string> | null) || null,
        })),
        ...guestCustomers.map(c => ({
          type: 'guest' as const,
          id: c.email,
          email: c.email,
          name: c.name,
          phone: c.phone,
          orderCount: c.orders.length,
          totalSpent: c.totalSpent,
          lastOrder: c.orders[0]?.createdAt,
          createdAt: c.orders[c.orders.length - 1]?.createdAt,
          address: c.address,
        })),
      ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-500 mt-1">Manage your customers</p>
          </div>
          <a
            href={`/api/admin/customers/export?${new URLSearchParams({
              ...(searchQuery ? { search: searchQuery } : {}),
              ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
            }).toString()}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </a>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalRegistered + totalGuests}</p>
                <p className="text-sm text-slate-500">Total Customers</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalRegistered}</p>
                <p className="text-sm text-slate-500">Registered</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <UserX className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalGuests}</p>
                <p className="text-sm text-slate-500">Guest Customers</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Filter Tabs */}
      <FadeIn delay={0.05}>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Customers' },
            { key: 'registered', label: 'Registered' },
            { key: 'guests', label: 'Guests' },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/customers${tab.key === 'all' ? '' : `?type=${tab.key}`}`}
            >
              <Badge
                variant={typeFilter === tab.key || (!params.type && tab.key === 'all') ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
              >
                {tab.label}
              </Badge>
            </Link>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>Customer List</CardTitle>
              <form className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  name="search"
                  placeholder="Search by name or email..." 
                  className="pl-10"
                  defaultValue={searchQuery}
                />
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {allCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No customers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Orders</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Total Spent</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Shipping Address</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{customer.name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <p className="text-sm text-slate-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </p>
                            {customer.phone && (
                              <p className="text-sm text-slate-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={customer.type === 'registered' ? 'secondary' : 'outline'}>
                            {customer.type === 'registered' ? 'Registered' : 'Guest'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-sm text-slate-600">
                            <ShoppingBag className="h-4 w-4" />
                            {customer.orderCount}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 font-medium text-slate-900">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            {formatCurrency(customer.totalSpent)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {customer.address ? (
                            <div className="text-sm text-slate-600 max-w-[200px]">
                              <p className="truncate">{customer.address.address}</p>
                              {customer.address.apartment && <p className="truncate">{customer.address.apartment}</p>}
                              <p className="truncate text-slate-400">
                                {[customer.address.city, customer.address.state, customer.address.postcode].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">&mdash;</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {customer.lastOrder ? formatDate(customer.lastOrder) : 'No orders'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, ShoppingBag, Wrench, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/motion'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface OrderSummary {
  id: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

interface ServiceRequestSummary {
  id: string
  ticketNumber: string
  serviceType: string
  productName: string | null
  status: string
  priority: string
  scheduledDate: string | null
  completedAt: string | null
  createdAt: string
}

interface CustomerDetail {
  customer: {
    email: string
    name: string
    phone: string
    registered: boolean
    joinedAt: string | null
  }
  recentOrders: OrderSummary[]
  recentServiceRequests: ServiceRequestSummary[]
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })

// Colors picked to match the existing admin order/service status badges.
const orderStatusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
}
const serviceStatusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SCHEDULED: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ email: string }>
}) {
  const { email: rawEmail } = use(params)
  const email = decodeURIComponent(rawEmail)

  const [data, setData] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          toast.error(body.error || 'Failed to load customer')
          return
        }
        const body = (await res.json()) as CustomerDetail
        if (!cancelled) setData(body)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [email])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/admin05/customers" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to customers
        </Link>
        <p className="text-slate-500">Customer not found.</p>
      </div>
    )
  }

  const { customer, recentOrders, recentServiceRequests } = data
  const fallbackName = customer.name || customer.email.split('@')[0]

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link
          href="/admin05/customers"
          className="inline-flex items-center text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to customers
        </Link>
      </FadeIn>

      {/* Header card */}
      <FadeIn delay={0.05}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 truncate">{fallbackName}</h1>
                  <Badge variant={customer.registered ? 'default' : 'secondary'}>
                    {customer.registered ? 'Registered' : 'Guest'}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {customer.email}
                  </span>
                  {customer.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {customer.phone}
                    </span>
                  )}
                </div>
                {customer.joinedAt && (
                  <p className="text-xs text-slate-400 mt-2">
                    Joined {formatDate(customer.joinedAt)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Two parallel sections */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                Orders (last 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No orders yet</p>
              ) : (
                <ul className="space-y-2">
                  {recentOrders.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/admin05/orders/${order.id}`}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-blue-200 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge className={orderStatusColor[order.status] ?? 'bg-slate-100 text-slate-700'}>
                            {order.status}
                          </Badge>
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Service Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-5 w-5 text-blue-600" />
                Service Requests (last 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentServiceRequests.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No service requests yet</p>
              ) : (
                <ul className="space-y-2">
                  {recentServiceRequests.map((sr) => (
                    <li
                      key={sr.id}
                      className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            #{sr.ticketNumber}
                          </p>
                          <p className="text-xs text-slate-500">
                            {sr.serviceType.replace(/_/g, ' ')}
                            {sr.productName ? ` · ${sr.productName}` : ''}
                          </p>
                        </div>
                        <Badge
                          className={`flex-shrink-0 ${serviceStatusColor[sr.status] ?? 'bg-slate-100 text-slate-700'}`}
                        >
                          {sr.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {sr.completedAt
                          ? `Completed ${formatDate(sr.completedAt)}`
                          : sr.scheduledDate
                          ? `Scheduled ${formatDate(sr.scheduledDate)}`
                          : `Logged ${formatDate(sr.createdAt)}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {recentServiceRequests.length > 0 && (
                <div className="mt-3 text-right">
                  <Link
                    href="/admin05/service-requests"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View all service requests →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeIn>
    </div>
  )
}

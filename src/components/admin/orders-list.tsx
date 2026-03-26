'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  Eye,
  Download,
  Filter,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SUCCEEDED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-700',
}

type SortField = 'date' | 'total' | 'customer' | 'status'
type SortDir = 'asc' | 'desc'

interface OrderItem {
  id: string
  quantity: number
  price: string | number
  product: { name: string }
}

interface Order {
  id: string
  customerName: string
  email: string
  phone: string | null
  totalAmount: string | number
  status: string
  paymentStatus: string
  isGuest: boolean
  createdAt: string
  items: OrderItem[]
  user: { name: string | null; email: string } | null
}

interface StatCounts {
  all: number
  PENDING: number
  PROCESSING: number
  SHIPPED: number
  DELIVERED: number
  CANCELLED: number
}

interface OrdersListProps {
  orders: Order[]
  statCounts: StatCounts
  currentStatus?: string
  currentSearch?: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function OrdersList({ orders, statCounts, currentStatus, currentSearch }: OrdersListProps) {
  const [search, setSearch] = useState(currentSearch || '')
  const [statusFilter, setStatusFilter] = useState(currentStatus || 'all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [guestFilter, setGuestFilter] = useState<'all' | 'guest' | 'registered'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [exporting, setExporting] = useState(false)

  // Client-side filtering for instant feedback
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      )
    }

    // Status
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter)
    }

    // Payment status
    if (paymentFilter !== 'all') {
      result = result.filter((o) => o.paymentStatus === paymentFilter)
    }

    // Date range
    if (dateFrom) {
      result = result.filter((o) => new Date(o.createdAt) >= new Date(dateFrom))
    }
    if (dateTo) {
      result = result.filter((o) => new Date(o.createdAt) <= new Date(dateTo + 'T23:59:59.999Z'))
    }

    // Guest filter
    if (guestFilter === 'guest') {
      result = result.filter((o) => o.isGuest)
    } else if (guestFilter === 'registered') {
      result = result.filter((o) => !o.isGuest)
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'date':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'total':
          cmp = Number(a.totalAmount) - Number(b.totalAmount)
          break
        case 'customer':
          cmp = a.customerName.localeCompare(b.customerName)
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [orders, search, statusFilter, paymentFilter, dateFrom, dateTo, guestFilter, sortField, sortDir])

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDir('desc')
      }
    },
    [sortField]
  )

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-slate-400" />
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 ml-1 text-sky-600" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 ml-1 text-sky-600" />
    )
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setDateFrom('')
    setDateTo('')
    setGuestFilter('all')
  }

  const hasActiveFilters =
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    guestFilter !== 'all'

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter)
      if (search) params.set('search', search)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const response = await fetch(`/api/admin/orders/export?${params.toString()}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'orders-export.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export orders. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">
            Manage customer orders &middot; {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || filteredOrders.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'all', label: 'All Orders', count: statCounts.all },
          { key: 'PENDING', label: 'Pending', count: statCounts.PENDING },
          { key: 'PROCESSING', label: 'Processing', count: statCounts.PROCESSING },
          { key: 'SHIPPED', label: 'Shipped', count: statCounts.SHIPPED },
          { key: 'DELIVERED', label: 'Delivered', count: statCounts.DELIVERED },
          { key: 'CANCELLED', label: 'Cancelled', count: statCounts.CANCELLED },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
          >
            <Badge
              variant={statusFilter === tab.key ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5 transition-colors"
            >
              {tab.label} ({tab.count})
            </Badge>
          </button>
        ))}
      </div>

      {/* Search + Filter Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <CardTitle className="text-lg">
                {statusFilter !== 'all' ? `${statusFilter} Orders` : 'All Orders'}
              </CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, or order ID..."
                    className="pl-10 pr-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-sky-50 border-sky-300 text-sky-700' : ''}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1.5 bg-sky-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {[
                        paymentFilter !== 'all',
                        dateFrom !== '',
                        dateTo !== '',
                        guestFilter !== 'all',
                      ].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="border-t pt-4 mt-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Payment Status
                    </label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    >
                      <option value="all">All Payments</option>
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SUCCEEDED">Succeeded</option>
                      <option value="FAILED">Failed</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </div>

                  {/* Customer Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Customer Type
                    </label>
                    <select
                      value={guestFilter}
                      onChange={(e) => setGuestFilter(e.target.value as 'all' | 'guest' | 'registered')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    >
                      <option value="all">All Customers</option>
                      <option value="registered">Registered</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>

                  {/* Date From */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      From Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      To Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                      Showing {filteredOrders.length} of {orders.length} orders
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-2">No orders found</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sky-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                      Order
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-900 cursor-pointer select-none hover:text-sky-600"
                      onClick={() => handleSort('customer')}
                    >
                      <span className="inline-flex items-center">
                        Customer
                        <SortIcon field="customer" />
                      </span>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                      Items
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-900 cursor-pointer select-none hover:text-sky-600"
                      onClick={() => handleSort('total')}
                    >
                      <span className="inline-flex items-center">
                        Total
                        <SortIcon field="total" />
                      </span>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                      Payment
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-900 cursor-pointer select-none hover:text-sky-600"
                      onClick={() => handleSort('status')}
                    >
                      <span className="inline-flex items-center">
                        Status
                        <SortIcon field="status" />
                      </span>
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-900 cursor-pointer select-none hover:text-sky-600"
                      onClick={() => handleSort('date')}
                    >
                      <span className="inline-flex items-center">
                        Date
                        <SortIcon field="date" />
                      </span>
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-sky-50 hover:bg-sky-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-slate-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        {order.isGuest && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Guest
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-slate-900">
                          {order.customerName}
                        </p>
                        <p className="text-sm text-slate-500">{order.email}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">
                        {formatCurrency(Number(order.totalAmount))}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={paymentStatusColors[order.paymentStatus]}>
                          {order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[order.status]}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

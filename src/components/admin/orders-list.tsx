'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  Mail,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { AddOrderModal } from './add-order-modal'
import { maxServiceableTenure, addMonths } from '@/lib/service-due'

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
  productId: string
  quantity: number
  price: string | number
  product: { name: string; serviceTenureMonths: number; isServiceable: boolean }
}

interface Order {
  id: string
  customerName: string
  email: string
  phone: string | null
  totalAmount: string | number
  purchasePrice: number | null
  margin: number | null
  marginPercent: number | null
  costSource: 'po-asof' | 'po-latest' | 'manual' | 'none'
  shippingCost: number
  discountAmount: number
  status: string
  paymentStatus: string
  isGuest: boolean
  isBacklog: boolean
  createdAt: string
  deliveredAt: string | null
  serviceDueDate: string | null
  notes: string | null
  installationDate: string | null
  shippingAddress: Record<string, string> | null
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
  BACKLOG: number
}

interface OrdersListProps {
  orders: Order[]
  statCounts: StatCounts
  currentStatus?: string
  currentSearch?: string
}

// Short labels for where an order's purchase cost came from (fallback chain).
const COST_SOURCE_LABEL: Record<Order['costSource'], string> = {
  'po-asof': 'PO cost',
  'po-latest': 'latest PO',
  manual: 'manual cost',
  none: '',
}
const COST_SOURCE_TOOLTIP: Record<Order['costSource'], string> = {
  'po-asof': 'Purchase-order unit cost as of the order date',
  'po-latest': 'Most recent purchase-order unit cost (order predates PO history)',
  manual: 'Manually set product cost price (no PO cost available)',
  none: 'No cost available',
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
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch || '')
  const [statusFilter, setStatusFilter] = useState(currentStatus || 'all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [showAddOrderModal, setShowAddOrderModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [guestFilter, setGuestFilter] = useState<'all' | 'guest' | 'registered'>('all')
  const [backlogFilter, setBacklogFilter] = useState<'all' | 'backlog' | 'regular'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [exporting, setExporting] = useState(false)
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  // Reconciliation kicks off a server sweep over every flagged backlog order
  // and clears any whose stock has caught up. Used to clean up orders that
  // pre-date the per-PO auto-clear logic; harmless to re-run.
  const [reconciling, setReconciling] = useState(false)

  function getServiceDueInfo(order: Order): { daysLeft: number | null; dueDate: Date | null; label: string; color: string } {
    // Use serviceDueDate if set, otherwise calculate from delivery date
    let dueDate: Date | null = null
    
    if (order.serviceDueDate) {
      dueDate = new Date(order.serviceDueDate)
    } else if (order.status === 'DELIVERED' && order.deliveredAt) {
      // Fallback: calculate from delivery date using the max tenure of the
      // serviceable items only. Consumables (filter kits, spares) are excluded;
      // an order with no serviceable items gets no service-due date.
      const maxTenure = maxServiceableTenure(
        order.items.map((i) => ({
          serviceTenureMonths: i.product.serviceTenureMonths,
          isServiceable: i.product.isServiceable,
        }))
      )
      if (maxTenure != null) {
        dueDate = addMonths(new Date(order.deliveredAt), maxTenure)
      }
    }
    
    if (!dueDate) {
      return { daysLeft: null, dueDate: null, label: '—', color: '' }
    }
    
    const now = new Date()
    const diffMs = dueDate.getTime() - now.getTime()
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) {
      return { daysLeft, dueDate, label: `Overdue by ${Math.abs(daysLeft)}d`, color: 'bg-red-100 text-red-700' }
    }
    if (daysLeft <= 30) {
      return { daysLeft, dueDate, label: `Due in ${daysLeft}d`, color: 'bg-amber-100 text-amber-700' }
    }
    return { daysLeft, dueDate, label: `${daysLeft}d left`, color: 'bg-green-100 text-green-700' }
  }

  const handleSendServiceReminder = async (order: Order) => {
    setSendingEmailFor(order.id)
    try {
      const serviceInfo = getServiceDueInfo(order)
      const response = await fetch(`/api/admin/orders/${order.id}/service-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: serviceInfo.dueDate?.toISOString(),
          daysLeft: serviceInfo.daysLeft,
        }),
      })
      if (!response.ok) throw new Error('Failed to send email')
      toast.success(`Service reminder sent to ${order.email}`)
    } catch {
      toast.error('Failed to send service reminder email')
    } finally {
      setSendingEmailFor(null)
    }
  }

  const handleDeleteOrder = async (orderId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete order for ${customerName}? This action cannot be undone.`)) {
      return
    }

    setDeletingOrderId(orderId)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete order')
      }
      toast.success('Order deleted successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete order')
    } finally {
      setDeletingOrderId(null)
    }
  }
  

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

    // Backlog filter
    if (backlogFilter === 'backlog') {
      result = result.filter((o) => o.isBacklog)
    } else if (backlogFilter === 'regular') {
      result = result.filter((o) => !o.isBacklog)
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
  }, [orders, search, statusFilter, paymentFilter, dateFrom, dateTo, guestFilter, backlogFilter, sortField, sortDir])

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
      <ChevronUp className="h-3.5 w-3.5 ml-1 text-blue-600" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 ml-1 text-blue-600" />
    )
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setDateFrom('')
    setDateTo('')
    setGuestFilter('all')
    setBacklogFilter('all')
  }

  const hasActiveFilters =
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    guestFilter !== 'all' ||
    backlogFilter !== 'all'

  // Sweep every flagged backlog order and clear any whose stock has caught
  // up (every item's product.stock >= 0). One-time cleanup for orders that
  // pre-date the per-PO auto-clear; idempotent if re-run.
  const handleReconcileBacklog = async () => {
    setReconciling(true)
    try {
      const res = await fetch('/api/admin/orders/reconcile-backlog', { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to reconcile backlog orders')
      }
      const clearedCount = Array.isArray(data?.cleared) ? data.cleared.length : 0
      const scanned = typeof data?.scanned === 'number' ? data.scanned : 0
      if (clearedCount === 0) {
        toast.success(
          scanned === 0
            ? 'No backlog orders to reconcile.'
            : `Scanned ${scanned} backlog ${scanned === 1 ? 'order' : 'orders'} — all still short on stock.`,
        )
      } else {
        toast.success(
          `Cleared backlog tag on ${clearedCount} ${clearedCount === 1 ? 'order' : 'orders'}.`,
        )
        // Refresh the server-rendered list so the badges disappear without a
        // manual reload. The page is `force-dynamic` so a router.refresh()
        // hits the DB.
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reconcile backlog orders')
    } finally {
      setReconciling(false)
    }
  }

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
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setShowAddOrderModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Order
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || filteredOrders.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </div>
      </div>

      {/* Add/Edit Order Modal */}
      <AddOrderModal
        isOpen={showAddOrderModal || !!editingOrder}
        onClose={() => {
          setShowAddOrderModal(false)
          setEditingOrder(null)
        }}
        onSuccess={() => router.refresh()}
        editOrder={editingOrder ? {
          id: editingOrder.id,
          customerName: editingOrder.customerName,
          email: editingOrder.email,
          phone: editingOrder.phone,
          shippingAddress: editingOrder.shippingAddress,
          notes: editingOrder.notes,
          installationDate: editingOrder.installationDate,
          status: editingOrder.status,
          paymentStatus: editingOrder.paymentStatus,
          shippingCost: editingOrder.shippingCost,
          discountAmount: editingOrder.discountAmount,
          items: editingOrder.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: Number(item.price),
            product: { name: item.product.name },
          })),
          createdAt: editingOrder.createdAt,
        } : null}
      />

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
        {/* Backlog Tab */}
        <button
          onClick={() => setBacklogFilter(backlogFilter === 'backlog' ? 'all' : 'backlog')}
        >
          <Badge
            variant={backlogFilter === 'backlog' ? 'default' : 'outline'}
            className={`cursor-pointer px-3 py-1.5 transition-colors ${backlogFilter === 'backlog' ? 'bg-amber-500' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}`}
          >
            Backlog ({statCounts.BACKLOG})
          </Badge>
        </button>
        {/* Reconcile-backlog action: only shown when at least one order is
            currently flagged. Hidden otherwise to keep the toolbar quiet. */}
        {statCounts.BACKLOG > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconcileBacklog}
            disabled={reconciling}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
            title="Clear backlog tag on orders whose stock has already been replenished"
          >
            {reconciling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            )}
            Reconcile
          </Button>
        )}
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
                  className={showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1.5 bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {[
                        paymentFilter !== 'all',
                        dateFrom !== '',
                        dateTo !== '',
                        guestFilter !== 'all',
                        backlogFilter !== 'all',
                      ].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="border-t pt-4 mt-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Payment Status
                    </label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Customers</option>
                      <option value="registered">Registered</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>

                  {/* Backlog Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Order Type
                    </label>
                    <select
                      value={backlogFilter}
                      onChange={(e) => setBacklogFilter(e.target.value as 'all' | 'backlog' | 'regular')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Orders</option>
                      <option value="backlog">Backlog Only</option>
                      <option value="regular">Regular Only</option>
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
                        className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <tr className="border-b border-blue-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                      Order
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-900 cursor-pointer select-none hover:text-blue-600"
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
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-900 cursor-pointer select-none hover:text-blue-600"
                      onClick={() => handleSort('total')}
                    >
                      <span className="inline-flex items-center">
                        Selling Price
                        <SortIcon field="total" />
                      </span>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                      Purchase Price
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                      Margin
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                      Payment
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-900 cursor-pointer select-none hover:text-blue-600"
                      onClick={() => handleSort('status')}
                    >
                      <span className="inline-flex items-center">
                        Status
                        <SortIcon field="status" />
                      </span>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                      Shipping Address
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                      Service Due
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-900 cursor-pointer select-none hover:text-blue-600"
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
                      className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-slate-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {order.isGuest && (
                            <Badge variant="outline" className="text-xs">
                              Guest
                            </Badge>
                          )}
                          {order.isBacklog && (
                            <Badge className="text-xs bg-amber-100 text-amber-700">
                              Backlog
                            </Badge>
                          )}
                        </div>
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
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {order.purchasePrice == null ? (
                          '—'
                        ) : (
                          <div className="flex flex-col">
                            <span>{formatCurrency(order.purchasePrice)}</span>
                            <span className="text-[10px] uppercase tracking-wide text-slate-400" title={COST_SOURCE_TOOLTIP[order.costSource]}>
                              {COST_SOURCE_LABEL[order.costSource]}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {order.margin == null ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span className={order.margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(order.margin)}
                            {order.marginPercent != null && (
                              <span className="text-slate-400 font-normal"> ({order.marginPercent.toFixed(0)}%)</span>
                            )}
                          </span>
                        )}
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
                      <td className="py-3 px-4">
                        {order.shippingAddress ? (
                          <div className="text-sm text-slate-600 max-w-[200px]">
                            <p className="truncate">{order.shippingAddress.address}</p>
                            {order.shippingAddress.apartment && <p className="truncate">{order.shippingAddress.apartment}</p>}
                            <p className="truncate text-slate-400">
                              {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postcode].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      {(() => {
                        const serviceInfo = getServiceDueInfo(order)
                        return (
                          <td className="py-3 px-4">
                            {serviceInfo.dueDate !== null ? (
                              <div className="space-y-1">
                                <p className="text-sm text-slate-600">
                                  {new Intl.DateTimeFormat('en-AU', { dateStyle: 'medium' }).format(serviceInfo.dueDate)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${serviceInfo.color}`}>
                                    {serviceInfo.label}
                                  </span>
                                  {serviceInfo.daysLeft !== null && serviceInfo.daysLeft <= 30 && (
                                    <button
                                      onClick={() => handleSendServiceReminder(order)}
                                      disabled={sendingEmailFor === order.id}
                                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                      title="Send service reminder email"
                                    >
                                      {sendingEmailFor === order.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Mail className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                          </td>
                        )
                      })()}
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin05/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingOrder(order)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id, order.customerName)}
                            disabled={deletingOrderId === order.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingOrderId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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

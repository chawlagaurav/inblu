'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Eye,
  Wallet,
  Calendar,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EXPENSE_SOURCE_PURCHASE_ORDER } from '@/lib/expense-categories'

interface Order {
  id: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

interface Customer {
  id: string
  createdAt: string
}

interface Expense {
  id: string
  date: string
  category: string
  amount: number
  sourceType: string | null
}

interface LowStockProduct {
  id: string
  name: string
  category: string
  stock: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

interface OrderStatus {
  status: string
  _count: { status: number }
}

interface DashboardStatsProps {
  orders: Order[]
  customers: Customer[]
  expenses: Expense[]
  lowStockProducts: LowStockProduct[]
  topProducts: TopProduct[]
  orderStatuses: OrderStatus[]
  recentOrders: Order[]
}

type DatePreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'all_time' | 'custom'

const presetLabels: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_year: 'This Year',
  all_time: 'All Time',
  custom: 'Custom Range',
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

function getDateRange(preset: DatePreset, customFrom?: string, customTo?: string): { from: Date; to: Date; compareFrom: Date; compareTo: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let from: Date
  let to: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  let compareFrom: Date
  let compareTo: Date

  switch (preset) {
    case 'today':
      from = today
      compareFrom = new Date(today)
      compareFrom.setDate(compareFrom.getDate() - 1)
      compareTo = new Date(compareFrom)
      compareTo.setHours(23, 59, 59, 999)
      break
    case 'yesterday':
      from = new Date(today)
      from.setDate(from.getDate() - 1)
      to = new Date(from)
      to.setHours(23, 59, 59, 999)
      compareFrom = new Date(from)
      compareFrom.setDate(compareFrom.getDate() - 1)
      compareTo = new Date(compareFrom)
      compareTo.setHours(23, 59, 59, 999)
      break
    case 'this_week':
      from = new Date(today)
      from.setDate(from.getDate() - from.getDay())
      compareFrom = new Date(from)
      compareFrom.setDate(compareFrom.getDate() - 7)
      compareTo = new Date(from)
      compareTo.setDate(compareTo.getDate() - 1)
      compareTo.setHours(23, 59, 59, 999)
      break
    case 'last_week':
      from = new Date(today)
      from.setDate(from.getDate() - from.getDay() - 7)
      to = new Date(from)
      to.setDate(to.getDate() + 6)
      to.setHours(23, 59, 59, 999)
      compareFrom = new Date(from)
      compareFrom.setDate(compareFrom.getDate() - 7)
      compareTo = new Date(compareFrom)
      compareTo.setDate(compareTo.getDate() + 6)
      compareTo.setHours(23, 59, 59, 999)
      break
    case 'this_month':
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      compareFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      compareTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      break
    case 'last_month':
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      compareFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      compareTo = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999)
      break
    case 'this_year':
      from = new Date(now.getFullYear(), 0, 1)
      compareFrom = new Date(now.getFullYear() - 1, 0, 1)
      compareTo = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
      break
    case 'all_time':
      from = new Date(2000, 0, 1) // Far in the past
      compareFrom = new Date(2000, 0, 1)
      compareTo = new Date(2000, 0, 1)
      break
    case 'custom':
      from = customFrom ? new Date(customFrom) : today
      to = customTo ? new Date(customTo + 'T23:59:59.999') : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
      compareFrom = new Date(from)
      compareFrom.setDate(compareFrom.getDate() - diffDays)
      compareTo = new Date(from)
      compareTo.setDate(compareTo.getDate() - 1)
      compareTo.setHours(23, 59, 59, 999)
      break
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      compareFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      compareTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  }

  return { from, to, compareFrom, compareTo }
}

function ChangeBadge({ value, reverse = false }: { value: number; reverse?: boolean }) {
  // For most metrics (revenue, orders) up is good. For expense-style metrics
  // pass `reverse` so a rise renders red and a drop green.
  const isPositive = reverse ? value <= 0 : value >= 0
  if (isPositive) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
        {value >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
        {Math.abs(value).toFixed(1)}%
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-red-100 text-red-700">
      {value >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
      {Math.abs(value).toFixed(1)}%
    </Badge>
  )
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export function DashboardStats({
  orders,
  customers,
  expenses,
  lowStockProducts,
  topProducts,
  orderStatuses,
  recentOrders,
}: DashboardStatsProps) {
  const [preset, setPreset] = useState<DatePreset>('all_time')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const stats = useMemo(() => {
    const { from, to, compareFrom, compareTo } = getDateRange(preset, customFrom, customTo)

    // Filter orders for the selected period
    const periodOrders = orders.filter((o) => {
      const d = new Date(o.createdAt)
      return d >= from && d <= to
    })

    // Filter orders for the comparison period
    const compareOrders = orders.filter((o) => {
      const d = new Date(o.createdAt)
      return d >= compareFrom && d <= compareTo
    })

    // Revenue calculations
    const periodRevenue = periodOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const compareRevenue = compareOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const revenueChange = compareRevenue > 0
      ? ((periodRevenue - compareRevenue) / compareRevenue) * 100
      : periodRevenue > 0 ? 100 : 0

    // Order count
    const periodOrderCount = periodOrders.length
    const compareOrderCount = compareOrders.length
    const orderChange = compareOrderCount > 0
      ? ((periodOrderCount - compareOrderCount) / compareOrderCount) * 100
      : periodOrderCount > 0 ? 100 : 0

    // Customers
    const periodCustomers = customers.filter((c) => {
      const d = new Date(c.createdAt)
      return d >= from && d <= to
    }).length
    const compareCustomers = customers.filter((c) => {
      const d = new Date(c.createdAt)
      return d >= compareFrom && d <= compareTo
    }).length
    const customerChange = compareCustomers > 0
      ? ((periodCustomers - compareCustomers) / compareCustomers) * 100
      : periodCustomers > 0 ? 100 : 0

    // Avg order value
    const avgOrderValue = periodOrderCount > 0 ? periodRevenue / periodOrderCount : 0
    const compareAvgValue = compareOrderCount > 0 ? compareRevenue / compareOrderCount : 0
    const avgOrderChange = compareAvgValue > 0
      ? ((avgOrderValue - compareAvgValue) / compareAvgValue) * 100
      : avgOrderValue > 0 ? 100 : 0

    // Expenses for the period (manual + PO-linked) — drives the unified P&L.
    // Filtered by `date` (admin-entered actual expense date), not `createdAt`.
    const periodExpensesList = expenses.filter((e) => {
      const d = new Date(e.date)
      return d >= from && d <= to
    })
    const compareExpensesList = expenses.filter((e) => {
      const d = new Date(e.date)
      return d >= compareFrom && d <= compareTo
    })
    const periodExpenses = periodExpensesList.reduce((sum, e) => sum + e.amount, 0)
    const compareExpenses = compareExpensesList.reduce((sum, e) => sum + e.amount, 0)
    const expensesChange = compareExpenses > 0
      ? ((periodExpenses - compareExpenses) / compareExpenses) * 100
      : periodExpenses > 0 ? 100 : 0

    // Split expenses into COGS (auto-synced from POs) vs operating (everything
    // else) so the P&L card can show how each contributes to total spend.
    let cogsExpenses = 0
    for (const e of periodExpensesList) {
      if (e.sourceType === EXPENSE_SOURCE_PURCHASE_ORDER) cogsExpenses += e.amount
    }
    const opExpenses = periodExpenses - cogsExpenses

    // Net profit + margin
    const netProfit = periodRevenue - periodExpenses
    const compareNetProfit = compareRevenue - compareExpenses
    const netProfitChange = compareNetProfit !== 0
      ? ((netProfit - compareNetProfit) / Math.abs(compareNetProfit)) * 100
      : netProfit > 0 ? 100 : netProfit < 0 ? -100 : 0
    const profitMargin = periodRevenue > 0 ? (netProfit / periodRevenue) * 100 : 0

    // Top expense categories (sum + sort)
    const categoryMap = new Map<string, number>()
    for (const e of periodExpensesList) {
      categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount)
    }
    const expensesByCategory = [...categoryMap.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    // Daily revenue for chart (last 7 days within the selected period)
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = []
    const chartDays = 7
    for (let i = chartDays - 1; i >= 0; i--) {
      const date = new Date(to.getTime() - i * 24 * 60 * 60 * 1000)
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

      if (startOfDay < from) continue

      const dayOrders = periodOrders.filter((o) => {
        const d = new Date(o.createdAt)
        return d >= startOfDay && d < endOfDay
      })

      dailyRevenue.push({
        date: startOfDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        orders: dayOrders.length,
      })
    }

    // Filter order statuses for the period
    const periodStatusCounts = periodOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const filteredStatuses = Object.entries(periodStatusCounts).map(([status, count]) => ({
      status,
      _count: { status: count },
    }))

    // Recent orders filtered by period (most recent 5 in the selected period)
    const filteredRecentOrders = periodOrders.slice(0, 5)

    return {
      periodRevenue,
      revenueChange,
      periodOrderCount,
      orderChange,
      periodCustomers,
      customerChange,
      avgOrderValue,
      avgOrderChange,
      periodExpenses,
      expensesChange,
      cogsExpenses,
      opExpenses,
      netProfit,
      netProfitChange,
      profitMargin,
      expensesByCategory,
      dailyRevenue,
      filteredStatuses,
      filteredRecentOrders,
    }
  }, [orders, customers, expenses, preset, customFrom, customTo])

  const maxRevenue = Math.max(...stats.dailyRevenue.map((d) => d.revenue), 1)
  const maxStatusCount = Math.max(...stats.filteredStatuses.map((s) => s._count.status), 1)

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset)
    if (newPreset === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome to your admin dashboard</p>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600 font-medium mr-2">Filter by:</span>
            {(Object.keys(presetLabels) as DatePreset[]).map((p) => (
              <Button
                key={p}
                variant={preset === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetChange(p)}
                className="text-xs"
              >
                {presetLabels[p]}
              </Button>
            ))}
          </div>
          {showCustom && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">From:</span>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">To:</span>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full sm:w-40"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Revenue</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats.periodRevenue)}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            {preset !== 'all_time' && (
              <div className="flex items-center gap-1 mt-2">
                <ChangeBadge value={stats.revenueChange} />
                <span className="text-xs text-slate-500">vs previous period</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Orders</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.periodOrderCount}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            {preset !== 'all_time' && (
              <div className="flex items-center gap-1 mt-2">
                <ChangeBadge value={stats.orderChange} />
                <span className="text-xs text-slate-500">vs previous period</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">New Customers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.periodCustomers}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            {preset !== 'all_time' && (
              <div className="flex items-center gap-1 mt-2">
                <ChangeBadge value={stats.customerChange} />
                <span className="text-xs text-slate-500">vs previous period</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Avg Order Value</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats.avgOrderValue)}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            {preset !== 'all_time' && (
              <div className="flex items-center gap-1 mt-2">
                <ChangeBadge value={stats.avgOrderChange} />
                <span className="text-xs text-slate-500">vs previous period</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats.periodExpenses)}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-red-600" />
              </div>
            </div>
            {preset !== 'all_time' && (
              <div className="flex items-center gap-1 mt-2">
                <ChangeBadge value={stats.expensesChange} reverse />
                <span className="text-xs text-slate-500">vs previous period</span>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Includes COGS auto-synced from POs</p>
          </CardContent>
        </Card>
      </div>

      {/* P&L — mini income statement for the selected period. The math is
          intentionally laid out line by line (Revenue − Expenses = Net Profit)
          so the admin can see exactly how the period's profit was derived
          rather than just landing on a final number. */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-emerald-600" />
            P&amp;L — {presetLabels[preset]}
          </CardTitle>
          <CardDescription>
            Revenue from paid orders minus all expenses (manual entries plus PO-linked cost of goods).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">Revenue</span>
              <span className="text-base font-semibold text-slate-900 tabular-nums">
                {formatCurrency(stats.periodRevenue)}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">− Total Expenses</span>
              <span className="text-base font-semibold text-slate-900 tabular-nums">
                {formatCurrency(stats.periodExpenses)}
              </span>
            </div>

            <div className="pl-4 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">• Inventory / COGS (from POs)</span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {formatCurrency(stats.cogsExpenses)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">• Operating expenses</span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {formatCurrency(stats.opExpenses)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200" />

            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Net Profit</span>
                {preset !== 'all_time' && (
                  <ChangeBadge value={stats.netProfitChange} />
                )}
              </div>
              <span
                className={`text-2xl font-bold tabular-nums ${stats.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
              >
                {formatCurrency(stats.netProfit)}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">Profit Margin</span>
              <span
                className={`text-base font-semibold tabular-nums ${stats.profitMargin >= 0 ? 'text-slate-900' : 'text-red-600'}`}
              >
                {stats.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.dailyRevenue.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No data for the selected period</p>
            ) : (
              <div className="space-y-3">
                {stats.dailyRevenue.map((day, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 shrink-0">{day.date}</span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                        style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-20 text-right">
                      {formatCurrency(day.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Distribution for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.filteredStatuses.map((status) => (
                <div key={status.status} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 shrink-0">
                    {statusLabels[status.status] || status.status}
                  </span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
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
              {stats.filteredStatuses.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No orders in the selected period</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Top Products + Low Stock + Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performers by quantity sold (all time)</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
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

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin05/products">View All</Link>
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

        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Spending breakdown for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.expensesByCategory.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No expenses in the selected period</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const max = Math.max(...stats.expensesByCategory.map((c) => c.amount), 1)
                  return stats.expensesByCategory.map((c) => (
                    <div key={c.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-700">{c.category}</span>
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(c.amount)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                          style={{ width: `${(c.amount / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin05/orders">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.filteredRecentOrders.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No orders in the selected period</p>
          ) : (
            <div className="space-y-3">
              {stats.filteredRecentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin05/orders/${order.id}`}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{order.customerName}</p>
                    <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                    <Badge className={statusColors[order.status]}>{order.status}</Badge>
                    <Eye className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

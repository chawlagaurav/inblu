'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Loader2, Download, Receipt, ExternalLink, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FadeIn } from '@/components/motion'
import { ExpenseForm, emptyExpense, type ExpenseFormValue } from '@/components/admin/expense-form'
import { EXPENSE_CATEGORIES, EXPENSE_SOURCE_PURCHASE_ORDER, type ExpenseCategory } from '@/lib/expense-categories'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  amount: number
  vendor: string | null
  description: string | null
  receiptUrl: string | null
  sourceType: string | null
  sourceId: string | null
  createdAt: string
}

type SourceFilter = 'ALL' | 'MANUAL' | 'PURCHASE_ORDER'

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseFormValue | undefined>()

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [category, setCategory] = useState<'ALL' | ExpenseCategory>('ALL')
  const [source, setSource] = useState<SourceFilter>('ALL')

  useEffect(() => {
    fetchExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, category, source])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (category !== 'ALL') params.set('category', category)
    if (source !== 'ALL') params.set('sourceType', source)
    return params.toString()
  }, [from, to, category, source])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/expenses?${queryString}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data)
      } else {
        toast.error('Failed to load expenses')
      }
    } catch {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(undefined)
    setDialogOpen(true)
  }

  const openEdit = (expense: Expense) => {
    if (expense.sourceType === EXPENSE_SOURCE_PURCHASE_ORDER) {
      // Linked rows are read-only here — bounce admin to the PO that owns it.
      toast.info('Linked from a Purchase Order. Edit the PO to change this expense.')
      return
    }
    setEditing({
      id: expense.id,
      date: expense.date.split('T')[0],
      category: expense.category,
      entryType: expense.amount < 0 ? 'credit' : 'expense',
      amount: String(Math.abs(expense.amount)),
      vendor: expense.vendor ?? '',
      description: expense.description ?? '',
      receiptUrl: expense.receiptUrl ?? '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (expense: Expense) => {
    if (expense.sourceType === EXPENSE_SOURCE_PURCHASE_ORDER) {
      toast.info('Linked from a Purchase Order. Delete the PO to remove this expense.')
      return
    }
    if (!confirm('Delete this expense? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/expenses/${expense.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Expense deleted')
        setExpenses((prev) => prev.filter((e) => e.id !== expense.id))
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to delete expense')
      }
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  // Summary stats from the currently filtered set.
  const stats = useMemo(() => {
    let manualTotal = 0
    let linkedTotal = 0
    let manualCount = 0
    let linkedCount = 0
    for (const e of expenses) {
      if (e.sourceType === EXPENSE_SOURCE_PURCHASE_ORDER) {
        linkedTotal += e.amount
        linkedCount += 1
      } else {
        manualTotal += e.amount
        manualCount += 1
      }
    }
    return {
      manualTotal,
      linkedTotal,
      total: manualTotal + linkedTotal,
      manualCount,
      linkedCount,
      count: expenses.length,
    }
  }, [expenses])

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
            <p className="text-slate-500 mt-1">
              Track operating expenses and cost of goods. Feeds into the dashboard P&amp;L.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={`/api/admin/expenses/export?${queryString}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </a>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Summary cards */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.manualTotal)}</p>
                <p className="text-sm text-slate-500">Expenses ({stats.manualCount} entries)</p>
                <p className="text-xs text-slate-400">Created in the Expenses tab</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Receipt className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.linkedTotal)}</p>
                <p className="text-sm text-slate-500">Linked from POs ({stats.linkedCount} entries)</p>
                <p className="text-xs text-slate-400">Auto-synced from Purchase Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.total)}</p>
                <p className="text-sm text-slate-500">Total ({stats.count} entries)</p>
                <p className="text-xs text-slate-400">Expenses + linked POs</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <Card>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="filter_from">From</Label>
              <Input
                id="filter_from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="filter_to">To</Label>
              <Input
                id="filter_to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="filter_category">Category</Label>
              <select
                id="filter_category"
                value={category}
                onChange={(e) => setCategory(e.target.value as 'ALL' | ExpenseCategory)}
                className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="filter_source">Source</Label>
              <select
                id="filter_source"
                value={source}
                onChange={(e) => setSource(e.target.value as SourceFilter)}
                className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All</option>
                <option value="MANUAL">Manual entries</option>
                <option value="PURCHASE_ORDER">Linked from POs</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* List */}
      <FadeIn delay={0.15}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No expenses in this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-2.5">Date</th>
                      <th className="text-left px-4 py-2.5">Category</th>
                      <th className="text-left px-4 py-2.5">Vendor</th>
                      <th className="text-left px-4 py-2.5">Description</th>
                      <th className="text-right px-4 py-2.5">Amount</th>
                      <th className="text-left px-4 py-2.5">Receipt</th>
                      <th className="text-right px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => {
                      const isLinked = e.sourceType === EXPENSE_SOURCE_PURCHASE_ORDER
                      return (
                        <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                            {new Date(e.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{e.category}</Badge>
                              {isLinked && (
                                <Badge variant="secondary" className="text-xs">Linked: PO</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{e.vendor || '—'}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={e.description ?? ''}>
                            {e.description || '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                            {e.amount < 0 ? (
                              <span className="text-emerald-600">
                                {formatCurrency(e.amount)}
                                <span className="ml-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-600 align-middle">
                                  Credit
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-900">{formatCurrency(e.amount)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {e.receiptUrl ? (
                              <a
                                href={e.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                View
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {isLinked ? (
                              <Link
                                href={`/admin05/purchase-orders`}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                View PO
                              </Link>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEdit(e)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                  aria-label="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(e)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            initial={editing ?? emptyExpense}
            onSubmit={() => {
              setDialogOpen(false)
              fetchExpenses()
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

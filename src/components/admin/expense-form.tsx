'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { DocumentUpload } from '@/components/admin/image-upload'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/expense-categories'
import { toast } from 'sonner'

export interface ExpenseFormValue {
  id?: string
  date: string             // ISO date input value (YYYY-MM-DD)
  category: ExpenseCategory
  amount: string           // string so the input can hold partial numbers
  vendor: string
  description: string
  receiptUrl: string
}

const today = () => new Date().toISOString().split('T')[0]

export const emptyExpense: ExpenseFormValue = {
  date: today(),
  category: 'Misc',
  amount: '',
  vendor: '',
  description: '',
  receiptUrl: '',
}

interface ExpenseFormProps {
  initial?: ExpenseFormValue
  onSubmit: () => void
  onCancel?: () => void
}

/**
 * Reusable form for creating + editing manual expenses. Linked-from-PO rows
 * never reach this form (the list page reroutes their edit action to the PO).
 *
 * State lives here; the parent triggers refetch via `onSubmit` after a
 * successful save.
 */
export function ExpenseForm({ initial, onSubmit, onCancel }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormValue>(initial ?? emptyExpense)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const handleSave = async () => {
    if (!form.date) {
      toast.error('Date is required')
      return
    }
    const amountNum = parseFloat(form.amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    setSaving(true)
    try {
      const url = form.id ? `/api/admin/expenses/${form.id}` : '/api/admin/expenses'
      const method = form.id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          category: form.category,
          amount: amountNum,
          vendor: form.vendor || null,
          description: form.description || null,
          receiptUrl: form.receiptUrl || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Failed to save expense')
        return
      }
      toast.success(form.id ? 'Expense updated' : 'Expense added')
      onSubmit()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="expense_date">Date *</Label>
          <Input
            id="expense_date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="expense_category">Category *</Label>
          <select
            id="expense_category"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as ExpenseCategory }))}
            className="mt-1 flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="expense_amount">Amount (AUD) *</Label>
          <Input
            id="expense_amount"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            placeholder="0.00"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="expense_vendor">Vendor</Label>
          <Input
            id="expense_vendor"
            value={form.vendor}
            onChange={(e) => setForm((prev) => ({ ...prev, vendor: e.target.value }))}
            placeholder="Optional"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="expense_description">Description</Label>
        <Textarea
          id="expense_description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          placeholder="What was this for?"
          className="mt-1"
        />
      </div>

      <div>
        <Label>Receipt (optional)</Label>
        <p className="text-xs text-slate-500 mb-2">PDF or photo of the receipt</p>
        <DocumentUpload
          value={form.receiptUrl}
          onChange={(url) => setForm((prev) => ({ ...prev, receiptUrl: url }))}
          folder="receipts"
          label="receipt"
          acceptedFiles="pdf-or-image"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : form.id ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </div>
  )
}

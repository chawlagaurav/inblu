'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, Tag, Percent, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'

interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  minOrderAmount: number | null
  maxDiscountAmount: number | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  startDate: string | null
  endDate: string | null
  createdAt: string
}

const emptyCoupon = {
  code: '',
  description: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: 10,
  minOrderAmount: '',
  maxDiscountAmount: '',
  maxUses: '',
  isActive: true,
  startDate: '',
  endDate: '',
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyCoupon)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons')
      if (res.ok) {
        const data = await res.json()
        setCoupons(data)
      }
    } catch {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyCoupon)
    setDialogOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType as 'percentage' | 'fixed',
      discountValue: Number(coupon.discountValue),
      minOrderAmount: coupon.minOrderAmount ? String(Number(coupon.minOrderAmount)) : '',
      maxDiscountAmount: coupon.maxDiscountAmount ? String(Number(coupon.maxDiscountAmount)) : '',
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      isActive: coupon.isActive,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error('Coupon code is required')
      return
    }
    if (!form.discountValue || form.discountValue <= 0) {
      toast.error('Discount value must be greater than 0')
      return
    }
    if (form.discountType === 'percentage' && form.discountValue > 100) {
      toast.error('Percentage discount cannot exceed 100%')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: form.code,
        description: form.description || null,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        isActive: form.isActive,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      }

      const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to save coupon')
        return
      }

      toast.success(editingId ? 'Coupon updated' : 'Coupon created')
      setDialogOpen(false)
      fetchCoupons()
    } catch {
      toast.error('Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Coupon deleted')
        setCoupons(prev => prev.filter(c => c.id !== id))
      } else {
        toast.error('Failed to delete coupon')
      }
    } catch {
      toast.error('Failed to delete coupon')
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
        toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`)
      }
    } catch {
      toast.error('Failed to update coupon')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Coupons</h1>
            <p className="text-slate-500 mt-1">Manage discount coupons for your store</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </FadeIn>

      <StaggerContainer className="grid gap-4">
        {coupons.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="h-12 w-12 text-sky-200 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No coupons yet</h3>
              <p className="text-sm text-slate-500 mb-4">Create your first discount coupon</p>
              <Button onClick={openCreate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </CardContent>
          </Card>
        ) : (
          coupons.map((coupon) => (
            <StaggerItem key={coupon.id}>
              <Card className={!coupon.isActive ? 'opacity-60' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        coupon.discountType === 'percentage' ? 'bg-sky-100' : 'bg-emerald-100'
                      }`}>
                        {coupon.discountType === 'percentage' ? (
                          <Percent className="h-5 w-5 text-sky-600" />
                        ) : (
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900">{coupon.code}</span>
                          <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {coupon.discountType === 'percentage'
                              ? `${Number(coupon.discountValue)}% off`
                              : `$${Number(coupon.discountValue).toFixed(2)} off`}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 truncate mt-0.5">
                          {coupon.description || 'No description'}
                          {coupon.minOrderAmount && ` · Min order: $${Number(coupon.minOrderAmount).toFixed(2)}`}
                          {coupon.maxDiscountAmount && ` · Max discount: $${Number(coupon.maxDiscountAmount).toFixed(2)}`}
                          {coupon.maxUses && ` · Used: ${coupon.usedCount}/${coupon.maxUses}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        title={coupon.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {coupon.isActive ? (
                          <ToggleRight className="h-5 w-5 text-sky-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(coupon)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))
        )}
      </StaggerContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="coupon_code">Coupon Code</Label>
              <Input
                id="coupon_code"
                value={form.code}
                onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                className="uppercase font-mono"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="coupon_desc">Description (optional)</Label>
              <Input
                id="coupon_desc"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Summer sale discount"
              />
            </div>

            {/* Discount Type */}
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, discountType: 'percentage' }))}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    form.discountType === 'percentage'
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Percent className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Percentage</p>
                    <p className="text-xs opacity-70">e.g. 10% off</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, discountType: 'fixed' }))}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    form.discountType === 'fixed'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <DollarSign className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Flat Amount</p>
                    <p className="text-xs opacity-70">e.g. $25 off</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Discount Value */}
            <div className="space-y-2">
              <Label htmlFor="coupon_value">
                {form.discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
              </Label>
              <div className="relative">
                <Input
                  id="coupon_value"
                  type="number"
                  min={0}
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  step={form.discountType === 'percentage' ? 1 : 0.01}
                  value={form.discountValue}
                  onChange={(e) => setForm(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                  placeholder={form.discountType === 'percentage' ? '10' : '25.00'}
                  className="pl-8"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  {form.discountType === 'percentage' ? '%' : '$'}
                </span>
              </div>
            </div>

            {/* Min Order & Max Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="coupon_min">Min Order Amount ($)</Label>
                <Input
                  id="coupon_min"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.minOrderAmount}
                  onChange={(e) => setForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
                  placeholder="No minimum"
                />
              </div>
              {form.discountType === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="coupon_max_discount">Max Discount ($)</Label>
                  <Input
                    id="coupon_max_discount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                    placeholder="No cap"
                  />
                </div>
              )}
            </div>

            {/* Max Uses */}
            <div className="space-y-2">
              <Label htmlFor="coupon_max_uses">Max Uses</Label>
              <Input
                id="coupon_max_uses"
                type="number"
                min={0}
                value={form.maxUses}
                onChange={(e) => setForm(prev => ({ ...prev, maxUses: e.target.value }))}
                placeholder="Unlimited"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="coupon_start">Start Date</Label>
                <Input
                  id="coupon_start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon_end">End Date</Label>
                <Input
                  id="coupon_end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-sm text-slate-900">Active</p>
                <p className="text-xs text-slate-500">Coupon can be used at checkout</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  form.isActive ? 'bg-sky-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                    form.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Preview */}
            <div className="p-3 border border-dashed border-sky-300 rounded-xl bg-sky-50">
              <p className="text-xs font-medium text-slate-500 mb-1">Preview</p>
              <p className="font-mono font-bold text-sky-700">{form.code || 'CODE'}</p>
              <p className="text-sm text-slate-600">
                {form.discountType === 'percentage'
                  ? `${form.discountValue || 0}% off`
                  : `$${(form.discountValue || 0).toFixed(2)} flat discount`}
                {form.minOrderAmount && ` on orders over $${Number(form.minOrderAmount).toFixed(2)}`}
                {form.discountType === 'percentage' && form.maxDiscountAmount && ` (max $${Number(form.maxDiscountAmount).toFixed(2)})`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingId ? 'Update Coupon' : 'Create Coupon'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

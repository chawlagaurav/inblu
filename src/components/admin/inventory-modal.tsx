'use client'

import { useState } from 'react'
import { Loader2, Upload, PackagePlus, SlidersHorizontal } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface InventoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productName: string
  currentStock: number
  onStockUpdated: (newStock: number) => void
}

export function InventoryModal({
  open,
  onOpenChange,
  productId,
  productName,
  currentStock,
  onStockUpdated,
}: InventoryModalProps) {
  const [tab, setTab] = useState('add')
  const [submitting, setSubmitting] = useState(false)

  // Add Stock state
  const [addQuantity, setAddQuantity] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [poFile, setPoFile] = useState<File | null>(null)

  // Adjust Stock state
  const [adjustStock, setAdjustStock] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  const resetForm = () => {
    setAddQuantity('')
    setPoNumber('')
    setVendorName('')
    setPoFile(null)
    setAdjustStock('')
    setAdjustReason('')
  }

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(addQuantity, 10)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantity must be a positive number')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('productId', productId)
      formData.append('type', 'IN')
      formData.append('quantity', String(qty))
      if (poNumber) formData.append('poNumber', poNumber)
      if (vendorName) formData.append('vendorName', vendorName)
      if (poFile) formData.append('file', poFile)

      const res = await fetch('/api/inventory/update', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add stock')
      }

      const data = await res.json()
      toast.success(`Added ${qty} units. New stock: ${data.stock}`)
      onStockUpdated(data.stock)
      resetForm()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add stock')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault()
    const newVal = parseInt(adjustStock, 10)
    if (isNaN(newVal) || newVal < 0) {
      toast.error('New stock must be a non-negative number')
      return
    }
    if (!adjustReason.trim()) {
      toast.error('Reason is required for stock adjustment')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('productId', productId)
      formData.append('type', 'ADJUSTMENT')
      formData.append('newStock', String(newVal))
      formData.append('note', adjustReason.trim())

      const res = await fetch('/api/inventory/update', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to adjust stock')
      }

      const data = await res.json()
      const diff = newVal - currentStock
      toast.success(`Stock adjusted by ${diff >= 0 ? '+' : ''}${diff}. New stock: ${data.stock}`)
      onStockUpdated(data.stock)
      resetForm()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust stock')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            {productName} &mdash; Current stock: <strong>{currentStock}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="add" className="flex-1 gap-1.5">
              <PackagePlus className="h-4 w-4" />
              Add Stock
            </TabsTrigger>
            <TabsTrigger value="adjust" className="flex-1 gap-1.5">
              <SlidersHorizontal className="h-4 w-4" />
              Adjust Stock
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <form onSubmit={handleAddStock} className="space-y-4 pt-2">
              <div>
                <Label htmlFor="addQuantity">Quantity *</Label>
                <Input
                  id="addQuantity"
                  type="number"
                  min="1"
                  required
                  placeholder="Enter quantity to add"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  className="mt-1"
                />
                {addQuantity && parseInt(addQuantity) > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    New stock will be: {currentStock + parseInt(addQuantity)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  placeholder="e.g. PO-2026-001"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="vendorName">Vendor Name</Label>
                <Input
                  id="vendorName"
                  placeholder="e.g. ABC Supplies"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="poFile">Purchase Order Document</Label>
                <div className="mt-1">
                  <label
                    htmlFor="poFile"
                    className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-blue-300 px-4 py-3 text-sm text-slate-600 hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-blue-500" />
                    {poFile ? poFile.name : 'Upload PDF or Image (optional)'}
                  </label>
                  <input
                    id="poFile"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => setPoFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Stock...
                  </>
                ) : (
                  <>
                    <PackagePlus className="h-4 w-4 mr-2" />
                    Add Stock
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="adjust">
            <form onSubmit={handleAdjustStock} className="space-y-4 pt-2">
              <div>
                <Label htmlFor="adjustStock">New Stock Value *</Label>
                <Input
                  id="adjustStock"
                  type="number"
                  min="0"
                  required
                  placeholder="Enter new stock value"
                  value={adjustStock}
                  onChange={(e) => setAdjustStock(e.target.value)}
                  className="mt-1"
                />
                {adjustStock !== '' && !isNaN(parseInt(adjustStock)) && (
                  <p className="text-xs text-slate-500 mt-1">
                    {(() => {
                      const diff = parseInt(adjustStock) - currentStock
                      if (diff === 0) return 'No change'
                      return `Change: ${diff >= 0 ? '+' : ''}${diff} units`
                    })()}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="adjustReason">Reason *</Label>
                <Textarea
                  id="adjustReason"
                  required
                  placeholder="e.g. Damaged goods, inventory count correction"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adjusting Stock...
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Adjust Stock
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

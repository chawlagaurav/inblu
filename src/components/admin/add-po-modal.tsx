'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Loader2,
  Upload,
  Plus,
  Trash2,
  Package,
  Search,
  X,
  FileText,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  imageUrl: string
  stock: number
  sku: string | null
}

interface POItem {
  productId: string
  product: Product
  quantity: number
  unitCost: string
}

interface EditPOData {
  id: string
  poNumber: string | null
  poDate: string | null
  vendorName: string | null
  fileUrl: string | null
  notes?: string | null
  tax: number | null
  deliveryStatus: string | null
  deliveryReceivedDate: string | null
  approvedBy: string | null
  paymentStatus: string | null
  inventoryTransactions: Array<{
    id: string
    productId: string
    quantity: number
    unitCost: string | null
    product: {
      id: string
      name: string
      imageUrl: string
      stock: number
      sku: string | null
    }
  }>
}

interface AddPOModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPOCreated: () => void
  editData?: EditPOData | null
}

export function AddPOModal({ open, onOpenChange, onPOCreated, editData }: AddPOModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // PO Details
  const [poNumber, setPoNumber] = useState('')
  const [poDate, setPoDate] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [poFile, setPoFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [tax, setTax] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState('PENDING')
  const [deliveryReceivedDate, setDeliveryReceivedDate] = useState('')
  const [approvedBy, setApprovedBy] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('UNPAID')

  // Selected products
  const [items, setItems] = useState<POItem[]>([])

  // Product search dropdown
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  const isEditMode = !!editData

  useEffect(() => {
    if (open) {
      fetchProducts()
      if (editData) {
        // Populate form with existing data
        setPoNumber(editData.poNumber || '')
        setPoDate(editData.poDate ? editData.poDate.split('T')[0] : '')
        setVendorName(editData.vendorName || '')
        setNotes(editData.notes || '')
        setTax(editData.tax?.toString() || '')
        setDeliveryStatus(editData.deliveryStatus || 'PENDING')
        setDeliveryReceivedDate(editData.deliveryReceivedDate ? editData.deliveryReceivedDate.split('T')[0] : '')
        setApprovedBy(editData.approvedBy || '')
        setPaymentStatus(editData.paymentStatus || 'UNPAID')
        setItems(
          editData.inventoryTransactions.map((t) => ({
            productId: t.productId,
            product: {
              id: t.product.id,
              name: t.product.name,
              imageUrl: t.product.imageUrl,
              // Calculate original stock (current stock minus what was added by this PO)
              stock: t.product.stock - t.quantity,
              sku: t.product.sku,
            },
            quantity: t.quantity,
            unitCost: t.unitCost || '',
          }))
        )
      }
    }
  }, [open, editData])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await fetch('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }

  const resetForm = () => {
    setPoNumber('')
    setPoDate('')
    setVendorName('')
    setPoFile(null)
    setNotes('')
    setTax('')
    setDeliveryStatus('PENDING')
    setDeliveryReceivedDate('')
    setApprovedBy('')
    setPaymentStatus('UNPAID')
    setItems([])
    setSearchQuery('')
  }

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase()
    const isNotSelected = !items.some((item) => item.productId === p.id)
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      (p.sku && p.sku.toLowerCase().includes(query))
    return isNotSelected && matchesSearch
  })

  const addProduct = (product: Product) => {
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        product,
        quantity: 1,
        unitCost: '',
      },
    ])
    setSearchQuery('')
    setShowProductDropdown(false)
  }

  const removeProduct = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateItem = (productId: string, field: 'quantity' | 'unitCost', value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, [field]: value } : item
      )
    )
  }

  const calculateTotalCost = () => {
    return items.reduce((sum, item) => {
      const qty = parseInt(item.quantity.toString(), 10) || 0
      const cost = parseFloat(item.unitCost) || 0
      return sum + qty * cost
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    // Validate quantities
    for (const item of items) {
      const qty = parseInt(item.quantity.toString(), 10)
      if (isNaN(qty) || qty <= 0) {
        toast.error(`Invalid quantity for ${item.product.name}`)
        return
      }
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      if (poNumber) formData.append('poNumber', poNumber)
      if (poDate) formData.append('poDate', poDate)
      if (vendorName) formData.append('vendorName', vendorName)
      if (notes) formData.append('notes', notes)
      if (tax) formData.append('tax', tax)
      formData.append('deliveryStatus', deliveryStatus)
      if (deliveryReceivedDate) formData.append('deliveryReceivedDate', deliveryReceivedDate)
      if (approvedBy) formData.append('approvedBy', approvedBy)
      formData.append('paymentStatus', paymentStatus)
      if (poFile) formData.append('file', poFile)

      // Add items as JSON
      const itemsData = items.map((item) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity.toString(), 10),
        unitCost: item.unitCost ? parseFloat(item.unitCost.toString()) : null,
      }))
      formData.append('items', JSON.stringify(itemsData))

      const url = isEditMode 
        ? `/api/admin/purchase-orders/${editData!.id}` 
        : '/api/admin/purchase-orders'
      
      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to ${isEditMode ? 'update' : 'create'} purchase order`)
      }

      const totalQty = items.reduce((sum, item) => sum + parseInt(item.quantity.toString(), 10), 0)
      toast.success(
        isEditMode 
          ? `Purchase order updated successfully.` 
          : `Purchase order created. ${totalQty} units added to stock.`
      )
      resetForm()
      onOpenChange(false)
      onPOCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} purchase order`)
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditMode ? 'Edit Purchase Order' : 'Add Purchase Order'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update purchase order details and stock quantities' 
              : 'Create a new purchase order and update stock for multiple products'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* PO Details - Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <Label htmlFor="poDate">PO Date</Label>
              <Input
                id="poDate"
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="vendorName">Supplier</Label>
              <Input
                id="vendorName"
                placeholder="e.g. Supplier Co."
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* PO Details - Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="deliveryStatus">Delivery Status</Label>
              <select
                id="deliveryStatus"
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
            <div>
              <Label htmlFor="deliveryReceivedDate">Delivery Received Date</Label>
              <Input
                id="deliveryReceivedDate"
                type="date"
                value={deliveryReceivedDate}
                onChange={(e) => setDeliveryReceivedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <select
                id="paymentStatus"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <Label htmlFor="approvedBy">Approved By</Label>
              <Input
                id="approvedBy"
                placeholder="Name of approver"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label>PO Document (optional)</Label>
            <div className="mt-1">
              {poFile ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-900 flex-1 truncate">{poFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPoFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                  <Upload className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-500">
                    Click to upload PO document (PDF, image)
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setPoFile(file)
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <Label>Products *</Label>
            <div className="mt-2 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowProductDropdown(true)
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  className="pl-9"
                />
              </div>

              {/* Product Dropdown */}
              {showProductDropdown && searchQuery && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loadingProducts ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No products found
                    </div>
                  ) : (
                    filteredProducts.slice(0, 10).map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 text-left transition-colors"
                      >
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{product.name}</p>
                          <p className="text-xs text-slate-500">
                            {product.sku && <span>SKU: {product.sku} · </span>}
                            Stock: {product.stock}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-blue-600" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Products */}
            {items.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  Selected Products ({items.length})
                </p>
                {items.map((item) => (
                  <Card key={item.productId} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          {item.product.imageUrl ? (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{item.product.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Current: {item.product.stock}</span>
                            {parseInt(item.quantity.toString(), 10) > 0 && (
                              <>
                                <span>→</span>
                                <span className="text-green-600 font-medium">
                                  New: {item.product.stock + parseInt(item.quantity.toString(), 10)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Stock to Add:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.productId, 'quantity', e.target.value)}
                                className="w-20 h-8 text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Unit Cost:</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="$0.00"
                                value={item.unitCost}
                                onChange={(e) => updateItem(item.productId, 'unitCost', e.target.value)}
                                className="w-24 h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(item.productId)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Total Cost Summary */}
                {items.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(calculateTotalCost())}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Tax:</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="$0.00"
                        value={tax}
                        onChange={(e) => setTax(e.target.value)}
                        className="w-28 h-8 text-sm text-right"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="font-medium text-slate-700">Total:</span>
                      <Badge className="bg-green-100 text-green-700 text-sm">
                        {formatCurrency(calculateTotalCost() + (parseFloat(tax) || 0))}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {items.length === 0 && (
              <div className="mt-4 p-6 border-2 border-dashed border-slate-200 rounded-lg text-center">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  Search and add products to this purchase order
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || items.length === 0}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Update Purchase Order
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create PO & Update Stock
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

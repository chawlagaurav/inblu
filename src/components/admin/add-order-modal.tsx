'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: number
  stock: number
}

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

interface AddOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddOrderModal({ isOpen, onClose, onSuccess }: AddOrderModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'NSW',
    postcode: '',
    notes: '',
    installationDate: '',
    orderDate: '',
    status: 'DELIVERED',
    paymentStatus: 'SUCCEEDED',
    shippingCost: '0',
    discountAmount: '0',
  })
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
  }, [isOpen])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.filter((p: Product & { isActive: boolean }) => p.isActive))
      }
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const addItem = () => {
    if (!selectedProduct) return
    
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return
    
    // Check if already added
    if (orderItems.some(item => item.productId === product.id)) {
      toast.error('Product already added')
      return
    }
    
    setOrderItems(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
    }])
    setSelectedProduct('')
  }

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return
    setOrderItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    ))
  }

  const updateItemPrice = (productId: string, price: number) => {
    setOrderItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, price } : item
    ))
  }

  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId))
  }

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const shipping = parseFloat(formData.shippingCost) || 0
    const discount = parseFloat(formData.discountAmount) || 0
    return subtotal + shipping - discount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (orderItems.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    if (!formData.customerName || !formData.email) {
      toast.error('Customer name and email are required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: calculateSubtotal(),
          totalAmount: calculateTotal(),
          shippingCost: parseFloat(formData.shippingCost) || 0,
          discountAmount: parseFloat(formData.discountAmount) || 0,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create order')
      }

      toast.success('Order created successfully')
      onSuccess()
      resetForm()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create order')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'NSW',
      postcode: '',
      notes: '',
      installationDate: '',
      orderDate: '',
      status: 'DELIVERED',
      paymentStatus: 'SUCCEEDED',
      shippingCost: '0',
      discountAmount: '0',
    })
    setOrderItems([])
    setSelectedProduct('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add Manual Order</h2>
            <p className="text-sm text-slate-500">Create an order for offline sales</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="orderDate">Order Date</Label>
                  <Input
                    id="orderDate"
                    name="orderDate"
                    type="date"
                    value={formData.orderDate}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Shipping Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City/Suburb</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="NSW">NSW</option>
                    <option value="VIC">VIC</option>
                    <option value="QLD">QLD</option>
                    <option value="WA">WA</option>
                    <option value="SA">SA</option>
                    <option value="TAS">TAS</option>
                    <option value="ACT">ACT</option>
                    <option value="NT">NT</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Order Items</h3>
              
              {/* Add Product */}
              <div className="flex gap-2 mb-4">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  disabled={loadingProducts}
                >
                  <option value="">Select a product...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price.toFixed(2)}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={addItem} disabled={!selectedProduct}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Items List */}
              {orderItems.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No items added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderItems.map(item => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.productName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                        />
                        <span className="text-slate-500">×</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                        <span className="text-slate-700 font-medium w-24 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Totals */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Shipping</span>
                      <Input
                        type="number"
                        name="shippingCost"
                        min="0"
                        step="0.01"
                        value={formData.shippingCost}
                        onChange={handleChange}
                        className="w-24 text-right"
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Discount</span>
                      <Input
                        type="number"
                        name="discountAmount"
                        min="0"
                        step="0.01"
                        value={formData.discountAmount}
                        onChange={handleChange}
                        className="w-24 text-right"
                      />
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Status & Internal Details */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Order Status & Internal Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Order Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <select
                    id="paymentStatus"
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="SUCCEEDED">Succeeded</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="installationDate">Installation Date</Label>
                  <Input
                    id="installationDate"
                    name="installationDate"
                    type="date"
                    value={formData.installationDate}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1"
                    placeholder="Add any internal notes about this order..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || orderItems.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

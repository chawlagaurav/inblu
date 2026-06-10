'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Package, LogOut, Calendar, X, CreditCard, MapPin, Loader2, FileText, Download, Eye, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn, FadeInOnScroll } from '@/components/motion'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    imageUrl: string
  }
}

interface Order {
  id: string
  createdAt: string
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'
  totalAmount: number
  subtotal: number
  gst: number
  shippingCost: number
  stripePaymentIntent: string | null
  shippingAddress: {
    firstName: string
    lastName: string
    city: string
    state: string
    postcode: string
    country: string
  }
  items: OrderItem[]
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

// Customer-facing label: a paid order in PROCESSING is shown as "Order Placed".
const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Order Placed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}
const formatStatus = (status: string) => statusLabels[status] ?? status

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    supabase.auth.getUser().then(({ data: { user: authUser } }: { data: { user: SupabaseUser | null } }) => {
      setUser(authUser)
      setLoading(false)
      if (authUser) {
        fetchOrders()
      }
    })
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/my-orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleRetryPayment = async (orderId: string) => {
    setRetryingOrderId(orderId)
    try {
      const res = await fetch('/api/checkout/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Redirect to the complete-payment page with the new client secret + the
      // reservation expiry so it shows the same countdown timer as checkout.
      const params = new URLSearchParams({
        orderId,
        payment_intent_client_secret: data.clientSecret,
        payment_intent: data.paymentIntentId,
      })
      if (data.reservationExpiresAt) {
        params.set('reservation_expires_at', data.reservationExpiresAt)
      }
      window.location.href = `/checkout/payment?${params.toString()}`
    } catch (err) {
      console.error('Retry error:', err)
      alert('Failed to initiate payment retry. Please try again.')
    } finally {
      setRetryingOrderId(null)
    }
  }

  const getHoursUntilExpiry = (createdAt: string) => {
    const created = new Date(createdAt).getTime()
    const expiry = created + 24 * 60 * 60 * 1000
    const hoursLeft = Math.max(0, Math.ceil((expiry - Date.now()) / (1000 * 60 * 60)))
    return hoursLeft
  }

  const handleLogout = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
      window.location.href = '/'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }

  const handleDownloadInvoice = async (orderId: string) => {
    setInvoiceLoading(true)
    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      
      if (response.ok) {
        const data = await response.json()
        // Open PDF in new tab for download
        window.open(data.pdfUrl, '_blank')
      } else {
        console.error('Failed to generate invoice')
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
    } finally {
      setInvoiceLoading(false)
    }
  }

  const handlePreviewInvoice = (orderId: string) => {
    window.open(`/api/generate-invoice?orderId=${orderId}&preview=true`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <FadeIn>
          <h1 className="text-3xl font-bold text-slate-900 mb-8">My Profile</h1>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Information Section */}
          <FadeInOnScroll>
            <Card className="border-blue-100 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-blue-500" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Member Since</p>
                    <p className="font-medium text-slate-900">
                      {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-100">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeInOnScroll>

          {/* Order History Section */}
          <div className="lg:col-span-2" id="orders">
            <FadeInOnScroll delay={0.1}>
              <Card className="border-blue-100 shadow-sm rounded-2xl">
                <CardHeader className="border-b border-blue-100">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-blue-500" />
                    Order History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">You haven&apos;t placed any orders yet.</p>
                      <Button asChild className="mt-4">
                        <a href="/products">Start Shopping</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        // An order is unpaid if the customer never completed payment:
                        // an explicit FAILED, or one abandoned on the payment page
                        // (left in PENDING/PROCESSING). All can be paid within 24h.
                        const isUnpaid =
                          order.status === 'PENDING' &&
                          ['FAILED', 'PENDING', 'PROCESSING'].includes(order.paymentStatus)
                        const isFailed = order.paymentStatus === 'FAILED'
                        const hoursLeft = isUnpaid ? getHoursUntilExpiry(order.createdAt) : null

                        return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`border rounded-xl p-4 hover:shadow-md transition-shadow ${isUnpaid ? 'border-amber-200 bg-amber-50/40' : 'border-blue-100'}`}
                        >
                          {isUnpaid && (
                            <div className="flex items-center gap-2 mb-3 p-3 bg-amber-100 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-amber-800">
                                  {isFailed ? 'Payment Failed' : 'Payment Incomplete'}
                                </p>
                                <p className="text-xs text-amber-700">
                                  Complete your payment to confirm this order.{' '}
                                  {hoursLeft && hoursLeft > 0
                                    ? `It will be automatically cancelled in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`
                                    : 'It will be cancelled shortly.'}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                            <div>
                              <p className="text-sm text-slate-500">Order ID</p>
                              <p className="font-mono text-sm font-medium text-slate-900">
                                {order.id.slice(0, 8).toUpperCase()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Date</p>
                              <p className="text-sm font-medium text-slate-900">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Status</p>
                              {isUnpaid ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  {isFailed ? 'Payment Failed' : 'Awaiting Payment'}
                                </span>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                  {formatStatus(order.status)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">Total</p>
                              <p className="text-sm font-bold text-blue-600">
                                {formatCurrency(order.totalAmount)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-blue-50">
                            <p className="text-sm text-slate-500">
                              {order.items.length} item{order.items.length > 1 ? 's' : ''}
                            </p>
                            <div className="flex gap-2">
                              {isUnpaid ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleRetryPayment(order.id)}
                                  disabled={retryingOrderId === order.id}
                                  className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                  {retryingOrderId === order.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <CreditCard className="h-3 w-3 mr-1" />
                                  )}
                                  Complete Payment
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  View Details
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeInOnScroll>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-10 lg:inset-20 bg-white rounded-2xl shadow-xl z-50 overflow-auto"
            >
              <div className="sticky top-0 bg-white border-b border-blue-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <p className="font-medium text-slate-900">Order Info</p>
                    </div>
                    <p className="text-sm text-slate-600">ID: {selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-slate-600">Date: {formatDate(selectedOrder.createdAt)}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${statusColors[selectedOrder.status]}`}>
                      {formatStatus(selectedOrder.status)}
                    </span>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <p className="font-medium text-slate-900">Shipping Address</p>
                    </div>
                    <p className="text-sm text-slate-600">
                      {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedOrder.shippingAddress.postcode}, {selectedOrder.shippingAddress.country}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <p className="font-medium text-slate-900">Payment</p>
                    </div>
                    <p className="text-sm text-slate-600">
                      Ref: {selectedOrder.stripePaymentIntent?.slice(-8) || 'N/A'}
                    </p>
                    <p className="text-sm text-slate-600">Subtotal: {formatCurrency(selectedOrder.subtotal)}</p>
                    <p className="text-sm text-slate-600">GST: {formatCurrency(selectedOrder.gst)}</p>
                    <p className="text-sm text-slate-600">Shipping: {formatCurrency(selectedOrder.shippingCost)}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Items Ordered</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 border border-blue-100 rounded-xl"
                      >
                        <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center overflow-hidden relative">
                          {item.product.imageUrl ? (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-blue-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{item.product.name}</p>
                          <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-blue-600">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-blue-100 pt-4 flex justify-between items-end">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewInvoice(selectedOrder.id)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview Invoice
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadInvoice(selectedOrder.id)}
                      disabled={invoiceLoading}
                      className="gap-2"
                    >
                      {invoiceLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Download Invoice
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

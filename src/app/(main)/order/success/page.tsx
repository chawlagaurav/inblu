'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package, ArrowRight, ShoppingBag, Loader2, Mail, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FadeIn } from '@/components/motion'
import { useCartStore } from '@/store/cart'
import { formatCurrency, formatDate } from '@/lib/utils'

interface OrderItem {
  id: string
  quantity: number
  price: string | number
  product: {
    id: string
    name: string
    imageUrl: string
  }
}

interface Order {
  id: string
  customerName: string
  email: string
  phone?: string
  totalAmount: string | number
  subtotal: string | number
  gst: string | number
  shippingCost: string | number
  status: string
  paymentStatus: string
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    apartment?: string
    city: string
    state: string
    postcode: string
    country: string
  }
  isGuest: boolean
  createdAt: string
  items: OrderItem[]
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const paymentIntent = searchParams.get('payment_intent')
  const clearCart = useCartStore((state) => state.clearCart)
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Clear cart after successful payment
    clearCart()
  }, [clearCart])

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId && !paymentIntent) {
        setIsLoading(false)
        return
      }

      try {
        const params = new URLSearchParams()
        if (orderId) params.set('orderId', orderId)
        if (paymentIntent) params.set('payment_intent', paymentIntent)

        const response = await fetch(`/api/checkout?${params.toString()}`)
        const data = await response.json()

        if (data.error) {
          setError(data.error)
        } else {
          setOrder(data.order)
        }
      } catch (err) {
        console.error('Failed to fetch order:', err)
        setError('Failed to load order details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, paymentIntent])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-sky-500 mx-auto mb-4" />
            <p className="text-slate-600">Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
        <FadeIn>
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Order Confirmed!
              </h1>

              <p className="text-slate-600 mb-6">
                Thank you for your purchase. We&apos;ve sent a confirmation email with your order details.
              </p>

              {orderId && (
                <p className="text-sm text-slate-500 mb-6 bg-slate-100 rounded-xl p-3">
                  Order ID: {orderId.slice(0, 8).toUpperCase()}
                </p>
              )}

              <div className="bg-sky-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-center gap-3 text-sky-700">
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Estimated delivery: 2-5 business days
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/products">
                    Continue Shopping
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <FadeIn>
          {/* Success Header */}
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Order Confirmed!
              </h1>

              <p className="text-slate-600 mb-4">
                Thank you for your purchase, {order.customerName}!
              </p>

              <div className="inline-flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2 text-sm">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-medium text-slate-900">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-sky-50">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sky-300">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="text-slate-900">{formatCurrency(Number(order.subtotal))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shipping</span>
                    <span className="text-slate-900">
                      {Number(order.shippingCost) === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatCurrency(Number(order.shippingCost))
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">GST (included)</span>
                    <span className="text-slate-900">{formatCurrency(Number(order.gst))}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(Number(order.totalAmount))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Shipping & Contact Info */}
          <FadeIn delay={0.2}>
            <div className="space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p className="font-medium text-slate-900">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                    <p>{order.shippingAddress.address}</p>
                    {order.shippingAddress.apartment && (
                      <p>{order.shippingAddress.apartment}</p>
                    )}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postcode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>{order.email}</p>
                    {order.phone && <p>{order.phone}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Order Status</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Payment Status</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Order Date</span>
                      <span className="text-sm text-slate-900">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Estimate */}
              <div className="bg-sky-50 rounded-2xl p-4">
                <div className="flex items-center gap-3 text-sky-700">
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Estimated delivery: 2-5 business days
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Action Buttons */}
        <FadeIn delay={0.3}>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/products">
                Continue Shopping
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Package, Truck, Mail, Phone, MapPin, CreditCard, Calendar, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FadeIn } from '@/components/motion'
import { OrderActions } from '@/components/admin/order-actions'
import prisma from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Order Details - Admin',
  description: 'View and manage order',
}

interface PageProps {
  params: Promise<{ id: string }>
}

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

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true }
      },
      user: true,
    },
  })

  if (!order) {
    notFound()
  }

  const shippingAddress = order.shippingAddress as {
    firstName: string
    lastName: string
    address: string
    apartment?: string
    city: string
    state: string
    postcode: string
    country: string
    phone?: string
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center text-sm text-slate-500 hover:text-sky-600 mb-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Orders
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-slate-500 mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={statusColors[order.status]} variant="outline">
              {order.status}
            </Badge>
            <Badge className={paymentStatusColors[order.paymentStatus]} variant="outline">
              Payment: {order.paymentStatus}
            </Badge>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="h-16 w-16 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="h-full w-full object-cover rounded-xl"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-sky-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">{item.product.name}</p>
                        <p className="text-sm text-slate-500">
                          {formatCurrency(Number(item.price))} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span>{formatCurrency(Number(order.subtotal))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shipping</span>
                    <span>
                      {Number(order.shippingCost) === 0 ? 'Free' : formatCurrency(Number(order.shippingCost))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">GST (included)</span>
                    <span>{formatCurrency(Number(order.gst))}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(Number(order.totalAmount))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Customer Information */}
          <FadeIn delay={0.15}>
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Contact Details</h4>
                    <div className="space-y-2">
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {order.email}
                      </p>
                      {order.phone && (
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {order.phone}
                        </p>
                      )}
                      {order.isGuest && (
                        <Badge variant="outline">Guest Customer</Badge>
                      )}
                      {order.user && (
                        <Badge variant="secondary">Registered Customer</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Shipping Address</h4>
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                        <p>{shippingAddress.address}</p>
                        {shippingAddress.apartment && <p>{shippingAddress.apartment}</p>}
                        <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postcode}</p>
                        <p>{shippingAddress.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Payment Details */}
          <FadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Payment Status</span>
                    <Badge className={paymentStatusColors[order.paymentStatus]}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  {order.stripePaymentIntent && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Stripe Payment Intent</span>
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                        {order.stripePaymentIntent}
                      </code>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Order Date</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          <FadeIn delay={0.1}>
            <OrderActions order={order} />
          </FadeIn>

          {/* Order Timeline */}
          <FadeIn delay={0.15}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.notes ? (
                  <p className="text-sm text-slate-600">{order.notes}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No notes added</p>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          {order.trackingNumber && (
            <FadeIn delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Tracking Number:</p>
                  <code className="text-sm font-medium bg-slate-100 px-2 py-1 rounded block mt-1">
                    {order.trackingNumber}
                  </code>
                </CardContent>
              </Card>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { StripeProvider } from '@/components/checkout/stripe-provider'
import { PaymentForm } from '@/components/checkout/payment-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'

interface ResumeOrder {
  id: string
  totalAmount: number
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
  }
}

function PaymentResume() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const clientSecret = searchParams.get('payment_intent_client_secret')
  const paymentIntentId = searchParams.get('payment_intent')

  const invalidLink = !orderId || !clientSecret || !paymentIntentId

  const [order, setOrder] = useState<ResumeOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (invalidLink) return

    fetch(`/api/checkout?orderId=${orderId}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok || !data.order) {
          throw new Error(data.error || 'Order not found')
        }
        const o = data.order
        // Already paid — nothing to do here, send them to their order.
        if (o.paymentStatus === 'SUCCEEDED') {
          router.replace(`/order/success?order_id=${o.id}`)
          return
        }
        setOrder({
          id: o.id,
          totalAmount: Number(o.totalAmount),
          status: o.status,
          paymentStatus: o.paymentStatus,
          shippingAddress: o.shippingAddress,
        })
      })
      .catch((err) => {
        console.error('Failed to load order for payment:', err)
        setError('We could not load this order. Please try again from your profile.')
      })
      .finally(() => setLoading(false))
  }, [invalidLink, orderId, router])

  if (invalidLink) {
    return (
      <FadeIn>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to load payment</h3>
            <p className="text-sm text-red-700 mb-4">
              This payment link is invalid or has expired.
            </p>
            <Button onClick={() => router.push('/profile#orders')} variant="outline">
              Go to My Orders
            </Button>
          </CardContent>
        </Card>
      </FadeIn>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !order || !clientSecret || !paymentIntentId) {
    return (
      <FadeIn>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to load payment</h3>
            <p className="text-sm text-red-700 mb-4">
              {error || 'This payment link is invalid or has expired.'}
            </p>
            <Button onClick={() => router.push('/profile#orders')} variant="outline">
              Go to My Orders
            </Button>
          </CardContent>
        </Card>
      </FadeIn>
    )
  }

  const addr = order.shippingAddress

  return (
    <FadeIn>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Completing payment for order {order.id.slice(0, 8).toUpperCase()}
            </CardTitle>
          </CardHeader>
          {addr && (
            <CardContent className="pt-0">
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {addr.firstName} {addr.lastName}
                </p>
                <p>{addr.address}</p>
                {addr.apartment && <p>{addr.apartment}</p>}
                <p>{addr.city}, {addr.state} {addr.postcode}</p>
              </div>
            </CardContent>
          )}
        </Card>

        <StripeProvider clientSecret={clientSecret}>
          <PaymentForm paymentIntentId={paymentIntentId} totalAmount={order.totalAmount} />
        </StripeProvider>
      </div>
    </FadeIn>
  )
}

export default function CheckoutPaymentPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-12 lg:px-8">
        <FadeIn>
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Complete Payment</h1>
        </FadeIn>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          }
        >
          <PaymentResume />
        </Suspense>
      </div>
    </div>
  )
}

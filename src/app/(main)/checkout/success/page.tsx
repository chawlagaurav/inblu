'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'
import { useCartStore } from '@/store/cart'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const clearCart = useCartStore((state) => state.clearCart)

  useEffect(() => {
    // Clear cart after successful payment
    clearCart()
  }, [clearCart])

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

            {sessionId && (
              <p className="text-sm text-slate-500 mb-6 bg-slate-100 rounded-xl p-3">
                Order ID: {sessionId.slice(0, 20)}...
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}

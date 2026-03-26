'use client'

import Link from 'next/link'
import { XCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <FadeIn>
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Payment Cancelled
            </h1>

            <p className="text-slate-600 mb-6">
              Your payment was cancelled. Don&apos;t worry, no charges were made to your account.
            </p>

            <p className="text-sm text-slate-500 mb-6">
              Your cart items have been saved. You can return to checkout whenever you&apos;re ready.
            </p>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/checkout">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/products">
                  Continue Shopping
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

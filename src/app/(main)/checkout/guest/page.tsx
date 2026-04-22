import { Metadata } from 'next'
import Link from 'next/link'
import { User } from 'lucide-react'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { OrderSummary } from '@/components/checkout/order-summary'
import { FadeIn } from '@/components/motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Guest Checkout',
  description: 'Complete your purchase as a guest.',
}

export default function GuestCheckoutPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <FadeIn>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Guest Checkout</h1>
          </div>
        </FadeIn>

        {/* Login prompt */}
        <FadeIn>
          <Card className="mb-8 border-slate-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Already have an account?</p>
                    <p className="text-sm text-slate-500">
                      Sign in to access saved addresses and track your orders
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/auth/login?redirect=/checkout">Sign In</Link>
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link href="/auth/signup?redirect=/checkout">Create Account</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <CheckoutForm isGuest={true} />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  )
}

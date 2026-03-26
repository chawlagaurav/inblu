import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { OrderSummary } from '@/components/checkout/order-summary'
import { FadeIn } from '@/components/motion'

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your purchase securely.',
}

export default async function CheckoutPage() {
  // Check if user is logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If not logged in, redirect to guest checkout
  if (!user) {
    redirect('/checkout/guest')
  }

  // Get user details for prefilling form
  const userDetails = {
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name,
    phone: user.user_metadata?.phone,
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <FadeIn>
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <CheckoutForm isGuest={false} userDetails={userDetails} />
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

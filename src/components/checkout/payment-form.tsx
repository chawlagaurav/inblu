'use client'

import { useState, FormEvent } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, CreditCard, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCartStore } from '@/store/cart'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PaymentFormProps {
  orderId: string
  totalAmount: number
}

type PaymentTab = 'stripe' | 'paypal'

export function PaymentForm({ orderId, totalAmount }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PaymentTab>('stripe')
  const clearCart = useCartStore((state) => state.clearCart)

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  const handleStripeSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/success?order_id=${orderId}`,
        },
        redirect: 'if_required',
      })

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message || 'Payment failed')
        } else {
          setErrorMessage('An unexpected error occurred')
        }
        toast.error(error.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        clearCart()
        toast.success('Payment successful!')
        router.push(`/order/success?order_id=${orderId}`)
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        clearCart()
        toast.info('Payment is processing...')
        router.push(`/order/success?order_id=${orderId}`)
      } else {
        clearCart()
      }
    } catch (err) {
      console.error('Payment error:', err)
      setErrorMessage('Failed to process payment')
      toast.error('Failed to process payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayPalCreateOrder = async (): Promise<string> => {
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      return data.paypalOrderId
    } catch (error) {
      console.error('PayPal create order error:', error)
      toast.error('Failed to initialize PayPal payment')
      throw error
    }
  }

  const handlePayPalApprove = async (data: { orderID: string }) => {
    try {
      setIsProcessing(true)
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalOrderId: data.orderID,
          orderId,
        }),
      })

      const result = await response.json()

      if (result.error) throw new Error(result.error)

      if (result.status === 'COMPLETED') {
        clearCart()
        toast.success('Payment successful!')
        router.push(`/order/success?order_id=${orderId}`)
      } else {
        toast.info('Payment is being processed...')
        router.push(`/order/success?order_id=${orderId}`)
      }
    } catch (error) {
      console.error('PayPal capture error:', error)
      setErrorMessage('Failed to process PayPal payment')
      toast.error('PayPal payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-2 text-slate-700 mb-2">
            <CreditCard className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Payment Method</h3>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveTab('stripe'); setErrorMessage(null) }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
                activeTab === 'stripe'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <CreditCard className="h-4 w-4" />
              Card / Klarna / Afterpay
            </button>
            {paypalClientId && (
              <button
                type="button"
                onClick={() => { setActiveTab('paypal'); setErrorMessage(null) }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'paypal'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.964L7.076 21.337z"/>
                  <path d="M18.833 6.4c-.01.07-.023.14-.034.21-.982 5.049-4.348 6.797-8.646 6.797H8.32c-.563 0-1.04.408-1.13.963l-1.187 7.527a.538.538 0 0 0 .532.624h3.73c.493 0 .912-.358.99-.843l.04-.217.785-4.977.05-.273a1.003 1.003 0 0 1 .99-.843h.624c4.043 0 7.205-1.642 8.13-6.393.386-1.983.186-3.64-.836-4.804a3.833 3.833 0 0 0-1.135-.77z"/>
                </svg>
                PayPal
              </button>
            )}
          </div>

          {/* Stripe Payment */}
          {activeTab === 'stripe' && (
            <form onSubmit={handleStripeSubmit} id="stripe-form">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: ['card', 'apple_pay', 'klarna', 'afterpay_clearpay'],
                  wallets: {
                    applePay: 'auto',
                    googlePay: 'auto',
                  },
                }}
              />
            </form>
          )}

          {/* PayPal Payment */}
          {activeTab === 'paypal' && paypalClientId && (
            <PayPalScriptProvider
              options={{
                clientId: paypalClientId,
                currency: 'AUD',
                intent: 'capture',
              }}
            >
              <div className="py-2">
                <PayPalButtons
                  style={{
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'paypal',
                    height: 48,
                  }}
                  createOrder={handlePayPalCreateOrder}
                  onApprove={handlePayPalApprove}
                  onError={(err) => {
                    console.error('PayPal error:', err)
                    setErrorMessage('PayPal encountered an error. Please try again.')
                    toast.error('PayPal error. Please try again.')
                  }}
                  onCancel={() => {
                    toast.info('PayPal payment cancelled')
                  }}
                  disabled={isProcessing}
                />
                <p className="text-center text-xs text-slate-400 mt-3">
                  You will be redirected to PayPal to complete your payment
                </p>
              </div>
            </PayPalScriptProvider>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {errorMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe pay button (only shown for Stripe tab) */}
      {activeTab === 'stripe' && (
        <Button
          type="submit"
          form="stripe-form"
          size="lg"
          className="w-full"
          disabled={!stripe || !elements || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-5 w-5 mr-2" />
              Pay {formatCurrency(totalAmount)}
            </>
          )}
        </Button>
      )}

      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <ShieldCheck className="h-4 w-4" />
        <span>Secure checkout</span>
      </div>

      <div className="grid grid-cols-5 gap-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-center p-2 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-600 font-medium">Visa</span>
        </div>
        <div className="flex items-center justify-center p-2 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-600 font-medium">Mastercard</span>
        </div>
        <div className="flex items-center justify-center p-2 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-600 font-medium">PayPal</span>
        </div>
        <div className="flex items-center justify-center p-2 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-600 font-medium">Klarna</span>
        </div>
        <div className="flex items-center justify-center p-2 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-600 font-medium">Afterpay</span>
        </div>
      </div>
    </div>
  )
}

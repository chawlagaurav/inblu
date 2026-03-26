'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User, MapPin, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/motion'
import { StripeProvider } from './stripe-provider'
import { PaymentForm } from './payment-form'
import { AddressAutocomplete } from './address-autocomplete'
import { useCartStore } from '@/store/cart'
import { ShippingAddress, CheckoutResponse } from '@/types'
import { toast } from 'sonner'
import { formatCurrency, calculateGST } from '@/lib/utils'

const australianStates = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
]

interface CheckoutFormProps {
  isGuest?: boolean
  userDetails?: {
    email?: string
    name?: string
    phone?: string
  }
}

export function CheckoutForm({ isGuest = false, userDetails }: CheckoutFormProps) {
  const router = useRouter()
  const { items, getTotal, appliedCoupon } = useCartStore()
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null)
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  
  const [formData, setFormData] = useState<ShippingAddress & { email: string }>({
    email: userDetails?.email || '',
    firstName: userDetails?.name?.split(' ')[0] || '',
    lastName: userDetails?.name?.split(' ').slice(1).join(' ') || '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia',
    phone: userDetails?.phone || '',
  })

  // Prefill with user details when available
  useEffect(() => {
    if (userDetails) {
      setFormData(prev => ({
        ...prev,
        email: userDetails.email || prev.email,
        firstName: userDetails.name?.split(' ')[0] || prev.firstName,
        lastName: userDetails.name?.split(' ').slice(1).join(' ') || prev.lastName,
        phone: userDetails.phone || prev.phone,
      }))
    }
  }, [userDetails])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAddressSelect = useCallback((components: {
    address: string
    city: string
    state: string
    postcode: string
    country: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      address: components.address,
      city: components.city,
      state: components.state,
      postcode: components.postcode,
    }))
  }, [])

  const subtotal = getTotal()
  const discountAmount = appliedCoupon?.discountAmount || 0
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const shipping = afterDiscount >= 100 ? 0 : (afterDiscount === 0 ? 0 : 9.95)
  const total = afterDiscount + shipping

  const handleSubmitShipping = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Validate form
    if (!formData.email || !formData.firstName || !formData.lastName || 
        !formData.address || !formData.city || !formData.state || !formData.postcode) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            imageUrl: item.product.imageUrl,
          })),
          shippingAddress: formData,
          email: formData.email,
          isGuest,
          couponCode: appliedCoupon?.code || null,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.clientSecret && data.orderId) {
        setCheckoutData(data)
        setStep('payment')
        toast.success('Shipping details saved!')
      } else {
        throw new Error('Failed to create payment session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process checkout')
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <FadeIn>
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Your cart is empty</h3>
            <p className="text-slate-500 mb-4">Add some products to proceed with checkout.</p>
            <Button onClick={() => router.push('/products')}>Browse Products</Button>
          </CardContent>
        </Card>
      </FadeIn>
    )
  }

  // Payment step
  if (step === 'payment' && checkoutData) {
    return (
      <FadeIn>
        <div className="space-y-6">
          {/* Order Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Shipping to</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('shipping')
                    setCheckoutData(null)
                  }}
                >
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {formData.firstName} {formData.lastName}
                </p>
                <p>{formData.address}</p>
                {formData.apartment && <p>{formData.apartment}</p>}
                <p>{formData.city}, {formData.state} {formData.postcode}</p>
                <p>{formData.email}</p>
                {formData.phone && <p>{formData.phone}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <StripeProvider clientSecret={checkoutData.clientSecret}>
            <PaymentForm 
              orderId={checkoutData.orderId}
              totalAmount={total}
            />
          </StripeProvider>
        </div>
      </FadeIn>
    )
  }

  // Shipping step
  return (
    <FadeIn>
      <form onSubmit={handleSubmitShipping} className="space-y-6">
        {/* Guest Checkout Notice */}
        {isGuest && (
          <Card className="border-sky-200 bg-sky-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-sky-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-sky-900">Guest Checkout</p>
                  <p className="text-sm text-sky-700">
                    You&apos;re checking out as a guest. Create an account to track your orders.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="04XX XXX XXX"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Street Address *</Label>
              <div className="mt-1">
                <AddressAutocomplete
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={(value) => setFormData({ ...formData, address: value })}
                  onAddressSelect={handleAddressSelect}
                  placeholder="Start typing your address..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="apartment">Apartment, unit, etc. (optional)</Label>
              <Input
                id="apartment"
                name="apartment"
                value={formData.apartment}
                onChange={handleChange}
                placeholder="Apt 4B"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City / Suburb *</Label>
                <Input
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {australianStates.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="postcode">Postcode *</Label>
                <Input
                  id="postcode"
                  name="postcode"
                  required
                  value={formData.postcode}
                  onChange={handleChange}
                  placeholder="2000"
                  pattern="[0-9]{4}"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                value="Australia"
                disabled
                className="mt-1 bg-slate-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Continue to Payment
            </>
          )}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Secure checkout powered by Stripe
        </p>
      </form>
    </FadeIn>
  )
}

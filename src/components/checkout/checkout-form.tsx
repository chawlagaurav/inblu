'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, User, MapPin, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react'
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
  const [emailExists, setEmailExists] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ email?: string; phone?: string }>({})
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Refs for form fields to enable scrolling
  const formRef = useRef<HTMLFormElement>(null)

  // Release the server-side checkout session (reservation + unpaid PaymentIntent).
  // The cart items are intentionally kept so the customer can check out again.
  const cancelCheckoutSession = useCallback(() => {
    if (!checkoutData) return
    fetch('/api/checkout/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservationSessionId: checkoutData.reservationSessionId,
        paymentIntentId: checkoutData.paymentIntentId,
      }),
      keepalive: true,
    }).catch(() => {})
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('reservationSessionId')
    }
  }, [checkoutData])

  // Best-effort cleanup if the customer closes the tab on the payment step.
  useEffect(() => {
    if (!checkoutData) return
    const handleBeforeUnload = () => {
      // Only release the stock reservation here — do NOT cancel the PaymentIntent,
      // because a 3DS/redirect payment also navigates away and must not be killed.
      const payload = JSON.stringify({
        reservationSessionId: checkoutData.reservationSessionId,
      })
      navigator.sendBeacon?.(
        '/api/checkout/cancel',
        new Blob([payload], { type: 'application/json' })
      )
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [checkoutData])

  const handleBackClick = () => {
    if (step === 'payment' && checkoutData) {
      setShowCancelConfirm(true)
    } else {
      router.push('/products')
    }
  }

  const confirmCancelCheckout = () => {
    cancelCheckoutSession()
    setShowCancelConfirm(false)
    setCheckoutData(null)
    setStep('shipping')
    router.push('/products')
  }
  
  // Helper function to scroll to a field and focus it
  const scrollToField = (fieldId: string) => {
    const element = document.getElementById(fieldId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        element.focus()
      }, 300) // Small delay to let scroll complete
    }
  }
  
  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    // Australian phone formats: 04xx xxx xxx, +61 4xx xxx xxx, or landlines
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    const ausPhoneRegex = /^(\+?61|0)?[2-9]\d{8}$/
    return ausPhoneRegex.test(cleanPhone)
  }

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
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    
    // Reset email exists state when email changes
    if (name === 'email') {
      setEmailExists(false)
      // Validate email format
      if (value && !validateEmail(value)) {
        setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      } else {
        setValidationErrors(prev => ({ ...prev, email: undefined }))
      }
    }
    
    // Validate phone format
    if (name === 'phone') {
      if (value && !validatePhone(value)) {
        setValidationErrors(prev => ({ ...prev, phone: 'Please enter a valid Australian phone number' }))
      } else {
        setValidationErrors(prev => ({ ...prev, phone: undefined }))
      }
    }
  }

  const checkEmailExists = async (email: string) => {
    if (!isGuest || !email || !email.includes('@')) return
    
    setIsCheckingEmail(true)
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      setEmailExists(data.exists)
    } catch (error) {
      console.error('Failed to check email:', error)
    } finally {
      setIsCheckingEmail(false)
    }
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

    // Check if email exists for guest checkout
    if (isGuest && emailExists) {
      toast.error('This email is already registered. Please log in to continue.')
      scrollToField('email')
      return
    }

    // Validate email format
    if (!formData.email) {
      setValidationErrors(prev => ({ ...prev, email: 'Email is required' }))
      toast.error('Please enter your email address')
      scrollToField('email')
      return
    }
    
    if (!validateEmail(formData.email)) {
      setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      toast.error('Please enter a valid email address')
      scrollToField('email')
      return
    }

    // Validate phone - required and must be valid format
    if (!formData.phone) {
      setValidationErrors(prev => ({ ...prev, phone: 'Phone number is required' }))
      toast.error('Please enter your phone number')
      scrollToField('phone')
      return
    }
    
    if (!validatePhone(formData.phone)) {
      setValidationErrors(prev => ({ ...prev, phone: 'Please enter a valid Australian phone number' }))
      toast.error('Please enter a valid Australian phone number (e.g., 0412 345 678)')
      scrollToField('phone')
      return
    }

    // Validate other required fields
    if (!formData.firstName) {
      toast.error('Please enter your first name')
      scrollToField('firstName')
      return
    }
    
    if (!formData.lastName) {
      toast.error('Please enter your last name')
      scrollToField('lastName')
      return
    }
    
    if (!formData.address) {
      toast.error('Please enter your street address')
      scrollToField('address')
      return
    }
    
    if (!formData.city) {
      toast.error('Please enter your city/suburb')
      scrollToField('city')
      return
    }
    
    if (!formData.state) {
      toast.error('Please select your state')
      scrollToField('state')
      return
    }
    
    if (!formData.postcode) {
      toast.error('Please enter your postcode')
      scrollToField('postcode')
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

      // Handle stock unavailability
      if (response.status === 409 && data.unavailableItems) {
        const unavailable = data.unavailableItems
        if (unavailable.length === 1) {
          toast.error(`${unavailable[0].productName}: ${unavailable[0].reason}`)
        } else {
          toast.error(`${unavailable.length} items are no longer available. Please update your cart.`)
        }
        return
      }

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.clientSecret && data.paymentIntentId) {
        setCheckoutData(data)
        // Remember this checkout's reservation session so the cart drawer can
        // exclude it from stock checks (otherwise the items being paid for show
        // as "Sold out" against the customer's own reservation).
        if (data.reservationSessionId && typeof window !== 'undefined') {
          sessionStorage.setItem('reservationSessionId', data.reservationSessionId)
        }
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
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

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
              paymentIntentId={checkoutData.paymentIntentId}
              totalAmount={total}
              reservationExpiresAt={checkoutData.reservationExpiresAt}
              onReservationExpired={() => {
                toast.error('Your reservation has expired. Please start checkout again.')
                cancelCheckoutSession()
                setStep('shipping')
                setCheckoutData(null)
              }}
            />
          </StripeProvider>
        </div>

        {/* Cancel checkout confirmation */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCancelConfirm(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Cancel checkout?</h3>
              <p className="text-sm text-slate-600 mb-6">
                Your payment hasn&apos;t been completed. Your items will stay in your cart so
                you can check out again later.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  Keep paying
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmCancelCheckout}
                >
                  Cancel checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </FadeIn>
    )
  }

  // Shipping step
  return (
    <FadeIn>
      <form onSubmit={handleSubmitShipping} className="space-y-6">
        <button
          type="button"
          onClick={handleBackClick}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Guest Checkout Notice */}
        {isGuest && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Guest Checkout</p>
                  <p className="text-sm text-blue-700">
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
                onBlur={(e) => checkEmailExists(e.target.value)}
                placeholder="you@example.com"
                className={`mt-1 ${emailExists || validationErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {validationErrors.email && !emailExists && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
              )}
              {isCheckingEmail && (
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking email...
                </p>
              )}
              {emailExists && !isCheckingEmail && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-amber-800 font-medium">Account already exists</p>
                      <p className="text-amber-700 mt-1">
                        An account with this email already exists.{' '}
                        <Link 
                          href={`/auth/login?redirect=/checkout&email=${encodeURIComponent(formData.email)}`}
                          className="text-blue-600 hover:text-blue-700 underline font-medium"
                        >
                          Log in to continue
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                className={`mt-1 ${validationErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {validationErrors.phone && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
              )}
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
                  <SelectTrigger id="state" className="mt-1">
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
      </form>
    </FadeIn>
  )
}

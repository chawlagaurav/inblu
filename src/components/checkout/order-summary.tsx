'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingBag, Tag, Loader2, X, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion'
import { useCartStore } from '@/store/cart'
import { formatCurrency, calculateGST } from '@/lib/utils'
import { toast } from 'sonner'

const SHIPPING_THRESHOLD = 100
const SHIPPING_COST = 9.95

export function OrderSummary() {
  const { items, getTotal, appliedCoupon, applyCoupon, removeCoupon } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const subtotal = getTotal()
  const discountAmount = appliedCoupon?.discountAmount || 0
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const shipping = afterDiscount >= SHIPPING_THRESHOLD ? 0 : (afterDiscount === 0 ? 0 : SHIPPING_COST)
  const gstAmount = calculateGST(afterDiscount + shipping)
  const total = afterDiscount + shipping

  if (!mounted) {
    return (
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Separator />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <FadeIn delay={0.1}>
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          {items.length > 0 ? (
            <ul className="space-y-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <li key={item.product.id} className="flex gap-3">
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
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              Your cart is empty
            </p>
          )}

          <Separator />

          {/* Coupon Code */}
          <CouponInput
            subtotal={subtotal}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            couponError={couponError}
            setCouponError={setCouponError}
            isValidating={isValidating}
            setIsValidating={setIsValidating}
            appliedCoupon={appliedCoupon}
            applyCoupon={applyCoupon}
            removeCoupon={removeCoupon}
          />

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">
                  Discount ({appliedCoupon.code})
                </span>
                <span className="text-green-600">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Shipping</span>
              <span className="text-slate-900">
                {shipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  formatCurrency(shipping)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">GST (included)</span>
              <span className="text-slate-900">{formatCurrency(gstAmount)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-base font-semibold text-slate-900">Total</span>
            <span className="text-xl font-bold text-slate-900">
              {formatCurrency(total)}
            </span>
          </div>

          {subtotal < SHIPPING_THRESHOLD && subtotal > 0 && !appliedCoupon && (
            <p className="text-sm text-sky-600 text-center bg-sky-50 rounded-xl p-3">
              Add {formatCurrency(SHIPPING_THRESHOLD - subtotal)} more for free shipping!
            </p>
          )}

          <p className="text-xs text-slate-500 text-center">
            All prices are in AUD and include GST
          </p>
        </CardContent>
      </Card>
    </FadeIn>
  )
}

function CouponInput({
  subtotal,
  couponCode,
  setCouponCode,
  couponError,
  setCouponError,
  isValidating,
  setIsValidating,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
}: {
  subtotal: number
  couponCode: string
  setCouponCode: (v: string) => void
  couponError: string | null
  setCouponError: (v: string | null) => void
  isValidating: boolean
  setIsValidating: (v: boolean) => void
  appliedCoupon: { code: string; discountType: string; discountValue: number; discountAmount: number; description?: string } | null
  applyCoupon: (coupon: { code: string; discountType: string; discountValue: number; discountAmount: number; description?: string }) => void
  removeCoupon: () => void
}) {
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return

    setIsValidating(true)
    setCouponError(null)

    try {
      const response = await fetch('/api/checkout/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderSubtotal: subtotal,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setCouponError(data.error || 'Invalid coupon code')
        return
      }

      applyCoupon({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: data.discountAmount,
        description: data.description,
      })
      setCouponCode('')
      toast.success(`Coupon "${data.code}" applied! You save ${formatCurrency(data.discountAmount)}`)
    } catch {
      setCouponError('Failed to validate coupon')
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
    setCouponError(null)
    toast.info('Coupon removed')
  }

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">{appliedCoupon.code}</p>
              <p className="text-xs text-green-600">
                {appliedCoupon.discountType === 'percentage'
                  ? `${appliedCoupon.discountValue}% off`
                  : `$${appliedCoupon.discountValue.toFixed(2)} off`}
                {appliedCoupon.description && ` — ${appliedCoupon.description}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="p-1 text-green-600 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Tag className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Coupon Code</span>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Enter code"
          value={couponCode}
          onChange={(e) => {
            setCouponCode(e.target.value.toUpperCase())
            if (couponError) setCouponError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleApplyCoupon()
            }
          }}
          className="flex-1 text-sm uppercase"
          disabled={isValidating}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleApplyCoupon}
          disabled={isValidating || !couponCode.trim()}
          className="px-4"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      {couponError && (
        <p className="text-xs text-red-500 mt-1.5">{couponError}</p>
      )}
    </div>
  )
}

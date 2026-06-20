'use client'

/**
 * Admin form card for setting per-product sale price / percentage discount.
 *
 * The shape of the form-data slice we touch is loose — both the new and edit
 * product pages keep their state as a single useState'd object that contains
 * many other fields. We require only the four fields we read/write and avoid
 * imposing a stricter type so the same component plugs into both pages.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPriceBreakdown } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'

export interface SaleDiscountFormShape {
  price: string
  isOnSale: boolean
  discountMode: 'percent' | 'fixed'
  discountPercent: string
  salePrice: string
  excludeFromCoupons: boolean
}

interface SaleDiscountCardProps<T extends SaleDiscountFormShape> {
  formData: T
  setFormData: React.Dispatch<React.SetStateAction<T>>
}

export function SaleDiscountCard<T extends SaleDiscountFormShape>({
  formData,
  setFormData,
}: SaleDiscountCardProps<T>) {
  const priceNum = parseFloat(formData.price) || 0
  const percentNum = formData.discountPercent === '' ? null : parseInt(formData.discountPercent)
  const saleNum = formData.salePrice === '' ? null : parseFloat(formData.salePrice)

  // Live-preview using the same helper the storefront and server use.
  const breakdown = getPriceBreakdown({
    price: priceNum,
    isOnSale: formData.isOnSale,
    discountPercent: formData.discountMode === 'percent'
      ? (percentNum != null && !Number.isNaN(percentNum) ? percentNum : null)
      : null,
    salePrice: formData.discountMode === 'fixed'
      ? (saleNum != null && !Number.isNaN(saleNum) ? saleNum : null)
      : null,
  })

  const setMode = (mode: 'percent' | 'fixed') => {
    // Switching modes nulls out the *other* field so we never submit both.
    setFormData((prev) => ({
      ...prev,
      discountMode: mode,
      ...(mode === 'percent' ? { salePrice: '' } : { discountPercent: '' }),
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sale &amp; Discount</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isOnSale}
            onChange={(e) => setFormData((prev) => ({ ...prev, isOnSale: e.target.checked }))}
            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-800">Put this product on sale</span>
        </label>

        <div className={formData.isOnSale ? '' : 'opacity-50 pointer-events-none'}>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountMode"
                value="percent"
                checked={formData.discountMode === 'percent'}
                onChange={() => setMode('percent')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Percentage off</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discountMode"
                value="fixed"
                checked={formData.discountMode === 'fixed'}
                onChange={() => setMode('fixed')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Fixed sale price</span>
            </label>
          </div>

          <div className="mt-3">
            {formData.discountMode === 'percent' ? (
              <div>
                <Label htmlFor="discountPercent">Discount %</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  value={formData.discountPercent}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discountPercent: e.target.value }))}
                  className="mt-1 w-full sm:w-40"
                  placeholder="e.g. 20"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="salePrice">Sale price (AUD)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.salePrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, salePrice: e.target.value }))}
                  className="mt-1 w-full sm:w-40"
                  placeholder="e.g. 80.00"
                />
              </div>
            )}
          </div>
        </div>

        {/* Live preview */}
        {formData.isOnSale && breakdown.isOnSale ? (
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm">
            <span className="text-slate-700">Customers will pay </span>
            <span className="font-semibold text-blue-700">{formatCurrency(breakdown.effectivePrice)}</span>
            <span className="text-slate-500"> (was {formatCurrency(breakdown.originalPrice)}, saving {formatCurrency(breakdown.discountAmount)} / {breakdown.discountPercent}%)</span>
          </div>
        ) : formData.isOnSale ? (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm text-amber-700">
            Enter a valid discount value to enable the sale.
          </div>
        ) : null}

        {/* Coupon eligibility — independent of the on-sale toggle. Use this to
            mark items that should never be discounted by a coupon code (e.g.
            already-clearance items, fixed-margin SKUs). */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-2">
            Coupon eligibility
          </p>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.excludeFromCoupons}
              onChange={(e) => setFormData((prev) => ({ ...prev, excludeFromCoupons: e.target.checked }))}
              className="mt-0.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Exclude this product from all coupon codes
              <span className="block text-xs text-slate-500 mt-0.5">
                Coupons applied to a cart that contains this product will skip
                this line. Other items in the cart still get discounted normally.
              </span>
            </span>
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

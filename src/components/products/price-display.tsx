/**
 * Two small composable pieces for rendering a product's price across the
 * storefront:
 *
 * - <PriceDisplay/> renders the bold sale price next to a struck-through
 *   original (or just the price when not on sale).
 * - <SaleBadge/> is the small "-20% OFF" / "SAVE $X" pill that sits on a
 *   product image. Returns `null` when not on sale; the caller positions it.
 *
 * Both consume the same `getPriceBreakdown` helper, so percent-mode and
 * fixed-mode discounts always agree on what's displayed.
 */

import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { getPriceBreakdown, type PriceableProduct } from '@/lib/pricing'

interface PriceDisplayProps {
  product: PriceableProduct
  /** Controls font size of the primary price. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg'
  /** Hide the sale badge — useful inside cart line items where there's no image. */
  className?: string
}

const SIZE_TO_CLASS: Record<NonNullable<PriceDisplayProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
}

const STRIKE_SIZE_TO_CLASS: Record<NonNullable<PriceDisplayProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function PriceDisplay({ product, size = 'md', className }: PriceDisplayProps) {
  const breakdown = getPriceBreakdown(product)
  const sizeClass = SIZE_TO_CLASS[size]
  const strikeClass = STRIKE_SIZE_TO_CLASS[size]

  if (!breakdown.isOnSale) {
    return (
      <span className={cn('font-bold text-slate-900', sizeClass, className)}>
        {formatCurrency(breakdown.originalPrice)}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className={cn('font-bold text-red-600', sizeClass)}>
        {formatCurrency(breakdown.effectivePrice)}
      </span>
      <s className={cn('text-slate-400', strikeClass)}>
        {formatCurrency(breakdown.originalPrice)}
      </s>
    </span>
  )
}

interface SaleBadgeProps {
  product: PriceableProduct
  className?: string
}

/**
 * Pill badge for the product image. Returns `null` when not on sale so the
 * caller doesn't need to guard.
 *
 * Wording follows admin's intent: percent-mode shows `-20% OFF`, fixed-mode
 * shows `SAVE $X` where $X is `originalPrice - effectivePrice`.
 */
export function SaleBadge({ product, className }: SaleBadgeProps) {
  const breakdown = getPriceBreakdown(product)
  if (!breakdown.isOnSale) return null

  const label = breakdown.mode === 'fixed'
    ? `SAVE ${formatCurrency(breakdown.discountAmount)}`
    : `-${breakdown.discountPercent}% OFF`

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow',
        className
      )}
    >
      {label}
    </span>
  )
}

/**
 * Shared service-due date logic.
 *
 * Service windows apply only to *serviceable* products (water purifier units,
 * etc.). Consumables — filter kits, spare parts — carry `isServiceable = false`
 * and must never create or extend an order's service-due date, even if they
 * happen to have a non-zero `serviceTenureMonths`.
 */

export interface ServiceableItem {
  serviceTenureMonths: number | null
  isServiceable: boolean
}

/**
 * Returns the maximum service tenure (in months) across the serviceable items
 * of an order, or `null` when the order has no serviceable items (→ no service
 * window at all). Consumables are ignored entirely.
 */
export function maxServiceableTenure(items: ServiceableItem[]): number | null {
  const tenures = items
    .filter((i) => i.isServiceable)
    .map((i) => i.serviceTenureMonths || 6)
  return tenures.length > 0 ? Math.max(...tenures) : null
}

/** Returns a new Date `months` months after `base` (does not mutate `base`). */
export function addMonths(base: Date, months: number): Date {
  const d = new Date(base)
  d.setMonth(d.getMonth() + months)
  return d
}

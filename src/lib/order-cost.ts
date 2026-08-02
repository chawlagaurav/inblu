import type { PrismaClient } from '@prisma/client'
import type prisma from '@/lib/prisma'

// Accept either the default prisma client or a transaction client.
type Db = typeof prisma | PrismaClient

export interface OrderCostResult {
  // Sum of (qty x purchase unit cost) across the order's items, using the PO
  // unit cost that was current on/before the order date. null when ANY item
  // has no qualifying PO cost (partial data would be misleading).
  purchasePrice: number | null
  // sellingTotal - purchasePrice. null when purchasePrice is null.
  margin: number | null
  // margin / sellingTotal * 100. null when purchasePrice is null or selling <= 0.
  marginPercent: number | null
}

interface CostPoint {
  unitCost: number
  createdAt: Date
}

/**
 * Builds a lookup of purchase-cost history for the given products from
 * InventoryTransaction rows that originated from purchase orders.
 *
 * Purchase price is not a fixed attribute of a Product — it is recorded per PO
 * in InventoryTransaction.unitCost and varies over time. This fetches all
 * qualifying cost points once (a single query) so per-order cost can be
 * resolved as-of the order date without N+1 queries.
 */
export async function buildProductCostHistory(
  db: Db,
  productIds: string[]
): Promise<Map<string, CostPoint[]>> {
  const map = new Map<string, CostPoint[]>()
  if (productIds.length === 0) return map

  const rows = await db.inventoryTransaction.findMany({
    where: {
      referenceType: 'PO',
      unitCost: { not: null },
      productId: { in: productIds },
    },
    select: { productId: true, unitCost: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  for (const row of rows) {
    if (row.unitCost == null) continue
    const list = map.get(row.productId) ?? []
    list.push({ unitCost: Number(row.unitCost), createdAt: row.createdAt })
    map.set(row.productId, list)
  }
  return map
}

/**
 * Returns the purchase unit cost for a product as-of a given date: the most
 * recent PO cost recorded on or before `asOf`. Returns null if no such cost
 * exists (product never bought via a logged PO before that date).
 */
export function costAsOf(
  history: Map<string, CostPoint[]>,
  productId: string,
  asOf: Date
): number | null {
  const points = history.get(productId)
  if (!points || points.length === 0) return null
  // points are ascending by createdAt; take the last one at or before asOf.
  let result: number | null = null
  for (const p of points) {
    if (p.createdAt <= asOf) result = p.unitCost
    else break
  }
  return result
}

/**
 * Computes purchase price and margin for a single order given its items and
 * the shared cost history. `sellingTotal` is the order's totalAmount (the
 * "Selling Price"), so margin reconciles with what is displayed.
 */
export function computeOrderCost(
  history: Map<string, CostPoint[]>,
  items: Array<{ productId: string; quantity: number }>,
  orderDate: Date,
  sellingTotal: number
): OrderCostResult {
  let purchasePrice = 0
  for (const item of items) {
    const unit = costAsOf(history, item.productId, orderDate)
    if (unit == null) {
      // Any item without a known cost makes the whole order's cost unknown.
      return { purchasePrice: null, margin: null, marginPercent: null }
    }
    purchasePrice += unit * item.quantity
  }

  const margin = sellingTotal - purchasePrice
  const marginPercent = sellingTotal > 0 ? (margin / sellingTotal) * 100 : null
  return { purchasePrice, margin, marginPercent }
}

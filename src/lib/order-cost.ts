import type { PrismaClient } from '@prisma/client'
import type prisma from '@/lib/prisma'

// Accept either the default prisma client or a transaction client.
type Db = typeof prisma | PrismaClient

// Where a resolved unit cost came from, weakest-last for aggregation.
export type CostSource = 'po-asof' | 'po-latest' | 'manual' | 'none'

// Ordering used to pick the "weakest" (least certain) source across an order's
// items — a higher index means less certain.
const SOURCE_RANK: Record<CostSource, number> = {
  'po-asof': 0,
  'po-latest': 1,
  manual: 2,
  none: 3,
}

export interface OrderCostResult {
  // Sum of (qty x resolved unit cost) across the order's items. null when ANY
  // item has no cost from any source (partial data would be misleading).
  purchasePrice: number | null
  // sellingTotal - purchasePrice. null when purchasePrice is null.
  margin: number | null
  // margin / sellingTotal * 100. null when purchasePrice is null or selling <= 0.
  marginPercent: number | null
  // Weakest cost source used across the order's items (drives the UI tag).
  costSource: CostSource
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
 * Builds a lookup of the admin-maintained fallback cost (`Product.costPrice`)
 * for the given products, in one query. Products with no costPrice are omitted.
 */
export async function buildCostPriceMap(
  db: Db,
  productIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (productIds.length === 0) return map

  const rows = await db.product.findMany({
    where: { id: { in: productIds }, costPrice: { not: null } },
    select: { id: true, costPrice: true },
  })
  for (const row of rows) {
    if (row.costPrice == null) continue
    map.set(row.id, Number(row.costPrice))
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
 * Resolves a product's purchase unit cost through the fallback chain:
 *   1. PO cost as-of the order date   (source 'po-asof')
 *   2. product's most recent PO cost  (source 'po-latest')
 *   3. manual Product.costPrice       (source 'manual')
 *   4. none                           (source 'none', cost null)
 */
export function resolveUnitCost(
  history: Map<string, CostPoint[]>,
  costPriceMap: Map<string, number>,
  productId: string,
  orderDate: Date
): { cost: number | null; source: CostSource } {
  const asOf = costAsOf(history, productId, orderDate)
  if (asOf != null) return { cost: asOf, source: 'po-asof' }

  const points = history.get(productId)
  if (points && points.length > 0) {
    // points are ascending by createdAt → last is the most recent PO cost.
    return { cost: points[points.length - 1].unitCost, source: 'po-latest' }
  }

  const manual = costPriceMap.get(productId)
  if (manual != null) return { cost: manual, source: 'manual' }

  return { cost: null, source: 'none' }
}

/**
 * Computes purchase price, margin, and the cost source for a single order.
 * `sellingTotal` is the order's totalAmount (the "Selling Price"), so margin
 * reconciles with what is displayed. `costSource` is the weakest (least
 * certain) source used across the order's items.
 */
export function computeOrderCost(
  history: Map<string, CostPoint[]>,
  costPriceMap: Map<string, number>,
  items: Array<{ productId: string; quantity: number }>,
  orderDate: Date,
  sellingTotal: number
): OrderCostResult {
  let purchasePrice = 0
  let worst: CostSource = 'po-asof'
  for (const item of items) {
    const { cost, source } = resolveUnitCost(history, costPriceMap, item.productId, orderDate)
    if (SOURCE_RANK[source] > SOURCE_RANK[worst]) worst = source
    if (cost == null) {
      // Any item without a known cost makes the whole order's cost unknown.
      return { purchasePrice: null, margin: null, marginPercent: null, costSource: 'none' }
    }
    purchasePrice += cost * item.quantity
  }

  const margin = sellingTotal - purchasePrice
  const marginPercent = sellingTotal > 0 ? (margin / sellingTotal) * 100 : null
  return { purchasePrice, margin, marginPercent, costSource: worst }
}

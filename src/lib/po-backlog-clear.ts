import type { Prisma } from '@prisma/client'

/**
 * Clear `isBacklog` on orders that become fully fulfillable after a PO's stock
 * increments. Called from the POST and PUT handlers for purchase orders,
 * inside the same Prisma transaction that bumps `product.stock`.
 *
 * Why this is shaped the way it is
 * --------------------------------
 * When a customer checks out without enough stock, `finalizePaidOrder` (in
 * checkout-intent.ts) still decrements `product.stock` for every item —
 * which means a backlog order's units have ALREADY been pulled from the
 * stock counter, taking it negative. Example: stock=2, customer orders 5 →
 * after checkout stock=-3, and the order is flagged `isBacklog: true`.
 *
 * When the admin uploads a PO that adds 5 units, the same counter goes
 * stock=-3 → stock=+2. The backlog order's deficit is gone — every product
 * in that order now has `stock >= 0`, meaning the warehouse can physically
 * fulfil it.
 *
 * So the clearing rule is simply: for each backlog order that contains any
 * of the PO's products, refetch ALL its items' current stock; if every one
 * is `>= 0`, the order is fulfillable and we flip `isBacklog: false`. If
 * even one item is still negative (e.g. an unrelated product on the same
 * multi-item backlog order is still short), the flag stays.
 *
 * Returns the IDs of orders whose flag was cleared, so the caller can log
 * or expose them in the response.
 *
 * Stock is NOT decremented here — it was already decremented at checkout.
 * We're just confirming reality has caught up with the order's needs and
 * flipping the bookkeeping flag.
 */
export async function clearFulfillableBacklogOrders(
  tx: Prisma.TransactionClient,
  productIds: string[],
): Promise<string[]> {
  if (productIds.length === 0) return []

  // Find every still-backlog order that touches at least one of the
  // products this PO restocked. Limit to paid orders that haven't shipped —
  // a shipped order is a closed book and shouldn't have its flag flipped
  // retroactively. PENDING/PROCESSING are the states where fulfilment is
  // still actionable.
  const candidates = await tx.order.findMany({
    where: {
      isBacklog: true,
      paymentStatus: 'SUCCEEDED',
      status: { in: ['PENDING', 'PROCESSING'] },
      items: { some: { productId: { in: productIds } } },
    },
    select: {
      id: true,
      items: { select: { productId: true } },
    },
  })

  if (candidates.length === 0) return []

  // Gather every distinct product across all candidate orders (not just the
  // PO's products) — a multi-item backlog order can be blocked by an item
  // that ISN'T in the PO. We need fresh stock for every one of them to
  // judge fulfillability honestly.
  const allProductIds = new Set<string>()
  for (const o of candidates) {
    for (const it of o.items) allProductIds.add(it.productId)
  }
  const stocks = await tx.product.findMany({
    where: { id: { in: [...allProductIds] } },
    select: { id: true, stock: true },
  })
  const stockById = new Map(stocks.map((p) => [p.id, p.stock]))

  // An order is fulfillable iff every one of its items has `stock >= 0`
  // (i.e. the customer's already-decremented units are no longer leaving
  // the counter in the red). Products that vanished from the catalog are
  // treated as still-short, so the flag stays — those need admin attention
  // anyway.
  const clearedIds: string[] = []
  for (const order of candidates) {
    const fulfillable = order.items.every((it) => {
      const s = stockById.get(it.productId)
      return s !== undefined && s >= 0
    })
    if (fulfillable) clearedIds.push(order.id)
  }

  if (clearedIds.length > 0) {
    await tx.order.updateMany({
      where: { id: { in: clearedIds } },
      data: { isBacklog: false },
    })
  }

  return clearedIds
}

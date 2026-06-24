import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * One-shot reconciliation endpoint: scan every paid order currently flagged
 * `isBacklog: true` and clear the flag on any order whose items are all
 * fulfillable from current stock (every `product.stock >= 0`).
 *
 * Why this exists separately from `clearFulfillableBacklogOrders`
 * --------------------------------------------------------------
 * The PO-save helper (`src/lib/po-backlog-clear.ts`) intentionally restricts
 * its candidate set in two ways:
 *
 *   1. Only orders that contain at least one product the PO touched. That
 *      lets it stay cheap inside the PO save transaction.
 *   2. Only orders in PENDING / PROCESSING. Once an order ships, the flag
 *      flip stops being actionable for the fulfilment team.
 *
 * This endpoint loosens both: it sweeps EVERY backlog order (no PO context
 * to scope by) and includes any status (DELIVERED orders that were once
 * flagged backlog but have since been shipped from restored stock are a
 * data inconsistency we want to clean up).
 *
 * Admin-gated. Safe to re-run: idempotent — second call after a successful
 * first call clears zero orders and returns an empty list.
 *
 * Body: none.
 * Response: { cleared: string[], scanned: number }
 */

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  if (dbUser?.role !== 'ADMIN') return null
  return user
}

export async function POST() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Pull every paid backlog order with its items. No status filter —
    // delivered-yet-still-flagged orders are themselves the contradiction
    // we're here to fix.
    const candidates = await prisma.order.findMany({
      where: {
        isBacklog: true,
        paymentStatus: 'SUCCEEDED',
      },
      select: {
        id: true,
        items: { select: { productId: true } },
      },
    })

    if (candidates.length === 0) {
      return NextResponse.json({ cleared: [], scanned: 0 })
    }

    // Fresh stock for every product on any candidate order, fetched once.
    const productIds = new Set<string>()
    for (const o of candidates) {
      for (const it of o.items) productIds.add(it.productId)
    }
    const stocks = await prisma.product.findMany({
      where: { id: { in: [...productIds] } },
      select: { id: true, stock: true },
    })
    const stockById = new Map(stocks.map((p) => [p.id, p.stock]))

    // Fulfillable iff every item's product still exists and has stock >= 0.
    // A vanished product leaves the order flagged — needs admin attention.
    const clearedIds: string[] = []
    for (const order of candidates) {
      const fulfillable = order.items.every((it) => {
        const s = stockById.get(it.productId)
        return s !== undefined && s >= 0
      })
      if (fulfillable) clearedIds.push(order.id)
    }

    if (clearedIds.length > 0) {
      await prisma.order.updateMany({
        where: { id: { in: clearedIds } },
        data: { isBacklog: false },
      })
    }

    return NextResponse.json({
      cleared: clearedIds,
      scanned: candidates.length,
    })
  } catch (error) {
    console.error('Error reconciling backlog orders:', error)
    return NextResponse.json(
      { error: 'Failed to reconcile backlog orders' },
      { status: 500 },
    )
  }
}

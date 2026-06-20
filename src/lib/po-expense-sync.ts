/**
 * Keeps the Expense ledger in sync with PurchaseOrders.
 *
 * When a PO has a non-null `totalCost`, the dashboard P&L treats that PO as a
 * cost-of-goods expense for the period. To make POs participate in the unified
 * P&L without double-bookkeeping, every PO write transactionally upserts (or
 * deletes) a paired Expense row identified by `(sourceType, sourceId)`. Manual
 * expenses (where both are null) are unaffected.
 *
 * Both functions take a Prisma `tx` so callers can compose them inside their
 * existing $transaction without a second round-trip — losing atomicity here
 * would let the linked Expense row drift from the PO and break the P&L.
 */

import type { Prisma } from '@prisma/client'
import { EXPENSE_SOURCE_PURCHASE_ORDER, PO_LINKED_CATEGORY } from './expense-categories'

type TxClient = Prisma.TransactionClient

/** Subset of PurchaseOrder fields the sync needs. Keeps the helper testable
 * without depending on the full Prisma model. */
export interface SyncablePurchaseOrder {
  id: string
  poNumber: string | null
  poDate: Date | null
  vendorName: string | null
  totalCost: Prisma.Decimal | number | null
  fileUrl: string | null
  createdAt: Date
}

/**
 * Upsert (or delete) the Expense row paired with this PO.
 *
 * Rules:
 *   - `totalCost == null` (e.g. all line items removed) → delete the linked
 *     Expense row, if any.
 *   - Otherwise upsert with `date = poDate ?? createdAt`, the canonical
 *     COGS category, and a description that references the PO number.
 *
 * Idempotent — safe to run on every PO create/update and from the backfill
 * script. The unique index `@@unique([sourceType, sourceId])` makes the
 * upsert a no-op when nothing changed.
 */
export async function syncPurchaseOrderExpense(
  tx: TxClient,
  po: SyncablePurchaseOrder,
): Promise<void> {
  if (po.totalCost == null) {
    await tx.expense.deleteMany({
      where: {
        sourceType: EXPENSE_SOURCE_PURCHASE_ORDER,
        sourceId: po.id,
      },
    })
    return
  }

  const date = po.poDate ?? po.createdAt
  const description = po.poNumber ? `PO ${po.poNumber}` : `PO ${po.id.slice(0, 8)}`

  await tx.expense.upsert({
    where: {
      sourceType_sourceId: {
        sourceType: EXPENSE_SOURCE_PURCHASE_ORDER,
        sourceId: po.id,
      },
    },
    create: {
      date,
      category: PO_LINKED_CATEGORY,
      amount: po.totalCost,
      vendor: po.vendorName ?? null,
      description,
      receiptUrl: po.fileUrl ?? null,
      sourceType: EXPENSE_SOURCE_PURCHASE_ORDER,
      sourceId: po.id,
    },
    update: {
      date,
      amount: po.totalCost,
      vendor: po.vendorName ?? null,
      description,
      receiptUrl: po.fileUrl ?? null,
    },
  })
}

/** Hard-delete the Expense row paired with this PO. Used by the PO DELETE flow. */
export async function deletePurchaseOrderExpense(
  tx: TxClient,
  poId: string,
): Promise<void> {
  await tx.expense.deleteMany({
    where: {
      sourceType: EXPENSE_SOURCE_PURCHASE_ORDER,
      sourceId: poId,
    },
  })
}

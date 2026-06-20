/**
 * Backfill linked Expense rows for every existing PurchaseOrder with a
 * non-null totalCost. Idempotent — the unique index on
 * `(sourceType, sourceId)` makes the upsert a no-op when the row already
 * matches, and re-running the script re-syncs vendor/date/amount drift.
 *
 * Run:
 *   npx tsx scripts/backfill-po-expenses.ts            # dry run, prints actions
 *   npx tsx scripts/backfill-po-expenses.ts --apply    # writes to the DB
 */

import prisma from '../src/lib/prisma'
import { syncPurchaseOrderExpense } from '../src/lib/po-expense-sync'

const APPLY = process.argv.includes('--apply')

async function main() {
  const pos = await prisma.purchaseOrder.findMany({
    where: { totalCost: { not: null } },
    select: {
      id: true,
      poNumber: true,
      poDate: true,
      vendorName: true,
      totalCost: true,
      fileUrl: true,
      createdAt: true,
    },
  })

  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN —'} backfilling ${pos.length} purchase orders`)

  let updated = 0
  for (const po of pos) {
    const date = po.poDate ?? po.createdAt
    console.log(
      `• ${po.poNumber ?? po.id.slice(0, 8)} — ${date.toISOString().slice(0, 10)} — $${po.totalCost?.toString() ?? '0'} — ${po.vendorName ?? '(no vendor)'}`
    )
    if (APPLY) {
      await prisma.$transaction(async (tx) => {
        await syncPurchaseOrderExpense(tx, po)
      })
      updated++
    }
  }

  console.log(
    `\n${APPLY ? `Synced ${updated} purchase order(s).` : 'Dry run complete — re-run with --apply to write changes.'}`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

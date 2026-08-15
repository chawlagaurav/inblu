// One-time backfill for Product.unitsSold.
//
// The admin "Sold" column switched from being derived (sum of OrderItem.quantity)
// to a stored counter. This initializes every product so nothing regresses to 0:
//   - four named products get their admin-approved target values
//   - all other products get their current order-derived aggregate
//
// Run once:  node scripts/backfill-units-sold.mjs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Admin-approved forced values, keyed by product id.
const FORCED = {
  '1': 11, // EXCEL+
  '2': 8,  // STERLING STAR
  '3': 1,  // KANGEN LEVELUK JR IV
  'f9be0d10-9878-48d9-af36-ca7b5e395673': 3, // Excel + Filters Kit
}

async function main() {
  const agg = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
  })
  const soldMap = new Map(agg.map((r) => [r.productId, r._sum.quantity ?? 0]))

  const products = await prisma.product.findMany({ select: { id: true, name: true } })

  for (const p of products) {
    const value = FORCED[p.id] ?? soldMap.get(p.id) ?? 0
    await prisma.product.update({ where: { id: p.id }, data: { unitsSold: value } })
    console.log(`${p.name} (${p.id}) -> unitsSold=${value}`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

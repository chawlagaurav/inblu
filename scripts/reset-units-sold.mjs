// One-shot: reset Product.unitsSold to 0 for specific products.
//
// Run once:  node scripts/reset-units-sold.mjs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const NAMES = ['X12', 'RO Hot and Cold Dispenser']

async function main() {
  for (const name of NAMES) {
    const products = await prisma.product.findMany({
      where: { name },
      select: { id: true, name: true, unitsSold: true },
    })
    if (products.length === 0) {
      console.log(`No product found named "${name}"`)
      continue
    }
    for (const p of products) {
      await prisma.product.update({ where: { id: p.id }, data: { unitsSold: 0 } })
      console.log(`${p.name} (${p.id}) -> unitsSold: ${p.unitsSold} => 0`)
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

/**
 * Seed Marketing Settings
 * Creates default marketing/popup settings if none exist.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding marketing settings...')

  const existing = await prisma.marketingSettings.findFirst()
  if (existing) {
    console.log('✓ Marketing settings already exist, skipping.')
    return
  }

  await prisma.marketingSettings.create({
    data: {
      popupEnabled: true,
      popupHeadline: 'GET 10% OFF YOUR FIRST ORDER',
      popupSubtext: 'Join our community and get exclusive offers on water purification products.',
      discountCode: 'CLEANWATER10',
      discountPercentage: 10,
      popupDelay: 5,
    },
  })

  console.log('✓ Default marketing settings created')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

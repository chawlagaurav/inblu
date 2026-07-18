// One-off admin promotion.
// Usage:  node scripts/promote-admin.mjs someone@example.com
// Optional role:  node scripts/promote-admin.mjs someone@example.com SUPER_ADMIN
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const email = (process.argv[2] || '').trim().toLowerCase()
const role = (process.argv[3] || 'ADMIN').trim().toUpperCase()

if (!email) {
  console.error('Usage: node scripts/promote-admin.mjs <email> [ADMIN|SUPER_ADMIN]')
  process.exit(1)
}
if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
  console.error(`Invalid role "${role}". Use ADMIN or SUPER_ADMIN.`)
  process.exit(1)
}

const existing = await prisma.user.findUnique({
  where: { email },
  select: { id: true, email: true, name: true, role: true },
})

if (!existing) {
  console.error(
    `No user found with email "${email}".\n` +
    `They must sign up / log in at least once first (so both a Supabase Auth\n` +
    `account and a users-table row exist), then re-run this script.`
  )
  process.exit(1)
}

if (existing.role === role) {
  console.log(`${email} is already ${role}. Nothing to do.`)
  process.exit(0)
}

const updated = await prisma.user.update({
  where: { email },
  data: { role },
  select: { id: true, email: true, name: true, role: true },
})

console.log(`Promoted ${updated.email} → ${updated.role}`)
await prisma.$disconnect()

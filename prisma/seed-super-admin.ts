/**
 * Super-Admin Seed Script
 *
 * Promotes nav@inblu.com.au to SUPER_ADMIN. The user must already exist in
 * Supabase Auth AND in the local `users` table (which they do — nav has been
 * signing in as an ADMIN). This script just flips the role.
 *
 * Usage:
 *   npx tsx prisma/seed-super-admin.ts
 *
 * Idempotent: safe to run multiple times. Overrides the env-var default with
 * SUPER_ADMIN_EMAIL if set.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'nav@inblu.com.au').toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (!existing) {
    console.error(`❌ No user found with email ${email}.`)
    console.log(
      '\nThe super-admin must already exist in the `users` table. If nav has never signed in yet, have them sign in once (which auto-provisions the user row) or seed them via prisma/seed-admin.ts first.',
    )
    process.exit(1)
  }

  const promoted = await prisma.user.update({
    where: { email },
    data: { role: 'SUPER_ADMIN' },
    select: { id: true, email: true, name: true, role: true },
  })

  console.log('✅ Super admin promoted:')
  console.log(`   ID:    ${promoted.id}`)
  console.log(`   Email: ${promoted.email}`)
  console.log(`   Name:  ${promoted.name ?? '(no name set)'}`)
  console.log(`   Role:  ${promoted.role}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

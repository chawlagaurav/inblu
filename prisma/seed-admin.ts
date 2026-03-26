/**
 * Admin Seed Script
 * 
 * This script creates an admin user in the database.
 * The user must already exist in Supabase Auth before running this script.
 * 
 * Usage:
 * 1. First, create a user in Supabase Auth (via signup or Supabase Dashboard)
 * 2. Get the user's ID from Supabase Auth
 * 3. Set ADMIN_USER_ID and ADMIN_EMAIL in your .env file
 * 4. Run: npx tsx prisma/seed-admin.ts
 */

// Load environment variables from .env
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminUserId = process.env.ADMIN_USER_ID
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminName = process.env.ADMIN_NAME || 'Admin'

  if (!adminUserId) {
    console.error('❌ ADMIN_USER_ID environment variable is required')
    console.log('\nTo create an admin user:')
    console.log('1. Sign up at your app with the admin email')
    console.log('2. Go to Supabase Dashboard > Authentication > Users')
    console.log('3. Copy the User UID')
    console.log('4. Add to .env: ADMIN_USER_ID=<your-uid>')
    console.log('5. Add to .env: ADMIN_EMAIL=<your-email>')
    console.log('6. Run: npx tsx prisma/seed-admin.ts')
    process.exit(1)
  }

  console.log('🚀 Creating admin user...')

  const admin = await prisma.user.upsert({
    where: { id: adminUserId },
    update: { 
      role: 'ADMIN',
      name: adminName,
    },
    create: {
      id: adminUserId,
      email: adminEmail,
      name: adminName,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin user created/updated successfully!')
  console.log(`   ID: ${admin.id}`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Name: ${admin.name}`)
  console.log(`   Role: ${admin.role}`)
  console.log('\n🎉 You can now log in at /admin/login')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

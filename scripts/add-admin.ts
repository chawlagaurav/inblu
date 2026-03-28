/**
 * Add Admin Script
 * Creates a new admin user in Supabase Auth + Database
 *
 * Usage: npx tsx scripts/add-admin.ts <email> <password> [name]
 * Example: npx tsx scripts/add-admin.ts john@example.com MyPass123 "John Doe"
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4] || 'Admin'

  if (!email || !password) {
    console.log('Usage: npx tsx scripts/add-admin.ts <email> <password> [name]')
    console.log('Example: npx tsx scripts/add-admin.ts john@example.com MyPass123 "John Doe"')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters')
    process.exit(1)
  }

  console.log(`\n🚀 Creating admin: ${email}`)

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('⚠️  User already exists in Supabase Auth, updating role in DB...')
      // Find existing user
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const existing = users.find(u => u.email === email)
      if (!existing) {
        console.error('❌ Could not find user')
        process.exit(1)
      }

      await prisma.user.upsert({
        where: { id: existing.id },
        update: { role: 'ADMIN', name },
        create: { id: existing.id, email, name, role: 'ADMIN' },
      })

      console.log('✅ User promoted to ADMIN!')
      console.log(`   Email: ${email}`)
      console.log(`   ID: ${existing.id}`)
    } else {
      console.error('❌ Auth error:', authError.message)
      process.exit(1)
    }
  } else {
    // 2. Create user in database with ADMIN role
    await prisma.user.upsert({
      where: { id: authData.user.id },
      update: { role: 'ADMIN', name },
      create: {
        id: authData.user.id,
        email,
        name,
        role: 'ADMIN',
      },
    })

    console.log('✅ Admin created successfully!')
    console.log(`   Email: ${email}`)
    console.log(`   ID: ${authData.user.id}`)
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})

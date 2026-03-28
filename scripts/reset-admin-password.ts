/**
 * Reset admin password script
 * Usage: npx tsx scripts/reset-admin-password.ts
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in your .env file')
  console.log('Find it in Supabase Dashboard → Project Settings → API → service_role key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const NEW_PASSWORD = 'Admin@123'

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('❌ ADMIN_EMAIL not found in .env')
    process.exit(1)
  }

  // List users to find admin
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('❌ Error listing users:', listError.message)
    process.exit(1)
  }

  const adminUser = users.find(u => u.email === adminEmail)

  if (!adminUser) {
    console.error(`❌ No user found with email: ${adminEmail}`)
    process.exit(1)
  }

  const { error } = await supabase.auth.admin.updateUserById(adminUser.id, {
    password: NEW_PASSWORD,
  })

  if (error) {
    console.error('❌ Error updating password:', error.message)
    process.exit(1)
  }

  console.log('✅ Admin password updated successfully!')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Password: ${NEW_PASSWORD}`)
  console.log('\n⚠️  Please change this password after logging in.')
}

main().catch(console.error)

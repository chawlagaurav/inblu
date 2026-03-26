/**
 * Setup RLS (Row Level Security) Policies
 * 
 * The app queries the `users` table via Supabase client (PostgREST) in:
 * - Middleware (to check admin role)
 * - Admin login form
 * - Admin API routes
 * 
 * This script enables RLS and creates policies so authenticated users
 * can read their own row, while service_role bypasses RLS entirely.
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function setupRLS() {
  console.log('Setting up RLS policies...')

  // Using service_role key to execute SQL via Supabase's REST API
  // We need to run raw SQL to set up RLS policies
  
  const queries = [
    // Enable RLS on users table
    `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`,
    
    // Policy: Authenticated users can read their own user row
    // This is needed for middleware/admin checks via Supabase client
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can read own data'
      ) THEN
        CREATE POLICY "Users can read own data"
          ON public.users
          FOR SELECT
          USING (auth.uid() = id::uuid);
      END IF;
    END $$;`,

    // Policy: Service role can do anything (implicit, but explicit for clarity)
    // Note: service_role key bypasses RLS by default in Supabase

    // Enable RLS on other tables but allow service_role full access
    // (Prisma uses the direct connection, not PostgREST, so these tables
    //  don't need public read policies)
    `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;`,
  ]

  for (const query of queries) {
    const { error } = await supabase.rpc('exec_sql', { sql: query })
    if (error) {
      // If exec_sql RPC doesn't exist, fall back to note
      if (error.message.includes('exec_sql')) {
        console.log('⚠️  Cannot execute SQL via RPC. Will use direct connection instead.')
        await setupRLSViaDirect()
        return
      }
      console.error(`⚠️  Error executing query: ${error.message}`)
    }
  }

  console.log('✅ RLS policies created successfully via RPC')
}

async function setupRLSViaDirect() {
  // Fall back to using the direct database connection via prisma
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  try {
    // Enable RLS on users table
    await prisma.$executeRawUnsafe(`ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`)
    console.log('  ✓ RLS enabled on users table')

    // Create policy for users to read their own data
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can read own data'
        ) THEN
          CREATE POLICY "Users can read own data"
            ON public.users
            FOR SELECT
            USING (auth.uid()::text = id);
        END IF;
      END $$;
    `)
    console.log('  ✓ "Users can read own data" SELECT policy created')

    // Enable RLS on all other tables
    const tables = ['products', 'orders', 'order_items', 'testimonials', 'marketing_content', 'subscribers', 'marketing_settings', 'coupons']
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`)
      console.log(`  ✓ RLS enabled on ${table} table`)
    }

    console.log('✅ All RLS policies configured via direct connection')
  } catch (err) {
    console.error('❌ Error setting up RLS:', err)
    console.log('')
    console.log('You may need to run these SQL statements manually in the Supabase SQL Editor:')
    console.log('─────────────────────────────────────────────────────')
    console.log(generateManualSQL())
    console.log('─────────────────────────────────────────────────────')
  } finally {
    await prisma.$disconnect()
  }
}

function generateManualSQL(): string {
  return `
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own user row
-- (needed for middleware admin role checks via Supabase client)
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id);
`.trim()
}

setupRLS()
  .catch((err) => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  })

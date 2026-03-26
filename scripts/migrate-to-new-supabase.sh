#!/bin/bash
#
# Migration Script: Replicate Supabase Project
# ==============================================
# This script migrates the database schema, seed data, and RLS policies
# to a new Supabase project.
#
# PREREQUISITES:
# 1. Create a new Supabase project at https://supabase.com/dashboard
# 2. Update your .env file with the NEW project credentials (see below)
# 3. Run this script from the project root: bash scripts/migrate-to-new-supabase.sh
#
# ENV VARS TO UPDATE IN .env BEFORE RUNNING:
#   NEXT_PUBLIC_SUPABASE_URL=https://<NEW_PROJECT_REF>.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<new_anon_key>
#   SUPABASE_SERVICE_ROLE_KEY=<new_service_role_key>
#   DATABASE_URL=postgresql://postgres.<NEW_PROJECT_REF>:<DB_PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true
#   DIRECT_URL=postgresql://postgres.<NEW_PROJECT_REF>:<DB_PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
#

set -e

echo "============================================"
echo "  Supabase Project Migration Script"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "❌ .env file not found. Please create it with the new Supabase credentials."
  exit 1
fi

# Parse .env safely (handles values with spaces/special chars)
NEXT_PUBLIC_SUPABASE_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
DIRECT_URL=$(grep -E '^DIRECT_URL=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")

# Validate required env vars
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
  echo "❌ Missing required environment variables."
  echo "   Please ensure NEXT_PUBLIC_SUPABASE_URL, DATABASE_URL, and DIRECT_URL are set in .env"
  exit 1
fi

echo "🔗 Target Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""
read -p "⚠️  This will create tables in the database above. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1/5: Generate Prisma Client"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx prisma generate
echo "✅ Prisma client generated"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2/5: Push Database Schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Creating all tables from Prisma schema..."
npx prisma db push
echo "✅ Database schema created"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3/5: Configure RLS Policies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setting up Row Level Security policies..."
npx tsx scripts/setup-rls.ts
echo "✅ RLS policies configured"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4/5: Seed Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Seeding products and testimonials..."
npx tsx prisma/seed.ts
echo ""
echo "Seeding coupons..."
npx tsx prisma/seed-coupons.ts
echo "✅ Seed data inserted"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5/5: Seed Marketing Settings"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx tsx scripts/seed-marketing.ts
echo "✅ Marketing settings configured"

echo ""
echo "============================================"
echo "  ✅ Migration Complete!"
echo "============================================"
echo ""
echo "REMAINING MANUAL STEPS:"
echo ""
echo "1. SUPABASE AUTH CONFIGURATION:"
echo "   Go to: $NEXT_PUBLIC_SUPABASE_URL → Dashboard → Authentication → URL Configuration"
echo "   • Site URL: Set to your app URL (e.g., http://localhost:3000 for dev)"
echo "   • Redirect URLs: Add these:"
echo "     - http://localhost:3000/auth/callback"
echo "     - https://your-production-domain.com/auth/callback"
echo ""
echo "2. AUTH PROVIDERS:"
echo "   Go to: Authentication → Providers"
echo "   • Enable 'Email' provider"
echo "   • (Optional) Enable Google/GitHub OAuth and add credentials"
echo ""
echo "3. CREATE ADMIN USER:"
echo "   a) Sign up at your app with the admin email"
echo "   b) Go to Supabase Dashboard → Authentication → Users"
echo "   c) Copy the User UID"
echo "   d) Add to .env: ADMIN_USER_ID=<uid> and ADMIN_EMAIL=<email>"
echo "   e) Run: npx tsx prisma/seed-admin.ts"
echo ""
echo "4. (OPTIONAL) STORAGE BUCKET:"
echo "   If using Supabase Storage for product images:"
echo "   Go to: Storage → Create bucket named 'products' (set to public)"
echo ""

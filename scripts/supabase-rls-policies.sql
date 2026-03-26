-- ============================================
-- Supabase RLS Policies Setup
-- ============================================
-- Run this in the Supabase SQL Editor AFTER running `npx prisma db push`
-- Only needed if the automated setup-rls.ts script fails.
--
-- The app uses Supabase Auth for authentication and queries the `users`
-- table via the Supabase client (PostgREST) to check admin roles in
-- middleware and admin API routes.

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
-- This is critical for:
--   - Middleware admin role checks
--   - Admin login verification
--   - Admin API route authorization
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id);

-- Note: The service_role key (used by server-side Prisma operations)
-- bypasses RLS by default, so no additional policies are needed for
-- server-side database operations.

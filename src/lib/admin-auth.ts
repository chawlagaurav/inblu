/**
 * Shared admin-role helpers for API routes and server components.
 *
 * Two levels:
 *   - verifyAdmin()      — accepts ADMIN or SUPER_ADMIN. The general gate for
 *                          the admin panel.
 *   - verifySuperAdmin() — accepts SUPER_ADMIN only. Used by the admin-
 *                          management endpoints so only the super-admin can
 *                          create new admins.
 *
 * Both return the Supabase `User` on success and `null` otherwise (identical
 * shape to the inline `verifyAdmin()` functions scattered across the existing
 * admin routes, so a route can swap between the two without changing its
 * error-handling shape).
 */

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

async function currentUserRole(): Promise<{ user: User; role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER' } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  if (!dbUser) return null
  return { user, role: dbUser.role }
}

export async function verifyAdmin(): Promise<User | null> {
  const result = await currentUserRole()
  if (!result) return null
  if (result.role !== 'ADMIN' && result.role !== 'SUPER_ADMIN') return null
  return result.user
}

export async function verifySuperAdmin(): Promise<User | null> {
  const result = await currentUserRole()
  if (!result) return null
  if (result.role !== 'SUPER_ADMIN') return null
  return result.user
}

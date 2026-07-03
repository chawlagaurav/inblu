import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'
import { verifySuperAdmin } from '@/lib/admin-auth'

/**
 * DELETE /api/admin/admins/[id] — demote an admin to CUSTOMER.
 *
 * Naming note: the HTTP verb is DELETE (matches shadcn's destructive-action
 * conventions and existing patterns like /employees/[id]), but the semantics
 * are a role change, not a row delete. The `users` row stays; only `role`
 * flips to CUSTOMER, so the person's order history and identity are preserved.
 *
 * Guardrails (all return 400):
 *   - Cannot demote yourself. Losing your own admin access mid-session with
 *     no way back is a foot-gun.
 *   - Cannot demote another SUPER_ADMIN. There's exactly one super admin by
 *     design; if you ever add a second, they should be demoted by editing the
 *     DB directly (deliberately hard).
 *
 * Side effect: revokes every active session for the demoted user via the
 * Supabase admin API's `signOut(userId, 'global')`. Without this, the person's
 * refresh-token cookie would keep them logged in until it expired — they'd
 * still hit the /admin05 layout's role gate and be redirected to /, but any
 * open admin tab would linger with stale UI until they refreshed.
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const requester = await verifySuperAdmin()
  if (!requester) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  if (id === requester.id) {
    return NextResponse.json(
      { error: 'You cannot demote yourself.' },
      { status: 400 },
    )
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  })
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (target.role === 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'The super admin cannot be demoted.' },
      { status: 400 },
    )
  }
  if (target.role !== 'ADMIN') {
    return NextResponse.json(
      { error: `${target.email} is not an admin.` },
      { status: 400 },
    )
  }

  await prisma.user.update({ where: { id }, data: { role: 'CUSTOMER' } })

  // Revoke every active session for the demoted user. Best-effort — if this
  // fails, the DB change still stands and the /admin05 layout will refuse
  // the next request anyway; we log and continue.
  try {
    const supabaseAdmin = createAdminSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { error } = await supabaseAdmin.auth.admin.signOut(id, 'global')
    if (error) {
      console.error('signOut error while demoting admin:', error)
    }
  } catch (err) {
    console.error('Failed to revoke sessions for demoted admin:', err)
  }

  return NextResponse.json({
    id: target.id,
    email: target.email,
    name: target.name,
    role: 'CUSTOMER' as const,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import prisma from '@/lib/prisma'
import { verifySuperAdmin } from '@/lib/admin-auth'

/**
 * /api/admin/admins — super-admin-only endpoint for listing and creating
 * admin users.
 *
 * The gate is `verifySuperAdmin` (from src/lib/admin-auth.ts). Ordinary
 * ADMINs get 403 here even though every other admin endpoint accepts them.
 *
 * POST flow: create Supabase Auth user with a random password + email_confirm,
 * upsert them into our `users` table with role ADMIN, then generate a
 * password-reset link via the Supabase admin API and email it via Resend.
 * The super-admin never handles a plaintext password.
 */

// GET — list all admins (ADMIN + SUPER_ADMIN). Ordered by role first so the
// super-admin surfaces at the top of the list.
export async function GET() {
  const user = await verifySuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    // role 'asc' happens to put SUPER_ADMIN before ADMIN alphabetically —
    // stable and intentional.
  })

  return NextResponse.json(admins)
}

// POST — create a new admin.
// Body: { email: string; name?: string }
export async function POST(request: NextRequest) {
  const requester = await verifySuperAdmin()
  if (!requester) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const rawEmail: unknown = (body as Record<string, unknown>).email
  const rawName: unknown = (body as Record<string, unknown>).name

  if (typeof rawEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim())) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }
  const email = rawEmail.trim().toLowerCase()
  const name = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : null

  // Refuse to overwrite an existing user (whether admin or customer). This
  // avoids silently escalating a customer to admin or creating a duplicate.
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } })
  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.role === 'ADMIN' || existing.role === 'SUPER_ADMIN'
            ? 'An admin with this email already exists'
            : 'A user with this email already exists (customer). Promote them manually if intended.',
      },
      { status: 409 },
    )
  }

  const supabaseAdmin = createAdminSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // Random password — discarded. The new admin sets their own via the
  // password-reset email below.
  const password = `${crypto.randomUUID()}${crypto.randomUUID()}`

  // Create Supabase Auth user (email pre-confirmed — we're vouching for them).
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { full_name: name } : undefined,
  })

  if (createErr || !created.user) {
    console.error('Supabase createUser error:', createErr)
    return NextResponse.json(
      { error: createErr?.message || 'Failed to create auth user' },
      { status: 500 },
    )
  }

  // Insert into our `users` table with ADMIN role. If this fails after Supabase
  // succeeded, we log and surface — the Supabase user is orphaned but harmless
  // (they can't log into the admin panel without the corresponding role row).
  let dbUser
  try {
    dbUser = await prisma.user.create({
      data: {
        id: created.user.id,
        email,
        name,
        role: 'ADMIN',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })
  } catch (dbErr) {
    console.error('Prisma user create error after Supabase user was created:', dbErr)
    return NextResponse.json(
      { error: 'Auth user created but role assignment failed. Contact support.' },
      { status: 500 },
    )
  }

  // Generate a password-reset link so the new admin sets their own password.
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au'
  const redirectTo = `${origin}/auth/reset-password`

  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })
  if (linkErr) {
    console.error('Supabase generateLink error for new admin:', linkErr)
  }
  const actionLink = linkData?.properties?.action_link

  // Send the invite email. Copy is patterned on
  // src/app/api/auth/reset-password-email/route.ts (same visual template).
  if (actionLink) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const displayName = name || email
      const { error: emailError } = await resend.emails.send({
        from: 'Inblu Filters <info@inblu.com.au>',
        to: email,
        subject: 'You have been added as an admin — set your password',
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #f8fafc;">
            <div style="background: white; border-radius: 12px; padding: 40px; border: 1px solid #e2e8f0;">
              <img src="https://inblu.com.au/inblutextlogo.png" alt="Inblu Filters" style="height: 48px; margin-bottom: 32px;" />
              <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">Welcome, ${displayName}</h1>
              <p style="color: #64748b; margin: 0 0 24px;">You've been added as an admin on the Inblu Filters platform.</p>
              <p style="color: #475569; margin: 0 0 32px;">
                Click the button below to set your password and sign in. This link is valid for 1 hour.
              </p>
              <a href="${actionLink}"
                style="display: inline-block; background: #2563eb; color: white; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
                Set Password
              </a>
              <p style="color: #94a3b8; font-size: 13px; margin: 32px 0 0;">
                Once your password is set, sign in at
                <a href="https://inblu.com.au/admin05/login" style="color: #2563eb;">inblu.com.au/admin05/login</a>.
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Inblu Filters
              </p>
            </div>
          </div>
        `,
      })
      if (emailError) {
        console.error('Resend error sending admin-invite email:', emailError)
      }
    } catch (emailErr) {
      console.error('Failed to send admin-invite email:', emailErr)
    }
  }

  return NextResponse.json(dbUser, { status: 201 })
}

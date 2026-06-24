import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Create Supabase admin client (service role — never exposed to client)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au'
    const redirectTo = `${origin}/auth/reset-password`

    // Generate the password reset link using admin API — bypasses SMTP entirely
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
      options: { redirectTo },
    })

    if (error) {
      console.error('Supabase generateLink error:', error)
      // Don't reveal whether email exists — always return success to user
      return NextResponse.json({ success: true })
    }

    const resetLink = data.properties?.action_link
    if (!resetLink) {
      console.error('No action_link returned from generateLink')
      return NextResponse.json({ success: true })
    }

    // Send via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    const userName = data.user?.user_metadata?.full_name || email

    const { error: emailError } = await resend.emails.send({
      from: 'Inblu Filters <info@inblu.com.au>',
      to: email,
      subject: 'Reset your Inblu Filters password',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #f8fafc;">
          <div style="background: white; border-radius: 12px; padding: 40px; border: 1px solid #e2e8f0;">
            <img src="https://inblu.com.au/inblutextlogo.png" alt="Inblu Filters" style="height: 48px; margin-bottom: 32px;" />
            <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">Reset your password</h1>
            <p style="color: #64748b; margin: 0 0 24px;">Hi ${userName},</p>
            <p style="color: #475569; margin: 0 0 32px;">
              We received a request to reset the password for your Inblu account. Click the button below to choose a new password.
            </p>
            <a href="${resetLink}"
              style="display: inline-block; background: #2563eb; color: white; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
              Reset Password
            </a>
            <p style="color: #94a3b8; font-size: 13px; margin: 32px 0 0;">
              This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
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
      console.error('Resend error sending reset email:', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password reset error:', error)
    // Always return success — don't reveal server errors to client
    return NextResponse.json({ success: true })
  }
}

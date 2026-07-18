import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/admin-auth'
import { sendRegistrationInviteEmail } from '@/lib/email'

// POST - Send registration invite emails to guest customers.
// Body: { customers: Array<{ email: string; name?: string }> }
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { customers } = body as {
      customers: Array<{ email: string; name?: string }>
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: 'No customers selected' }, { status: 400 })
    }

    // Deduplicate by email (case-insensitive) and drop invalid entries.
    const seen = new Set<string>()
    const recipients = customers.filter((c) => {
      if (!c?.email || !c.email.includes('@')) return false
      const key = c.email.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Skip anyone who already has a registered account.
    const existing = await prisma.user.findMany({
      where: {
        email: { in: recipients.map((c) => c.email), mode: 'insensitive' },
      },
      select: { email: true },
    })
    const existingEmails = new Set(existing.map((u) => u.email.toLowerCase()))

    let sent = 0
    let skipped = 0
    let failed = 0

    for (const recipient of recipients) {
      if (existingEmails.has(recipient.email.toLowerCase())) {
        skipped++
        continue
      }

      const ok = await sendRegistrationInviteEmail(recipient.email, recipient.name)
      if (ok) {
        sent++
      } else {
        failed++
      }
    }

    const parts = [`${sent} invite(s) sent`]
    if (skipped > 0) parts.push(`${skipped} already registered`)
    if (failed > 0) parts.push(`${failed} failed`)

    return NextResponse.json({
      success: true,
      message: parts.join(', '),
      sent,
      skipped,
      failed,
    })
  } catch (error) {
    console.error('Error sending registration invites:', error)
    return NextResponse.json(
      { error: 'Failed to send invites' },
      { status: 500 }
    )
  }
}

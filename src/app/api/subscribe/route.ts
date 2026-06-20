import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import { checkRateLimit, rateLimiters, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - prevent spam subscriptions
    const ip = getClientIP(request)
    const rateLimit = checkRateLimit(`subscribe:${ip}`, rateLimiters.subscribe)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many subscription attempts. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
          },
        }
      )
    }

    const body = await request.json()
    const { email, phone, source } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Optional phone — strip whitespace and reject obviously bogus values, but
    // be permissive about format (international, parentheses, dashes are fine).
    let normalizedPhone: string | null = null
    if (typeof phone === 'string') {
      const trimmed = phone.trim()
      if (trimmed.length > 0) {
        // Require at least 6 digits somewhere in the input — catches blank/garbage.
        const digitCount = (trimmed.match(/\d/g) ?? []).length
        if (digitCount < 6) {
          return NextResponse.json(
            { error: 'Please enter a valid phone number' },
            { status: 400 }
          )
        }
        normalizedPhone = trimmed
      }
    }

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      // Already subscribed — quietly update the phone if they didn't have one
      // recorded, so re-submissions can still capture a missing field. Don't
      // overwrite a phone they previously provided.
      if (normalizedPhone && !existing.phone) {
        await prisma.subscriber.update({
          where: { email: normalizedEmail },
          data: { phone: normalizedPhone },
        })
      }
      return NextResponse.json({ success: true, message: 'Subscribed successfully!' })
    }

    // Create new subscriber
    await prisma.subscriber.create({
      data: {
        email: normalizedEmail,
        phone: normalizedPhone,
        source: source || 'website',
      },
    })

    // Get discount code from marketing settings
    let discountCode = 'WELCOME10'
    try {
      const settings = await prisma.marketingSettings.findFirst()
      if (settings?.discountCode) {
        discountCode = settings.discountCode
      }
    } catch {
      // Use default if settings not found
    }

    // Send welcome email (don't block response on email)
    sendWelcomeEmail(normalizedEmail, discountCode).catch((err) => {
      console.error('Failed to send welcome email:', err)
    })

    return NextResponse.json({ success: true, message: 'Subscribed successfully!' })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  }
}

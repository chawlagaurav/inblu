import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source } = body

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

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      // Already subscribed, but don't reveal this for privacy
      return NextResponse.json({ success: true, message: 'Subscribed successfully!' })
    }

    // Create new subscriber
    await prisma.subscriber.create({
      data: {
        email: normalizedEmail,
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

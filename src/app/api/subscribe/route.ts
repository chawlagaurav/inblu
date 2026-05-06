import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      // Already subscribed, but don't reveal this for privacy
      return NextResponse.json({ success: true, message: 'Subscribed successfully!' })
    }

    // Create new subscriber
    await prisma.subscriber.create({
      data: {
        email: email.toLowerCase(),
        source: source || 'website',
      },
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

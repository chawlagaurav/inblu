import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source = 'popup' } = body

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingSubscriber) {
      // Return success even if already subscribed (don't reveal this to user)
      return NextResponse.json({
        success: true,
        message: 'Thank you for subscribing!',
        couponCode: 'CLEANWATER10',
      })
    }

    // Create new subscriber
    await prisma.subscriber.create({
      data: {
        email: email.toLowerCase(),
        source,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing!',
      couponCode: 'CLEANWATER10',
    })
  } catch (error) {
    console.error('Error creating subscriber:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// Verify admin access
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (dbUser?.role !== 'ADMIN') {
    return null
  }

  return user
}

// GET marketing settings (public for popup, returns limited data)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    // Get or create settings
    let settings = await prisma.marketingSettings.findFirst()

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.marketingSettings.create({
        data: {
          popupEnabled: true,
          popupHeadline: 'GET 10% OFF YOUR FIRST ORDER',
          popupSubtext: 'Join our community and get exclusive offers on water purification products.',
          discountCode: 'CLEANWATER10',
          discountPercentage: 10,
          popupDelay: 5,
        },
      })
    }

    // Check if popup is within date range
    const now = new Date()
    let isActive = settings.popupEnabled

    if (settings.startDate && now < settings.startDate) {
      isActive = false
    }
    if (settings.endDate && now > settings.endDate) {
      isActive = false
    }

    // For admin requests, return full settings
    if (isAdmin) {
      const user = await verifyAdmin()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json(settings)
    }

    // For public requests, return only necessary data
    return NextResponse.json({
      enabled: isActive,
      headline: settings.popupHeadline,
      subtext: settings.popupSubtext,
      discountCode: settings.discountCode,
      discountPercentage: settings.discountPercentage,
      delay: settings.popupDelay,
    })
  } catch (error) {
    console.error('Error fetching marketing settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT update marketing settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      popupEnabled,
      popupHeadline,
      popupSubtext,
      discountCode,
      discountPercentage,
      popupDelay,
      startDate,
      endDate,
    } = body

    // Get existing settings or create new
    let settings = await prisma.marketingSettings.findFirst()

    if (settings) {
      // Update existing settings
      settings = await prisma.marketingSettings.update({
        where: { id: settings.id },
        data: {
          popupEnabled: popupEnabled ?? settings.popupEnabled,
          popupHeadline: popupHeadline ?? settings.popupHeadline,
          popupSubtext: popupSubtext ?? settings.popupSubtext,
          discountCode: discountCode ?? settings.discountCode,
          discountPercentage: discountPercentage ?? settings.discountPercentage,
          popupDelay: popupDelay ?? settings.popupDelay,
          startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : settings.startDate,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : settings.endDate,
        },
      })
    } else {
      // Create new settings
      settings = await prisma.marketingSettings.create({
        data: {
          popupEnabled: popupEnabled ?? true,
          popupHeadline: popupHeadline ?? 'GET 10% OFF YOUR FIRST ORDER',
          popupSubtext: popupSubtext ?? 'Join our community and get exclusive offers on water purification products.',
          discountCode: discountCode ?? 'CLEANWATER10',
          discountPercentage: discountPercentage ?? 10,
          popupDelay: popupDelay ?? 5,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating marketing settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

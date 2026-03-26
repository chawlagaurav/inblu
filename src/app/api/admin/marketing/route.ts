import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// Get all marketing content
export async function GET() {
  try {
    const content = await prisma.marketingContent.findMany({
      orderBy: { key: 'asc' },
    })
    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching marketing content:', error)
    return NextResponse.json({ error: 'Failed to fetch marketing content' }, { status: 500 })
  }
}

// Create or update marketing content
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { key, content: contentValue, isActive } = body

    // Upsert the marketing content
    const result = await prisma.marketingContent.upsert({
      where: { key },
      update: {
        content: contentValue,
        isActive: isActive ?? true,
      },
      create: {
        key,
        content: contentValue,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error saving marketing content:', error)
    return NextResponse.json({ error: 'Failed to save marketing content' }, { status: 500 })
  }
}

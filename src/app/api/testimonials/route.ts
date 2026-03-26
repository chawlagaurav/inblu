import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET all testimonials (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const approved = searchParams.get('approved')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    // Filter by approval status (for admin showing all vs public showing approved)
    if (approved === 'true') {
      where.isApproved = true
    } else if (approved === 'false') {
      where.isApproved = false
    }

    const testimonials = await prisma.testimonial.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(testimonials)
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    )
  }
}

// POST create testimonial (authenticated users)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, rating } = body

    if (!content || !rating) {
      return NextResponse.json(
        { error: 'Content and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        content,
        rating: parseInt(rating),
        authorName: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
        authorAvatar: user.user_metadata?.avatar_url || null,
        isApproved: false, // Requires admin approval
      },
    })

    return NextResponse.json(testimonial, { status: 201 })
  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json(
      { error: 'Failed to create testimonial' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') return null
  return user
}

// GET all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { value, label, description, imageUrl, displayOrder, isActive } = body

    if (!value || !label) {
      return NextResponse.json({ error: 'Value and label are required' }, { status: 400 })
    }

    // Create slug from value
    const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const existing = await prisma.category.findUnique({
      where: { value: slug },
    })

    if (existing) {
      return NextResponse.json({ error: 'A category with this value already exists' }, { status: 409 })
    }

    const category = await prisma.category.create({
      data: {
        value: slug,
        label,
        description: description || null,
        imageUrl: imageUrl || null,
        displayOrder: displayOrder || 0,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

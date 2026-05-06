import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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

// PUT: Update product display order
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { products } = body // Array of { id, displayOrder }

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Update all products in a transaction
    await prisma.$transaction(
      products.map((p: { id: string; displayOrder: number }) =>
        prisma.product.update({
          where: { id: p.id },
          data: { displayOrder: p.displayOrder },
        })
      )
    )

    // Revalidate product pages
    revalidatePath('/products', 'page')
    revalidatePath('/', 'page')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering products:', error)
    return NextResponse.json({ error: 'Failed to reorder products' }, { status: 500 })
  }
}

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

// GET all products
export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST create new product
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      price, 
      stock, 
      category, 
      imageUrl,
      images,
      sku,
      specifications,
      manualUrl,
      isBestSeller,
      isActive
    } = body

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock: stock || 0,
        category,
        imageUrl: imageUrl || '/products/placeholder.jpg',
        images: images || [],
        sku: sku || null,
        specifications: specifications || {},
        manualUrl: manualUrl || null,
        isBestSeller: isBestSeller || false,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

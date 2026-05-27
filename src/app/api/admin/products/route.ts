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

// GET all products
export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
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
      categories,
      imageUrl,
      images,
      sku,
      specifications,
      manualUrl,
      serviceTenureMonths,
      isBestSeller,
      isActive
    } = body

    // Generate slug from name
    let slug = generateSlug(name)
    
    // Check if slug exists and make it unique if necessary
    const existingProduct = await prisma.product.findUnique({ where: { slug } })
    if (existingProduct) {
      slug = `${slug}-${Date.now()}`
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        stock: stock || 0,
        category: category || (categories && categories.length > 0 ? categories[0] : ''),
        categories: categories || (category ? [category] : []),
        imageUrl: imageUrl || '/products/placeholder.jpg',
        images: images || [],
        sku: sku || null,
        specifications: specifications || {},
        manualUrl: manualUrl || null,
        serviceTenureMonths: serviceTenureMonths ?? 6,
        isBestSeller: isBestSeller || false,
        isActive: isActive ?? true,
      },
    })

    // Revalidate product pages cache
    revalidatePath('/products', 'page')
    revalidatePath('/', 'page')

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

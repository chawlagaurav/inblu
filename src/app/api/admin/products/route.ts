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

/**
 * Validate per-product discount fields. Returns null if valid, otherwise an
 * error message suitable for a 400 response.
 *
 * Rules: when `isOnSale` is true, exactly one of `discountPercent` or
 * `salePrice` must be set. Percent must be 1..99. SalePrice must be > 0 and
 * < price. When `isOnSale` is false we accept any draft values; the pricing
 * helper ignores them.
 */
function validateDiscount(input: {
  price: number
  isOnSale: boolean
  discountPercent: number | null
  salePrice: number | null
}): string | null {
  if (!input.isOnSale) return null
  const hasPercent = input.discountPercent != null
  const hasFixed = input.salePrice != null
  if (hasPercent === hasFixed) {
    return 'Provide exactly one of discountPercent or salePrice when on sale'
  }
  if (hasPercent && (input.discountPercent! < 1 || input.discountPercent! > 99)) {
    return 'discountPercent must be between 1 and 99'
  }
  if (hasFixed && (input.salePrice! <= 0 || input.salePrice! >= input.price)) {
    return 'salePrice must be greater than 0 and less than the regular price'
  }
  return null
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
      isActive,
      isOnSale,
      discountPercent,
      salePrice,
    } = body

    // Validate discount fields against the resolved price.
    const numericPrice = Number(price)
    const discountError = validateDiscount({
      price: numericPrice,
      isOnSale: !!isOnSale,
      discountPercent: discountPercent == null || discountPercent === '' ? null : Number(discountPercent),
      salePrice: salePrice == null || salePrice === '' ? null : Number(salePrice),
    })
    if (discountError) {
      return NextResponse.json({ error: discountError }, { status: 400 })
    }

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
        isOnSale: !!isOnSale,
        discountPercent: discountPercent == null || discountPercent === '' ? null : Number(discountPercent),
        salePrice: salePrice == null || salePrice === '' ? null : Number(salePrice),
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

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
}

/** See `src/app/api/admin/products/route.ts` for documentation. */
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

  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') {
    return null
  }

  return user
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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
      relatedProductIds,
      isBestSeller,
      isActive,
      isOnSale,
      discountPercent,
      salePrice,
      excludeFromCoupons,
      isSoldOut,
    } = body

    // Get current product to check if name changed
    const currentProduct = await prisma.product.findUnique({ where: { id } })
    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Resolve the price the discount should validate against — incoming `price`
    // wins, otherwise fall back to the existing one. This lets the admin lower
    // the regular price below an existing salePrice (validation will catch it
    // and force them to fix it in the same save).
    const resolvedPrice = price != null ? Number(price) : Number(currentProduct.price)
    const normalisedDiscountPercent = discountPercent === undefined
      ? (currentProduct.discountPercent ?? null)
      : (discountPercent == null || discountPercent === '' ? null : Number(discountPercent))
    const normalisedSalePrice = salePrice === undefined
      ? (currentProduct.salePrice == null ? null : Number(currentProduct.salePrice))
      : (salePrice == null || salePrice === '' ? null : Number(salePrice))
    const normalisedIsOnSale = isOnSale === undefined ? currentProduct.isOnSale : !!isOnSale

    const discountError = validateDiscount({
      price: resolvedPrice,
      isOnSale: normalisedIsOnSale,
      discountPercent: normalisedDiscountPercent,
      salePrice: normalisedSalePrice,
    })
    if (discountError) {
      return NextResponse.json({ error: discountError }, { status: 400 })
    }

    // Generate new slug if name changed
    let newSlug = currentProduct?.slug
    if (name && currentProduct && name !== currentProduct.name) {
      newSlug = generateSlug(name)
      // Check if slug already exists for another product
      const existingProduct = await prisma.product.findUnique({ where: { slug: newSlug } })
      if (existingProduct && existingProduct.id !== id) {
        newSlug = `${newSlug}-${Date.now()}`
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug: newSlug,
        description,
        price,
        stock,
        category: category || (categories && categories.length > 0 ? categories[0] : undefined),
        categories: categories || undefined,
        imageUrl,
        images,
        sku,
        specifications,
        manualUrl,
        serviceTenureMonths: serviceTenureMonths ?? undefined,
        relatedProductIds: relatedProductIds ?? undefined,
        isBestSeller,
        isActive,
        // Persist discount fields when explicitly present in the body. Use the
        // already-validated normalised values so an empty string from the form
        // becomes `null`.
        ...(isOnSale !== undefined ? { isOnSale: normalisedIsOnSale } : {}),
        ...(discountPercent !== undefined ? { discountPercent: normalisedDiscountPercent } : {}),
        ...(salePrice !== undefined ? { salePrice: normalisedSalePrice } : {}),
        ...(excludeFromCoupons !== undefined ? { excludeFromCoupons: !!excludeFromCoupons } : {}),
        ...(isSoldOut !== undefined ? { isSoldOut: !!isSoldOut } : {}),
      },
    })

    // Revalidate product pages cache
    revalidatePath('/products', 'page')
    if (product.slug) {
      revalidatePath(`/products/${product.slug}`, 'page')
    }
    revalidatePath('/', 'page')
    // revalidatePath does not invalidate unstable_cache entries — only revalidateTag does.
    // Without this, getCachedProductBySlug/getCachedProducts keep returning the
    // pre-toggle Product (so e.g. the new isSoldOut flag is invisible to the
    // detail page for up to 60s).
    // Next 16 requires the second arg: 'max' = fully invalidate (matches the
    // pre-16 single-arg behaviour).
    revalidateTag('products', 'max')

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product has any order items
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId: id },
    })

    if (orderItems) {
      // Soft delete - mark as inactive instead of hard delete
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      })
      
      // Revalidate cache
      revalidatePath('/products', 'page')
      revalidatePath('/', 'page')
      revalidateTag('products', 'max')

      return NextResponse.json({ message: 'Product deactivated (has order history)' })
    }

    // Hard delete if no orders
    await prisma.product.delete({
      where: { id },
    })

    // Revalidate cache
    revalidatePath('/products', 'page')
    revalidatePath('/', 'page')
    revalidateTag('products', 'max')

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

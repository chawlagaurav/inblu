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
      isActive
    } = body

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
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
      },
    })

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
      return NextResponse.json({ message: 'Product deactivated (has order history)' })
    }

    // Hard delete if no orders
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

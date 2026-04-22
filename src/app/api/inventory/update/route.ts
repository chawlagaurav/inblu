import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'ADMIN') return null
  return user
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const productId = formData.get('productId') as string
    const type = formData.get('type') as string
    const note = formData.get('note') as string | null
    const poNumber = formData.get('poNumber') as string | null
    const vendorName = formData.get('vendorName') as string | null
    const file = formData.get('file') as File | null

    if (!productId || !type) {
      return NextResponse.json({ error: 'productId and type are required' }, { status: 400 })
    }

    if (!['IN', 'ADJUSTMENT'].includes(type)) {
      return NextResponse.json({ error: 'type must be IN or ADJUSTMENT' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const currentStock = product.stock
    let newStock: number
    let quantity: number
    let referenceType: string
    let referenceId: string | null = null
    let fileUrl: string | null = null

    if (type === 'IN') {
      const rawQuantity = formData.get('quantity')
      if (!rawQuantity) {
        return NextResponse.json({ error: 'quantity is required for stock in' }, { status: 400 })
      }
      quantity = parseInt(rawQuantity as string, 10)
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 })
      }
      newStock = currentStock + quantity
      referenceType = 'PO'

      // Handle file upload to Cloudinary
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const { uploadToCloudinary } = await import('@/lib/cloudinary')
        const result = await uploadToCloudinary(buffer, {
          folder: 'purchase-orders',
          publicId: `po_${Date.now()}`,
        })
        fileUrl = result.url
      }

      // Create purchase order if any PO data provided
      if (poNumber || vendorName || fileUrl) {
        const po = await prisma.purchaseOrder.create({
          data: {
            poNumber: poNumber || null,
            vendorName: vendorName || null,
            fileUrl,
          },
        })
        referenceId = po.id
      }
    } else {
      // ADJUSTMENT
      const rawNewStock = formData.get('newStock')
      if (rawNewStock === null || rawNewStock === '') {
        return NextResponse.json({ error: 'newStock is required for adjustment' }, { status: 400 })
      }
      newStock = parseInt(rawNewStock as string, 10)
      if (isNaN(newStock) || newStock < 0) {
        return NextResponse.json({ error: 'newStock must be a non-negative number' }, { status: 400 })
      }
      quantity = newStock - currentStock
      referenceType = 'MANUAL'
    }

    // Create inventory transaction and update product stock in a transaction
    const [transaction, updatedProduct] = await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: {
          productId,
          type,
          quantity,
          previousStock: currentStock,
          newStock,
          referenceType,
          referenceId,
          note: note || null,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      }),
    ])

    return NextResponse.json({
      success: true,
      transaction,
      stock: updatedProduct.stock,
    })
  } catch (error) {
    console.error('Inventory update error:', error)
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}

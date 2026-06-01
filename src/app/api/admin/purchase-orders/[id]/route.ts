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
  if (dbUser?.role !== 'ADMIN') return null
  return user
}

// GET a single purchase order
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        inventoryTransactions: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, stock: true, sku: true },
            },
          },
        },
      },
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json(purchaseOrder)
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 })
  }
}

// PUT - Update a purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get existing PO with transactions
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        inventoryTransactions: true,
      },
    })

    if (!existingPO) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const poNumber = formData.get('poNumber') as string | null
    const poDateStr = formData.get('poDate') as string | null
    const vendorName = formData.get('vendorName') as string | null
    const notes = formData.get('notes') as string | null
    const taxStr = formData.get('tax') as string | null
    const deliveryStatus = formData.get('deliveryStatus') as string | null
    const approvedBy = formData.get('approvedBy') as string | null
    const paymentStatus = formData.get('paymentStatus') as string | null
    const itemsJson = formData.get('items') as string
    const file = formData.get('file') as File | null

    if (!itemsJson) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    let items: { productId: string; quantity: number; unitCost: number | null }[]
    try {
      items = JSON.parse(itemsJson)
    } catch {
      return NextResponse.json({ error: 'Invalid items format' }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    // Validate all products exist
    const productIds = items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stock: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 404 })
    }

    const productMap = new Map(products.map((p) => [p.id, p]))

    // Handle file upload to Cloudinary
    let fileUrl = existingPO.fileUrl
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

    // Calculate total cost
    let totalCost = 0
    for (const item of items) {
      if (item.unitCost && item.unitCost > 0) {
        totalCost += item.quantity * item.unitCost
      }
    }

    const tax = taxStr ? parseFloat(taxStr) : null
    const poDate = poDateStr ? new Date(poDateStr) : null

    // Create a map of old transactions by product ID
    const oldTransactionMap = new Map(
      existingPO.inventoryTransactions.map((t) => [t.productId, t])
    )

    // Update PO and stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, revert old stock changes
      for (const oldTx of existingPO.inventoryTransactions) {
        await tx.product.update({
          where: { id: oldTx.productId },
          data: {
            stock: {
              decrement: oldTx.quantity,
            },
          },
        })
      }

      // Delete old inventory transactions
      await tx.inventoryTransaction.deleteMany({
        where: { referenceId: id },
      })

      // Update purchase order details
      const purchaseOrder = await tx.purchaseOrder.update({
        where: { id },
        data: {
          poNumber: poNumber || null,
          poDate,
          vendorName: vendorName || null,
          fileUrl,
          totalCost: totalCost > 0 ? totalCost : null,
          tax,
          deliveryStatus: deliveryStatus || 'PENDING',
          approvedBy: approvedBy || null,
          paymentStatus: paymentStatus || 'UNPAID',
          notes: notes || null,
        },
      })

      // Create new inventory transactions and update stock for each product
      for (const item of items) {
        // Get current stock after reverting old changes
        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        })
        
        const currentStock = currentProduct?.stock || 0
        const newStock = currentStock + item.quantity

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            previousStock: currentStock,
            newStock,
            referenceType: 'PO',
            referenceId: purchaseOrder.id,
            unitCost: item.unitCost ? item.unitCost : null,
            note: notes || null,
          },
        })

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        })
      }

      return purchaseOrder
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}

// DELETE a purchase order
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // First delete associated inventory transactions
    await prisma.inventoryTransaction.deleteMany({
      where: { referenceId: id },
    })

    // Then delete the purchase order
    await prisma.purchaseOrder.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 })
  }
}

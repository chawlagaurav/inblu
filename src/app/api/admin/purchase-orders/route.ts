import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { syncPurchaseOrderExpense } from '@/lib/po-expense-sync'
import { clearFulfillableBacklogOrders } from '@/lib/po-backlog-clear'

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

// GET all purchase orders
export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json(purchaseOrders)
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

// POST - Create a new purchase order with multiple products
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const poNumber = formData.get('poNumber') as string | null
    const poDateStr = formData.get('poDate') as string | null
    const vendorName = formData.get('vendorName') as string | null
    const notes = formData.get('notes') as string | null
    const taxStr = formData.get('tax') as string | null
    const deliveryStatus = formData.get('deliveryStatus') as string | null
    const deliveryReceivedDateStr = formData.get('deliveryReceivedDate') as string | null
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
    let fileUrl: string | null = null
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const { uploadToCloudinary } = await import('@/lib/cloudinary')
      // Preserve file extension so browsers can determine content type (e.g. .pdf, .png)
      const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
      const publicId = fileExt ? `po_${Date.now()}.${fileExt}` : `po_${Date.now()}`
      const result = await uploadToCloudinary(buffer, {
        folder: 'purchase-orders',
        publicId,
        resourceType: fileExt === 'pdf' ? 'raw' : 'auto',
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
    const deliveryReceivedDate = deliveryReceivedDateStr ? new Date(deliveryReceivedDateStr) : null

    // Create PO and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create purchase order
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          poNumber: poNumber || null,
          poDate,
          vendorName: vendorName || null,
          fileUrl,
          totalCost: totalCost > 0 ? totalCost : null,
          tax,
          deliveryStatus: deliveryStatus || 'PENDING',
          deliveryReceivedDate,
          approvedBy: approvedBy || null,
          paymentStatus: paymentStatus || 'UNPAID',
          notes: notes || null,
        },
      })

      // Create inventory transactions and update stock for each product
      for (const item of items) {
        const product = productMap.get(item.productId)!
        const currentStock = product.stock
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

      // Clear `isBacklog` on any paid, not-yet-shipped order that this PO's
      // restock has made fully fulfillable. Runs INSIDE the transaction so the
      // flag flip is atomic with the stock bump that justifies it. See
      // `po-backlog-clear.ts` for the rule (every item's stock >= 0).
      const clearedBacklogOrderIds = await clearFulfillableBacklogOrders(
        tx,
        items.map((i) => i.productId),
      )

      // Mirror this PO into the Expense ledger so dashboard P&L includes it.
      await syncPurchaseOrderExpense(tx, purchaseOrder)

      return { purchaseOrder, clearedBacklogOrderIds }
    }, {
      // Match the timeout used by PUT — many line items × remote Postgres can
      // exceed Prisma's 5s default.
      maxWait: 10_000,
      timeout: 30_000,
    })

    return NextResponse.json({
      success: true,
      purchaseOrder: result.purchaseOrder,
      clearedBacklogOrderIds: result.clearedBacklogOrderIds,
    })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    const message = error instanceof Error ? error.message : 'Failed to create purchase order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

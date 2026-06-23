import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { syncPurchaseOrderExpense, deletePurchaseOrderExpense } from '@/lib/po-expense-sync'

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
    let fileUrl = existingPO.fileUrl
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

    // Create a map of old transactions by product ID
    const oldTransactionMap = new Map(
      existingPO.inventoryTransactions.map((t) => [t.productId, t])
    )

    // Some inventory transactions on this PO may reference products that have
    // since been deleted from the catalog. We can't update stock for a missing
    // product, so we skip those rows in the revert step. The InventoryTransaction
    // row itself still gets deleted below.
    const existingProductIdsOnPO = Array.from(oldTransactionMap.keys())
    const productsStillExisting = existingProductIdsOnPO.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: existingProductIdsOnPO } },
          select: { id: true },
        })
      : []
    const stillExistsSet = new Set(productsStillExisting.map((p) => p.id))

    // Update PO and stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, revert old stock changes for products that still exist.
      for (const oldTx of existingPO.inventoryTransactions) {
        if (!stillExistsSet.has(oldTx.productId)) continue
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
          deliveryReceivedDate,
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

      // Mirror this PO into the Expense ledger so dashboard P&L stays in sync.
      await syncPurchaseOrderExpense(tx, purchaseOrder)

      return purchaseOrder
    }, {
      // Each PO can touch many products in serial (revert stock × N, delete txs,
      // update PO, then for each new line: findUnique + create tx + update stock).
      // On a remote Supabase Postgres, ~50-100ms per query × dozens of queries can
      // exceed Prisma's 5s default and abort mid-flight with a transaction-timeout
      // error that surfaces as a generic 500. 30s is comfortable headroom.
      maxWait: 10_000,
      timeout: 30_000,
    })

    return NextResponse.json(result)
  } catch (error) {
    // Log the full error server-side and surface a meaningful message to the
    // admin. Without this, every failure (stock conflict, missing product,
    // upsert collision, etc.) collapses to "Failed to update" and we have to
    // tail server logs to diagnose.
    console.error('Error updating purchase order:', error)
    const message = error instanceof Error ? error.message : 'Failed to update purchase order'
    return NextResponse.json({ error: message }, { status: 500 })
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

    // Atomically clear all dependents and the PO itself. Previously the inventory-tx
    // delete and PO delete weren't wrapped in a transaction, so a failure between
    // them could orphan rows. Now we also clean up the linked Expense ledger row.
    await prisma.$transaction(async (tx) => {
      await deletePurchaseOrderExpense(tx, id)
      await tx.inventoryTransaction.deleteMany({
        where: { referenceId: id },
      })
      await tx.purchaseOrder.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete purchase order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

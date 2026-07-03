import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') return null
  return user
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const vendor = searchParams.get('vendor')
  // Page-driven filters — keep names in sync with the admin UI so the export
  // anchor matches what's on screen.
  const search = searchParams.get('search')?.trim()
  const deliveryStatus = searchParams.get('deliveryStatus')
  const paymentStatus = searchParams.get('paymentStatus')

  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        ...(vendor ? { vendorName: { contains: vendor, mode: 'insensitive' } } : {}),
        ...(deliveryStatus && deliveryStatus !== 'all' ? { deliveryStatus } : {}),
        ...(paymentStatus && paymentStatus !== 'all' ? { paymentStatus } : {}),
        ...(search
          ? {
              OR: [
                { poNumber: { contains: search, mode: 'insensitive' } },
                { vendorName: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
                { approvedBy: { contains: search, mode: 'insensitive' } },
                {
                  inventoryTransactions: {
                    some: {
                      product: {
                        name: { contains: search, mode: 'insensitive' },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
        ...(dateFrom || dateTo ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59.999Z') } : {}),
          }
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        inventoryTransactions: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    })

    // Create summary rows (one row per PO)
    const summaryRows = purchaseOrders.map((po) => {
      const totalUnits = po.inventoryTransactions.reduce((sum, t) => sum + t.quantity, 0)
      const productCount = po.inventoryTransactions.length
      const products = po.inventoryTransactions.map(t => `${t.product.name} (${t.quantity})`).join(', ')

      return {
        'PO ID': po.id,
        'PO Number': po.poNumber || 'N/A',
        'PO Date': po.poDate ? new Date(po.poDate).toLocaleDateString('en-AU') : '',
        'Vendor Name': po.vendorName || 'N/A',
        'Products Count': productCount,
        'Total Units Added': totalUnits,
        'Total Cost': po.totalCost ? Number(po.totalCost) : 0,
        'Tax': po.tax ? Number(po.tax) : 0,
        'Delivery Status': po.deliveryStatus || 'PENDING',
        'Delivery Received Date': po.deliveryReceivedDate ? new Date(po.deliveryReceivedDate).toLocaleDateString('en-AU') : '',
        'Payment Status': po.paymentStatus || 'UNPAID',
        'Approved By': po.approvedBy || '',
        'Products': products,
        'Document URL': po.fileUrl || '',
        'Notes': po.notes || '',
        'Created Date': new Date(po.createdAt).toLocaleDateString('en-AU', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    })

    // Create detailed rows (one row per product in each PO)
    const detailedRows: Record<string, unknown>[] = []
    for (const po of purchaseOrders) {
      for (const t of po.inventoryTransactions) {
        detailedRows.push({
          'PO Number': po.poNumber || 'N/A',
          'Vendor Name': po.vendorName || 'N/A',
          'Product Name': t.product.name,
          'Product SKU': t.product.sku || 'N/A',
          'Quantity Added': t.quantity,
          'Unit Cost': t.unitCost ? Number(t.unitCost) : 0,
          'Line Total': t.unitCost ? t.quantity * Number(t.unitCost) : 0,
          'Previous Stock': t.previousStock,
          'New Stock': t.newStock,
          'Date': new Date(po.createdAt).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        })
      }
    }

    const workbook = XLSX.utils.book_new()

    // Summary sheet
    if (summaryRows.length > 0) {
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows)
      const summaryColWidths = Object.keys(summaryRows[0]).map(key => ({
        wch: Math.max(
          key.length,
          ...summaryRows.map(r => String((r as Record<string, unknown>)[key] || '').length)
        ) + 2,
      }))
      summarySheet['!cols'] = summaryColWidths
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'PO Summary')
    }

    // Detailed sheet
    if (detailedRows.length > 0) {
      const detailedSheet = XLSX.utils.json_to_sheet(detailedRows)
      const detailedColWidths = Object.keys(detailedRows[0]).map(key => ({
        wch: Math.max(
          key.length,
          ...detailedRows.map(r => String((r as Record<string, unknown>)[key] || '').length)
        ) + 2,
      }))
      detailedSheet['!cols'] = detailedColWidths
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Product Details')
    }

    // If no data, create empty sheet
    if (summaryRows.length === 0) {
      const emptySheet = XLSX.utils.json_to_sheet([{ Message: 'No purchase orders found' }])
      XLSX.utils.book_append_sheet(workbook, emptySheet, 'No Data')
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const date = new Date().toISOString().split('T')[0]
    const filename = `purchase-orders-export-${date}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting purchase orders:', error)
    return NextResponse.json({ error: 'Failed to export purchase orders' }, { status: 500 })
  }
}

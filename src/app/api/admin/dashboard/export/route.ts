import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { EXPENSE_SOURCE_PURCHASE_ORDER } from '@/lib/expense-categories'

/**
 * GET /api/admin/dashboard/export
 *
 * Combined XLSX export for the dashboard, spanning three domains:
 *   - Sheet "Orders"          — paid (SUCCEEDED) customer orders
 *   - Sheet "Purchase Orders" — stock-in POs (one row per PO)
 *   - Sheet "Expenses"        — manual + PO-linked expenses (unified P&L)
 *
 * All three sheets are filtered by the same date range so the workbook
 * represents a single time window across the business:
 *   - dateFrom, dateTo (YYYY-MM-DD) — optional, both inclusive.
 *   - Orders + Purchase Orders filter by `createdAt`; Expenses filter by
 *     `date` (admin-entered actual expense date) to match the dashboard's
 *     own convention.
 *
 * Column shapes mirror the domain-specific export routes so admins get a
 * familiar layout on each sheet.
 */

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

// Build a Prisma date-range filter for `createdAt`-style columns. Returns an
// empty object when no bounds are set so the caller can spread it in.
function dateRangeFilter(field: 'createdAt' | 'date', from: string | null, to: string | null) {
  if (!from && !to) return {}
  return {
    [field]: {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to + 'T23:59:59.999Z') } : {}),
    },
  }
}

const formatDate = (d: Date) =>
  new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })

const formatDateTime = (d: Date) =>
  new Date(d).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// Set `!cols` on a sheet so each column is at least as wide as its header and
// its widest cell (capped so a single mega-cell doesn't blow the layout).
function autoSizeColumns<T extends Record<string, unknown>>(sheet: XLSX.WorkSheet, rows: T[]) {
  if (rows.length === 0) return
  const MAX_WIDTH = 60
  sheet['!cols'] = Object.keys(rows[0]).map((key) => ({
    wch: Math.min(
      MAX_WIDTH,
      Math.max(
        key.length,
        ...rows.map((r) => String(r[key as keyof T] ?? '').length),
      ) + 2,
    ),
  }))
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Run the three domain queries in parallel — they're independent.
    const [orders, purchaseOrders, expenses] = await Promise.all([
      prisma.order.findMany({
        where: {
          paymentStatus: 'SUCCEEDED',
          ...dateRangeFilter('createdAt', dateFrom, dateTo),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } },
        },
      }),
      prisma.purchaseOrder.findMany({
        where: dateRangeFilter('createdAt', dateFrom, dateTo),
        orderBy: { createdAt: 'desc' },
        include: {
          inventoryTransactions: {
            include: { product: { select: { id: true, name: true, sku: true } } },
          },
        },
      }),
      prisma.expense.findMany({
        // Expenses use `date` (actual expense date) rather than `createdAt`, matching
        // the dashboard's own filtering. Row-level ordering also uses `date` first.
        where: dateRangeFilter('date', dateFrom, dateTo),
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
    ])

    // --- Orders sheet ---
    const orderRows = orders.map((o) => {
      const address = o.shippingAddress as Record<string, string> | null
      return {
        'Order #': `#${o.id.slice(0, 8).toUpperCase()}`,
        'Customer Name': o.customerName,
        'Email': o.email,
        'Phone': o.phone || '',
        'Items': o.items.map((i) => `${i.product.name} x${i.quantity}`).join(', '),
        'Item Count': o.items.reduce((sum, i) => sum + i.quantity, 0),
        'Subtotal': Number(o.subtotal),
        'Discount': Number(o.discountAmount || 0),
        'GST': Number(o.gst),
        'Shipping': Number(o.shippingCost),
        'Total Amount': Number(o.totalAmount),
        'Payment Status': o.paymentStatus,
        'Order Status': o.status,
        'Shipping Address': address
          ? `${address.firstName || ''} ${address.lastName || ''}, ${address.address || ''}${address.apartment ? `, ${address.apartment}` : ''}, ${address.city || ''}, ${address.state || ''} ${address.postcode || ''}, ${address.country || ''}`
          : '',
        'Order Date': formatDateTime(o.createdAt),
      }
    })

    // --- Purchase Orders sheet ---
    const poRows = purchaseOrders.map((po) => {
      const totalUnits = po.inventoryTransactions.reduce((sum, t) => sum + t.quantity, 0)
      const productCount = po.inventoryTransactions.length
      const products = po.inventoryTransactions
        .map((t) => `${t.product.name} (${t.quantity})`)
        .join(', ')

      return {
        'PO Number': po.poNumber || 'N/A',
        'PO Date': po.poDate ? formatDate(po.poDate) : '',
        'Vendor Name': po.vendorName || 'N/A',
        'Products': products,
        'Products Count': productCount,
        'Total Units': totalUnits,
        'Total Cost': po.totalCost ? Number(po.totalCost) : 0,
        'Tax': po.tax ? Number(po.tax) : 0,
        'Delivery Status': po.deliveryStatus || 'PENDING',
        'Delivery Received': po.deliveryReceivedDate ? formatDate(po.deliveryReceivedDate) : '',
        'Payment Status': po.paymentStatus || 'UNPAID',
        'Approved By': po.approvedBy || '',
        'Notes': po.notes || '',
        'Created Date': formatDateTime(po.createdAt),
      }
    })

    // --- Expenses sheet ---
    const expenseRows = expenses.map((e) => ({
      Date: formatDate(e.date),
      Category: e.category,
      Amount: Number(e.amount),
      Vendor: e.vendor || '',
      Description: e.description || '',
      Source: e.sourceType === EXPENSE_SOURCE_PURCHASE_ORDER ? 'Linked from PO' : 'Manual',
      'Receipt URL': e.receiptUrl || '',
      'Created At': formatDate(e.createdAt),
    }))

    // Build the workbook. Every sheet gets appended even if empty so the admin
    // sees a clear "no data" placeholder rather than a missing tab.
    const workbook = XLSX.utils.book_new()

    const emptyPlaceholder = (label: string) => [{
      Info: `No ${label} in the selected date range`,
    }]

    // Orders sheet
    {
      const rows = orderRows.length > 0 ? orderRows : emptyPlaceholder('orders')
      const sheet = XLSX.utils.json_to_sheet(rows)
      autoSizeColumns(sheet, rows)
      XLSX.utils.book_append_sheet(workbook, sheet, 'Orders')
    }

    // Purchase Orders sheet
    {
      const rows = poRows.length > 0 ? poRows : emptyPlaceholder('purchase orders')
      const sheet = XLSX.utils.json_to_sheet(rows)
      autoSizeColumns(sheet, rows)
      XLSX.utils.book_append_sheet(workbook, sheet, 'Purchase Orders')
    }

    // Expenses sheet
    {
      const rows = expenseRows.length > 0 ? expenseRows : emptyPlaceholder('expenses')
      const sheet = XLSX.utils.json_to_sheet(rows)
      autoSizeColumns(sheet, rows)
      XLSX.utils.book_append_sheet(workbook, sheet, 'Expenses')
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Filename includes the date range for at-a-glance identification.
    const today = new Date().toISOString().split('T')[0]
    const rangeSuffix = dateFrom || dateTo
      ? `-${dateFrom || 'start'}-to-${dateTo || today}`
      : ''
    const filename = `dashboard-export${rangeSuffix}-${today}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting dashboard data:', error)
    return NextResponse.json({ error: 'Failed to export dashboard data' }, { status: 500 })
  }
}

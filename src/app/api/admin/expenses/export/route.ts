import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { buildExpenseWhere } from '../route'
import { EXPENSE_SOURCE_PURCHASE_ORDER } from '@/lib/expense-categories'

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

/**
 * GET /api/admin/expenses/export — XLSX of expenses for the current filters.
 * Same query string as the list endpoint so the page's "Export to Excel"
 * anchor downloads exactly what the admin sees.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const where = buildExpenseWhere(searchParams)

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    const formatDate = (d: Date) =>
      new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })

    const rows = expenses.map((e) => ({
      Date: formatDate(e.date),
      Category: e.category,
      Amount: Number(e.amount),
      Vendor: e.vendor || '',
      Description: e.description || '',
      Source: e.sourceType === EXPENSE_SOURCE_PURCHASE_ORDER ? 'Linked from PO' : 'Manual',
      'Receipt URL': e.receiptUrl || '',
      'Created At': formatDate(e.createdAt),
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    if (rows.length > 0) {
      worksheet['!cols'] = Object.keys(rows[0]).map((key) => ({
        wch: Math.max(
          key.length,
          ...rows.map((r) => String(r[key as keyof typeof r] ?? '').length)
        ) + 2,
      }))
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const date = new Date().toISOString().split('T')[0]
    const filename = `expenses-export-${date}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting expenses:', error)
    return NextResponse.json({ error: 'Failed to export expenses' }, { status: 500 })
  }
}

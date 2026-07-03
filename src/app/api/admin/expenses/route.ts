import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { isExpenseCategory, EXPENSE_SOURCE_PURCHASE_ORDER } from '@/lib/expense-categories'

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
 * Build the Prisma `where` clause shared by GET (list) and the export route.
 * Filter params:
 *   - from / to: ISO date strings, inclusive
 *   - category: exact match against the fixed category list
 *   - sourceType: 'MANUAL' (rows admin entered, sourceType=null) /
 *                 'PURCHASE_ORDER' (auto-synced from POs) / 'ALL' (default)
 *   - q: case-insensitive substring on vendor or description
 */
export function buildExpenseWhere(searchParams: URLSearchParams) {
  const where: Record<string, unknown> = {}

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    }
  }

  const category = searchParams.get('category')
  if (category && isExpenseCategory(category)) {
    where.category = category
  }

  const source = searchParams.get('sourceType')
  if (source === 'MANUAL') {
    where.sourceType = null
  } else if (source === EXPENSE_SOURCE_PURCHASE_ORDER) {
    where.sourceType = EXPENSE_SOURCE_PURCHASE_ORDER
  }

  const q = searchParams.get('q')
  if (q && q.trim()) {
    where.OR = [
      { vendor: { contains: q.trim(), mode: 'insensitive' } },
      { description: { contains: q.trim(), mode: 'insensitive' } },
    ]
  }

  return where
}

// GET /api/admin/expenses
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

    // Decimal → number for JSON.
    return NextResponse.json(
      expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
      }))
    )
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

// POST /api/admin/expenses
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, category, amount, vendor, description, receiptUrl } = body

    // Validation. Mirrors the form's client-side checks; treat bad input as 400.
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }
    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }
    if (!isExpenseCategory(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    const amountNum = Number(amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        date: parsedDate,
        category,
        amount: amountNum,
        vendor: vendor || null,
        description: description || null,
        receiptUrl: receiptUrl || null,
        // Manual entries always have a null source. PO-linked rows are written
        // exclusively by the PO sync helper, never by this route.
        sourceType: null,
        sourceId: null,
      },
    })

    revalidatePath('/admin05', 'page')
    return NextResponse.json({ ...expense, amount: Number(expense.amount) }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

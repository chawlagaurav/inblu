import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { isExpenseCategory } from '@/lib/expense-categories'

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

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/admin/expenses/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    // PO-linked rows are managed by the PO write paths — direct edits would let
    // the linked Expense drift from the source PO's totalCost. Block here.
    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { sourceType: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    if (existing.sourceType !== null) {
      return NextResponse.json(
        { error: 'This expense is linked to a Purchase Order. Edit the PO instead.' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const { date, category, amount, vendor, description, receiptUrl } = body

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

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        date: parsedDate,
        category,
        amount: amountNum,
        vendor: vendor || null,
        description: description || null,
        receiptUrl: receiptUrl || null,
      },
    })

    revalidatePath('/admin05', 'page')
    return NextResponse.json({ ...expense, amount: Number(expense.amount) })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

// DELETE /api/admin/expenses/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { sourceType: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    if (existing.sourceType !== null) {
      return NextResponse.json(
        { error: 'This expense is linked to a Purchase Order. Delete the PO to remove it.' },
        { status: 409 }
      )
    }

    await prisma.expense.delete({ where: { id } })
    revalidatePath('/admin05', 'page')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}

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

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/admin/employees/[id]/permanent
 *
 * Hard-deletes an employee row and (via the Prisma cascade on
 * EmployeeDocument.employeeId) all their attached document metadata. This is
 * the escape hatch for genuinely removing a record — soft-delete via the
 * regular DELETE endpoint stays the default because payroll / tax / dispute
 * history usually wants the row to survive.
 *
 * Guard: only inactive employees can be hard-deleted. To remove an active
 * employee, the admin must deactivate them first. This forces a two-step
 * action so a stray click can't wipe an active record.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    })
    if (!existing) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    if (existing.isActive) {
      return NextResponse.json(
        { error: 'Active employees cannot be permanently deleted. Deactivate first.' },
        { status: 409 }
      )
    }

    await prisma.employee.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error permanently deleting employee:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { EmploymentStatus } from '@prisma/client'

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

const VALID_EMPLOYMENT_STATUSES: EmploymentStatus[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CASUAL']
function isEmploymentStatus(v: unknown): v is EmploymentStatus {
  return typeof v === 'string' && (VALID_EMPLOYMENT_STATUSES as string[]).includes(v)
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/employees/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { documents: { orderBy: { createdAt: 'asc' } } },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

// PUT /api/admin/employees/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.employee.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const body = await request.json()
    const {
      employeeId,
      fullName,
      email,
      phone,
      address,
      department,
      position,
      joiningDate,
      employmentStatus,
      currentStatus,
      notes,
      isActive,
    } = body

    if (employmentStatus !== undefined && !isEmploymentStatus(employmentStatus)) {
      return NextResponse.json(
        { error: `employmentStatus must be one of: ${VALID_EMPLOYMENT_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    let parsedJoiningDate: Date | undefined
    if (joiningDate !== undefined) {
      parsedJoiningDate = new Date(joiningDate)
      if (Number.isNaN(parsedJoiningDate.getTime())) {
        return NextResponse.json({ error: 'Invalid joiningDate' }, { status: 400 })
      }
    }

    // Uniqueness check when changing identity-bearing fields. Compare against
    // the canonical (trimmed/lowercased) form so a no-op edit doesn't trip it.
    if (employeeId !== undefined || email !== undefined) {
      const conflict = await prisma.employee.findFirst({
        where: {
          NOT: { id },
          OR: [
            ...(employeeId !== undefined ? [{ employeeId: String(employeeId).trim() }] : []),
            ...(email !== undefined ? [{ email: String(email).trim().toLowerCase() }] : []),
          ],
        },
        select: { employeeId: true, email: true },
      })
      if (conflict) {
        const field = employeeId !== undefined && conflict.employeeId === String(employeeId).trim()
          ? 'Employee ID'
          : 'Email'
        return NextResponse.json({ error: `${field} already exists` }, { status: 409 })
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(employeeId !== undefined ? { employeeId: String(employeeId).trim() } : {}),
        ...(fullName !== undefined ? { fullName: String(fullName).trim() } : {}),
        ...(email !== undefined ? { email: String(email).trim().toLowerCase() } : {}),
        ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
        ...(address !== undefined ? { address: address ? String(address).trim() : null } : {}),
        ...(department !== undefined ? { department: String(department).trim() } : {}),
        ...(position !== undefined ? { position: String(position).trim() } : {}),
        ...(parsedJoiningDate ? { joiningDate: parsedJoiningDate } : {}),
        ...(employmentStatus !== undefined ? { employmentStatus } : {}),
        ...(currentStatus !== undefined ? { currentStatus: String(currentStatus).trim() } : {}),
        ...(notes !== undefined ? { notes: notes ? String(notes).trim() : null } : {}),
        ...(isActive !== undefined ? { isActive: !!isActive } : {}),
      },
      include: { documents: { orderBy: { createdAt: 'asc' } } },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    const message = error instanceof Error ? error.message : 'Failed to update employee'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/admin/employees/[id] — SOFT delete. Keeps the row for audit;
// payroll/tax/legal disputes routinely require historical HR data.
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.employee.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    await prisma.employee.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error soft-deleting employee:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}

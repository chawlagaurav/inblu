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
  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') return null
  return user
}

const VALID_EMPLOYMENT_STATUSES: EmploymentStatus[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CASUAL']
function isEmploymentStatus(v: unknown): v is EmploymentStatus {
  return typeof v === 'string' && (VALID_EMPLOYMENT_STATUSES as string[]).includes(v)
}

/**
 * Build the Prisma `where` clause shared by GET (list) and the export route.
 *   - `search`: case-insensitive substring across employeeId / fullName / email / phone / department / position.
 *   - `showInactive`: when 'true', the list switches to the inactive-only
 *     archive view (returns only `isActive=false` rows). Otherwise returns the
 *     active-only view. Either way the list is single-state — never mixed —
 *     so reactivating / deactivating naturally moves a row OUT of the current
 *     view, which is the UX the admin expects.
 */
export function buildEmployeeWhere(searchParams: URLSearchParams) {
  const where: Record<string, unknown> = {}

  where.isActive = searchParams.get('showInactive') !== 'true'

  const q = searchParams.get('search')?.trim()
  if (q) {
    where.OR = [
      { employeeId: { contains: q, mode: 'insensitive' } },
      { fullName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { department: { contains: q, mode: 'insensitive' } },
      { position: { contains: q, mode: 'insensitive' } },
    ]
  }

  return where
}

// GET /api/admin/employees
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const where = buildEmployeeWhere(searchParams)

    const employees = await prisma.employee.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: { documents: { orderBy: { createdAt: 'asc' } } },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

// POST /api/admin/employees
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      bankName,
      accountNumber,
      bsb,
    } = body

    // Required-field validation. Mirrors the form's client-side checks so a
    // tampered request still fails with a clear message.
    const required: Array<[string, unknown]> = [
      ['employeeId', employeeId],
      ['fullName', fullName],
      ['email', email],
      ['phone', phone],
      ['department', department],
      ['position', position],
      ['joiningDate', joiningDate],
      ['employmentStatus', employmentStatus],
      ['currentStatus', currentStatus],
    ]
    for (const [field, value] of required) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    if (!isEmploymentStatus(employmentStatus)) {
      return NextResponse.json(
        { error: `employmentStatus must be one of: ${VALID_EMPLOYMENT_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const parsedJoiningDate = new Date(joiningDate)
    if (Number.isNaN(parsedJoiningDate.getTime())) {
      return NextResponse.json({ error: 'Invalid joiningDate' }, { status: 400 })
    }

    // Uniqueness pre-check so we can return a friendly 409 instead of a raw
    // P2002 constraint violation.
    const conflict = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId: employeeId.trim() },
          { email: email.trim().toLowerCase() },
        ],
      },
      select: { employeeId: true, email: true },
    })
    if (conflict) {
      const field = conflict.employeeId === employeeId.trim() ? 'Employee ID' : 'Email'
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 409 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId: employeeId.trim(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address?.trim() || null,
        department: department.trim(),
        position: position.trim(),
        joiningDate: parsedJoiningDate,
        employmentStatus,
        currentStatus: currentStatus.trim(),
        notes: notes?.trim() || null,
        bankName: bankName?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        bsb: bsb?.trim() || null,
      },
      include: { documents: true },
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    const message = error instanceof Error ? error.message : 'Failed to create employee'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

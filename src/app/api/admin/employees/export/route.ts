import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { buildEmployeeWhere } from '../route'

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

const employmentStatusLabel: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  CASUAL: 'Casual',
}

/**
 * GET /api/admin/employees/export — XLSX of employees.
 * Honours the same `search` and `showInactive` filters as the list endpoint
 * so the download matches what the admin currently sees on screen.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const where = buildEmployeeWhere(searchParams)

    const employees = await prisma.employee.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: { documents: true },
    })

    const formatDate = (d: Date | null) =>
      d
        ? new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
        : ''

    const rows = employees.map((e) => ({
      'Employee ID': e.employeeId,
      'Full Name': e.fullName,
      'Email': e.email,
      'Phone': e.phone,
      'Address': e.address || '',
      'Department': e.department,
      'Position': e.position,
      'Joining Date': formatDate(e.joiningDate),
      'Employment Status': employmentStatusLabel[e.employmentStatus] ?? e.employmentStatus,
      'Current Status': e.currentStatus,
      'Notes': e.notes || '',
      'Bank Name': e.bankName || '',
      'Account Number': e.accountNumber || '',
      'BSB': e.bsb || '',
      // Each row gets a single "Documents" cell that joins labels with their
      // URLs for quick visibility. Spreadsheet doesn't render hyperlinks per
      // label, but the URLs are clickable when the cell is selected.
      'Documents': e.documents.length === 0
        ? ''
        : e.documents.map((d) => `${d.label}: ${d.url}`).join(' | '),
      'Active': e.isActive ? 'Yes' : 'No',
      'Created At': formatDate(e.createdAt),
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    if (rows.length > 0) {
      const MAX_WIDTH = 60
      worksheet['!cols'] = Object.keys(rows[0]).map((key) => ({
        wch: Math.min(
          MAX_WIDTH,
          Math.max(
            key.length,
            ...rows.map((r) => String(r[key as keyof typeof r] ?? '').length)
          ) + 2,
        ),
      }))
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const date = new Date().toISOString().split('T')[0]
    const filename = `employees-export-${date}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting employees:', error)
    return NextResponse.json({ error: 'Failed to export employees' }, { status: 500 })
  }
}

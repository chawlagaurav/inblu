import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
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
  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') return null
  return user
}

/**
 * GET /api/admin/enquiries/export — XLSX of enquiries.
 *
 * Honours the same query params the page uses (`status`, `search`) so the
 * "Export to Excel" anchor downloads exactly what the admin sees. With no
 * params it exports every enquiry.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')?.trim()

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ]
    }

    const enquiries = await prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const formatDate = (d: Date | null) =>
      d
        ? new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
        : ''

    const rows = enquiries.map((e) => ({
      'Submitted': formatDate(e.createdAt),
      'Name': e.name,
      'Email': e.email,
      'Phone': e.phone || '',
      'Subject': e.subject,
      'Message': e.message,
      'Status': e.status,
      'Comment': e.comment || '',
      'Resolved At': formatDate(e.resolvedAt),
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    if (rows.length > 0) {
      // Cap column width so a long message doesn't blow out the sheet to 5,000 chars wide.
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Enquiries')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const date = new Date().toISOString().split('T')[0]
    const filename = `enquiries-export-${date}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting enquiries:', error)
    return NextResponse.json({ error: 'Failed to export enquiries' }, { status: 500 })
  }
}

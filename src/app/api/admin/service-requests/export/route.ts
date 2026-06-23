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
  if (dbUser?.role !== 'ADMIN') return null
  return user
}

/**
 * GET /api/admin/service-requests/export — XLSX of service requests.
 *
 * Honours the page's `status` and `search` filters so the export matches
 * what the admin currently sees. With no params it exports everything.
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
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { issueDescription: { contains: search, mode: 'insensitive' } },
      ]
    }

    const requests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const formatDate = (d: Date | null) =>
      d
        ? new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
        : ''

    const rows = requests.map((sr) => ({
      'Submitted': formatDate(sr.createdAt),
      'Ticket #': sr.ticketNumber,
      'Customer Name': sr.name,
      'Email': sr.email,
      'Phone': sr.phone,
      'Address': [sr.address, sr.city, sr.state, sr.postcode].filter(Boolean).join(', '),
      'Service Type': sr.serviceType.replace(/_/g, ' '),
      'Product': sr.productName || '',
      'Purchase Date': formatDate(sr.purchaseDate),
      'Issue': sr.issueDescription,
      'Preferred Date': formatDate(sr.preferredDate),
      'Status': sr.status.replace(/_/g, ' '),
      'Priority': sr.priority,
      'Assigned To': sr.assignedTo || '',
      'Scheduled Date': formatDate(sr.scheduledDate),
      'Completed At': formatDate(sr.completedAt),
      'Resolution': sr.resolution || '',
      'Internal Notes': sr.internalNotes || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    if (rows.length > 0) {
      // Cap column width so long issue descriptions / notes don't make the
      // sheet absurd to scroll horizontally.
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Service Requests')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const date = new Date().toISOString().split('T')[0]
    const filename = `service-requests-export-${date}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting service requests:', error)
    return NextResponse.json({ error: 'Failed to export service requests' }, { status: 500 })
  }
}

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
  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') return null
  return user
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/employees/[id]/documents
// Attach a {label, url} document record to an employee. The file itself is
// already uploaded to Cloudinary via /api/admin/upload; this endpoint just
// stores the metadata.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: employeeId } = await params

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const body = await request.json()
    const { label, url } = body

    if (!label || typeof label !== 'string' || !label.trim()) {
      return NextResponse.json({ error: 'Document label is required' }, { status: 400 })
    }
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'Document URL is required' }, { status: 400 })
    }

    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId,
        label: label.trim(),
        url: url.trim(),
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Error attaching employee document:', error)
    return NextResponse.json({ error: 'Failed to attach document' }, { status: 500 })
  }
}

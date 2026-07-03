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
  params: Promise<{ id: string; docId: string }>
}

// DELETE /api/admin/employees/[id]/documents/[docId]
// Removes the metadata row. We don't proactively delete the underlying
// Cloudinary asset here — failing to clean that up never breaks anything,
// and a later cleanup script can sweep orphaned uploads if/when storage cost
// matters. Keeps this endpoint side-effect-light and reversible.
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: employeeId, docId } = await params

    const doc = await prisma.employeeDocument.findUnique({
      where: { id: docId },
      select: { employeeId: true },
    })
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Defensive: enforce the URL hierarchy. Without this, an admin could
    // delete any doc by id regardless of which employee URL was hit. Still
    // admin-only behind verifyAdmin, but the check costs nothing.
    if (doc.employeeId !== employeeId) {
      return NextResponse.json({ error: 'Document does not belong to this employee' }, { status: 400 })
    }

    await prisma.employeeDocument.delete({ where: { id: docId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}

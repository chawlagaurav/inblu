import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { EnquiryStatus } from '@prisma/client'

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

// PATCH - Update enquiry status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, comment } = body

    const validStatuses: EnquiryStatus[] = ['NEW_LEAD', 'INTERESTED', 'FOLLOW_UP', 'NEED_MORE_INFO', 'QUOTATION_SENT', 'NEGOTIATION', 'CONVERTED_TO_ORDER', 'NO_RESPONSE', 'NOT_INTERESTED', 'LOST', 'FUTURE_FOLLOW_UP']
    
    const updateData: { status?: EnquiryStatus; comment?: string | null } = {}
    
    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status as EnquiryStatus
    }
    
    if (comment !== undefined) {
      updateData.comment = comment || null
    }

    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(enquiry)
  } catch (error) {
    console.error('Error updating enquiry:', error)
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 })
  }
}

// DELETE - Delete an enquiry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.enquiry.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting enquiry:', error)
    return NextResponse.json({ error: 'Failed to delete enquiry' }, { status: 500 })
  }
}

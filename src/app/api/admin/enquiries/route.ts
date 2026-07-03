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

// GET all enquiries
export async function GET() {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(enquiries)
  } catch (error) {
    console.error('Error fetching enquiries:', error)
    return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 })
  }
}

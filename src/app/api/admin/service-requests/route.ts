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

// GET: Fetch all service requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const serviceType = searchParams.get('serviceType')
    const priority = searchParams.get('priority')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (serviceType) where.serviceType = serviceType
    if (priority) where.priority = priority

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            serviceDueDate: true,
          },
        },
      },
    })

    return NextResponse.json(serviceRequests)
  } catch (error) {
    console.error('Error fetching service requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
      { status: 500 }
    )
  }
}

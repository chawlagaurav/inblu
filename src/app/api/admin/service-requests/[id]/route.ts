import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { ServiceRequestStatus } from '@prisma/client'

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

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET: Fetch single service request
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
    })

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error('Error fetching service request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service request' },
      { status: 500 }
    )
  }
}

// PATCH: Update service request
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    const {
      status,
      priority,
      assignedTo,
      internalNotes,
      resolution,
      scheduledDate,
    } = body

    // Get current service request to check for linked order
    const currentRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { orderId: true, status: true },
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (status) {
      updateData.status = status as ServiceRequestStatus
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
      }
    }
    if (priority !== undefined) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes
    if (resolution !== undefined) updateData.resolution = resolution
    if (scheduledDate !== undefined) {
      updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null
    }

    const serviceRequest = await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
    })

    // If status changed to COMPLETED and there's a linked order, update service due date
    if (status === 'COMPLETED' && currentRequest.status !== 'COMPLETED' && currentRequest.orderId) {
      // Get the order with its items and products to find max service tenure
      const order = await prisma.order.findUnique({
        where: { id: currentRequest.orderId },
        include: {
          items: {
            include: {
              product: {
                select: { serviceTenureMonths: true },
              },
            },
          },
        },
      })

      if (order) {
        // Find the maximum service tenure from all products in the order
        const maxTenure = order.items.reduce((max, item) => {
          return Math.max(max, item.product.serviceTenureMonths || 6)
        }, 6)

        // Calculate new service due date from now
        const newServiceDueDate = new Date()
        newServiceDueDate.setMonth(newServiceDueDate.getMonth() + maxTenure)

        await prisma.order.update({
          where: { id: currentRequest.orderId },
          data: { serviceDueDate: newServiceDueDate },
        })
      }
    }

    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error('Error updating service request:', error)
    return NextResponse.json(
      { error: 'Failed to update service request' },
      { status: 500 }
    )
  }
}

// DELETE: Delete service request
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    await prisma.serviceRequest.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service request:', error)
    return NextResponse.json(
      { error: 'Failed to delete service request' },
      { status: 500 }
    )
  }
}

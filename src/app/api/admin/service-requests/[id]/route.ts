import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { ServiceRequestStatus } from '@prisma/client'
import { maxServiceableTenure, addMonths } from '@/lib/service-due'

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
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            serviceDueDate: true,
            items: {
              select: {
                id: true,
                quantity: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        servicedOrderItem: {
          select: {
            id: true,
            quantity: true,
            product: { select: { name: true } },
          },
        },
        partsOrders: {
          include: {
            order: {
              select: { id: true, customerName: true, totalAmount: true },
            },
          },
        },
      },
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
      servicedOrderItemId,
      partsOrderIds,
    } = body

    // Get current service request to check for linked order
    const currentRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { orderId: true, status: true },
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    // Resolve pasted parts-order identifiers (accept full UUID or the 8-char
    // short code shown in the admin UI) to real order IDs. Reject unknowns so
    // a typo surfaces instead of silently dropping the link.
    let resolvedPartsOrderIds: string[] | null = null
    if (partsOrderIds !== undefined) {
      if (!Array.isArray(partsOrderIds)) {
        return NextResponse.json({ error: 'partsOrderIds must be an array' }, { status: 400 })
      }
      const resolved = new Set<string>()
      const notFound: string[] = []
      for (const raw of partsOrderIds) {
        const value = String(raw ?? '').trim()
        if (!value) continue
        const order = await prisma.order.findFirst({
          where: { id: { startsWith: value.toLowerCase() } },
          select: { id: true },
        })
        if (order) resolved.add(order.id)
        else notFound.push(value)
      }
      if (notFound.length > 0) {
        return NextResponse.json(
          { error: `Order ID(s) not found: ${notFound.join(', ')}` },
          { status: 400 }
        )
      }
      resolvedPartsOrderIds = Array.from(resolved)
    }

    // Validate the serviced order item belongs to the linked order.
    if (servicedOrderItemId) {
      if (!currentRequest.orderId) {
        return NextResponse.json(
          { error: 'Cannot set a serviced product: this request has no linked order.' },
          { status: 400 }
        )
      }
      const item = await prisma.orderItem.findFirst({
        where: { id: servicedOrderItemId, orderId: currentRequest.orderId },
        select: { id: true },
      })
      if (!item) {
        return NextResponse.json(
          { error: 'Selected product does not belong to the linked order.' },
          { status: 400 }
        )
      }
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
    if (servicedOrderItemId !== undefined) {
      updateData.servicedOrderItemId = servicedOrderItemId || null
    }
    if (scheduledDate !== undefined) {
      updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null
    }

    await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
    })

    // Sync the parts-order links (add new, remove deselected).
    if (resolvedPartsOrderIds !== null) {
      const existing = await prisma.serviceRequestPartsOrder.findMany({
        where: { serviceRequestId: id },
        select: { orderId: true },
      })
      const existingIds = new Set(existing.map((e) => e.orderId))
      const desiredIds = new Set(resolvedPartsOrderIds)

      const toAdd = resolvedPartsOrderIds.filter((oid) => !existingIds.has(oid))
      const toRemove = [...existingIds].filter((oid) => !desiredIds.has(oid))

      if (toRemove.length > 0) {
        await prisma.serviceRequestPartsOrder.deleteMany({
          where: { serviceRequestId: id, orderId: { in: toRemove } },
        })
      }
      if (toAdd.length > 0) {
        await prisma.serviceRequestPartsOrder.createMany({
          data: toAdd.map((oid) => ({ serviceRequestId: id, orderId: oid })),
          skipDuplicates: true,
        })
      }
    }

    // If status changed to COMPLETED and there's a linked order, update service due date
    if (status === 'COMPLETED' && currentRequest.status !== 'COMPLETED' && currentRequest.orderId) {
      // Get the order with its items and products to find max service tenure
      const order = await prisma.order.findUnique({
        where: { id: currentRequest.orderId },
        include: {
          items: {
            include: {
              product: {
                select: { serviceTenureMonths: true, isServiceable: true },
              },
            },
          },
        },
      })

      if (order) {
        // Use only serviceable items — consumables (filter kits, spare parts)
        // must not create or extend a service window.
        const maxTenure = maxServiceableTenure(
          order.items.map((item) => ({
            serviceTenureMonths: item.product.serviceTenureMonths,
            isServiceable: item.product.isServiceable,
          }))
        )

        // Only reset the due date when the order has serviceable items.
        if (maxTenure != null) {
          const newServiceDueDate = addMonths(new Date(), maxTenure)
          await prisma.order.update({
            where: { id: currentRequest.orderId },
            data: { serviceDueDate: newServiceDueDate },
          })
        }
      }
    }

    // Re-fetch with relations so the client gets the updated parts orders and
    // serviced product in the response.
    const updated = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            serviceDueDate: true,
            items: {
              select: {
                id: true,
                quantity: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        servicedOrderItem: {
          select: {
            id: true,
            quantity: true,
            product: { select: { name: true } },
          },
        },
        partsOrders: {
          include: {
            order: {
              select: { id: true, customerName: true, totalAmount: true },
            },
          },
        },
      },
    })

    return NextResponse.json(updated)
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

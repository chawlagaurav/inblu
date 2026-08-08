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
                product: { select: { name: true, isServiceable: true } },
              },
            },
          },
        },
        servicedOrderItem: {
          select: {
            id: true,
            quantity: true,
            product: { select: { name: true, isServiceable: true } },
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
      orderId,
      recomputeServiceDue,
    } = body

    // Get current service request to check for linked order
    const currentRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { orderId: true, status: true, completedAt: true },
    })

    if (!currentRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    // Resolve the main linked order if the admin is changing it. Accept a full
    // UUID or the 8-char short code, or an empty value / null to unlink.
    let newOrderId: string | null | undefined = undefined // undefined = unchanged
    if (orderId !== undefined) {
      const value = String(orderId ?? '').trim()
      if (!value) {
        newOrderId = null
      } else {
        const order = await prisma.order.findFirst({
          where: { id: { startsWith: value.toLowerCase() } },
          select: { id: true },
        })
        if (!order) {
          return NextResponse.json(
            { error: `Order ID not found: ${value}` },
            { status: 400 }
          )
        }
        newOrderId = order.id
      }
    }

    // The order this request will be linked to after this update.
    const effectiveOrderId =
      newOrderId !== undefined ? newOrderId : currentRequest.orderId

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

    // Validate the serviced order item belongs to the (effective) linked order.
    if (servicedOrderItemId) {
      if (!effectiveOrderId) {
        return NextResponse.json(
          { error: 'Cannot set a serviced product: this request has no linked order.' },
          { status: 400 }
        )
      }
      const item = await prisma.orderItem.findFirst({
        where: { id: servicedOrderItemId, orderId: effectiveOrderId },
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
      // A completed request is locked: its status cannot be changed again.
      // (Backs up the UI lock; also prevents re-stamping completedAt.)
      if (currentRequest.status === 'COMPLETED' && status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'This request is already completed and its status can no longer be changed.' },
          { status: 400 }
        )
      }
      updateData.status = status as ServiceRequestStatus
      // Stamp completedAt only on the first transition into COMPLETED, and never
      // overwrite an existing value — re-saving a completed request must keep
      // the original service-completion date.
      if (
        status === 'COMPLETED' &&
        currentRequest.status !== 'COMPLETED' &&
        !currentRequest.completedAt
      ) {
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
    if (newOrderId !== undefined) {
      updateData.orderId = newOrderId
      // The old serviced product belonged to the previous order; clear it unless
      // a new one is being set in this same request.
      if (servicedOrderItemId === undefined) {
        updateData.servicedOrderItemId = null
      }
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

    // Recompute the linked order's service-due date.
    //
    // Fires when any of these is true:
    //   - the request is transitioning into COMPLETED (the normal case)
    //   - the admin explicitly asked to recompute (recomputeServiceDue) — lets
    //     an already-COMPLETED request be reset after fixing a mis-linked order
    //   - the linked order was changed on this request
    //
    // The due date is based on the max serviceable tenure of the EFFECTIVE
    // linked order; consumable-only orders yield no service window (blank).
    // Base date is the service completion date when known, else now.
    const isCompletingNow =
      status === 'COMPLETED' && currentRequest.status !== 'COMPLETED'
    const orderChanged =
      newOrderId !== undefined && newOrderId !== currentRequest.orderId
    const shouldRecompute =
      isCompletingNow || recomputeServiceDue === true || orderChanged

    // Outcome reported back to the client for a clear toast message.
    let serviceDueResult:
      | { set: true; date: string; orderShort: string }
      | { set: false; reason: 'no-order' | 'consumable-only' }
      | null = null

    if (shouldRecompute) {
      if (!effectiveOrderId) {
        serviceDueResult = { set: false, reason: 'no-order' }
      } else {
        const order = await prisma.order.findUnique({
          where: { id: effectiveOrderId },
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

          if (maxTenure != null) {
            // Base the next service-due date on the actual completion date, not
            // "now": prefer an existing completedAt, then any value stamped in
            // this request, and only fall back to now if neither exists.
            const base =
              currentRequest.completedAt ??
              (updateData.completedAt as Date | undefined) ??
              new Date()
            const newServiceDueDate = addMonths(base, maxTenure)
            await prisma.order.update({
              where: { id: effectiveOrderId },
              data: { serviceDueDate: newServiceDueDate },
            })
            serviceDueResult = {
              set: true,
              date: newServiceDueDate.toISOString(),
              orderShort: order.id.slice(0, 8).toUpperCase(),
            }
          } else {
            serviceDueResult = { set: false, reason: 'consumable-only' }
          }
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
                product: { select: { name: true, isServiceable: true } },
              },
            },
          },
        },
        servicedOrderItem: {
          select: {
            id: true,
            quantity: true,
            product: { select: { name: true, isServiceable: true } },
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

    return NextResponse.json({ ...updated, _serviceDue: serviceDueResult })
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

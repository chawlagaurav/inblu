import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ServiceType } from '@prisma/client'

/**
 * Generate ticket number: SR-YYYYMMDD-XXXX
 */
function generateTicketNumber(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SR-${dateStr}-${randomSuffix}`
}

// POST: Create new service request (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      postcode,
      serviceType,
      orderId,
      productName,
      purchaseDate,
      issueDescription,
      preferredDate,
    } = body

    // Validate required fields
    if (!name || !email || !phone || !serviceType || !issueDescription || !orderId) {
      return NextResponse.json(
        { error: 'Please fill in all required fields including Order ID' },
        { status: 400 }
      )
    }

    // Validate service type
    const validServiceTypes: ServiceType[] = [
      'INSTALLATION',
      'MAINTENANCE',
      'REPAIR',
      'FILTER_REPLACEMENT',
      'INSPECTION',
      'WARRANTY_CLAIM',
      'OTHER',
    ]
    if (!validServiceTypes.includes(serviceType)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    // Validate and find order by ID
    const order = await prisma.order.findFirst({
      where: {
        id: {
          startsWith: orderId.trim().toLowerCase(),
        },
      },
    })
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found. Please check your Order ID and try again.' },
        { status: 400 }
      )
    }

    // Generate unique ticket number
    let ticketNumber = generateTicketNumber()
    let attempts = 0
    while (attempts < 5) {
      const existing = await prisma.serviceRequest.findUnique({
        where: { ticketNumber },
      })
      if (!existing) break
      ticketNumber = generateTicketNumber()
      attempts++
    }

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        ticketNumber,
        orderId: order.id,
        name,
        email,
        phone,
        address: address || null,
        city: city || null,
        state: state || null,
        postcode: postcode || null,
        serviceType: serviceType as ServiceType,
        productName: productName || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        issueDescription,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
      },
    })

    return NextResponse.json({
      success: true,
      ticketNumber: serviceRequest.ticketNumber,
      id: serviceRequest.id,
    })
  } catch (error) {
    console.error('Service request creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create service request' },
      { status: 500 }
    )
  }
}

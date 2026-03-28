import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'ADMIN') return null
  return user
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const type = searchParams.get('type')

  try {
    // Registered customers
    const registeredCustomers = type === 'guests' ? [] : await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        ...(search ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ]
        } : {}),
      },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            shippingAddress: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Guest orders
    const guestOrders = type === 'registered' ? [] : await prisma.order.findMany({
      where: {
        isGuest: true,
        ...(search ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
          ]
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group guest orders by email
    const guestMap = new Map<string, {
      email: string
      name: string
      phone: string | null
      orderCount: number
      totalSpent: number
      lastOrder: Date
      address: Record<string, string> | null
    }>()

    guestOrders.forEach(order => {
      const existing = guestMap.get(order.email)
      if (existing) {
        existing.orderCount++
        existing.totalSpent += Number(order.totalAmount)
      } else {
        guestMap.set(order.email, {
          email: order.email,
          name: order.customerName,
          phone: order.phone,
          orderCount: 1,
          totalSpent: Number(order.totalAmount),
          lastOrder: order.createdAt,
          address: order.shippingAddress as Record<string, string> | null,
        })
      }
    })

    function formatAddress(addr: Record<string, string> | null): string {
      if (!addr) return ''
      return [
        addr.address,
        addr.apartment,
        addr.city,
        addr.state,
        addr.postcode,
        addr.country,
      ].filter(Boolean).join(', ')
    }

    const rows: Record<string, string | number>[] = []

    // Add registered customers
    registeredCustomers.forEach(c => {
      const latestAddress = c.orders[0]?.shippingAddress as Record<string, string> | null
      rows.push({
        'Name': c.name || c.email.split('@')[0],
        'Email': c.email,
        'Phone': c.phone || '',
        'Type': 'Registered',
        'Orders': c.orders.length,
        'Total Spent': c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
        'Shipping Address': formatAddress(latestAddress),
        'Last Order': c.orders[0]?.createdAt
          ? new Date(c.orders[0].createdAt).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
          : 'No orders',
        'Joined': new Date(c.createdAt).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' }),
      })
    })

    // Add guest customers
    guestMap.forEach(c => {
      rows.push({
        'Name': c.name,
        'Email': c.email,
        'Phone': c.phone || '',
        'Type': 'Guest',
        'Orders': c.orderCount,
        'Total Spent': c.totalSpent,
        'Shipping Address': formatAddress(c.address),
        'Last Order': new Date(c.lastOrder).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' }),
        'Joined': '',
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)

    // Auto-size columns
    if (rows.length > 0) {
      const colWidths = Object.keys(rows[0]).map(key => ({
        wch: Math.max(
          key.length,
          ...rows.map(r => String(r[key] || '').length)
        ) + 2,
      }))
      worksheet['!cols'] = colWidths
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const date = new Date().toISOString().split('T')[0]
    const filename = `customers-export-${date}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting customers:', error)
    return NextResponse.json({ error: 'Failed to export customers' }, { status: 500 })
  }
}

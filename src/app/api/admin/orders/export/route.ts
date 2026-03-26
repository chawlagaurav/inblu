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
  const status = searchParams.get('status')
  const paymentStatus = searchParams.get('paymentStatus')
  const search = searchParams.get('search')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  try {
    const orders = await prisma.order.findMany({
      where: {
        ...(status && status !== 'all' ? { status: status as 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' } : {}),
        ...(paymentStatus && paymentStatus !== 'all' ? { paymentStatus: paymentStatus as 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' } : {}),
        ...(search ? {
          OR: [
            { customerName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { id: { contains: search, mode: 'insensitive' } },
          ]
        } : {}),
        ...(dateFrom || dateTo ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59.999Z') } : {}),
          }
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    })

    const rows = orders.map((order) => {
      const address = order.shippingAddress as Record<string, string>
      return {
        'Order ID': order.id,
        'Order #': `#${order.id.slice(0, 8).toUpperCase()}`,
        'Customer Name': order.customerName,
        'Email': order.email,
        'Phone': order.phone || '',
        'Items': order.items.map(i => `${i.product.name} x${i.quantity}`).join(', '),
        'Item Count': order.items.reduce((sum, i) => sum + i.quantity, 0),
        'Subtotal': Number(order.subtotal),
        'GST': Number(order.gst),
        'Shipping': Number(order.shippingCost),
        'Total Amount': Number(order.totalAmount),
        'Payment Status': order.paymentStatus,
        'Order Status': order.status,
        'Guest Order': order.isGuest ? 'Yes' : 'No',
        'Tracking Number': order.trackingNumber || '',
        'Shipping Address': address
          ? `${address.firstName || ''} ${address.lastName || ''}, ${address.address || ''}${address.apartment ? `, ${address.apartment}` : ''}, ${address.city || ''}, ${address.state || ''} ${address.postcode || ''}, ${address.country || ''}`
          : '',
        'Notes': order.notes || '',
        'Order Date': new Date(order.createdAt).toLocaleDateString('en-AU', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(
        key.length,
        ...rows.map(r => String((r as Record<string, unknown>)[key] || '').length)
      ) + 2,
    }))
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const date = new Date().toISOString().split('T')[0]
    const filename = `orders-export-${date}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting orders:', error)
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 })
  }
}

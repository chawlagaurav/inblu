import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const shippingAddress = order.shippingAddress as {
      firstName: string
      lastName: string
      address: string
      apartment?: string
      city: string
      state: string
      postcode: string
      country: string
    }

    // Generate HTML invoice (can be converted to PDF using a library)
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${order.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 40px; }
    .invoice { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #0a508e; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 20px; font-weight: bold; color: #1e293b; }
    .date { color: #64748b; margin-top: 4px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: 600; color: #64748b; margin-bottom: 10px; text-transform: uppercase; }
    .customer-info { background: #f8fafc; padding: 20px; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px; background: #f1f5f9; font-weight: 600; font-size: 14px; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .amount { text-align: right; }
    .totals { margin-top: 20px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #1e293b; padding-top: 16px; margin-top: 8px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status.paid { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef9c3; color: #854d0e; }
    .footer { margin-top: 60px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">Inblu</div>
      <div class="invoice-info">
        <div class="invoice-number">Invoice #${order.id.slice(0, 8).toUpperCase()}</div>
        <div class="date">${formatDate(order.createdAt)}</div>
        <div class="status ${order.paymentStatus === 'SUCCEEDED' ? 'paid' : 'pending'}">
          ${order.paymentStatus === 'SUCCEEDED' ? 'PAID' : order.paymentStatus}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Bill To</div>
      <div class="customer-info">
        <strong>${order.customerName}</strong><br>
        ${order.email}<br>
        ${shippingAddress.address}<br>
        ${shippingAddress.apartment ? shippingAddress.apartment + '<br>' : ''}
        ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postcode}<br>
        ${shippingAddress.country}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Order Items</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th class="amount">Price</th>
            <th class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.product.name}</td>
              <td>${item.quantity}</td>
              <td class="amount">${formatCurrency(Number(item.price))}</td>
              <td class="amount">${formatCurrency(Number(item.price) * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${formatCurrency(Number(order.subtotal))}</span>
        </div>
        <div class="totals-row">
          <span>Shipping</span>
          <span>${Number(order.shippingCost) === 0 ? 'Free' : formatCurrency(Number(order.shippingCost))}</span>
        </div>
        <div class="totals-row">
          <span>GST (included)</span>
          <span>${formatCurrency(Number(order.gst))}</span>
        </div>
        <div class="totals-row total">
          <span>Total</span>
          <span>${formatCurrency(Number(order.totalAmount))}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>If you have any questions, please contact support@inblu.com.au</p>
    </div>
  </div>
</body>
</html>
    `

    // Return as HTML for now (in production, use a PDF library like puppeteer or jspdf)
    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${order.id.slice(0, 8).toUpperCase()}.html"`,
      },
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}

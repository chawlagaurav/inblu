import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { v2 as cloudinary } from 'cloudinary'
import { Resend } from 'resend'
import { generateInvoiceHtml } from '@/lib/invoice-html'
import {
  InvoiceItem,
  generateInvoiceNumberFromOrder,
  formatInvoiceDate,
  calculateDueDate,
  DEFAULT_BANK_DETAILS,
  COMPANY_DETAILS,
} from '@/lib/invoice'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

interface GenerateInvoiceRequest {
  orderId: string
  deposit?: number
  bankDetails?: {
    bankName: string
    accountName: string
    accountNumber: string
    bsb: string
  }
  sendEmail?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateInvoiceRequest = await request.json()
    const { orderId, deposit = 0, bankDetails = DEFAULT_BANK_DETAILS, sendEmail = false } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Fetch order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate invoice data
    const invoiceDate = new Date(order.createdAt)
    const dueDate = calculateDueDate(invoiceDate)
    const invoiceNumber = generateInvoiceNumberFromOrder(order.id, invoiceDate)

    const items: InvoiceItem[] = order.items.map((item) => ({
      description: item.product.name,
      unitPrice: Number(item.price),
      quantity: item.quantity,
    }))

    // Add shipping as a line item if applicable
    if (Number(order.shippingCost) > 0) {
      items.push({
        description: 'Shipping',
        unitPrice: Number(order.shippingCost),
        quantity: 1,
      })
    }

    const invoiceHtml = generateInvoiceHtml({
      invoiceNumber,
      date: formatInvoiceDate(invoiceDate),
      dueDate: formatInvoiceDate(dueDate),
      clientName: order.customerName,
      clientEmail: order.email,
      clientPhone: order.phone || undefined,
      items,
      deposit,
      bankDetails,
    })

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    
    const page = await browser.newPage()
    await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })

    await browser.close()

    // Upload to Cloudinary
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'invoices',
          public_id: `invoice_${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}`,
          resource_type: 'raw',
          format: 'pdf',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as { secure_url: string })
        }
      )
      uploadStream.end(pdfBuffer)
    })

    const pdfUrl = uploadResult.secure_url

    // Send email if requested
    let emailSent = false
    if (sendEmail) {
      try {
        await resend.emails.send({
          from: `${COMPANY_DETAILS.name} <${process.env.RESEND_FROM_EMAIL || 'invoices@inblu.com.au'}>`,
          to: order.email,
          subject: `Invoice #${invoiceNumber}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #0f172a;">Invoice #${invoiceNumber}</h1>
              <p style="color: #475569;">Dear ${order.customerName},</p>
              <p style="color: #475569;">
                Thank you for your order. Please find your invoice attached to this email.
              </p>
              <p style="color: #475569;">
                <strong>Order Total:</strong> $${Number(order.totalAmount).toFixed(2)}<br>
                <strong>Due Date:</strong> ${formatInvoiceDate(dueDate)}
              </p>
              <p style="color: #475569;">
                If you have any questions, please don't hesitate to contact us.
              </p>
              <p style="color: #475569;">
                Best regards,<br>
                ${COMPANY_DETAILS.name} Team
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
              <p style="color: #94a3b8; font-size: 12px;">
                ${COMPANY_DETAILS.address}<br>
                ${COMPANY_DETAILS.phone} | ${COMPANY_DETAILS.email}
              </p>
            </div>
          `,
          attachments: [
            {
              filename: `Invoice-${invoiceNumber}.pdf`,
              content: Buffer.from(pdfBuffer).toString('base64'),
            },
          ],
        })
        emailSent = true
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      invoiceNumber,
      pdfUrl,
      emailSent,
    })
  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

// GET: Preview invoice HTML (for testing/preview)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  const preview = searchParams.get('preview') === 'true'

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const invoiceDate = new Date(order.createdAt)
    const dueDate = calculateDueDate(invoiceDate)
    const invoiceNumber = generateInvoiceNumberFromOrder(order.id, invoiceDate)

    const items: InvoiceItem[] = order.items.map((item) => ({
      description: item.product.name,
      unitPrice: Number(item.price),
      quantity: item.quantity,
    }))

    if (Number(order.shippingCost) > 0) {
      items.push({
        description: 'Shipping',
        unitPrice: Number(order.shippingCost),
        quantity: 1,
      })
    }

    if (preview) {
      const html = generateInvoiceHtml({
        invoiceNumber,
        date: formatInvoiceDate(invoiceDate),
        dueDate: formatInvoiceDate(dueDate),
        clientName: order.customerName,
        clientEmail: order.email,
        clientPhone: order.phone || undefined,
        items,
        deposit: 0,
        bankDetails: DEFAULT_BANK_DETAILS,
      })
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    return NextResponse.json({
      invoiceNumber,
      date: formatInvoiceDate(invoiceDate),
      dueDate: formatInvoiceDate(dueDate),
      clientName: order.customerName,
      clientEmail: order.email,
      clientPhone: order.phone,
      items,
      totalAmount: Number(order.totalAmount),
    })
  } catch (error) {
    console.error('Invoice preview error:', error)
    return NextResponse.json({ error: 'Failed to preview invoice' }, { status: 500 })
  }
}

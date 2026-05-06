import { Resend } from 'resend'
import { formatCurrency, formatDate } from './utils'

const FROM_EMAIL = 'inBlu Australia <info@inblu.com.au>'

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set — emails will only be logged to console.')
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export interface OrderEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  shipping: number
  gst: number
  total: number
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    apartment?: string
    city: string
    state: string
    postcode: string
    country: string
  }
  orderDate: Date
  isGuest: boolean
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  try {
    const subject = `Order Confirmation - #${data.orderId.slice(0, 8).toUpperCase()}`
    const html = generateOrderEmailHtml(data)
    const resend = getResend()

    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: data.customerEmail,
        subject,
        html,
      })

      if (error) {
        console.error('Resend error (order confirmation):', error)
        return false
      }

      console.log(`Order confirmation email sent to ${data.customerEmail} for order ${data.orderId}`)
    } else {
      // Fallback: log to console when Resend is not configured
      console.log('=== ORDER CONFIRMATION EMAIL (not sent — Resend not configured) ===')
      console.log(`To: ${data.customerEmail}`)
      console.log(`Subject: ${subject}`)
      console.log('=================================')
    }

    return true
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    return false
  }
}

export async function sendAdminOrderNotification(data: OrderEmailData): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'info@inblu.com.au'
    const subject = `New ${data.isGuest ? 'Guest ' : ''}Order - #${data.orderId.slice(0, 8).toUpperCase()}`
    const html = generateAdminNotificationHtml(data)
    const resend = getResend()

    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: adminEmail,
        subject,
        html,
      })

      if (error) {
        console.error('Resend error (admin notification):', error)
        return false
      }

      console.log(`Admin order notification sent to ${adminEmail} for order ${data.orderId}`)
    } else {
      console.log('=== ADMIN ORDER NOTIFICATION (not sent — Resend not configured) ===')
      console.log(`To: ${adminEmail}`)
      console.log(`Subject: ${subject}`)
      console.log('=================================')
    }

    return true
  } catch (error) {
    console.error('Failed to send admin notification:', error)
    return false
  }
}

function generateAdminNotificationHtml(data: OrderEmailData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('')

  const addr = data.shippingAddress

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; color: #1e293b; padding: 20px;">
      <h2>New ${data.isGuest ? 'Guest ' : ''}Order — #${data.orderId.slice(0, 8).toUpperCase()}</h2>
      <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
      <p><strong>Order Type:</strong> ${data.isGuest ? 'Guest Order' : 'Registered User'}</p>
      <p><strong>Date:</strong> ${formatDate(data.orderDate)}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><strong>Subtotal:</strong> ${formatCurrency(data.subtotal)}</p>
      <p><strong>Shipping:</strong> ${data.shipping === 0 ? 'FREE' : formatCurrency(data.shipping)}</p>
      <p><strong>GST (included):</strong> ${formatCurrency(data.gst)}</p>
      <p style="font-size: 18px;"><strong>Total: ${formatCurrency(data.total)}</strong></p>
      <hr/>
      <p><strong>Shipping Address:</strong><br/>
        ${addr.firstName} ${addr.lastName}<br/>
        ${addr.address}<br/>
        ${addr.apartment ? addr.apartment + '<br/>' : ''}
        ${addr.city}, ${addr.state} ${addr.postcode}<br/>
        ${addr.country}
      </p>
    </body>
    </html>
  `
}

// HTML email template generator (for production use)
export function generateOrderEmailHtml(data: OrderEmailData): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px;">✓</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Order Confirmed!</h1>
            <p style="margin: 8px 0 0; color: #64748b;">Order #${data.orderId.slice(0, 8).toUpperCase()}</p>
          </div>

          <p>Dear ${data.customerName},</p>
          <p>Thank you for your order! We've received your payment and are preparing your items for shipment.</p>

          <!-- Order Details -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Subtotal:</span>
                <span>${formatCurrency(data.subtotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Shipping:</span>
                <span>${data.shipping === 0 ? 'FREE' : formatCurrency(data.shipping)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b;">
                <span>GST (included):</span>
                <span>${formatCurrency(data.gst)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; margin-top: 12px; padding-top: 12px; border-top: 2px solid #e2e8f0;">
                <span>Total:</span>
                <span>${formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="background-color: #eef4fb; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600;">Shipping Address</h2>
            <p style="margin: 0;">
              ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
              ${data.shippingAddress.address}<br>
              ${data.shippingAddress.apartment ? data.shippingAddress.apartment + '<br>' : ''}
              ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postcode}<br>
              ${data.shippingAddress.country}
            </p>
          </div>

          <p style="text-align: center; color: #64748b; margin-top: 32px;">
            Estimated delivery: 5-7 business days
          </p>

          <div style="text-align: center; margin-top: 32px; padding-top: 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0;">Questions? Contact us at <a href="mailto:info@inblu.com.au" style="color: #0a508e;">info@inblu.com.au</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export interface ServiceReminderData {
  orderId: string
  customerName: string
  customerEmail: string
  items: Array<{ name: string; quantity: number }>
  dueDate: string
  daysLeft: number
}

export async function sendServiceReminderEmail(data: ServiceReminderData): Promise<boolean> {
  try {
    const subject = `Service Reminder - Order #${data.orderId.slice(0, 8).toUpperCase()}`
    const html = generateServiceReminderHtml(data)
    const resend = getResend()

    if (resend) {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: data.customerEmail,
        subject,
        html,
      })

      if (error) {
        console.error('Resend error (service reminder):', error)
        return false
      }

      console.log(`Service reminder email sent to ${data.customerEmail} for order ${data.orderId}`)
    } else {
      console.log('=== SERVICE REMINDER EMAIL (not sent — Resend not configured) ===')
      console.log(`To: ${data.customerEmail}`)
      console.log(`Subject: ${subject}`)
      console.log('=================================')
    }

    return true
  } catch (error) {
    console.error('Failed to send service reminder email:', error)
    return false
  }
}

function generateServiceReminderHtml(data: ServiceReminderData): string {
  const formattedDate = formatDate(data.dueDate)
  const isOverdue = data.daysLeft < 0

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #0a508e, #1e6fba); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Service Reminder</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 16px;">Hi ${data.customerName},</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            ${isOverdue
              ? `Your service for order <strong>#${data.orderId.slice(0, 8).toUpperCase()}</strong> was due on <strong>${formattedDate}</strong>. Please schedule your service at your earliest convenience.`
              : `This is a friendly reminder that the service for your order <strong>#${data.orderId.slice(0, 8).toUpperCase()}</strong> is due on <strong>${formattedDate}</strong> (${data.daysLeft} days from now).`
            }
          </p>

          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #0f172a; margin: 0 0 12px 0; font-size: 14px;">Items in this order:</h3>
            ${data.items.map((item) => `
              <p style="color: #475569; margin: 4px 0; font-size: 14px;">• ${item.name} (x${item.quantity})</p>
            `).join('')}
          </div>

          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Please contact us to schedule your service appointment. We want to ensure your products continue to perform at their best.
          </p>

          <div style="text-align: center; margin-top: 24px;">
            <a href="mailto:info@inblu.com.au" style="display: inline-block; background: #0a508e; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Contact Us to Schedule
            </a>
          </div>

          <div style="text-align: center; margin-top: 32px; padding-top: 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0;">Questions? Contact us at <a href="mailto:info@inblu.com.au" style="color: #0a508e;">info@inblu.com.au</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Service Request Email Functions
export interface ServiceRequestEmailData {
  ticketNumber: string
  name: string
  email: string
  phone: string
  serviceType: string
  productName?: string | null
  issueDescription: string
  preferredDate?: Date | null
  address?: string | null
  city?: string | null
  state?: string | null
  postcode?: string | null
  orderId?: string | null
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  INSTALLATION: 'Installation',
  MAINTENANCE: 'Maintenance',
  REPAIR: 'Repair',
  FILTER_REPLACEMENT: 'Filter Replacement',
  INSPECTION: 'Inspection',
  WARRANTY_CLAIM: 'Warranty Claim',
  OTHER: 'Other',
}

export async function sendServiceRequestConfirmation(data: ServiceRequestEmailData): Promise<boolean> {
  try {
    const subject = `Service Request Received - ${data.ticketNumber}`
    const html = generateServiceRequestConfirmationHtml(data)
    const resend = getResend()

    if (resend) {
      const { error } = await resend.emails.send({
        from: 'inBlu Support <support@inblu.com.au>',
        to: data.email,
        subject,
        html,
      })

      if (error) {
        console.error('Resend error (service request confirmation):', error)
        return false
      }

      console.log(`Service request confirmation sent to ${data.email} for ticket ${data.ticketNumber}`)
    } else {
      console.log('=== SERVICE REQUEST CONFIRMATION (not sent — Resend not configured) ===')
      console.log(`To: ${data.email}`)
      console.log(`Subject: ${subject}`)
      console.log('=================================')
    }

    return true
  } catch (error) {
    console.error('Failed to send service request confirmation:', error)
    return false
  }
}

export async function sendServiceRequestAdminNotification(data: ServiceRequestEmailData): Promise<boolean> {
  try {
    const adminEmail = 'support@inblu.com.au'
    const subject = `New Service Request - ${data.ticketNumber} (${SERVICE_TYPE_LABELS[data.serviceType] || data.serviceType})`
    const html = generateServiceRequestAdminHtml(data)
    const resend = getResend()

    if (resend) {
      const { error } = await resend.emails.send({
        from: 'inBlu System <support@inblu.com.au>',
        to: adminEmail,
        subject,
        html,
      })

      if (error) {
        console.error('Resend error (service request admin notification):', error)
        return false
      }

      console.log(`Service request admin notification sent for ticket ${data.ticketNumber}`)
    } else {
      console.log('=== SERVICE REQUEST ADMIN NOTIFICATION (not sent — Resend not configured) ===')
      console.log(`To: ${adminEmail}`)
      console.log(`Subject: ${subject}`)
      console.log('=================================')
    }

    return true
  } catch (error) {
    console.error('Failed to send service request admin notification:', error)
    return false
  }
}

function generateServiceRequestConfirmationHtml(data: ServiceRequestEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #0a508e, #1e6fba); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Service Request Received</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Ticket: ${data.ticketNumber}</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 16px;">Hi ${data.name},</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Thank you for submitting your service request. We have received your request and our team will review it shortly.
          </p>

          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #0f172a; margin: 0 0 16px 0; font-size: 16px;">Request Details</h3>
            <table style="width: 100%; font-size: 14px; color: #475569;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Ticket Number:</td>
                <td style="padding: 8px 0;">${data.ticketNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Service Type:</td>
                <td style="padding: 8px 0;">${SERVICE_TYPE_LABELS[data.serviceType] || data.serviceType}</td>
              </tr>
              ${data.productName ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Product:</td>
                <td style="padding: 8px 0;">${data.productName}</td>
              </tr>
              ` : ''}
              ${data.orderId ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Order ID:</td>
                <td style="padding: 8px 0;">${data.orderId.slice(0, 8).toUpperCase()}</td>
              </tr>
              ` : ''}
              ${data.preferredDate ? `
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Preferred Date:</td>
                <td style="padding: 8px 0;">${formatDate(data.preferredDate)}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>What's Next?</strong><br/>
              Our support team will review your request and contact you within 1-2 business days to schedule your service appointment.
            </p>
          </div>

          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            If you have any urgent concerns, please don't hesitate to call us at <a href="tel:+61431318665" style="color: #0a508e;">+61 431 318 665</a>.
          </p>

          <div style="text-align: center; margin-top: 32px; padding-top: 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              Questions? Reply to this email or contact us at <a href="mailto:support@inblu.com.au" style="color: #0a508e;">support@inblu.com.au</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateServiceRequestAdminHtml(data: ServiceRequestEmailData): string {
  const addressParts = [data.address, data.city, data.state, data.postcode].filter(Boolean)
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Not provided'

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background: #dc2626; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🔔 New Service Request</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${data.ticketNumber}</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; font-size: 14px; color: #334155; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 8px; font-weight: 600; width: 140px;">Customer Name:</td>
              <td style="padding: 12px 8px;">${data.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 8px; font-weight: 600;">Email:</td>
              <td style="padding: 12px 8px;"><a href="mailto:${data.email}" style="color: #0a508e;">${data.email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 8px; font-weight: 600;">Phone:</td>
              <td style="padding: 12px 8px;"><a href="tel:${data.phone}" style="color: #0a508e;">${data.phone}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 8px; font-weight: 600;">Service Type:</td>
              <td style="padding: 12px 8px;"><span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${SERVICE_TYPE_LABELS[data.serviceType] || data.serviceType}</span></td>
            </tr>
            ${data.productName ? `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 8px; font-weight: 600;">Product:</td>
              <td style="padding: 12px 8px;">${data.productName}</td>
            </tr>
            ` : ''}
            ${data.orderId ? `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 8px; font-weight: 600;">Order ID:</td>
              <td style="padding: 12px 8px;">${data.orderId.slice(0, 8).toUpperCase()}</td>
            </tr>
            ` : ''}
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 8px; font-weight: 600;">Address:</td>
              <td style="padding: 12px 8px;">${fullAddress}</td>
            </tr>
            ${data.preferredDate ? `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 8px; font-weight: 600;">Preferred Date:</td>
              <td style="padding: 12px 8px;">${formatDate(data.preferredDate)}</td>
            </tr>
            ` : ''}
          </table>

          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 20px;">
            <h3 style="color: #0f172a; margin: 0 0 8px 0; font-size: 14px;">Issue Description:</h3>
            <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.issueDescription}</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au'}/admin/service-requests" style="display: inline-block; background: #0a508e; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              View in Admin Panel
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

import {
  InvoiceItem,
  calculateTotals,
  formatCurrency,
  COMPANY_DETAILS,
} from '@/lib/invoice'

interface InvoiceHtmlData {
  invoiceNumber: string
  date: string
  dueDate: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  items: InvoiceItem[]
  deposit?: number
  bankDetails: {
    bankName: string
    accountName: string
    accountNumber: string
    bsb: string
  }
}

/**
 * Generate static HTML for invoice (used by Puppeteer for PDF generation)
 */
export function generateInvoiceHtml(data: InvoiceHtmlData): string {
  const { subtotal, totalDue, itemTotals } = calculateTotals(data.items, data.deposit || 0)

  const itemsHtml = data.items
    .map(
      (item, index) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 16px 8px; font-size: 14px; color: #475569;">${index + 1}</td>
        <td style="padding: 16px 8px; font-size: 14px; color: #0f172a; font-weight: 500;">${item.description}</td>
        <td style="padding: 16px 8px; font-size: 14px; color: #475569; text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 16px 8px; font-size: 14px; color: #475569; text-align: center;">${item.quantity}</td>
        <td style="padding: 16px 8px; font-size: 14px; color: #0f172a; font-weight: 500; text-align: right;">${formatCurrency(itemTotals[index])}</td>
      </tr>
    `
    )
    .join('')

  const depositHtml =
    data.deposit && data.deposit > 0
      ? `
    <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #16a34a;">
      <span style="font-size: 14px;">Deposit Paid</span>
      <span style="font-size: 14px; font-weight: 500;">-${formatCurrency(data.deposit)}</span>
    </div>
  `
      : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: white;
      color: #0f172a;
      line-height: 1.5;
    }
    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div style="width: 210mm; min-height: 297mm; padding: 48px; margin: 0 auto; background: white;">
    
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px;">
      <!-- Company Info -->
      <div>
        <h1 style="font-size: 36px; font-weight: 700; color: #0f172a; letter-spacing: -0.025em; margin-bottom: 4px;">INVOICE</h1>
        <div style="margin-top: 24px; font-size: 14px; color: #475569;">
          <p style="font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">${COMPANY_DETAILS.name}</p>
          <p style="margin: 4px 0;">${COMPANY_DETAILS.address}</p>
          <p style="margin: 4px 0;">ABN: ${COMPANY_DETAILS.abn}</p>
          <p style="margin: 4px 0;">${COMPANY_DETAILS.website}</p>
          <p style="margin: 4px 0;">${COMPANY_DETAILS.email}</p>
          <p style="margin: 4px 0;">${COMPANY_DETAILS.phone}</p>
        </div>
      </div>

      <!-- Invoice Info -->
      <div style="text-align: right;">
        <div style="display: inline-block; background: #f1f5f9; border-radius: 8px; padding: 24px; min-width: 200px;">
          <div style="margin-bottom: 12px;">
            <p style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Invoice Number</p>
            <p style="font-size: 18px; font-weight: 600; color: #0f172a;">${data.invoiceNumber}</p>
          </div>
          <div style="margin-bottom: 12px;">
            <p style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Date</p>
            <p style="font-size: 14px; color: #334155;">${data.date}</p>
          </div>
          <div>
            <p style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Due Date</p>
            <p style="font-size: 14px; font-weight: 500; color: #2563eb;">${data.dueDate}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bill To Section -->
    <div style="margin-bottom: 40px; padding: 24px; background: rgba(239, 246, 255, 0.5); border-radius: 8px; border: 1px solid #dbeafe;">
      <h2 style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Bill To</h2>
      <p style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">${data.clientName}</p>
      <p style="font-size: 14px; color: #475569; margin: 4px 0;">${data.clientEmail}</p>
      ${data.clientPhone ? `<p style="font-size: 14px; color: #475569; margin: 4px 0;">${data.clientPhone}</p>` : ''}
    </div>

    <!-- Items Table -->
    <div style="margin-bottom: 32px;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0;">
            <th style="text-align: left; padding: 12px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 500; width: 48px;">Sr No.</th>
            <th style="text-align: left; padding: 12px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 500;">Description</th>
            <th style="text-align: right; padding: 12px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 500; width: 112px;">Unit Price</th>
            <th style="text-align: center; padding: 12px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 500; width: 80px;">Qty</th>
            <th style="text-align: right; padding: 12px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 500; width: 112px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
      <div style="width: 288px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="font-size: 14px; color: #475569;">Subtotal</span>
          <span style="font-size: 14px; font-weight: 500; color: #0f172a;">${formatCurrency(subtotal)}</span>
        </div>
        ${depositHtml}
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #0f172a; margin-top: 8px;">
          <span style="font-size: 18px; font-weight: 700; color: #0f172a;">TOTAL DUE</span>
          <span style="font-size: 18px; font-weight: 700; color: #0f172a;">${formatCurrency(totalDue)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: auto; padding-top: 32px; border-top: 1px solid #e2e8f0;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
        <!-- Payment Note -->
        <div>
          <h3 style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Payment Terms</h3>
          <p style="font-size: 14px; color: #475569;">Payment is due within 7 days of invoice date.</p>
          <p style="font-size: 14px; color: #64748b; margin-top: 8px;">Thank you for your business!</p>
        </div>

        <!-- Bank Details -->
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">Bank Details</h3>
          <div style="font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="color: #64748b;">Bank Name</span>
              <span style="color: #0f172a; font-weight: 500;">${data.bankDetails.bankName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="color: #64748b;">Account Name</span>
              <span style="color: #0f172a; font-weight: 500;">${data.bankDetails.accountName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="color: #64748b;">BSB</span>
              <span style="color: #0f172a; font-weight: 500;">${data.bankDetails.bsb}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span style="color: #64748b;">Account Number</span>
              <span style="color: #0f172a; font-weight: 500;">${data.bankDetails.accountNumber}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</body>
</html>
  `
}

// Invoice helper functions

export interface InvoiceItem {
  description: string
  unitPrice: number
  quantity: number
}

export interface InvoiceData {
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
 * Generate invoice number in format: INV-YYYY-0001
 */
export function generateInvoiceNumber(sequenceNumber: number): string {
  const year = new Date().getFullYear()
  const paddedSequence = String(sequenceNumber).padStart(4, '0')
  return `INV-${year}-${paddedSequence}`
}

/**
 * Generate invoice number from order ID (use last 4 chars of order ID)
 */
export function generateInvoiceNumberFromOrder(orderId: string, orderDate: Date): string {
  const year = orderDate.getFullYear()
  const suffix = orderId.slice(-4).toUpperCase()
  return `INV-${year}-${suffix}`
}

/**
 * Calculate totals for invoice items
 */
export function calculateTotals(items: InvoiceItem[], deposit: number = 0): {
  subtotal: number
  totalDue: number
  itemTotals: number[]
} {
  const itemTotals = items.map(item => item.unitPrice * item.quantity)
  const subtotal = itemTotals.reduce((sum, total) => sum + total, 0)
  const totalDue = subtotal - Math.abs(deposit)
  
  return {
    subtotal,
    totalDue,
    itemTotals,
  }
}

/**
 * Format currency in AUD
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value)
}

/**
 * Format date for invoice
 */
export function formatInvoiceDate(date: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Calculate due date (7 days from invoice date)
 */
export function calculateDueDate(invoiceDate: Date): Date {
  const dueDate = new Date(invoiceDate)
  dueDate.setDate(dueDate.getDate() + 7)
  return dueDate
}

/**
 * Company details for invoice
 */
export const COMPANY_DETAILS = {
  name: 'Inblu',
  address: '22 Wentworth Street, The Ponds NSW 2769',
  abn: '87947612461',
  website: 'www.inblu.com.au',
  email: 'sales@inblu.com.au',
  phone: '0431 318 665',
}

/**
 * Default bank details
 */
export const DEFAULT_BANK_DETAILS = {
  bankName: 'Commonwealth Bank',
  accountName: 'Inblu Pty Ltd',
  accountNumber: '12345678',
  bsb: '062-000',
}

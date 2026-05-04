'use client'

import { 
  InvoiceItem, 
  calculateTotals, 
  formatCurrency, 
  COMPANY_DETAILS 
} from '@/lib/invoice'

interface InvoiceTemplateProps {
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
  isPreview?: boolean
}

export function InvoiceTemplate({
  invoiceNumber,
  date,
  dueDate,
  clientName,
  clientEmail,
  clientPhone,
  items,
  deposit = 0,
  bankDetails,
  isPreview = false,
}: InvoiceTemplateProps) {
  const { subtotal, totalDue, itemTotals } = calculateTotals(items, deposit)

  return (
    <div 
      className={`bg-white ${isPreview ? 'p-8 max-w-[210mm] mx-auto shadow-lg' : 'p-12'}`}
      style={{ 
        width: isPreview ? '210mm' : 'auto',
        minHeight: isPreview ? '297mm' : 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        {/* Company Info */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">INVOICE</h1>
          <div className="mt-6 space-y-1 text-sm text-slate-600">
            <p className="text-xl font-semibold text-slate-900">{COMPANY_DETAILS.name}</p>
            <p>{COMPANY_DETAILS.address}</p>
            <p>ABN: {COMPANY_DETAILS.abn}</p>
            <p>{COMPANY_DETAILS.website}</p>
            <p>{COMPANY_DETAILS.email}</p>
            <p>{COMPANY_DETAILS.phone}</p>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="text-right">
          <div className="inline-block bg-slate-100 rounded-lg p-6 min-w-[200px]">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Invoice Number</p>
                <p className="text-lg font-semibold text-slate-900">{invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Date</p>
                <p className="text-sm text-slate-700">{date}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Due Date</p>
                <p className="text-sm font-medium text-blue-600">{dueDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="mb-10 p-6 bg-blue-50/50 rounded-lg border border-blue-100">
        <h2 className="text-xs text-slate-500 uppercase tracking-wide mb-3">Bill To</h2>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-900">{clientName}</p>
          <p className="text-sm text-slate-600">{clientEmail}</p>
          {clientPhone && <p className="text-sm text-slate-600">{clientPhone}</p>}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 px-2 text-xs uppercase tracking-wide text-slate-500 font-medium w-12">Sr No.</th>
              <th className="text-left py-3 px-2 text-xs uppercase tracking-wide text-slate-500 font-medium">Description</th>
              <th className="text-right py-3 px-2 text-xs uppercase tracking-wide text-slate-500 font-medium w-28">Unit Price</th>
              <th className="text-center py-3 px-2 text-xs uppercase tracking-wide text-slate-500 font-medium w-20">Qty</th>
              <th className="text-right py-3 px-2 text-xs uppercase tracking-wide text-slate-500 font-medium w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100">
                <td className="py-4 px-2 text-sm text-slate-600">{index + 1}</td>
                <td className="py-4 px-2 text-sm text-slate-900 font-medium">{item.description}</td>
                <td className="py-4 px-2 text-sm text-slate-600 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-4 px-2 text-sm text-slate-600 text-center">{item.quantity}</td>
                <td className="py-4 px-2 text-sm text-slate-900 font-medium text-right">{formatCurrency(itemTotals[index])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-10">
        <div className="w-72">
          <div className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-600">Subtotal</span>
              <span className="text-sm font-medium text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            {deposit > 0 && (
              <div className="flex justify-between py-2 text-green-600">
                <span className="text-sm">Deposit Paid</span>
                <span className="text-sm font-medium">-{formatCurrency(deposit)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-slate-900">
              <span className="text-lg font-bold text-slate-900">TOTAL DUE</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(totalDue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-8">
          {/* Payment Note */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Payment Terms</h3>
            <p className="text-sm text-slate-600">Payment is due within 7 days of invoice date.</p>
            <p className="text-sm text-slate-500 mt-2">Thank you for your business!</p>
          </div>

          {/* Bank Details */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Bank Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Name</span>
                <span className="text-slate-900 font-medium">{bankDetails.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Name</span>
                <span className="text-slate-900 font-medium">{bankDetails.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BSB</span>
                <span className="text-slate-900 font-medium">{bankDetails.bsb}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Number</span>
                <span className="text-slate-900 font-medium">{bankDetails.accountNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

/**
 * Dashboard-level "Export to Excel" — pulls Orders, Purchase Orders, and
 * Expenses into a single .xlsx (one sheet per domain).
 *
 * Optional From/To date filters apply to all three sheets so the workbook
 * represents a single time window. Both are inclusive; leave empty for
 * all-time. If both are set, we validate `from <= to` on the client so we
 * don't burn a round trip on an obvious mistake.
 */
export function DashboardExportButton() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (from && to && from > to) {
      toast.error('"From" date must be on or before "To" date')
      return
    }

    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set('dateFrom', from)
      if (to) params.set('dateTo', to)

      const url = `/api/admin/dashboard/export${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Export failed')
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download =
        response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
        'dashboard-export.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(objectUrl)
      a.remove()
      toast.success('Dashboard data exported')
    } catch (error) {
      console.error('Dashboard export error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to export')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-2">
      <div>
        <Label htmlFor="dash_export_from" className="text-xs text-slate-500">From</Label>
        <Input
          id="dash_export_from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="mt-1 w-full sm:w-40"
        />
      </div>
      <div>
        <Label htmlFor="dash_export_to" className="text-xs text-slate-500">To</Label>
        <Input
          id="dash_export_to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="mt-1 w-full sm:w-40"
        />
      </div>
      <Button
        onClick={handleExport}
        disabled={exporting}
        className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {exporting ? 'Exporting...' : 'Export to Excel'}
      </Button>
    </div>
  )
}

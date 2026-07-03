'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ProductsExportButton() {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/admin/products/export')
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
        'products-export.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
      toast.success('Products exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export products')
    } finally {
      setExporting(false)
    }
  }

  return (
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
  )
}

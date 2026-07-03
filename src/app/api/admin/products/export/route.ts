import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  if (dbUser?.role !== 'ADMIN' && dbUser?.role !== 'SUPER_ADMIN') return null
  return user
}

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { displayOrder: 'asc' },
    })

    const rows = products.map((p) => ({
      'ID': p.id,
      'Name': p.name,
      'SKU': p.sku || '',
      'Category': p.category,
      'Categories': p.categories.join(', '),
      'Price (AUD)': Number(p.price),
      'Stock': p.stock,
      'Status': p.isActive ? 'Active' : 'Inactive',
      'Best Seller': p.isBestSeller ? 'Yes' : 'No',
      'Service Tenure (months)': p.serviceTenureMonths,
      'Display Order': p.displayOrder,
      'Slug': p.slug || '',
      'Image URL': p.imageUrl,
      'Manual URL': p.manualUrl || '',
      'Created Date': new Date(p.createdAt).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      'Updated Date': new Date(p.updatedAt).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)

    // Column widths
    ws['!cols'] = [
      { wch: 38 }, // ID
      { wch: 35 }, // Name
      { wch: 15 }, // SKU
      { wch: 20 }, // Category
      { wch: 30 }, // Categories
      { wch: 14 }, // Price
      { wch: 8 },  // Stock
      { wch: 10 }, // Status
      { wch: 12 }, // Best Seller
      { wch: 24 }, // Service Tenure
      { wch: 14 }, // Display Order
      { wch: 25 }, // Slug
      { wch: 50 }, // Image URL
      { wch: 50 }, // Manual URL
      { wch: 16 }, // Created
      { wch: 16 }, // Updated
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Products')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const filename = `products-export-${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Products export error:', error)
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 })
  }
}

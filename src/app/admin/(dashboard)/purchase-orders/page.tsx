import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, ExternalLink, Package, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion'
import prisma from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Purchase Orders - Admin',
  description: 'View purchase order history',
}

export const dynamic = 'force-dynamic'

export default async function PurchaseOrdersPage() {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      inventoryTransactions: {
        include: {
          product: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  const totalPOs = purchaseOrders.length
  const withFiles = purchaseOrders.filter((po) => po.fileUrl).length
  const totalUnitsAdded = purchaseOrders.reduce(
    (sum, po) => sum + po.inventoryTransactions.reduce((s, t) => s + t.quantity, 0),
    0
  )

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-slate-500 mt-1">Track all stock-in purchase orders and documents</p>
        </div>
      </FadeIn>

      {/* Summary Cards */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total POs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalPOs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">With Documents</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{withFiles}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Units Added</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalUnitsAdded}</p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* PO List */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No purchase orders yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Purchase orders are created when you add stock to a product
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">PO Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Vendor</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Product(s)</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Qty Added</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Document</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map((po) => {
                      const totalQty = po.inventoryTransactions.reduce((s, t) => s + t.quantity, 0)
                      const products = po.inventoryTransactions.map((t) => t.product)

                      return (
                        <tr
                          key={po.id}
                          className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-slate-900">
                              {po.poNumber || (
                                <span className="text-slate-400 italic">No PO#</span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-600">
                              {po.vendorName || (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {products.map((p) => (
                                <Link
                                  key={p.id}
                                  href={`/admin/products/${p.id}`}
                                  className="inline-block"
                                >
                                  <Badge variant="secondary" className="hover:bg-blue-100 cursor-pointer text-xs">
                                    {p.name}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="bg-green-100 text-green-700">
                              +{totalQty}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {po.fileUrl ? (
                              <a
                                href={po.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                View
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {formatDate(po.createdAt.toISOString())}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, ExternalLink, Package, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/motion'
import { toast } from 'sonner'

interface InventoryTransaction {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    imageUrl: string
  }
}

interface PurchaseOrder {
  id: string
  poNumber: string | null
  vendorName: string | null
  fileUrl: string | null
  totalCost: string | null
  createdAt: string
  inventoryTransactions: InventoryTransaction[]
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
  }).format(new Date(dateStr))
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  const fetchPurchaseOrders = async () => {
    try {
      const res = await fetch('/api/admin/purchase-orders')
      if (res.ok) {
        setPurchaseOrders(await res.json())
      }
    } catch {
      toast.error('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this purchase order? This will also remove the associated inventory transactions. Stock levels will NOT be reverted.')) {
      return
    }

    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/purchase-orders/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setPurchaseOrders((prev) => prev.filter((po) => po.id !== id))
        toast.success('Purchase order deleted')
      } else {
        toast.error('Failed to delete purchase order')
      }
    } catch {
      toast.error('Failed to delete purchase order')
    } finally {
      setDeleting(null)
    }
  }

  const totalPOs = purchaseOrders.length
  const withFiles = purchaseOrders.filter((po) => po.fileUrl).length
  const totalUnitsAdded = purchaseOrders.reduce(
    (sum, po) => sum + po.inventoryTransactions.reduce((s, t) => s + t.quantity, 0),
    0
  )
  const totalCostSpent = purchaseOrders.reduce(
    (sum, po) => sum + Number(po.totalCost || 0),
    0
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total Cost Spent</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalCostSpent)}</p>
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
              <div className="space-y-3">
                {purchaseOrders.map((po) => {
                  const totalQty = po.inventoryTransactions.reduce((s, t) => s + t.quantity, 0)
                  const productCount = po.inventoryTransactions.length
                  const isExpanded = expandedId === po.id

                  return (
                    <div
                      key={po.id}
                      className="border border-blue-100 rounded-xl overflow-hidden"
                    >
                      {/* Main row */}
                      <div className="p-4 hover:bg-blue-50/50 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* PO Number & Vendor */}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {po.poNumber || <span className="text-slate-400 italic">No PO#</span>}
                              </p>
                              <p className="text-sm text-slate-500">
                                {po.vendorName || <span className="italic">No vendor</span>}
                              </p>
                            </div>

                            {/* Products summary */}
                            <div className="hidden sm:flex items-center gap-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                {productCount} product{productCount !== 1 ? 's' : ''}
                              </Badge>
                              <Badge className="bg-green-100 text-green-700">
                                +{totalQty} units
                              </Badge>
                              {po.totalCost && Number(po.totalCost) > 0 && (
                                <Badge className="bg-amber-100 text-amber-700">
                                  {formatCurrency(Number(po.totalCost))}
                                </Badge>
                              )}
                            </div>

                            {/* Document */}
                            {po.fileUrl && (
                              <a
                                href={po.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden md:inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                View Doc
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}

                            {/* Date */}
                            <span className="hidden lg:block text-sm text-slate-500">
                              {formatDate(po.createdAt)}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedId(isExpanded ? null : po.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(po.id)}
                              disabled={deleting === po.id}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              {deleting === po.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Mobile summary */}
                        <div className="flex sm:hidden items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {productCount} product{productCount !== 1 ? 's' : ''}
                          </Badge>
                          <Badge className="bg-green-100 text-green-700">
                            +{totalQty} units
                          </Badge>
                          {po.totalCost && Number(po.totalCost) > 0 && (
                            <Badge className="bg-amber-100 text-amber-700">
                              {formatCurrency(Number(po.totalCost))}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-400 ml-auto">
                            {formatDate(po.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Expanded product details */}
                      {isExpanded && (
                        <div className="border-t border-blue-100 bg-slate-50 p-4">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                            Products in this PO
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {po.inventoryTransactions.map((t) => (
                              <Link
                                key={t.id}
                                href={`/admin/products/${t.product.id}`}
                                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
                              >
                                <div className="h-12 w-12 rounded-lg overflow-hidden bg-blue-100 flex-shrink-0">
                                  {t.product.imageUrl ? (
                                    <Image
                                      src={t.product.imageUrl}
                                      alt={t.product.name}
                                      width={48}
                                      height={48}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-blue-400">
                                      <Package className="h-6 w-6" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {t.product.name}
                                  </p>
                                  <Badge className="bg-green-100 text-green-700 mt-1">
                                    +{t.quantity} units
                                  </Badge>
                                </div>
                              </Link>
                            ))}
                          </div>
                          
                          {po.fileUrl && (
                            <div className="mt-4 pt-3 border-t border-slate-200 md:hidden">
                              <a
                                href={po.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                              >
                                <FileText className="h-4 w-4" />
                                View Document
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

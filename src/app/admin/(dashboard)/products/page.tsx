import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/motion'
import { formatCurrency } from '@/lib/utils'
import prisma from '@/lib/prisma'
import { ProductActions } from '@/components/admin/product-actions'

export const metadata: Metadata = {
  title: 'Products - Admin',
  description: 'Manage your products',
}

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const searchQuery = params.search
  const statusFilter = params.status

  const products = await prisma.product.findMany({
    where: {
      ...(searchQuery ? {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { category: { contains: searchQuery, mode: 'insensitive' } },
        ]
      } : {}),
      ...(statusFilter === 'active' ? { isActive: true } : {}),
      ...(statusFilter === 'inactive' ? { isActive: false } : {}),
      ...(statusFilter === 'low-stock' ? { stock: { lte: 10 } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalProducts = products.length
  const activeProducts = products.filter(p => p.isActive).length
  const lowStockProducts = products.filter(p => p.stock <= 10).length

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-500 mt-1">Manage your product catalog</p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalProducts}</p>
                <p className="text-sm text-slate-500">Total Products</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeProducts}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{lowStockProducts}</p>
                <p className="text-sm text-slate-500">Low Stock</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Filter Tabs */}
      <FadeIn delay={0.1}>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Products' },
            { key: 'active', label: 'Active' },
            { key: 'inactive', label: 'Inactive' },
            { key: 'low-stock', label: 'Low Stock' },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/products${tab.key === 'all' ? '' : `?status=${tab.key}`}`}
            >
              <Badge
                variant={statusFilter === tab.key || (!params.status && tab.key === 'all') ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
              >
                {tab.label}
              </Badge>
            </Link>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>Product List</CardTitle>
              <form className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  name="search"
                  placeholder="Search products..." 
                  className="pl-10"
                  defaultValue={searchQuery}
                />
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No products found</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/products/new">Add your first product</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sky-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Price</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Stock</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-sky-50 hover:bg-sky-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-sky-100 flex-shrink-0">
                              {product.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-6 w-6 text-sky-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{product.name}</p>
                              <div className="flex gap-1 mt-0.5">
                                {product.isBestSeller && (
                                  <Badge variant="secondary" className="text-xs">Best Seller</Badge>
                                )}
                                {!product.isActive && (
                                  <Badge variant="outline" className="text-xs text-slate-500">Inactive</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{product.category}</td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                          {formatCurrency(Number(product.price))}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-medium ${
                            product.stock <= 10 ? 'text-red-600' : 'text-slate-900'
                          }`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <ProductActions product={{ id: product.id, name: product.name }} />
                        </td>
                      </tr>
                    ))}
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

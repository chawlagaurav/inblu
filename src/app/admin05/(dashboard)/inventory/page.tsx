import { Metadata } from 'next'
import Link from 'next/link'
import { Package, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion'
import prisma from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Inventory - Admin',
  description: 'Manage your inventory',
}

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { stock: 'asc' },
  })

  const outOfStock = products.filter(p => p.stock === 0)
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10)
  const inStock = products.filter(p => p.stock > 10)

  const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * p.stock), 0)
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0)

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 mt-1">Track and manage stock levels</p>
        </div>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalUnits}</p>
                <p className="text-sm text-slate-500">Total Units</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
                <p className="text-sm text-slate-500">Inventory Value</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{lowStock.length}</p>
                <p className="text-sm text-slate-500">Low Stock</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{outOfStock.length}</p>
                <p className="text-sm text-slate-500">Out of Stock</p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Out of Stock Alert */}
      {outOfStock.length > 0 && (
        <FadeIn delay={0.1}>
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Out of Stock ({outOfStock.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {outOfStock.map(product => (
                  <div key={product.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">{product.category}</p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/admin/products/${product.id}`}>Update Stock</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Low Stock Warning */}
      {lowStock.length > 0 && (
        <FadeIn delay={0.15}>
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Low Stock ({lowStock.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStock.map(product => (
                  <div key={product.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">{product.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                        {product.stock} left
                      </Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/products/${product.id}`}>Update</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* All Products Inventory */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              All Products Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Value</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/admin/products/${product.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                          {product.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{product.category}</td>
                      <td className="py-3 px-4 text-sm text-slate-900">{formatCurrency(Number(product.price))}</td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${
                          product.stock === 0 ? 'text-red-600' :
                          product.stock <= 10 ? 'text-amber-600' : 'text-slate-900'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">
                        {formatCurrency(Number(product.price) * product.stock)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          product.stock === 0 ? 'destructive' :
                          product.stock <= 10 ? 'secondary' : 'default'
                        }>
                          {product.stock === 0 ? 'Out of Stock' :
                           product.stock <= 10 ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StaggerContainer, StaggerItem } from '@/components/motion'
import { useCartStore } from '@/store/cart'
import { formatCurrency } from '@/lib/utils'
import { Product } from '@/types'
import { toast } from 'sonner'

interface ProductsGridProps {
  products: Product[]
  category?: string
  search?: string
}

export function ProductsGrid({ products, category, search }: ProductsGridProps) {
  const addItem = useCartStore((state) => state.addItem)

  // Filter products based on category and search (client-side filtering for already-fetched products)
  let filteredProducts = products
  
  if (category && category !== 'all') {
    filteredProducts = filteredProducts.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    )
  }
  
  if (search) {
    const searchLower = search.toLowerCase()
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
    )
  }

  const handleAddToCart = (product: Product) => {
    addItem(product)
    toast.success(`${product.name} added to cart`)
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
        <p className="text-slate-500">Try adjusting your filters or search query.</p>
      </div>
    )
  }

  return (
    <StaggerContainer key={`${category || 'all'}-${search || ''}`} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filteredProducts.map((product) => (
        <StaggerItem key={product.id}>
          <ProductCard product={product} onAddToCart={handleAddToCart} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product
  onAddToCart: (product: Product) => void
}) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-sky-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-100 to-sky-200">
            <span className="text-5xl font-bold text-sky-300">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
        
        {product.isBestSeller && (
          <Badge className="absolute top-3 left-3">Best Seller</Badge>
        )}
        
        {product.stock < 10 && product.stock > 0 && (
          <Badge variant="warning" className="absolute top-3 right-3">
            Low Stock
          </Badge>
        )}
        
        {product.stock === 0 && (
          <Badge variant="destructive" className="absolute top-3 right-3">
            Out of Stock
          </Badge>
        )}

        {/* Quick actions */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.preventDefault()
              onAddToCart(product)
            }}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <Link href={`/products/${product.id}`}>
          <div className="mb-2">
            <p className="text-xs text-sky-600 font-medium uppercase tracking-wide">
              {product.category}
            </p>
            <h3 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors mt-1">
              {product.name}
            </h3>
          </div>
        </Link>
        
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-slate-900">
            {formatCurrency(product.price)}
          </span>
          <span className="text-xs text-slate-400">
            {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

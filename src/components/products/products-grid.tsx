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
import { Product } from '@/types'
import { buildCategoryLabelMap, resolveProductCategoryLabel } from '@/lib/category-display'
import { PriceDisplay } from '@/components/products/price-display'
import { toast } from 'sonner'

interface ProductsGridProps {
  products: Product[]
  category?: string
  search?: string
  /**
   * Canonical category list used to render labels and skip stale/unknown slugs
   * (e.g. legacy data tagged "ro-purifier" when the active slug is
   * "ro-purifiers"). When omitted the badge falls back to the raw slug.
   */
  categoryOptions?: { value: string; label: string }[]
}

export function ProductsGrid({ products, category, search, categoryOptions }: ProductsGridProps) {
  const addItem = useCartStore((state) => state.addItem)
  const labelMap = buildCategoryLabelMap(categoryOptions ?? [])

  // Filter products based on category and search (client-side filtering for already-fetched products)
  let filteredProducts = products
  
  if (category && category !== 'all') {
    const target = category.toLowerCase()
    filteredProducts = filteredProducts.filter((p) => {
      if (p.category?.toLowerCase() === target) return true
      return (p.categories ?? []).some((c) => c.toLowerCase() === target)
    })
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
    <StaggerContainer key={`${category || 'all'}-${search || ''}`} className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
      {filteredProducts.map((product) => (
        <StaggerItem key={product.id}>
          <ProductCard product={product} onAddToCart={handleAddToCart} labelMap={labelMap} hasLabelMap={!!categoryOptions} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}

function ProductCard({
  product,
  onAddToCart,
  labelMap,
  hasLabelMap,
}: {
  product: Product
  onAddToCart: (product: Product) => void
  labelMap: Record<string, string>
  hasLabelMap: boolean
}) {
  // If we have a canonical category list, render its label and hide the badge
  // for stale/unknown slugs. Without a list, fall back to the raw slug so old
  // call sites keep working.
  const categoryLabel = hasLabelMap
    ? resolveProductCategoryLabel(product, labelMap)
    : product.category
  return (
    <Link href={`/products/${product.slug}`} className="block h-full">
      <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-blue-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
            <span className="text-5xl font-bold text-blue-300">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* The sale badge sits next to the price (inside <PriceDisplay/>),
            not on the image — so this slot is back to best-seller only. */}
        {product.isBestSeller && (
          <Badge className="absolute top-3 left-3">Best Seller</Badge>
        )}

        {/* Sold-out overlay. Pure UI flag — independent of stock. When set,
            the card stays clickable to the detail page but the Add-to-Cart
            quick action is replaced with a non-interactive badge so customers
            can't queue an unfulfillable order from the listing. */}
        {product.isSoldOut && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center pointer-events-none">
            <span className="bg-slate-900 text-white text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow">
              Sold Out
            </span>
          </div>
        )}

        {/* Quick actions - hidden on mobile, visible on desktop hover. Suppressed
            entirely when the product is sold out. */}
        {!product.isSoldOut && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent hidden md:block opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onAddToCart(product)
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        )}
      </div>
      
        <CardContent className="p-4">
          <div className="mb-2">
            {categoryLabel && (
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                {categoryLabel}
              </p>
            )}
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mt-1">
              {product.name}
            </h3>
          </div>
          
          <div className="flex items-center justify-between">
            <PriceDisplay product={product} size="md" />
          </div>
        </CardContent>
      </Card>
    </Link>
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

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FadeInOnScroll, StaggerContainer, StaggerItem } from '@/components/motion'
import { useCartStore } from '@/store/cart'
import { Product } from '@/types'
import { PriceDisplay } from '@/components/products/price-display'
import { toast } from 'sonner'

interface BestSellersProps {
  products: Product[]
}

export function BestSellers({ products }: BestSellersProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = (product: Product) => {
    addItem(product)
    toast.success(`${product.name} added to cart`)
  }

  // Don't render section if no products
  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-16 sm:py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeInOnScroll>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Best Sellers
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Discover our most popular products loved by customers across Australia.
            </p>
          </div>
        </FadeInOnScroll>

        <StaggerContainer className="mt-12 flex flex-wrap justify-center gap-10">
          {products.map((product) => (
            <StaggerItem key={product.id} className="w-full sm:w-[calc(50%-20px)] lg:w-[calc(33.333%-27px)]">
              <ProductCard product={product} onAddToCart={handleAddToCart} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInOnScroll className="mt-12 text-center" delay={0.3}>
          <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-600">
            <Link href="/products">View All Products</Link>
          </Button>
        </FadeInOnScroll>
      </div>
    </section>
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
            <span className="text-4xl font-bold text-blue-300">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Sale badge moved inline next to the price; only best-seller stays here. */}
        {product.isBestSeller && (
          <Badge className="absolute top-3 left-3">Best Seller</Badge>
        )}
        {/* Quick actions - hidden on mobile, visible on desktop hover */}
        <div className="absolute inset-0 bg-black/5 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAddToCart(product)
            }}
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <div className="mt-3 flex items-center justify-between">
            <PriceDisplay product={product} size="md" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

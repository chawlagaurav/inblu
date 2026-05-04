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
import { formatCurrency } from '@/lib/utils'
import { Product } from '@/types'
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
          <Button asChild variant="outline" size="lg">
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
    <Link href={`/products/${product.id}`} className="block">
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-blue-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
            <span className="text-4xl font-bold text-blue-300">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
        {product.isBestSeller && (
          <Badge className="absolute top-3 left-3">Best Seller</Badge>
        )}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-black/5 flex items-center justify-center"
        >
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              onAddToCart(product)
            }}
            className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </motion.div>
      </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500 line-clamp-1">{product.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(product.price)}
            </span>
            <span className="text-xs text-slate-500">{product.stock} in stock</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

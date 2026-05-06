'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeInOnScroll, StaggerContainer, StaggerItem } from '@/components/motion'
import { useCartStore } from '@/store/cart'
import { formatCurrency } from '@/lib/utils'
import { Product } from '@/types'
import { toast } from 'sonner'

interface RelatedProductsProps {
  products: Product[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = (product: Product) => {
    addItem(product)
    toast.success(`${product.name} added to cart`)
  }

  return (
    <section className="py-12 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeInOnScroll>
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            You May Also Like
          </h2>
        </FadeInOnScroll>

        <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => (
            <StaggerItem key={product.id}>
              <Link href={`/products/${product.id}`} className="group block h-full">
                <div className="h-full overflow-hidden rounded-lg bg-white border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-blue-200">
                  <div className="relative aspect-[4/3] overflow-hidden bg-blue-50">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                        <span className="text-2xl font-bold text-blue-300">
                          {product.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2.5">
                    <h3 className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(product.price)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.preventDefault()
                          handleAddToCart(product)
                        }}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

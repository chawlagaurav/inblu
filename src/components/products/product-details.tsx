'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Truck, Shield, RotateCcw, Check, Download, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FadeIn } from '@/components/motion'
import { useCartStore } from '@/store/cart'
import { formatCurrency, calculateSubtotal } from '@/lib/utils'
import { Product } from '@/types'
import { buildCategoryLabelMap, resolveProductCategoryLabel } from '@/lib/category-display'
import { PriceDisplay } from '@/components/products/price-display'
import { getEffectivePrice } from '@/lib/pricing'
import { toast } from 'sonner'

interface ProductDetailsProps {
  product: Product
  /** Canonical category list for label resolution; if omitted falls back to the raw slug. */
  categoryOptions?: { value: string; label: string }[]
}

export function ProductDetails({ product, categoryOptions }: ProductDetailsProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const addItem = useCartStore((state) => state.addItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const { setIsOpen } = useCartStore()
  const labelMap = buildCategoryLabelMap(categoryOptions ?? [])
  const categoryLabel = categoryOptions
    ? resolveProductCategoryLabel(product, labelMap)
    : product.category

  const handleAddToCart = () => {
    addItem(product, quantity)
    toast.success(`${product.name} added to cart`, {
      action: {
        label: 'View Cart',
        onClick: () => setIsOpen(true),
      },
    })
  }

  const handleBuyNow = () => {
    // Clear cart and add only this product for immediate checkout
    clearCart()
    addItem(product, quantity)
    router.push('/checkout')
  }

  const images = product.images.length > 0 ? product.images : [product.imageUrl]

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      {/* Breadcrumb */}
      <FadeIn>
        <nav className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Link>
        </nav>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <FadeIn className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-blue-50 group">
            {product.isSoldOut && (
              <div className="absolute inset-0 z-30 bg-slate-900/40 flex items-center justify-center pointer-events-none">
                <span className="bg-slate-900 text-white text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow">
                  Sold Out
                </span>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                {images[selectedImage] ? (
                  <Image
                    src={images[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                    <span className="text-8xl font-bold text-blue-300">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6 text-slate-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6 text-slate-700" />
                </button>
              </>
            )}
            
            {product.isBestSeller && (
              <Badge className="absolute top-4 left-4">Best Seller</Badge>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors ${
                    selectedImage === index
                      ? 'border-blue-500'
                      : 'border-transparent hover:border-blue-200'
                  }`}
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-blue-100" />
                  )}
                </button>
              ))}
            </div>
          )}
        </FadeIn>

        {/* Product Info */}
        <FadeIn delay={0.1}>
          <div className="space-y-6">
            {/* Category */}
            {categoryLabel && (
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                {categoryLabel}
              </p>
            )}

            {/* Name */}
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            {/* Price */}
            <div className="space-y-1">
              <PriceDisplay product={product} size="lg" />
              <p className="text-sm text-slate-500">
                Includes GST ({formatCurrency(getEffectivePrice(product) - calculateSubtotal(getEffectivePrice(product)))})
              </p>
            </div>

            <Separator />

            {/* Quantity & Add to Cart — entirely suppressed when the product
                is marked sold out. We replace the controls with a clear
                "Sold Out" banner so the customer can't queue an unfulfillable
                order. Independent of stock level. */}
            {product.isSoldOut ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-900 text-white px-6 py-4 text-center">
                  <p className="text-base font-bold uppercase tracking-wider">Sold Out</p>
                  <p className="text-sm text-slate-300 mt-1">
                    This product is currently unavailable. Please check back later.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quantity */}
                <div>
                  <label className="text-sm font-semibold text-slate-900 mb-2 block">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 rounded-xl border border-blue-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 rounded-xl border border-blue-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={handleBuyNow}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Buy Now
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
              <div 
                className="text-slate-600 leading-relaxed prose prose-slate prose-sm max-w-none [&_strong]:font-bold [&_strong]:text-slate-900 [&_em]:italic [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2 [&_li]:my-1 [&_h4]:font-semibold [&_h4]:text-slate-900 [&_h4]:mt-4 [&_h4]:mb-2"
                dangerouslySetInnerHTML={{
                  __html: product.description
                    // Headers
                    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
                    // Bold
                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
                    // Italic
                    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
                    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
                    // Bullet points - process entire list blocks
                    .replace(/(?:^[-•]\s+.+$\n?)+/gm, (match) => {
                      const items = match.trim().split('\n').map(line => 
                        `<li>${line.replace(/^[-•]\s+/, '')}</li>`
                      ).join('');
                      return `<ul>${items}</ul>`;
                    })
                    // Numbered lists
                    .replace(/(?:^\d+\.\s+.+$\n?)+/gm, (match) => {
                      const items = match.trim().split('\n').map(line => 
                        `<li>${line.replace(/^\d+\.\s+/, '')}</li>`
                      ).join('');
                      return `<ol>${items}</ol>`;
                    })
                    // Line breaks
                    .replace(/\n/g, '<br/>')
                }}
              />
            </div>

            {/* Download Manual Button */}
            {product.manualUrl && (
              <a
                href={product.manualUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Download manual for ${product.name}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 shadow-md transition-colors px-6 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <Download className="h-5 w-5" />
                Download {product.name} Manual
              </a>
            )}

            <Separator />

            {/* Estimated Delivery */}
            <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-100">
              <Truck className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Estimated delivery: 5-7 business days</span>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Truck, title: 'Free Shipping', desc: 'On orders over $100' },
                { icon: Shield, title: 'Secure Payment', desc: '256-bit encryption' },
                { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50">
                  <feature.icon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{feature.title}</p>
                    <p className="text-xs text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}

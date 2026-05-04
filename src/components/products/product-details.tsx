'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Minus, Plus, ShoppingCart, Truck, Shield, RotateCcw, Check, Download, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FadeIn } from '@/components/motion'
import { useCartStore } from '@/store/cart'
import { formatCurrency, calculateSubtotal } from '@/lib/utils'
import { Product } from '@/types'
import { toast } from 'sonner'

interface ProductDetailsProps {
  product: Product
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const addItem = useCartStore((state) => state.addItem)
  const clearCart = useCartStore((state) => state.clearCart)
  const { setIsOpen } = useCartStore()

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
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-blue-50">
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
            <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
              {product.category}
            </p>

            {/* Name */}
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            {/* Price */}
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(product.price)}
              </p>
              <p className="text-sm text-slate-500">
                Includes GST ({formatCurrency(product.price - calculateSubtotal(product.price))})
              </p>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              {product.stock > 10 ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">In Stock</span>
                </>
              ) : product.stock > 0 ? (
                <>
                  <Check className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-yellow-600 font-medium">
                    Only {product.stock} left
                  </span>
                </>
              ) : (
                <span className="text-sm text-red-600 font-medium">Out of Stock</span>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-600 leading-relaxed">{product.description}</p>
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

            {/* Quantity & Add to Cart */}
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
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="h-10 w-10 rounded-xl border border-blue-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 transition-colors"
                    disabled={quantity >= product.stock}
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
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Buy Now
                </Button>
              </div>
            </div>

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

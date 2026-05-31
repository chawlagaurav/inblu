'use client'

import { Fragment, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface StockStatus {
  productId: string
  productName: string
  available: boolean
  reason: string | null
  requested: number
  inStock: number
  availableQuantity: number
}

export function CartDrawer() {
  const router = useRouter()
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, getTotal } = useCartStore()
  const total = getTotal()
  const [isCheckingStock, setIsCheckingStock] = useState(false)
  const [stockStatus, setStockStatus] = useState<StockStatus[]>([])

  // Check stock availability when cart opens or items change
  useEffect(() => {
    if (isOpen && items.length > 0) {
      checkStockAvailability()
    }
  }, [isOpen, items])

  const checkStockAvailability = async () => {
    if (items.length === 0) return

    try {
      const response = await fetch('/api/inventory/check-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        })
      })

      const data = await response.json()
      setStockStatus(data.items || [])
    } catch (error) {
      console.error('Failed to check stock:', error)
    }
  }

  const handleProceedToCheckout = async () => {
    if (items.length === 0) return

    setIsCheckingStock(true)

    try {
      const response = await fetch('/api/inventory/check-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        })
      })

      const data = await response.json()

      if (!data.available) {
        setStockStatus(data.items || [])
        const unavailable = data.unavailableItems || []
        
        if (unavailable.length === 1) {
          toast.error(`${unavailable[0].productName} is ${unavailable[0].reason}`)
        } else {
          toast.error(`${unavailable.length} items are no longer available in the requested quantity`)
        }
        return
      }

      // All items available, proceed to checkout
      setIsOpen(false)
      router.push('/checkout')
    } catch (error) {
      console.error('Stock check failed:', error)
      toast.error('Unable to verify stock. Please try again.')
    } finally {
      setIsCheckingStock(false)
    }
  }

  const getItemStockStatus = (productId: string): StockStatus | undefined => {
    return stockStatus.find(s => s.productId === productId)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100">
                <h2 className="text-lg font-semibold text-slate-900">Shopping Cart</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-blue-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingBag className="h-16 w-16 text-blue-200 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Your cart is empty</h3>
                    <p className="text-sm text-slate-500 mb-6">
                      Looks like you haven&apos;t added any items yet.
                    </p>
                    <Button onClick={() => setIsOpen(false)} asChild>
                      <Link href="/products">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {items.map((item) => {
                      const itemStock = getItemStockStatus(item.product.id)
                      const isUnavailable = itemStock && !itemStock.available
                      
                      return (
                      <motion.li
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex gap-4 rounded-2xl p-4 ${isUnavailable ? 'bg-red-50 border border-red-200' : 'bg-blue-50/50'}`}
                      >
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-blue-100">
                          {item.product.imageUrl ? (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-blue-300">
                              <ShoppingBag className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-slate-900">
                                {item.product.name}
                              </h3>
                              <p className="text-sm text-slate-500">
                                {formatCurrency(item.product.price)}
                              </p>
                              {isUnavailable && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>{itemStock.reason}</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity - 1)
                                }
                                className="rounded-lg p-1 text-slate-500 hover:bg-blue-100 transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity + 1)
                                }
                                disabled={item.quantity >= item.product.stock}
                                className="rounded-lg p-1 text-slate-500 hover:bg-blue-100 transition-colors disabled:opacity-50"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatCurrency(item.product.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    )})}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-blue-100 px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-slate-900">Subtotal</span>
                    <span className="text-lg font-semibold text-slate-900">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Shipping and GST calculated at checkout.
                  </p>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleProceedToCheckout}
                      disabled={isCheckingStock}
                    >
                      {isCheckingStock ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking availability...
                        </>
                      ) : (
                        'Proceed to Checkout'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

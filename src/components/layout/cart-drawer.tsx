'use client'

import { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { formatCurrency } from '@/lib/utils'

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, getTotal } = useCartStore()
  const total = getTotal()

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
              <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100">
                <h2 className="text-lg font-semibold text-slate-900">Shopping Cart</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-sky-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingBag className="h-16 w-16 text-sky-200 mb-4" />
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
                    {items.map((item) => (
                      <motion.li
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex gap-4 rounded-2xl bg-sky-50/50 p-4"
                      >
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-sky-100">
                          {item.product.imageUrl ? (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-sky-300">
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
                                className="rounded-lg p-1 text-slate-500 hover:bg-sky-100 transition-colors"
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
                                className="rounded-lg p-1 text-slate-500 hover:bg-sky-100 transition-colors disabled:opacity-50"
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
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-sky-100 px-6 py-4 space-y-4">
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
                      onClick={() => setIsOpen(false)}
                      asChild
                    >
                      <Link href="/checkout">Proceed to Checkout</Link>
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

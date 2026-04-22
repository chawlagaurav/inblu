'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  category: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Debounced search
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.products || data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchProducts])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleProductClick = (productId: string) => {
    onClose()
    setQuery('')
    setResults([])
    router.push(`/products/${productId}`)
  }

  const handleViewAll = () => {
    onClose()
    setQuery('')
    setResults([])
    router.push(`/products?search=${encodeURIComponent(query)}`)
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-20 z-50 w-full max-w-2xl -translate-x-1/2 px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 text-lg placeholder:text-slate-400"
                  autoFocus
                />
                {isLoading && <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />}
                <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {query && results.length === 0 && !isLoading && (
                  <div className="p-8 text-center text-slate-500">
                    <Search className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No products found for &quot;{query}&quot;</p>
                    <p className="text-sm mt-1">Try searching with different keywords</p>
                  </div>
                )}

                {results.length > 0 && (
                  <div className="p-2">
                    {results.slice(0, 6).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Search className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{product.name}</p>
                          <p className="text-sm text-slate-500">{product.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-blue-600">
                            ${Number(product.price).toFixed(2)}
                          </p>
                        </div>
                      </button>
                    ))}

                    {results.length > 6 && (
                      <div className="p-3 border-t border-slate-100 mt-2">
                        <Button
                          onClick={handleViewAll}
                          variant="outline"
                          className="w-full"
                        >
                          View all {results.length} results
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {!query && (
                  <div className="p-6 text-center text-slate-500">
                    <p className="text-sm">Start typing to search products...</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {['Kent', 'Kangen', 'RO Purifier', 'Water Ioniser'].map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="px-3 py-1.5 bg-slate-100 rounded-full text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

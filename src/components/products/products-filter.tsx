'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const categories = [
  { id: 'all', name: 'All Products' },
  { id: 'ro-purifiers', name: 'RO Water Purifiers' },
  { id: 'water-ionisers', name: 'Water Ionisers' },
  { id: 'undersink-filters', name: 'Undersink Filters' },
  { id: 'replacement-filters', name: 'Replacement Filters' },
]

export function ProductsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [isOpen, setIsOpen] = useState(false)

  const currentCategory = searchParams.get('category') || 'all'

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }
    router.push(`/products?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery) {
      params.set('search', searchQuery)
    } else {
      params.delete('search')
    }
    router.push(`/products?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    router.push('/products')
  }

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </span>
          {currentCategory !== 'all' && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              1
            </span>
          )}
        </Button>
      </div>

      {/* Filter panel */}
      <div
        className={cn(
          'space-y-6 lg:block',
          isOpen ? 'block' : 'hidden'
        )}
      >
        {/* Search */}
        <form onSubmit={handleSearch}>
          <Label className="text-sm font-semibold text-slate-900 mb-2 block">
            Search
          </Label>
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pr-10"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <Separator />

        {/* Categories */}
        <div>
          <Label className="text-sm font-semibold text-slate-900 mb-3 block">
            Categories
          </Label>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-xl text-sm transition-colors',
                  currentCategory === category.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Clear filters */}
        {(currentCategory !== 'all' || searchQuery) && (
          <>
            <Separator />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="w-full text-slate-500"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </>
        )}
      </div>
    </>
  )
}

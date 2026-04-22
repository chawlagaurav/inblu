import { Suspense } from 'react'
import { Metadata } from 'next'
import { ProductsGrid, ProductsGridSkeleton } from '@/components/products/products-grid'
import { ProductsFilter } from '@/components/products/products-filter'
import { FadeIn } from '@/components/motion'
import { getCachedProducts } from '@/lib/db/products'

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse our collection of premium products. Quality essentials for modern Australian living.',
}

async function ProductsGridWrapper({ category, search }: { category?: string; search?: string }) {
  const products = await getCachedProducts()
  return <ProductsGrid products={products} category={category} search={search} />
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const params = await searchParams
  
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Our Products
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Discover our curated collection of premium products, designed for Australians who appreciate quality.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <Suspense fallback={<div>Loading filters...</div>}>
              <ProductsFilter />
            </Suspense>
          </aside>

          {/* Grid */}
          <main className="flex-1">
            <Suspense fallback={<ProductsGridSkeleton />}>
              <ProductsGridWrapper category={params.category} search={params.search} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}

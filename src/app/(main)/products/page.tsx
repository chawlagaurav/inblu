import { Suspense } from 'react'
import { Metadata } from 'next'
import { ProductsGrid, ProductsGridSkeleton } from '@/components/products/products-grid'
import { ProductsFilter } from '@/components/products/products-filter'
import { FadeIn } from '@/components/motion'
import { getCachedProducts } from '@/lib/db/products'
import { BreadcrumbSchema } from '@/components/seo'
import { PAGE_SEO } from '@/lib/seo'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au'

export const metadata: Metadata = {
  title: PAGE_SEO.products.title,
  description: PAGE_SEO.products.description,
  keywords: PAGE_SEO.products.keywords,
  alternates: {
    canonical: '/products',
  },
  openGraph: {
    title: 'Water Filters & Purifiers | Shop RO Systems | Inblu Australia',
    description: 'Browse our range of RO water purifiers, countertop filters, undersink systems & water ionisers. Free shipping & installation. Best prices in Australia.',
    url: `${BASE_URL}/products`,
    type: 'website',
  },
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
  
  const breadcrumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'Products', url: `${BASE_URL}/products` },
  ]
  
  return (
    <div className="bg-white">
      <BreadcrumbSchema items={breadcrumbs} />
      
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Water Filters & Purification Systems
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Shop Australia&apos;s best RO water purifiers, countertop filters, undersink systems and water ionisers. Free shipping and professional installation available.
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

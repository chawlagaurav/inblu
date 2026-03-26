import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetails } from '@/components/products/product-details'
import { RelatedProducts } from '@/components/products/related-products'
import { getCachedProductById, getCachedRelatedProducts, getCachedProducts } from '@/lib/db/products'

// Allow dynamic params
export const dynamicParams = true

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getCachedProductById(id)
  
  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = await getCachedProductById(id)
  
  if (!product) {
    notFound()
  }

  const relatedProducts = await getCachedRelatedProducts(product.category, product.id, 4)

  return (
    <div className="bg-white">
      <ProductDetails product={product} />
      
      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} />
      )}
    </div>
  )
}

export async function generateStaticParams() {
  // Fetch all products for static generation
  const products = await getCachedProducts({ limit: 100 })
  return products.map((product) => ({
    id: product.id,
  }))
}

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetails } from '@/components/products/product-details'
import { RelatedProducts } from '@/components/products/related-products'
import { getCachedProductById, getCachedRelatedProducts, getCachedProducts } from '@/lib/db/products'
import { ProductSchema, BreadcrumbSchema } from '@/components/seo'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au'

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

  const seoTitle = `${product.name} | Buy Online Australia | Inblu Filters`
  const seoDescription = `${product.description.slice(0, 140)}... Free shipping Australia-wide.`

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      product.name,
      product.category,
      'water filter Australia',
      'buy water filter online',
      `${product.category} water filter`,
    ],
    alternates: {
      canonical: `/products/${id}`,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `${BASE_URL}/products/${id}`,
      type: 'website',
      images: product.imageUrl ? [
        {
          url: product.imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: seoDescription,
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

  const relatedProducts = await getCachedRelatedProducts(product.id, product.category, 4)

  const breadcrumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'Products', url: `${BASE_URL}/products` },
    { name: product.name, url: `${BASE_URL}/products/${product.id}` },
  ]

  return (
    <div className="bg-white">
      <BreadcrumbSchema items={breadcrumbs} />
      <ProductSchema
        name={product.name}
        description={product.description}
        image={product.imageUrl || ''}
        price={Number(product.price)}
        sku={product.sku || undefined}
        category={product.category}
        availability={product.stock > 0 ? 'InStock' : 'OutOfStock'}
        url={`${BASE_URL}/products/${product.id}`}
      />
      <ProductDetails product={product} />
      
      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} />
      )}
    </div>
  )
}

export async function generateStaticParams() {
  try {
    // Fetch all products for static generation
    const products = await getCachedProducts({ limit: 100 })
    return products.map((product) => ({
      id: product.id,
    }))
  } catch (error) {
    // If database is unavailable during build, generate pages on-demand
    console.log('Database unavailable during build, skipping static generation for products')
    return []
  }
}

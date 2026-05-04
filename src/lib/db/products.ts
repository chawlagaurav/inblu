import { prisma } from '@/lib/prisma'
import { Product } from '@/types'
import { unstable_cache } from 'next/cache'

/**
 * Transform Prisma product to frontend Product type
 * Handles Decimal to number conversion
 */
function transformProduct(product: {
  id: string
  name: string
  description: string
  price: unknown
  imageUrl: string
  images: string[]
  stock: number
  category: string
  categories: string[]
  isBestSeller: boolean
  manualUrl: string | null
  relatedProductIds?: string[]
  createdAt: Date
  updatedAt: Date
}): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    imageUrl: product.imageUrl,
    images: product.images,
    stock: product.stock,
    category: product.category,
    categories: product.categories || [],
    isBestSeller: product.isBestSeller,
    manualUrl: product.manualUrl ?? undefined,
    relatedProductIds: product.relatedProductIds || [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

/**
 * Get all products with optional filtering
 */
export async function getProducts(options?: {
  category?: string
  search?: string
  limit?: number
  bestSellersOnly?: boolean
}): Promise<Product[]> {
  const { category, search, limit = 50, bestSellersOnly = false } = options ?? {}

  const where: Record<string, unknown> = {
    isActive: true,
  }

  if (category && category !== 'all') {
    where.category = category
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (bestSellersOnly) {
    where.isBestSeller = true
  }

  const products = await prisma.product.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  return products.map(transformProduct)
}

/**
 * Get products with caching for server components
 */
export const getCachedProducts = unstable_cache(
  async (options?: {
    category?: string
    search?: string
    limit?: number
    bestSellersOnly?: boolean
  }) => getProducts(options),
  ['products'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['products'],
  }
)

/**
 * Get best seller products
 */
export async function getBestSellerProducts(limit = 4): Promise<Product[]> {
  return getProducts({ bestSellersOnly: true, limit })
}

/**
 * Get cached best seller products
 */
export const getCachedBestSellerProducts = unstable_cache(
  async (limit = 4) => getBestSellerProducts(limit),
  ['best-sellers'],
  {
    revalidate: 60,
    tags: ['products', 'best-sellers'],
  }
)

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
  })

  if (!product) {
    return null
  }

  return transformProduct(product)
}

/**
 * Get cached product by ID
 */
export const getCachedProductById = unstable_cache(
  async (id: string) => getProductById(id),
  ['product'],
  {
    revalidate: 60,
    tags: ['products'],
  }
)

/**
 * Get related products - first uses manually set relatedProductIds, then falls back to category
 */
export async function getRelatedProducts(
  productId: string,
  category: string,
  limit = 4
): Promise<Product[]> {
  // First, get the current product to check for manually set related products
  const currentProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { relatedProductIds: true },
  })

  // If there are manually set related products, fetch those
  if (currentProduct?.relatedProductIds && currentProduct.relatedProductIds.length > 0) {
    const products = await prisma.product.findMany({
      where: {
        id: { in: currentProduct.relatedProductIds },
        isActive: true,
      },
      take: limit,
    })
    return products.map(transformProduct)
  }

  // Fall back to category-based related products
  const products = await prisma.product.findMany({
    where: {
      category,
      id: { not: productId },
      isActive: true,
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  return products.map(transformProduct)
}

/**
 * Get cached related products
 */
export const getCachedRelatedProducts = unstable_cache(
  async (productId: string, category: string, limit = 4) =>
    getRelatedProducts(productId, category, limit),
  ['related-products'],
  {
    revalidate: 60,
    tags: ['products'],
  }
)

/**
 * Get all unique categories
 */
export async function getCategories(): Promise<string[]> {
  const categories = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
  })

  return categories.map((p) => p.category)
}

/**
 * Get cached categories
 */
export const getCachedCategories = unstable_cache(
  async () => getCategories(),
  ['categories'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['products', 'categories'],
  }
)

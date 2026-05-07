import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with priority and changeFrequency
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/support/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/support/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/support/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/support/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/support/enquiry`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/support/service-request`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Category pages
  const categories = [
    'ro-purifiers',
    'countertop',
    'undersink',
    'ionisers',
    'replacement',
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/products?category=${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic product pages
  let productPages: MetadataRoute.Sitemap = []
  
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        updatedAt: true,
      },
    })

    productPages = products.map((product) => ({
      url: `${BASE_URL}/products/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    // If database is unavailable, return empty product pages
    console.log('Sitemap: Database unavailable, skipping product pages')
  }

  return [...staticPages, ...categoryPages, ...productPages]
}

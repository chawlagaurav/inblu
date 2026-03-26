import { prisma } from '@/lib/prisma'
import { Testimonial } from '@/types'
import { unstable_cache } from 'next/cache'

/**
 * Transform Prisma testimonial to frontend Testimonial type
 */
function transformTestimonial(testimonial: {
  id: string
  content: string
  rating: number
  authorName: string
  authorAvatar: string | null
  isApproved: boolean
  createdAt: Date
  updatedAt: Date
}): Testimonial {
  return {
    id: testimonial.id,
    name: testimonial.authorName,
    review: testimonial.content,
    rating: testimonial.rating,
    imageUrl: testimonial.authorAvatar ?? undefined,
    createdAt: testimonial.createdAt,
    updatedAt: testimonial.updatedAt,
  }
}

/**
 * Get all approved testimonials
 */
export async function getTestimonials(options?: {
  limit?: number
  approvedOnly?: boolean
}): Promise<Testimonial[]> {
  const { limit = 20, approvedOnly = true } = options ?? {}

  const where: Record<string, unknown> = {}

  if (approvedOnly) {
    where.isApproved = true
  }

  const testimonials = await prisma.testimonial.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  return testimonials.map(transformTestimonial)
}

/**
 * Get cached testimonials for server components
 */
export const getCachedTestimonials = unstable_cache(
  async (options?: { limit?: number; approvedOnly?: boolean }) =>
    getTestimonials(options),
  ['testimonials'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['testimonials'],
  }
)

/**
 * Get featured testimonials for homepage
 */
export async function getFeaturedTestimonials(limit = 3): Promise<Testimonial[]> {
  return getTestimonials({ limit, approvedOnly: true })
}

/**
 * Get cached featured testimonials
 */
export const getCachedFeaturedTestimonials = unstable_cache(
  async (limit = 3) => getFeaturedTestimonials(limit),
  ['featured-testimonials'],
  {
    revalidate: 60,
    tags: ['testimonials'],
  }
)

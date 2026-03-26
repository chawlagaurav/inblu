import { Suspense } from 'react'
import {
  HeroSection,
  BestSellers,
  TestimonialsSection,
  FeaturedCategories,
  NewsletterSection,
} from '@/components/home'
import { getCachedBestSellerProducts } from '@/lib/db/products'
import { getCachedFeaturedTestimonials } from '@/lib/db/testimonials'
import { SkeletonProductGrid, SkeletonTestimonials } from '@/components/ui/skeleton'

async function BestSellersSection() {
  const products = await getCachedBestSellerProducts(4)
  return <BestSellers products={products} />
}

async function TestimonialsSectionWrapper() {
  const testimonials = await getCachedFeaturedTestimonials(3)
  return <TestimonialsSection testimonials={testimonials} />
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<SkeletonProductGrid className="py-16 sm:py-24 bg-slate-50" />}>
        <BestSellersSection />
      </Suspense>
      <FeaturedCategories />
      <Suspense fallback={<SkeletonTestimonials />}>
        <TestimonialsSectionWrapper />
      </Suspense>
      <NewsletterSection />
    </>
  )
}

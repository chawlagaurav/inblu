import { Suspense } from 'react'
import { Metadata } from 'next'
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
import { FAQSchema } from '@/components/seo'
import { PAGE_SEO } from '@/lib/seo'

export const metadata: Metadata = {
  title: PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
  keywords: PAGE_SEO.home.keywords,
  alternates: {
    canonical: '/',
  },
}

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
      <FAQSchema />
      <HeroSection />
      <Suspense fallback={<SkeletonProductGrid className="py-16 sm:py-24 bg-slate-50" />}>
        <BestSellersSection />
      </Suspense>
      <FeaturedCategories />
      <NewsletterSection />
      <Suspense fallback={<SkeletonTestimonials />}>
        <TestimonialsSectionWrapper />
      </Suspense>
    </>
  )
}

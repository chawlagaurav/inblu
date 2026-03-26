'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { FadeInOnScroll } from '@/components/motion'

const categories = [
  {
    name: 'RO Water Purifiers',
    description: 'Advanced reverse osmosis purification',
    href: '/products?category=ro-purifiers',
    image: '/categories/ro-purifiers.png',
    color: 'from-sky-400 to-blue-500',
  },
  {
    name: 'Water Ionisers',
    description: 'Alkaline antioxidant water systems',
    href: '/products?category=water-ionisers',
    image: '/categories/water-ionisers.png',
    color: 'from-purple-400 to-pink-500',
  },
  {
    name: 'Undersink Filters',
    description: 'Space-saving filtration solutions',
    href: '/products?category=undersink-filters',
    image: '/categories/undersink-filters.png',
    color: 'from-green-400 to-emerald-500',
  },
]

export function FeaturedCategories() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeInOnScroll>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Shop by Category
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Explore our range of premium water filtration solutions for Australian homes.
            </p>
          </div>
        </FadeInOnScroll>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <FadeInOnScroll key={category.name} delay={index * 0.1}>
              <Link href={category.href} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold text-white">{category.name}</h3>
                    <p className="mt-1 text-sm text-white/80">{category.description}</p>
                    <div className="mt-3 flex items-center text-sm font-medium text-white group-hover:text-sky-300 transition-colors">
                      Shop Now
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}

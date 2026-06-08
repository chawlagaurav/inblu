import { Metadata } from 'next'
import { Droplets, Leaf, Users, ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { FadeIn, FadeInOnScroll, StaggerContainer, StaggerItem } from '@/components/motion'
import { BreadcrumbSchema } from '@/components/seo'
import { PAGE_SEO } from '@/lib/seo'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au'

export const metadata: Metadata = {
  title: PAGE_SEO.about.title,
  description: PAGE_SEO.about.description,
  keywords: PAGE_SEO.about.keywords,
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: PAGE_SEO.about.title,
    description: PAGE_SEO.about.description,
    url: `${BASE_URL}/about`,
    type: 'website',
  },
}

const values = [
  {
    icon: Droplets,
    title: 'Clean Water First',
    description: 'We tackle PFAS, fluoride, chlorine, heavy metals, microplastics, and other contaminants so your family can drink with confidence every day.',
  },
  {
    icon: Leaf,
    title: 'Reduce Bottled Water',
    description: 'High-quality filtration straight from your tap means less plastic waste and a healthier planet for future generations.',
  },
  {
    icon: Users,
    title: 'Better Hydration',
    description: 'The human body is roughly 70% water. Cleaner, purer water encourages better hydration and supports your daily wellbeing.',
  },
  {
    icon: ShieldCheck,
    title: 'Peace of Mind',
    description: 'Filtration solutions designed for modern Australian homes, giving you and your family greater confidence in every glass.',
  },
]

const benefits = [
  'Reduces unwanted contaminants and impurities',
  'Improves taste and odour',
  'Encourages better hydration',
  'Supports healthier cooking and beverage preparation',
  'Reduces reliance on bottled water',
  'Provides greater peace of mind for you and your family',
]

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'About Us', url: `${BASE_URL}/about` },
  ]

  return (
    <div className="bg-white">
      <BreadcrumbSchema items={breadcrumbs} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                About Inblu Filters
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Founded in 2025 with a simple mission — to provide clean, great-tasting, and reliable drinking water for every Australian household.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="https://res.cloudinary.com/dlnt5kqmh/image/upload/v1780910927/about/founder-with-inventory.webp"
                  alt="Inblu Filters founder with inventory of water filtration products"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll delay={0.1}>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  Our Story
                </h2>
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    With increasing public discussion around substances such as PFAS (&ldquo;forever chemicals&rdquo;), fluoride, chlorine, heavy metals, microplastics, and other contaminants reported in water supplies worldwide, many families are seeking greater confidence in the water they drink every day.
                  </p>
                  <p>
                    Considering that the human body is made up of approximately 70% water, the quality of the water we consume plays an important role in our daily wellbeing. At Inblu, we are committed to helping Australian families enjoy cleaner, purer water through high-quality filtration solutions designed for modern homes.
                  </p>
                  <p>
                    At Inblu, we believe everyone deserves access to cleaner, fresher water — because better water starts at home.
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Benefits of Filtered Water
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Why thousands of Australian families choose Inblu.
              </p>
            </div>
          </FadeInOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {benefits.map((benefit) => (
              <FadeInOnScroll key={benefit}>
                <div className="flex items-start gap-3 bg-white rounded-xl p-5 shadow-sm border border-blue-50">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  </div>
                  <p className="text-slate-700">{benefit}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Our Values
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                The principles that guide everything we do.
              </p>
            </div>
          </FadeInOnScroll>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <StaggerItem key={value.title}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 h-full">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-500 to-blue-600">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-blue-100 leading-relaxed mb-8">
                To provide clean, great-tasting, and reliable drinking water for every household. We are committed to helping Australian families enjoy cleaner, purer water through high-quality filtration solutions designed for modern homes — because better water starts at home.
              </p>
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                <Link href="/products">
                  Explore Our Collection
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  )
}

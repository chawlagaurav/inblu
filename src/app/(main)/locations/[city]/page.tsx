import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Phone, Truck, Shield, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn, FadeInOnScroll, StaggerContainer, StaggerItem } from '@/components/motion'
import { BreadcrumbSchema, FAQSchema, LocalBusinessSchema } from '@/components/seo'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au'

// City-specific data
const cities = {
  sydney: {
    name: 'Sydney',
    state: 'NSW',
    description: 'Premium water filters and RO purifiers in Sydney. Free installation across Sydney metro, North Shore, Eastern Suburbs, Inner West, and Western Sydney.',
    areas: ['CBD', 'North Shore', 'Eastern Suburbs', 'Inner West', 'Western Sydney', 'Parramatta', 'Sutherland', 'Northern Beaches'],
    waterInfo: 'Sydney water comes from protected catchments but still contains chlorine and fluoride. Our RO filters remove 99% of contaminants for pure drinking water.',
  },
  melbourne: {
    name: 'Melbourne',
    state: 'VIC',
    description: 'Premium water filters and RO purifiers in Melbourne. Free installation across Melbourne CBD, Inner suburbs, Eastern suburbs, and Mornington Peninsula.',
    areas: ['CBD', 'Inner North', 'Inner South', 'Eastern Suburbs', 'Western Suburbs', 'Bayside', 'Mornington Peninsula'],
    waterInfo: 'Melbourne tap water is sourced from mountain catchments but contains treatment chemicals. Our filtration systems provide crystal-clear, pure water.',
  },
  brisbane: {
    name: 'Brisbane',
    state: 'QLD',
    description: 'Premium water filters and RO purifiers in Brisbane. Free installation across Brisbane, Gold Coast, and South East Queensland.',
    areas: ['CBD', 'Northside', 'Southside', 'Eastern Suburbs', 'Western Suburbs', 'Gold Coast', 'Sunshine Coast'],
    waterInfo: 'Brisbane water can have higher chlorine levels due to warmer climate. Our RO systems ensure fresh, clean tasting water year-round.',
  },
  perth: {
    name: 'Perth',
    state: 'WA',
    description: 'Premium water filters and RO purifiers in Perth. Free installation across Perth metro, Fremantle, Joondalup, and surrounding areas.',
    areas: ['CBD', 'Fremantle', 'Joondalup', 'Rockingham', 'Mandurah', 'Northern Suburbs', 'Southern Suburbs'],
    waterInfo: 'Perth relies heavily on desalinated water. Our filters improve taste and remove residual chemicals for better drinking water.',
  },
  adelaide: {
    name: 'Adelaide',
    state: 'SA',
    description: 'Premium water filters and RO purifiers in Adelaide. Free installation across Adelaide metro and surrounding regions.',
    areas: ['CBD', 'North Adelaide', 'Eastern Suburbs', 'Western Suburbs', 'Southern Suburbs', 'Adelaide Hills'],
    waterInfo: 'Adelaide water is known for its harder mineral content. Our RO systems soften water and remove impurities for improved taste.',
  },
  canberra: {
    name: 'Canberra',
    state: 'ACT',
    description: 'Premium water filters and RO purifiers in Canberra. Free installation across the ACT and Queanbeyan.',
    areas: ['Civic', 'Belconnen', 'Woden', 'Tuggeranong', 'Gungahlin', 'Weston Creek', 'Queanbeyan'],
    waterInfo: 'Canberra water quality is good but can be improved with filtration. Our systems ensure the purest water for your family.',
  },
  'gold-coast': {
    name: 'Gold Coast',
    state: 'QLD',
    description: 'Premium water filters and RO purifiers on the Gold Coast. Free installation from Coolangatta to Ormeau.',
    areas: ['Surfers Paradise', 'Broadbeach', 'Southport', 'Robina', 'Burleigh', 'Coolangatta', 'Helensvale'],
    waterInfo: 'Gold Coast water quality varies by area. Our RO filters provide consistent, pure water regardless of your location.',
  },
}

type CityKey = keyof typeof cities

const features = [
  {
    icon: Truck,
    title: 'Free Local Installation',
    description: 'Professional installation by certified technicians at no extra cost.',
  },
  {
    icon: Clock,
    title: 'Same Week Service',
    description: 'Fast turnaround with installation available within days of ordering.',
  },
  {
    icon: Shield,
    title: 'Local Warranty Support',
    description: 'Full warranty backed by local Australian service and support.',
  },
  {
    icon: Star,
    title: 'Trusted by Locals',
    description: 'Thousands of satisfied customers across Australia.',
  },
]

const localFAQs = (city: string) => [
  {
    question: `What is the best water filter for ${city} homes?`,
    answer: `For ${city} homes, we recommend reverse osmosis (RO) water filters as they effectively remove chlorine, fluoride, and other contaminants found in local tap water. Our countertop and undersink RO systems are popular choices for ${city} residents.`,
  },
  {
    question: `Do you offer free installation in ${city}?`,
    answer: `Yes! Inblu Filters offers free professional installation across the ${city} metropolitan area. Our certified technicians will install your water filter system at a time that suits you.`,
  },
  {
    question: `How long does water filter installation take in ${city}?`,
    answer: `Most installations in ${city} are completed within 1-2 hours. Countertop systems require no installation at all - simply plug in and start filtering.`,
  },
  {
    question: `What areas in ${city} do you service?`,
    answer: `We provide water filter installation and service across all ${city} suburbs and surrounding areas. Contact us to confirm service availability in your specific area.`,
  },
]

interface CityPageProps {
  params: Promise<{ city: string }>
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params
  const cityData = cities[city as CityKey]
  
  if (!cityData) {
    return {
      title: 'Location Not Found',
    }
  }

  const title = `Water Filters ${cityData.name} | RO Purifiers & Installation | Inblu`
  const description = `Buy water filters in ${cityData.name}. Premium RO purifiers, countertop & undersink filters with FREE installation across ${cityData.name} ${cityData.state}. Shop now!`

  return {
    title,
    description,
    keywords: [
      `water filter ${cityData.name}`,
      `RO filter ${cityData.name}`,
      `water purifier ${cityData.name}`,
      `reverse osmosis ${cityData.name}`,
      `undersink filter ${cityData.name}`,
      `countertop water filter ${cityData.name}`,
      `best water filter ${cityData.name}`,
      `water filter installation ${cityData.name}`,
      `buy water filter ${cityData.name}`,
      `water filtration ${cityData.state}`,
    ],
    alternates: {
      canonical: `/locations/${city}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/locations/${city}`,
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(cities).map((city) => ({
    city,
  }))
}

export default async function CityPage({ params }: CityPageProps) {
  const { city } = await params
  const cityData = cities[city as CityKey]
  
  if (!cityData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Location not found</h1>
          <Link href="/locations" className="text-blue-600 hover:underline mt-4 block">
            View all locations
          </Link>
        </div>
      </div>
    )
  }

  const breadcrumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'Locations', url: `${BASE_URL}/locations` },
    { name: cityData.name, url: `${BASE_URL}/locations/${city}` },
  ]

  return (
    <div className="bg-white">
      <BreadcrumbSchema items={breadcrumbs} />
      <FAQSchema faqs={localFAQs(cityData.name)} />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="text-blue-600 font-medium">{cityData.name}, {cityData.state}</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Water Filters in {cityData.name}
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                {cityData.description}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/products">
                  <Button size="lg" className="w-full sm:w-auto">
                    Shop Water Filters
                  </Button>
                </Link>
                <Link href="/support/contact">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Phone className="h-4 w-4 mr-2" />
                    Get Free Quote
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              Why Choose Inblu in {cityData.name}?
            </h2>
          </FadeInOnScroll>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <Card className="h-full">
                  <CardContent className="p-6 text-center">
                    <feature.icon className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Water Quality Info */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  {cityData.name} Water Quality
                </h2>
                <p className="text-slate-600 mb-6">
                  {cityData.waterInfo}
                </p>
                <h3 className="font-semibold text-slate-900 mb-3">Our filters remove:</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" /> Chlorine & Chloramine
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" /> Fluoride
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" /> Heavy Metals (Lead, Mercury)
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" /> Bacteria & Viruses
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" /> Microplastics
                  </li>
                </ul>
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.1}>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Areas We Service in {cityData.name}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {cityData.areas.map((area) => (
                    <div key={area} className="flex items-center gap-2 text-slate-600">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  + many more suburbs across {cityData.name}
                </p>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Products CTA */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Popular Water Filters in {cityData.name}
              </h2>
              <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                Browse our best-selling RO purifiers, countertop filters, and undersink systems. 
                All with free installation across {cityData.name}.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/products?category=ro-purifiers">
                  <Button variant="outline">RO Purifiers</Button>
                </Link>
                <Link href="/products?category=countertop">
                  <Button variant="outline">Countertop Filters</Button>
                </Link>
                <Link href="/products?category=undersink">
                  <Button variant="outline">Undersink Filters</Button>
                </Link>
              </div>
              <Link href="/products" className="block mt-8">
                <Button size="lg">
                  View All Products
                </Button>
              </Link>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              Frequently Asked Questions - {cityData.name}
            </h2>
          </FadeInOnScroll>
          <div className="space-y-6">
            {localFAQs(cityData.name).map((faq, index) => (
              <FadeInOnScroll key={index} delay={index * 0.1}>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                    <p className="text-slate-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready for Pure Water in {cityData.name}?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Get a free consultation and quote. Our {cityData.name} team is ready to help you choose the perfect water filtration system.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/support/contact">
                <Button size="lg" variant="secondary">
                  Get Free Quote
                </Button>
              </Link>
              <a href="tel:+61431318665">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}

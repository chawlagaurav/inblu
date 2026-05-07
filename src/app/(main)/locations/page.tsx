import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn, FadeInOnScroll, StaggerContainer, StaggerItem } from '@/components/motion'
import { BreadcrumbSchema } from '@/components/seo'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inblu.com.au'

export const metadata: Metadata = {
  title: 'Water Filter Locations Australia | Free Installation | Inblu',
  description: 'Inblu Filters services all major Australian cities. Free water filter installation in Sydney, Melbourne, Brisbane, Perth, Adelaide, Canberra & Gold Coast.',
  keywords: [
    'water filter Sydney',
    'water filter Melbourne', 
    'water filter Brisbane',
    'water filter Perth',
    'water filter Adelaide',
    'water filter Canberra',
    'water filter Gold Coast',
    'RO filter installation Australia',
    'water purifier near me',
    'water filter installation near me',
  ],
  alternates: {
    canonical: '/locations',
  },
  openGraph: {
    title: 'Water Filter Locations Australia | Inblu Filters',
    description: 'Free water filter installation across Australia. Sydney, Melbourne, Brisbane, Perth, Adelaide & more.',
    url: `${BASE_URL}/locations`,
    type: 'website',
  },
}

const locations = [
  {
    city: 'Sydney',
    slug: 'sydney',
    state: 'NSW',
    description: 'Free installation across Sydney metro and surrounding areas.',
  },
  {
    city: 'Melbourne',
    slug: 'melbourne',
    state: 'VIC',
    description: 'Serving Melbourne CBD, suburbs, and Mornington Peninsula.',
  },
  {
    city: 'Brisbane',
    slug: 'brisbane',
    state: 'QLD',
    description: 'Coverage across Brisbane and South East Queensland.',
  },
  {
    city: 'Perth',
    slug: 'perth',
    state: 'WA',
    description: 'Perth metro, Fremantle, Joondalup and surrounds.',
  },
  {
    city: 'Adelaide',
    slug: 'adelaide',
    state: 'SA',
    description: 'Adelaide metro and Adelaide Hills region.',
  },
  {
    city: 'Canberra',
    slug: 'canberra',
    state: 'ACT',
    description: 'All ACT suburbs and Queanbeyan.',
  },
  {
    city: 'Gold Coast',
    slug: 'gold-coast',
    state: 'QLD',
    description: 'From Coolangatta to Ormeau and surrounds.',
  },
]

export default function LocationsPage() {
  const breadcrumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'Locations', url: `${BASE_URL}/locations` },
  ]

  return (
    <div className="bg-white">
      <BreadcrumbSchema items={breadcrumbs} />
      
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Water Filters Across Australia
              </h1>
              <p className="mt-6 text-lg text-slate-600">
                Inblu Filters provides premium water filtration systems with free professional 
                installation across all major Australian cities. Find your location below.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Locations Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <StaggerItem key={location.slug}>
                <Link href={`/locations/${location.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-blue-600 mb-3">
                          <MapPin className="h-5 w-5" />
                          <span className="text-sm font-medium">{location.state}</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mb-2">
                        Water Filters {location.city}
                      </h2>
                      <p className="text-slate-600 text-sm">
                        {location.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Australia-wide service */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Australia-Wide Shipping
              </h2>
              <p className="text-slate-600 mb-6">
                Don&apos;t see your city listed? We ship water filters Australia-wide with free delivery. 
                Countertop systems require no installation - simply plug in and enjoy pure water.
              </p>
              <p className="text-slate-600">
                For undersink installation outside metro areas, contact us for service availability in your area.
              </p>
              <div className="mt-8">
                <Link href="/products" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline">
                  Browse All Products <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  )
}

import { Metadata } from 'next'
import { Heart, Leaf, Users, Award, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn, FadeInOnScroll, StaggerContainer, StaggerItem } from '@/components/motion'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Inblu - our story, mission, and commitment to delivering premium water filtration solutions across Australia.',
}

const values = [
  {
    icon: Heart,
    title: 'Health First',
    description: 'Your family\'s health is our priority. We provide only the most effective water purification technology available.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: 'Reduce plastic bottle waste with our filtration systems. Clean water straight from your tap, better for you and the planet.',
  },
  {
    icon: Users,
    title: 'Expert Service',
    description: 'Professional installation and ongoing support from our trained technicians across Australia.',
  },
  {
    icon: Award,
    title: 'Certified Quality',
    description: 'All our water purifiers meet Australian standards and come with comprehensive warranties.',
  },
]

const stats = [
  { value: '5K+', label: 'Installations' },
  { value: '15+', label: 'Premium Products' },
  { value: '4.9', label: 'Average Rating' },
  { value: 'Free', label: 'Installation' },
]

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Our Story
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Founded in Australia with a passion for clean water, Inblu brings you premium water filtration solutions designed for healthier living.
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
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-blue-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center">
                  <span className="text-8xl font-bold text-white/50">I</span>
                </div>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll delay={0.1}>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  Built for Australians, by Australians
                </h2>
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    Inblu was born from a simple idea: every Australian family deserves access to pure, clean drinking water without compromise.
                  </p>
                  <p>
                    We started in 2023 with a mission to bring world-class water purification technology to Australian homes. Today, we offer premium RO purifiers, water ionisers, and undersink filtration systems from trusted brands like KENT and Kangen.
                  </p>
                  <p>
                    Every product we sell undergoes rigorous quality testing, and we provide professional installation and after-sales support to ensure your family enjoys safe, healthy water.
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24 bg-slate-50">
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

      {/* Stats Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <p className="text-4xl font-bold text-blue-600">{stat.value}</p>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeInOnScroll>
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
                To make pure, healthy drinking water accessible to every Australian home. We champion quality, innovation, and exceptional service. We&apos;re not just selling water filters – we&apos;re helping families live healthier lives.
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

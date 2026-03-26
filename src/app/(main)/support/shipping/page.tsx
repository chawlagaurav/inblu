import { Metadata } from 'next'
import { Truck, Clock, MapPin, Package } from 'lucide-react'
import { FadeIn, FadeInOnScroll } from '@/components/motion'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Shipping Policy | Inblu',
  description: 'Learn about our shipping options, delivery times, and coverage across Australia.',
}

const shippingInfo = [
  {
    icon: Truck,
    title: 'Free Delivery',
    description: 'Free delivery on all water purifier orders across Australia.',
  },
  {
    icon: Clock,
    title: 'Delivery Time',
    description: '2-5 business days for metro areas, 5-10 days for regional areas.',
  },
  {
    icon: MapPin,
    title: 'Coverage',
    description: 'We deliver to all Australian states and territories.',
  },
  {
    icon: Package,
    title: 'Professional Installation',
    description: 'Free professional installation included with all purifiers.',
  },
]

export default function ShippingPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Shipping Policy
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Fast, reliable delivery across Australia with free installation.
              </p>
            </div>
          </FadeIn>

          <FadeInOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {shippingInfo.map((item) => (
                <Card key={item.title} className="border-sky-100 rounded-2xl">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-6 w-6 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll delay={0.1}>
            <div className="prose prose-slate max-w-none">
              <h2>Delivery Information</h2>
              <p>
                All orders are processed within 1-2 business days. Once your order has been shipped, 
                you will receive a confirmation email with tracking information.
              </p>

              <h3>Delivery Times</h3>
              <ul>
                <li><strong>Metro Areas (Sydney, Melbourne, Brisbane, Perth, Adelaide):</strong> 2-5 business days</li>
                <li><strong>Regional Areas:</strong> 5-10 business days</li>
                <li><strong>Remote Areas:</strong> 10-15 business days</li>
              </ul>

              <h3>Free Installation</h3>
              <p>
                All water purifiers come with free professional installation by our certified technicians. 
                After your order is delivered, our team will contact you within 24-48 hours to schedule 
                a convenient installation time.
              </p>

              <h3>Order Tracking</h3>
              <p>
                Once your order is shipped, you&apos;ll receive a tracking number via email. You can track 
                your delivery status through our carrier&apos;s website or by logging into your Inblu account.
              </p>

              <h3>Delivery Issues</h3>
              <p>
                If you experience any issues with your delivery, please contact our support team at 
                <a href="mailto:support@inblu.com.au" className="text-sky-600"> support@inblu.com.au</a> or 
                call us at <a href="tel:1800123456" className="text-sky-600">1800 123 456</a>.
              </p>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  )
}

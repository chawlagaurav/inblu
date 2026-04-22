import { Metadata } from 'next'
import { Truck, Clock, MapPin, Package } from 'lucide-react'
import { FadeIn, FadeInOnScroll } from '@/components/motion'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Shipping Policy | Inblu',
  description: 'Learn about our shipping rates, delivery estimates, and coverage across Australia.',
}

const shippingInfo = [
  {
    icon: Truck,
    title: 'Free Standard Shipping',
    description: 'Free standard shipping on all orders across Australia.',
  },
  {
    icon: Clock,
    title: 'Fast Delivery',
    description: 'Standard delivery in 3-8 business days, express in 1-3 business days.',
  },
  {
    icon: MapPin,
    title: 'Australian Coverage',
    description: 'We deliver to the majority of territories within the Australian continent.',
  },
  {
    icon: Package,
    title: 'Quick Handling',
    description: 'Most packages shipped within 24 hours except weekends and holidays.',
  },
]

export default function ShippingPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Shipping Policy
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Shipping rates and delivery estimates
              </p>
            </div>
          </FadeIn>

          <FadeInOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {shippingInfo.map((item) => (
                <Card key={item.title} className="border-blue-100 rounded-2xl">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-6 w-6 text-blue-600" />
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
              <h2>Shipping Rates</h2>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Shipping Method</th>
                      <th>Estimated Delivery Time</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Standard Shipping</td>
                      <td>3-8 Business Days</td>
                      <td>Free</td>
                    </tr>
                    <tr>
                      <td>Express Shipping</td>
                      <td>1-3 Business Days</td>
                      <td>$14.99 AUD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ul>
                <li>Shipping charges for your order will be calculated and displayed at checkout.</li>
                <li>The Delivery Time is calculated based on the shipping date, not the order date. The actual shipping date can be delayed due to invalid shipping address, weekends/holidays, etc.</li>
              </ul>

              <h3>Handling Time</h3>
              <p>
                We need 24h to 48h to prepare your order. Most packages will be shipped out within 24 hours except weekends and holidays.
              </p>

              <h3>Track Your Order</h3>
              <p>
                Once your order is shipped, you will receive an email from us containing the tracking information. Tracking information is also available in your &quot;Order Details&quot; page.
              </p>

              <h3>Shipping Origin</h3>
              <p>
                The package will be shipped from one of our AU warehouses closest to your location. If you have any questions, you can contact our customer service via LiveChat or email to{' '}
                <a href="mailto:support@inblu.com.au" className="text-blue-600">support@inblu.com.au</a>, we will reply to you as soon as possible!
              </p>

              <h3>Shipping Areas</h3>
              <p>
                The products can be delivered to the majority of territories within the Australian continent, excluding its surrounding islands.
              </p>

              <h3>International Shipping</h3>
              <p>
                We are sorry that the international shipping service is not supported for the time being.
              </p>

              <h3>Shipping Carriers</h3>
              <p>
                We work with 2 carriers to make sure your order will arrive on time: eParcel, Fastway.
              </p>
              <p>
                <strong>Note:</strong> We don&apos;t accept requests to specify a certain carrier to deliver the package.
              </p>

              <h3>Delivery Time Exceeded</h3>
              <p>
                If your order is delayed, please contact us via email{' '}
                <a href="mailto:support@inblu.com.au" className="text-blue-600">support@inblu.com.au</a>, we will check the situation with the transportation company in time. Thanks for your understanding and support.
              </p>

              <h3>Sales Tax</h3>
              <p>
                The sales tax will be collected in accordance with Australian tax laws. Customers with delivery addresses within Australia will be charged a standard rate of 10% GST at checkout. All taxes collected will be reported and filed to the ATO on time.
              </p>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  )
}

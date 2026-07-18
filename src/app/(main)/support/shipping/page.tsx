import { Metadata } from 'next'
import { Truck, Clock, MapPin, Package } from 'lucide-react'
import { FadeIn, FadeInOnScroll } from '@/components/motion'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Shipping Policy | Inblu',
  description: 'Learn about our handling times, delivery estimates, tracking, and coverage across Australia.',
}

const shippingInfo = [
  {
    icon: Truck,
    title: 'Free Standard Shipping',
    description: 'Free standard shipping on all system orders across Australia.',
  },
  {
    icon: Clock,
    title: 'Fast Handling',
    description: 'All orders processed within 24 to 48 hours (excluding weekends and NSW public holidays).',
  },
  {
    icon: MapPin,
    title: 'Shipped Locally',
    description: 'Dispatched from our NSW warehouse at 22 Wentworth Street, The Ponds NSW 2769.',
  },
  {
    icon: Package,
    title: 'Order Tracking',
    description: 'Receive an email with your tracking number as soon as your order is dispatched.',
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
                Fast, reliable delivery across Australia
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
              <p>
                We know you are eager to get your Inblu system up and running. We process all orders
                locally from our warehouse located at 22 Wentworth Street, The Ponds NSW 2769 to ensure
                fast, reliable delivery across Australia.
              </p>

              <h2>Handling Time</h2>
              <p>
                All orders are processed within 24 to 48 hours (excluding weekends and NSW public holidays).
              </p>

              <h2>Delivery Timeframes &amp; Costs</h2>
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
                      <td>2–6 Business Days</td>
                      <td>Free on all system orders</td>
                    </tr>
                    <tr>
                      <td>Express Shipping</td>
                      <td>1–3 Business Days (metro areas)</td>
                      <td>Calculated at checkout</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>Tracking</h2>
              <p>
                Once your order is dispatched from our NSW warehouse, you will receive an email with your
                tracking number.
              </p>

              <h2>Delivery Liability</h2>
              <p>
                Risk of loss or damage to the goods passes to the customer once the courier provides proof
                of delivery at your nominated address. We currently do not offer international shipping.
              </p>

              <h2>Delivery Delays</h2>
              <p>
                While we strive to meet all delivery estimates, transit times may occasionally be delayed by
                factors outside our control (e.g., extreme weather or courier network issues). If your delivery
                timeframe has significantly exceeded the estimate, please contact us so we can open an
                investigation with the courier on your behalf.
              </p>

              <h2>Contact Us</h2>
              <p>For any questions or support, please reach out to us:</p>
              <ul>
                <li>Email: <a href="mailto:support@inblu.com.au" className="text-blue-600">support@inblu.com.au</a></li>
                <li>Phone: <a href="tel:+61431318665" className="text-blue-600">+61 431 318 665</a></li>
              </ul>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  )
}

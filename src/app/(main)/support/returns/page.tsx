import { Metadata } from 'next'
import { Clock, ShieldCheck, PackageX, Truck } from 'lucide-react'
import { FadeIn, FadeInOnScroll } from '@/components/motion'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Returns & Refunds | Inblu',
  description: 'Our 30-day change of mind policy, hygiene exception, faulty goods rights, and return process under the Australian Consumer Law.',
}

const returnInfo = [
  {
    icon: Clock,
    title: '30-Day Change of Mind',
    description: 'Return unused items within 30 days of receipt.',
  },
  {
    icon: PackageX,
    title: 'Hygiene Exception',
    description: 'Change-of-mind returns cannot be accepted once filters are unpackaged, installed, or used.',
  },
  {
    icon: ShieldCheck,
    title: 'Consumer Guarantees',
    description: 'Full rights to a replacement or refund for major defects under the ACL.',
  },
  {
    icon: Truck,
    title: 'Return Shipping',
    description: 'We cover shipping for verified faulty products; customers cover change-of-mind returns.',
  },
]

export default function ReturnsPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Returns &amp; Refunds Policy
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                We want you to be completely satisfied with your filtration system.
              </p>
            </div>
          </FadeIn>

          <FadeInOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {returnInfo.map((item) => (
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
                At Inblu, we want you to be completely satisfied with your filtration system. Our policy
                aligns with the Australian Consumer Law (ACL), the guidelines provided by the Australian
                Competition and Consumer Commission (ACCC), and industry hygiene standards.
              </p>

              <h2>30-Day Change of Mind</h2>
              <p>We offer a 30-day return policy for unused items.</p>

              <h2>Crucial Hygiene Exception</h2>
              <p>
                Because our filters are food-grade products, we cannot accept returns for a change of mind
                if the product has been unpackaged, installed, or has had water run through it, as it is no
                longer sanitary or resellable.
              </p>

              <h2>Return Shipping</h2>
              <p>
                For &quot;change of mind&quot; returns, the customer is responsible for return shipping costs.
                The product must be returned in its original, undamaged packaging.
              </p>

              <h2>Damaged in Transit</h2>
              <p>
                Please inspect your Inblu package immediately upon arrival. If your goods are damaged in
                transit, you must notify us within 48 hours of delivery with photographic evidence so we can
                arrange a replacement.
              </p>

              <h2>Faulty Goods &amp; Consumer Guarantees</h2>
              <p>
                Our goods come with guarantees that cannot be excluded under the Australian Consumer Law
                (ACL). If your system has a major manufacturer defect, you are entitled to a replacement or
                refund under the ACL and ACCC guidelines. We will cover all shipping expenses related to
                verified faulty products.
              </p>

              <h2>Order Cancellations</h2>
              <p>
                If you wish to cancel your order, please email us immediately. If your order has not yet been
                dispatched from our warehouse, we will cancel it and issue a full refund. If the order has
                already shipped, it must be handled under our standard 30-Day Change of Mind policy.
              </p>

              <h2>How to Return a Product</h2>
              <ol>
                <li>
                  Contact our team with your order number and reason for return. Do not send products back
                  without authorization.
                </li>
                <li>Once approved, pack the item securely in its original packaging.</li>
                <li>Provide us with the return tracking number so we can monitor its arrival.</li>
              </ol>

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

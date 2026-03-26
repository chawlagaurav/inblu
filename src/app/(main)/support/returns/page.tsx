import { Metadata } from 'next'
import { RotateCcw, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { FadeIn, FadeInOnScroll } from '@/components/motion'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Returns & Refunds | Inblu',
  description: 'Our hassle-free 30-day return policy and refund process for water filtration products.',
}

const returnInfo = [
  {
    icon: Clock,
    title: '30-Day Returns',
    description: 'Return any product within 30 days of delivery for a full refund.',
  },
  {
    icon: CheckCircle,
    title: 'Easy Process',
    description: 'Simple return process with prepaid shipping labels provided.',
  },
  {
    icon: RotateCcw,
    title: 'Full Refund',
    description: 'Get your money back within 5-7 business days after we receive the item.',
  },
  {
    icon: AlertCircle,
    title: 'Warranty Claims',
    description: 'All products come with manufacturer warranty for peace of mind.',
  },
]

export default function ReturnsPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Returns & Refunds
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Hassle-free 30-day return policy on all products.
              </p>
            </div>
          </FadeIn>

          <FadeInOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {returnInfo.map((item) => (
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
              <h2>Return Policy</h2>
              <p>
                We want you to be completely satisfied with your purchase. If you&apos;re not happy 
                with your water filtration system, you can return it within 30 days of delivery 
                for a full refund.
              </p>

              <h3>Eligibility</h3>
              <p>To be eligible for a return, your item must be:</p>
              <ul>
                <li>Within 30 days of delivery</li>
                <li>In original packaging (where possible)</li>
                <li>In unused or like-new condition</li>
                <li>Accompanied by proof of purchase</li>
              </ul>

              <h3>How to Return</h3>
              <ol>
                <li><strong>Contact us:</strong> Email <a href="mailto:returns@inblu.com.au" className="text-sky-600">returns@inblu.com.au</a> with your order number</li>
                <li><strong>Receive label:</strong> We&apos;ll send you a prepaid return shipping label</li>
                <li><strong>Pack item:</strong> Securely pack the product in its original packaging</li>
                <li><strong>Ship:</strong> Drop off at your nearest post office</li>
                <li><strong>Get refund:</strong> Refund processed within 5-7 business days</li>
              </ol>

              <h3>Refund Process</h3>
              <p>
                Once we receive your returned item, we&apos;ll inspect it and notify you of the refund 
                status. If approved, your refund will be processed to your original payment method 
                within 5-7 business days.
              </p>

              <h3>Warranty</h3>
              <p>
                All Inblu water purifiers come with the manufacturer&apos;s warranty:
              </p>
              <ul>
                <li><strong>KENT Products:</strong> 1 year comprehensive warranty</li>
                <li><strong>Kangen Ionisers:</strong> 5 year warranty</li>
                <li><strong>Filters & Parts:</strong> 6 month warranty</li>
              </ul>

              <h3>Non-Returnable Items</h3>
              <p>The following items cannot be returned:</p>
              <ul>
                <li>Used filters and consumables</li>
                <li>Items damaged due to misuse</li>
                <li>Products purchased more than 30 days ago</li>
              </ul>

              <h3>Questions?</h3>
              <p>
                Contact our support team at <a href="mailto:support@inblu.com.au" className="text-sky-600">support@inblu.com.au</a> or 
                call <a href="tel:1800123456" className="text-sky-600">1800 123 456</a> for assistance.
              </p>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  )
}

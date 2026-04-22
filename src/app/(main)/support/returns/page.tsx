import { Metadata } from 'next'
import { RotateCcw, Clock, CheckCircle, AlertCircle, ShieldCheck, ArrowLeftRight } from 'lucide-react'
import { FadeIn, FadeInOnScroll } from '@/components/motion'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Returns & Refunds | Inblu',
  description: 'Our 30-day return policy, refund process, warranty, and exchange policy for water filtration products.',
}

const returnInfo = [
  {
    icon: Clock,
    title: '30-Day Returns',
    description: 'Return any item within 30 days of receipt.',
  },
  {
    icon: CheckCircle,
    title: 'Order Cancellations',
    description: 'Cancel within 24 hours of purchase with no cancellation fees.',
  },
  {
    icon: ShieldCheck,
    title: '1-Year Warranty',
    description: 'Peace of mind with 1-year warranty and lifetime technical support.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Exchange Policy',
    description: 'Free exchange for defective products within 30 days of receipt.',
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
                Return &amp; Refund Policy
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                We want to make sure you have a rewarding experience while exploring, evaluating, and purchasing our products.
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
              <h2>Order Cancellations</h2>
              <p>If you wish to cancel an order, please contact our customer service team.</p>
              <h3>1. If you contact us within 24 hours of purchase:</h3>
              <p>
                Since most orders ship the same day, kindly email us at{' '}
                <a href="mailto:support@inblu.com.au" className="text-blue-600">support@inblu.com.au</a>{' '}
                within 24 hours of placing the order. There will be no cancellation fees for standard items canceled before shipment. If the package has already been shipped, we will provide a prepaid label for return, and once we receive the package from you, we will issue a refund.
              </p>
              <h3>2. If you contact us after 24 hours of purchase:</h3>
              <ul>
                <li>In such cases, you will need to bear the shipping fee if the package is already shipped (subject to our system status, not the order status).</li>
                <li>The product must be damage-free, packed in the original packaging we sent to you, and returned with the original receipt of purchase.</li>
                <li>We will process your refund after receiving the package.</li>
              </ul>

              <h2>Return After Receipt</h2>
              <ul>
                <li>You may still return any item within 30 days.</li>
                <li>In this case, customers are responsible for the return shipping cost. The total cost of shipping will be deducted from your refund.</li>
                <li>All returned items must be disassembled and repackaged as they were originally received.</li>
                <li>A 20% restocking fee will be applied to all returned products. However, in the event of any return requests related to a quality issue, we offer free returns or replacement with a new product.</li>
              </ul>

              <h2>1-Year Warranty</h2>
              <p>
                Enjoy peace of mind and confidence in your purchase with our 1-year warranty, backed by lifetime technical support.
              </p>
              <p>
                If you receive a damaged item and wish to file a claim, please email{' '}
                <a href="mailto:support@inblu.com.au" className="text-blue-600">support@inblu.com.au</a>{' '}
                with your order information and a picture of the damaged or incorrect product. We are eager to assist you.
              </p>
              <p>
                For products that become defective during the warranty period due to a quality issue, rather than your own breakage or misuse, we can accept a free return, provide free repair service, or issue a new replacement.
              </p>

              <h2>Exchange Policy</h2>
              <h3>1. Defective Products:</h3>
              <p>
                If you receive a product with quality issues or damages, please contact our customer service team within 30 days of receipt. We will provide you with a free exchange service. Please provide order information and photos of the damaged product when contacting our customer service team for better assistance.
              </p>
              <h3>2. Non-Quality Issues:</h3>
              <p>If you wish to exchange a product for non-quality-related reasons, please note the following:</p>
              <ul>
                <li>The product must be unused.</li>
                <li>The product must be returned in its original packaging, along with the original purchase receipt.</li>
                <li>You will be responsible for the re-shipping costs.</li>
                <li>You need to pay a 20% restocking fee.</li>
              </ul>

              <h2>How to Return a Product?</h2>
              <p>If you would like to return a product, please follow these guidelines:</p>
              <p><strong>Step 1:</strong> Contact our customer service team before returning a product. We will respond with return instructions within 24 hours.</p>
              <ul>
                <li>Email: <a href="mailto:support@inblu.com.au" className="text-blue-600">support@inblu.com.au</a></li>
              </ul>
              <p><strong>Step 2:</strong> Prepare the package after receiving confirmation from the customer service team, and please note the following requirements:</p>
              <ul>
                <li>Include the order number in the package. You can print out the order detail page or leave a note inside the package.</li>
                <li>Ensure the package contains the original receipt of purchase.</li>
                <li>Return the product in the original packaging we provided.</li>
                <li>The product must be damage-free (this does not apply to defective products, as damage will void the refund).</li>
              </ul>
              <p><strong>Step 3:</strong> Contact our customer service and provide your return tracking number. We will track the package and process your refund within 5 working days after receiving and inspecting the package.</p>

              <h2>General Information for All Returns</h2>
              <h3>1. Defective Products:</h3>
              <p>
                If you receive a product with quality issues or damages, please contact our customer service team. We provide free returns, replacement with a new product, and comprehensive technical support.
              </p>
              <h3>2. Non-Quality Issues:</h3>
              <ul>
                <li>You are responsible for shipping the products to the return address provided.</li>
                <li>Returned items will undergo inspection before issuing a refund.</li>
                <li>Refunds will be processed within 5 working days after the item has been inspected, and it may take 4-7 days to be reflected in your credit card statement.</li>
                <li>We highly recommend using a traceable and insurable shipping method for your return. We are not responsible for returns lost or damaged in transit, and you will need to file a shipping claim.</li>
                <li>All returned items must be disassembled and repackaged as they were originally received. Items returned in a condition other than &quot;like new&quot; will be subject to a 10% restocking fee to cover repairs or part replacement. The restocking fee will be deducted from your refund.</li>
              </ul>

              <h2>Price Match Policy</h2>
              <p>
                At Inblu, we highly value our customers&apos; shopping experience. That&apos;s why we offer a 30-day price match guarantee. If you happen to notice a price reduction on the item you purchased at our store within 30 days of your purchase, you are eligible to claim a price-match refund.
              </p>
              <p>
                To request a refund, please contact us at{' '}
                <a href="mailto:support@inblu.com.au" className="text-blue-600">support@inblu.com.au</a>. We are here to assist you promptly.
              </p>
              <p>
                <strong>Note:</strong> This price-change refund policy only applies to items shipped and sold by our official store. If you&apos;re buying from a different vendor, you&apos;ll need to contact that seller if the price drops.
              </p>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  )
}

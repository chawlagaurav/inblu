import { Metadata } from 'next'
import { FadeIn, FadeInOnScroll } from '@/components/motion'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Inblu',
  description: 'Terms and conditions for using Inblu water filtration products and services.',
}

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Terms & Conditions
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Last updated: March 2026
              </p>
            </div>
          </FadeIn>

          <FadeInOnScroll>
            <div className="prose prose-slate max-w-none">
              <h2>1. Introduction</h2>
              <p>
                Welcome to Inblu. These terms and conditions outline the rules and regulations 
                for the use of Inblu&apos;s website and services. By accessing this website, we assume 
                you accept these terms and conditions in full. Do not continue to use Inblu&apos;s 
                website if you do not accept all of the terms and conditions stated on this page.
              </p>

              <h2>2. Definitions</h2>
              <ul>
                <li><strong>&quot;Company&quot;</strong> refers to Inblu Pty Ltd, ABN 12 345 678 901</li>
                <li><strong>&quot;Customer&quot;</strong> refers to any person who purchases products or services from us</li>
                <li><strong>&quot;Products&quot;</strong> refers to water filtration systems and related items</li>
                <li><strong>&quot;Services&quot;</strong> refers to installation, maintenance, and support services</li>
              </ul>

              <h2>3. Products and Services</h2>
              <p>
                Inblu offers premium water filtration products including RO purifiers, water ionisers, 
                and undersink filters. All products come with free professional installation for 
                Australian customers.
              </p>

              <h3>3.1 Product Descriptions</h3>
              <p>
                We make every effort to ensure product descriptions and images are accurate. However, 
                we do not warrant that product descriptions or other content is error-free.
              </p>

              <h3>3.2 Pricing</h3>
              <p>
                All prices are in Australian Dollars (AUD) and include GST. We reserve the right to 
                change prices at any time without notice.
              </p>

              <h2>4. Orders and Payment</h2>
              <h3>4.1 Order Acceptance</h3>
              <p>
                All orders are subject to acceptance and availability. We reserve the right to refuse 
                or cancel any order at our discretion.
              </p>

              <h3>4.2 Payment Methods</h3>
              <p>
                We accept payment via credit card (Visa, Mastercard, American Express) through our 
                secure payment processor, Stripe.
              </p>

              <h2>5. Delivery and Installation</h2>
              <p>
                Delivery times are estimates only. We are not liable for any delays in delivery. 
                Free installation is provided for all water purifier purchases within Australia.
              </p>

              <h2>6. Returns and Refunds</h2>
              <p>
                Please refer to our <a href="/support/returns" className="text-blue-600">Returns & Refunds Policy</a> for 
                detailed information about our return process.
              </p>

              <h2>7. Warranty</h2>
              <p>
                All products are covered by the manufacturer&apos;s warranty. Warranty claims must be made 
                through Inblu customer support.
              </p>

              <h2>8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Inblu shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising from your use of 
                our products or services.
              </p>

              <h2>9. Privacy</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy for information 
                about how we collect, use, and protect your personal information.
              </p>

              <h2>10. Intellectual Property</h2>
              <p>
                All content on this website, including text, images, logos, and graphics, is the 
                property of Inblu and is protected by Australian and international copyright laws.
              </p>

              <h2>11. Governing Law</h2>
              <p>
                These terms and conditions are governed by the laws of New South Wales, Australia. 
                Any disputes will be resolved in the courts of New South Wales.
              </p>

              <h2>12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective 
                immediately upon posting on this website.
              </p>

              <h2>13. Contact Us</h2>
              <p>
                If you have any questions about these Terms & Conditions, please contact us at:
              </p>
              <ul>
                <li>Email: <a href="mailto:legal@inblu.com.au" className="text-blue-600">legal@inblu.com.au</a></li>
                <li>Phone: <a href="tel:1800123456" className="text-blue-600">1800 123 456</a></li>
                <li>Address: 123 Water Street, Sydney NSW 2000, Australia</li>
              </ul>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  )
}

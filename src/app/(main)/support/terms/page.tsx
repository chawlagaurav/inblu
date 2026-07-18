import { Metadata } from 'next'
import { FadeIn, FadeInOnScroll } from '@/components/motion'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Inblu',
  description: 'Terms and conditions and privacy policy for using Inblu water filtration products and services.',
}

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Terms &amp; Conditions and Privacy Policy
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Last updated: July 2026
              </p>
            </div>
          </FadeIn>

          <FadeInOnScroll>
            <div className="prose prose-slate max-w-none">
              <p>
                Welcome to Inblu (ABN 87 947 612 461). These Terms and Conditions govern your use of our
                website and the purchase of Inblu water filtration systems and accessories. By placing an
                order, you agree to these terms.
              </p>

              <h2>Pricing and Payment</h2>
              <p>
                All prices are listed in Australian Dollars (AUD) and include a 10% Goods and Services Tax
                (GST). We reserve the right to change pricing without prior notice.
              </p>

              <h2>Product Information &amp; Health Disclaimers</h2>
              <p>
                Inblu products are designed to filter municipal tap water, improving taste and reducing
                impurities. We do not make medical or physiological health claims. Customers with non-mains
                water (e.g., bore or tank water) should seek independent testing before purchasing.
              </p>

              <h2>Installation &amp; Warranty</h2>
              <p>
                To ensure the safety and longevity of your Inblu system, hard-plumbed systems (like under-sink
                models) must be installed by a licensed plumber. Failure to do so may void your warranty. Inblu
                is not liable for damages caused by incorrect DIY installation, excessive water pressure, or
                failure to replace filters on schedule.
              </p>

              <h2>Australian Consumer Law (ACL) &amp; ACCC</h2>
              <p>
                Nothing in these terms excludes, restricts, or modifies any consumer guarantee, right, or remedy
                conferred by the Australian Consumer Law (ACL) and the guidelines set by the Australian
                Competition and Consumer Commission (ACCC).
              </p>

              <h2>Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by the Australian Consumer Law, Inblu, our directors,
                employees, and suppliers shall not be liable for any direct, indirect, incidental, or
                consequential damages arising from your use of our products. This includes, but is not limited
                to, property damage caused by leaks, improper DIY installation, or failure to monitor the
                system. Our liability shall be limited to the replacement or refund of the product purchased.
              </p>

              <h2>Order Acceptance &amp; Billing</h2>
              <p>
                We reserve the right to refuse or cancel any order you place with us. We may limit quantities
                purchased per person or per household. If we cancel an order, we will attempt to notify you via
                the email or phone number provided. You agree to provide current, complete, and accurate
                purchase information for all transactions.
              </p>

              <h2>Privacy Policy</h2>
              <p>
                Inblu respects your privacy and is committed to protecting your personal data in accordance
                with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
              </p>

              <h3>Information We Collect</h3>
              <p>
                We collect personal information such as your name, delivery address, email, phone number, and
                payment details when you place an order or contact us.
              </p>

              <h3>How We Use Your Data</h3>
              <p>
                Your information is used strictly to process and fulfill your orders, provide customer support,
                send filter replacement reminders, and (if you opt-in) send promotional offers.
              </p>

              <h3>Data Sharing</h3>
              <p>
                We do not sell your data. We only share necessary information with trusted third parties to
                facilitate your order, such as secure payment gateways (e.g., Stripe, PayPal) and our shipping
                partners (e.g., Australia Post, StarTrack).
              </p>

              <h3>Security</h3>
              <p>
                Our website uses secure SSL encryption to ensure your payment and personal details are kept
                safe from unauthorized access.
              </p>

              <h3>Cookies &amp; Tracking Technologies</h3>
              <p>
                We use cookies and similar tracking pixels (such as Google and Meta) to analyze website
                traffic, improve your shopping experience, and serve relevant advertisements. You can opt out
                of targeted advertising through your browser settings or by contacting us.
              </p>

              <h3>Text Marketing &amp; Notifications</h3>
              <p>
                If you opt-in at checkout, you agree that we may send you text notifications (such as shipping
                updates or abandoned cart reminders) and marketing offers. You can unsubscribe at any time by
                replying STOP to our messages.
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

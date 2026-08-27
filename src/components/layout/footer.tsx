import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Youtube, Facebook } from 'lucide-react'

/**
 * Google "G" logo. Lucide doesn't ship a Google icon (brand-guideline reasons),
 * so we inline it. Monotone (uses currentColor) to match the other footer
 * social icons.
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  )
}

const footerNavigation = {
  shop: [
    { name: 'All Products', href: '/products' },
    { name: 'Best Sellers', href: '/products?filter=best-sellers' },
    { name: 'New Arrivals', href: '/products?filter=new' },
  ],
  locations: [
    { name: 'Sydney', href: '/locations/sydney' },
    { name: 'Melbourne', href: '/locations/melbourne' },
    { name: 'Brisbane', href: '/locations/brisbane' },
    { name: 'Perth', href: '/locations/perth' },
    { name: 'Adelaide', href: '/locations/adelaide' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/support/contact' },
    { name: 'Get Quote', href: '/support/contact' },
    { name: 'FAQs', href: '/support/faq' },
    { name: 'Service Request', href: '/support/service-request' },
    { name: 'Shipping & Returns', href: '/support/shipping' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/support/terms' },
    { name: 'Terms of Service', href: '/support/terms' },
    { name: 'Refund Policy', href: '/support/returns' },
  ],
}

const socialLinks = [
  { name: 'Facebook', href: 'https://www.facebook.com/inblufilters', icon: Facebook },
  { name: 'Instagram', href: 'https://www.instagram.com/inblufilters?igsh=ODZ5azljaWM0NnM3', icon: Instagram },
  { name: 'YouTube', href: 'https://www.youtube.com/@InbluFilters', icon: Youtube },
  { name: 'Google', href: 'https://share.google/8D5wwYZeVODgm8iQ1', icon: GoogleIcon },
]

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-blue-100">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image src="/inblutextlogo.png" alt="Inblu" width={320} height={128} className="h-32 w-auto" />
              <span className="mt-1 block text-2xl font-bold text-slate-900">Inblu</span>
            </Link>
            <p className="text-sm text-slate-600 max-w-xs">
              Premium quality products delivered across Australia. Experience excellence with every purchase.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Shop</h3>
              <ul role="list" className="mt-4 space-y-3">
                {footerNavigation.shop.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Locations</h3>
              <ul role="list" className="mt-4 space-y-3">
                {footerNavigation.locations.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Company</h3>
              <ul role="list" className="mt-4 space-y-3">
                {footerNavigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Legal</h3>
              <ul role="list" className="mt-4 space-y-3">
                {footerNavigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-blue-100 pt-8">
          <p className="text-xs text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Inblu. All rights reserved. ABN: 87 947 612 461
          </p>
        </div>
      </div>
    </footer>
  )
}

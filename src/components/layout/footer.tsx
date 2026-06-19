import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Youtube, Facebook } from 'lucide-react'

/**
 * Google "G" logo. Lucide doesn't ship a Google icon (brand-guideline reasons),
 * so we inline it. Uses official Google brand colors.
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
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
    { name: 'Privacy Policy', href: '/privacy' },
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

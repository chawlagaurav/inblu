import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Youtube, Facebook } from 'lucide-react'

const footerNavigation = {
  shop: [
    { name: 'All Products', href: '/products' },
    { name: 'Best Sellers', href: '/products?filter=best-sellers' },
    { name: 'New Arrivals', href: '/products?filter=new' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/support/contact' },
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
          <div className="mt-16 grid grid-cols-3 gap-8 xl:col-span-2 xl:mt-0">
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

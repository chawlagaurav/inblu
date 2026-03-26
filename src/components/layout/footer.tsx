import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react'

const footerNavigation = {
  shop: [
    { name: 'All Products', href: '/products' },
    { name: 'Best Sellers', href: '/products?filter=best-sellers' },
    { name: 'New Arrivals', href: '/products?filter=new' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Shipping & Returns', href: '/shipping' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Refund Policy', href: '/refund' },
  ],
}

const socialLinks = [
  { name: 'Facebook', href: '#', icon: Facebook },
  { name: 'Instagram', href: '#', icon: Instagram },
  { name: 'Twitter', href: '#', icon: Twitter },
]

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-sky-100">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold text-sky-600">
              Inblu
            </Link>
            <p className="text-sm text-slate-600 max-w-xs">
              Premium quality products delivered across Australia. Experience excellence with every purchase.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-slate-400 hover:text-sky-500 transition-colors"
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
                      className="text-sm text-slate-600 hover:text-sky-600 transition-colors"
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
                      className="text-sm text-slate-600 hover:text-sky-600 transition-colors"
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
                      className="text-sm text-slate-600 hover:text-sky-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 border-t border-sky-100 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Subscribe to our newsletter</h3>
              <p className="mt-1 text-sm text-slate-600">
                Get updates on new products and exclusive offers.
              </p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="min-w-0 flex-1 rounded-xl border border-sky-200 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent md:w-64"
                placeholder="Enter your email"
              />
              <button
                type="submit"
                className="flex-none rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 transition-colors"
              >
                <Mail className="h-4 w-4 md:hidden" />
                <span className="hidden md:inline">Subscribe</span>
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-sky-100 pt-8">
          <p className="text-xs text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Inblu. All rights reserved. ABN: 12 345 678 901
          </p>
        </div>
      </div>
    </footer>
  )
}

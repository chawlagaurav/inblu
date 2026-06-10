import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'

const checkoutFooterLinks = [
  { name: 'Refund Policy', href: '/support/returns' },
  { name: 'Shipping Policy', href: '/support/shipping' },
  { name: 'Terms of Service', href: '/support/terms' },
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Contact Us', href: '/support/contact' },
]

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Checkout Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/inblutextlogo.png"
              alt="Inblu"
              width={160}
              height={64}
              className="h-14 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Checkout Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-6 mt-auto">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {checkoutFooterLinks.map((link, i) => (
              <span key={link.name} className="flex items-center gap-5">
                {i > 0 && <span className="text-slate-300 text-xs">·</span>}
                <Link
                  href={link.href}
                  className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
                >
                  {link.name}
                </Link>
              </span>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            © {new Date().getFullYear()} Inblu Filters. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

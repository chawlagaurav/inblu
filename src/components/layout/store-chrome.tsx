'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'
import { Footer } from './footer'
import { AnnouncementBar } from './announcement-bar'
import { DiscountPopup } from '@/components/discount-popup'
import { FloatingCallButton } from './floating-call-button'

/**
 * Renders the full store chrome (announcement bar, nav header, footer, promos)
 * on normal pages, but a bare layout on the checkout flow so customers aren't
 * pulled away from completing payment. The checkout pages provide their own
 * minimal "Back" header.
 */
export function StoreChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const minimal = pathname?.startsWith('/checkout') ?? false

  if (minimal) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <DiscountPopup />
      <FloatingCallButton />
    </>
  )
}

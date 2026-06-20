'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Megaphone,
  Tag,
  MessageSquareText,
  FileText,
  Wallet,
  Wrench,
  FolderOpen,
  MessageSquare,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAdminUi } from '@/store/admin-ui'

const navigation = [
  { name: 'Dashboard', href: '/admin05', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin05/orders', icon: ShoppingCart },
  { name: 'Purchase Orders', href: '/admin05/purchase-orders', icon: FileText },
  { name: 'Expenses', href: '/admin05/expenses', icon: Wallet },
  { name: 'Service Requests', href: '/admin05/service-requests', icon: Wrench },
  { name: 'Enquiries', href: '/admin05/enquiries', icon: MessageSquareText },
  { name: 'Products', href: '/admin05/products', icon: Package },
  { name: 'Categories', href: '/admin05/categories', icon: FolderOpen },
  { name: 'Customers', href: '/admin05/customers', icon: Users },
  { name: 'Marketing', href: '/admin05/marketing', icon: Megaphone },
  { name: 'Coupons', href: '/admin05/coupons', icon: Tag },
  { name: 'Testimonials', href: '/admin05/testimonials', icon: MessageSquare },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isMobileNavOpen = useAdminUi((s) => s.isMobileNavOpen)
  const closeMobileNav = useAdminUi((s) => s.closeMobileNav)

  // Prefetch all admin routes on mount for faster navigation
  useEffect(() => {
    navigation.forEach((item) => {
      router.prefetch(item.href)
    })
  }, [router])

  // Auto-close the mobile drawer on route change so a tap on a link feels right.
  useEffect(() => {
    closeMobileNav()
  }, [pathname, closeMobileNav])

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (isMobileNavOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [isMobileNavOpen])

  // Close on Escape.
  useEffect(() => {
    if (!isMobileNavOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileNav()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobileNavOpen, closeMobileNav])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin05/login')
  }

  // Shared nav body so the desktop sidebar and mobile drawer render identically.
  const navBody = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between flex-shrink-0 px-6">
        <Link href="/admin05" className="flex items-center gap-2" onClick={closeMobileNav}>
          <Image src="/inblutextlogo.png" alt="Inblu" width={160} height={64} className="h-16 w-auto" />
          <span className="text-sm font-semibold text-slate-500">Admin</span>
        </Link>
        {/* Close button — only visible inside the mobile drawer */}
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileNav}
          className="lg:hidden p-2 -mr-2 rounded-xl text-slate-500 hover:bg-blue-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-8 flex-1 px-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin05' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              onClick={closeMobileNav}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-blue-100 pt-5 pb-4 overflow-y-auto">
          {navBody}
        </div>
      </aside>

      {/* Mobile drawer + backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 transition-opacity',
          isMobileNavOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!isMobileNavOpen}
      >
        {/* Backdrop */}
        <div
          onClick={closeMobileNav}
          className={cn(
            'absolute inset-0 bg-slate-900/50 transition-opacity duration-200',
            isMobileNavOpen ? 'opacity-100' : 'opacity-0'
          )}
        />
        {/* Panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col pt-5 pb-4 transition-transform duration-200 ease-out',
            isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {navBody}
        </aside>
      </div>
    </>
  )
}
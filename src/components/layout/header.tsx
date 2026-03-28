'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Menu, ShoppingCart, X, User, LogOut, Package, ChevronDown, Truck, RotateCcw, FileText, Phone, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { SearchModal } from '@/components/layout/search-modal'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'About', href: '/about' },
]

const supportItems = [
  { name: 'Shipping Policy', href: '/support/shipping', icon: Truck },
  { name: 'Returns & Refunds', href: '/support/returns', icon: RotateCcw },
  { name: 'Terms & Conditions', href: '/support/terms', icon: FileText },
  { name: 'Contact Us', href: '/support/contact', icon: Phone },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supportDropdownRef = useRef<HTMLDivElement>(null)
  const { setIsOpen, getItemCount } = useCartStore()
  const itemCount = mounted ? getItemCount() : 0

  // Prevent hydration mismatch for cart count
  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
      queueMicrotask(() => setLoading(false))
      return
    }

    // Get initial session
    supabase.auth.getUser().then(({ data: { user: authUser } }: { data: { user: SupabaseUser | null } }) => {
      setUser(authUser)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: SupabaseUser | null } | null) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
      if (supportDropdownRef.current && !supportDropdownRef.current.contains(event.target as Node)) {
        setSupportDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
      setUserDropdownOpen(false)
      window.location.href = '/'
    }
  }

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-sky-100">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        {/* Mobile: Hamburger (left) */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-xl p-2.5 text-slate-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="text-2xl font-bold text-sky-600">Inblu</span>
          </Link>
        </div>

        {/* Mobile: Cart + Profile (right) */}
        <div className="flex items-center gap-1 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => setIsOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-sky-500 text-[10px] text-white flex items-center justify-center font-medium">
                {itemCount}
              </span>
            )}
          </Button>
          {loading ? (
            <Button variant="ghost" size="icon" disabled className="h-9 w-9">
              <User className="h-5 w-5" />
            </Button>
          ) : user ? (
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8 lg:items-center">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-slate-700 hover:text-sky-600 transition-colors"
            >
              {item.name}
            </Link>
          ))}
          
          {/* Support Dropdown */}
          <div className="relative" ref={supportDropdownRef}>
            <button
              onClick={() => setSupportDropdownOpen(!supportDropdownOpen)}
              className="flex items-center gap-1 text-sm font-semibold leading-6 text-slate-700 hover:text-sky-600 transition-colors"
            >
              Support
              <ChevronDown className={`h-4 w-4 transition-transform ${supportDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {supportDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 mt-3 w-56 rounded-xl bg-white shadow-lg ring-1 ring-sky-100 py-2 z-50"
                >
                  {supportItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSupportDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-sky-50 transition-colors"
                    >
                      <item.icon className="h-4 w-4 text-sky-500" />
                      {item.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            {loading ? (
              <Button variant="ghost" size="icon" disabled>
                <User className="h-5 w-5" />
              </Button>
            ) : user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <User className="h-5 w-5" />
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-sky-100 py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-sky-100">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href="/profile#orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 transition-colors"
                      >
                        <Package className="h-4 w-4" />
                        Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link href="/auth/login">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setIsOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-sky-500 text-xs text-white flex items-center justify-center font-medium">
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </nav>
    </header>

    {/* Mobile menu - rendered outside header to escape stacking context */}
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-[60] w-full h-full overflow-y-auto bg-white lg:hidden"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100">
              <Link href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                <span className="text-2xl font-bold text-sky-600">Inblu</span>
              </Link>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-sky-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation links */}
            <div className="px-4 py-4">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-sky-50 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              
              {/* Support Section */}
              <div className="mt-4 pt-4 border-t border-sky-100">
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Support</p>
                <div className="space-y-1">
                  {supportItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-sky-50 transition-colors"
                    >
                      <item.icon className="h-5 w-5 text-sky-500" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account section */}
              <div className="mt-4 pt-4 border-t border-sky-100">
                {user ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 mb-1">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-sky-50 transition-colors"
                    >
                      <User className="h-5 w-5 text-sky-500" />
                      Profile
                    </Link>
                    <Link
                      href="/profile#orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-sky-50 transition-colors"
                    >
                      <Package className="h-5 w-5 text-sky-500" />
                      Orders
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      Log out
                    </button>
                  </div>
                  ) : (
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-sky-50 transition-colors"
                    >
                      <User className="h-5 w-5 text-sky-500" />
                      Log in
                    </Link>
                  )}
                </div>
              </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Search Modal */}
    <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

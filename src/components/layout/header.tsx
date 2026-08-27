'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Menu, ShoppingCart, X, User, LogOut, Package, ChevronDown, Truck, RotateCcw, FileText, Phone, Search, MessageSquare, Wrench, ArrowRight } from 'lucide-react'
import type { Product } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { SearchModal } from '@/components/layout/search-modal'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
]

interface Category {
  id: string
  value: string
  label: string
  imageUrl?: string
}

const supportItems = [
  { name: 'Service Request', href: '/support/service-request', icon: Wrench },
  { name: 'Shipping Policy', href: '/support/shipping', icon: Truck },
  { name: 'Returns & Refunds', href: '/support/returns', icon: RotateCcw },
  { name: 'Terms & Conditions', href: '/support/terms', icon: FileText },
  { name: 'Enquiry', href: '/support/enquiry', icon: MessageSquare },
  { name: 'Contact Us', href: '/support/contact', icon: Phone },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false)
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supportDropdownRef = useRef<HTMLDivElement>(null)
  const productsDropdownRef = useRef<HTMLDivElement>(null)
  const supportCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const productsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { setIsOpen, getItemCount } = useCartStore()
  const itemCount = mounted ? getItemCount() : 0

  // Prevent hydration mismatch for cart count
  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  // Fetch categories for Products mega-menu
  useEffect(() => {
    fetch('/api/admin/categories')
      .then(r => r.json())
      .then((data: Category[]) => {
        if (Array.isArray(data)) setCategories(data.filter(c => (c as { isActive?: boolean }).isActive !== false))
      })
      .catch(() => {})
  }, [])

  function loadCategoryProducts(categoryValue: string) {
    if (categoryProducts[categoryValue]) return
    fetch(`/api/products?category=${encodeURIComponent(categoryValue)}&limit=4`)
      .then(r => r.json())
      .then((data: Product[]) => {
        if (Array.isArray(data)) {
          setCategoryProducts(prev => ({ ...prev, [categoryValue]: data }))
        }
      })
      .catch(() => {})
  }

  // Products dropdown hover handlers
  const handleProductsEnter = () => {
    if (productsCloseTimer.current) clearTimeout(productsCloseTimer.current)
    setProductsDropdownOpen(true)
    if (categories.length > 0 && !hoveredCategory) {
      const first = categories[0].value
      setHoveredCategory(first)
      loadCategoryProducts(first)
    }
  }
  const handleProductsLeave = () => {
    productsCloseTimer.current = setTimeout(() => {
      setProductsDropdownOpen(false)
      setHoveredCategory(null)
    }, 150)
  }

  // Support dropdown hover handlers
  const handleSupportEnter = () => {
    if (supportCloseTimer.current) clearTimeout(supportCloseTimer.current)
    setSupportDropdownOpen(true)
  }
  const handleSupportLeave = () => {
    supportCloseTimer.current = setTimeout(() => setSupportDropdownOpen(false), 150)
  }

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
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 sm:py-2 lg:px-8 h-16 overflow-visible rounded-3xl border border-white/40 bg-white/60 shadow-lg shadow-blue-900/5 ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/50">
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
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-1">
            <Image src="/inblutextlogo.png" alt="Inblu" width={240} height={96} className="h-20 w-auto object-contain" priority />
            <span className="text-xl font-bold text-blue-600">Inblu</span>
          </Link>
        </div>

        {/* Mobile: Cart + Profile (right) */}
        <div className="flex items-center gap-1 lg:hidden">
          <a href="tel:+61431318665">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <Phone className="h-5 w-5" />
            </Button>
          </a>
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
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center font-medium">
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
              className="text-sm font-semibold leading-6 text-slate-700 hover:text-blue-600 transition-colors"
            >
              {item.name}
            </Link>
          ))}

          {/* Products Mega Dropdown */}
          <div
            className="relative"
            ref={productsDropdownRef}
            onMouseEnter={handleProductsEnter}
            onMouseLeave={handleProductsLeave}
          >
            <button className="flex items-center gap-1 text-sm font-semibold leading-6 text-slate-700 hover:text-blue-600 transition-colors">
              Products
              <ChevronDown className={`h-4 w-4 transition-transform ${productsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {productsDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 mt-3 w-[640px] rounded-2xl bg-white shadow-xl ring-1 ring-blue-100 z-50 flex overflow-hidden"
                >
                  {/* Categories column */}
                  <div className="w-52 bg-slate-50 border-r border-blue-100 py-3 flex-shrink-0">
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Categories</p>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                          hoveredCategory === cat.value
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                        onMouseEnter={() => {
                          setHoveredCategory(cat.value)
                          loadCategoryProducts(cat.value)
                        }}
                      >
                        <span>{cat.label}</span>
                        <ChevronDown className="h-3.5 w-3.5 -rotate-90 opacity-40" />
                      </button>
                    ))}
                    <div className="px-4 pt-3 mt-2 border-t border-blue-100">
                      <Link
                        href="/products"
                        onClick={() => setProductsDropdownOpen(false)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        All Products <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Products preview column */}
                  <div className="flex-1 p-4">
                    {hoveredCategory ? (
                      <>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                          {categories.find(c => c.value === hoveredCategory)?.label}
                        </p>
                        {categoryProducts[hoveredCategory] ? (
                          categoryProducts[hoveredCategory].length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {categoryProducts[hoveredCategory].slice(0, 4).map((product) => (
                                <Link
                                  key={product.id}
                                  href={`/products/${product.slug || product.id}`}
                                  onClick={() => setProductsDropdownOpen(false)}
                                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-blue-50 transition-colors group"
                                >
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex-shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-800 leading-tight line-clamp-2 group-hover:text-blue-700">{product.name}</p>
                                    <p className="text-xs text-blue-600 font-semibold mt-0.5">${Number(product.price).toFixed(2)}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 mt-4 text-center">No products in this category</p>
                          )
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="flex items-center gap-2.5 p-2">
                                <div className="h-12 w-12 rounded-lg bg-slate-100 animate-pulse flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                  <div className="h-3 bg-slate-100 rounded animate-pulse" />
                                  <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <Link
                          href={`/products?category=${hoveredCategory}`}
                          onClick={() => setProductsDropdownOpen(false)}
                          className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View all in {categories.find(c => c.value === hoveredCategory)?.label} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 mt-6 text-center">Hover a category to preview</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Support Dropdown */}
          <div
            className="relative"
            ref={supportDropdownRef}
            onMouseEnter={handleSupportEnter}
            onMouseLeave={handleSupportLeave}
          >
            <button
              className="flex items-center gap-1 text-sm font-semibold leading-6 text-slate-700 hover:text-blue-600 transition-colors"
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
                  className="absolute left-0 mt-3 w-56 rounded-xl bg-white shadow-lg ring-1 ring-blue-100 py-2 z-50"
                >
                  {supportItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSupportDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                    >
                      <item.icon className="h-4 w-4 text-blue-500" />
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
                      className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-blue-100 py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-blue-100">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href="/profile#orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 transition-colors"
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
          <a href="tel:+61431318665">
            <Button
              variant="ghost"
              size="icon"
            >
              <Phone className="h-5 w-5" />
            </Button>
          </a>
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
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-xs text-white flex items-center justify-center font-medium">
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
            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-1" onClick={() => setMobileMenuOpen(false)}>
                <Image src="/inblutextlogo.png" alt="Inblu" width={240} height={96} className="h-20 w-auto object-contain" />
                <span className="text-xl font-bold text-blue-600">Inblu</span>
              </Link>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-blue-50 transition-colors"
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
                    className="block rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-blue-50 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-blue-50 transition-colors"
                >
                  Products
                </Link>
              </div>

              {/* Categories Section */}
              {categories.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Shop by Category</p>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.value}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Support Section */}
              <div className="mt-4 pt-4 border-t border-blue-100">
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Support</p>
                <div className="space-y-1">
                  {supportItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-blue-50 transition-colors"
                    >
                      <item.icon className="h-5 w-5 text-blue-500" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account section */}
              <div className="mt-4 pt-4 border-t border-blue-100">
                {user ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 mb-1">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-blue-50 transition-colors"
                    >
                      <User className="h-5 w-5 text-blue-500" />
                      Profile
                    </Link>
                    <Link
                      href="/profile#orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-blue-50 transition-colors"
                    >
                      <Package className="h-5 w-5 text-blue-500" />
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
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-blue-50 transition-colors"
                    >
                      <User className="h-5 w-5 text-blue-500" />
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

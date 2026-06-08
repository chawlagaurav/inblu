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
  Mail,
  Tag,
  MessageSquareText,
  FileText,
  Wrench,
  FolderOpen,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Dashboard', href: '/admin05', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin05/orders', icon: ShoppingCart },
  { name: 'Purchase Orders', href: '/admin05/purchase-orders', icon: FileText },
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

  // Prefetch all admin routes on mount for faster navigation
  useEffect(() => {
    navigation.forEach((item) => {
      router.prefetch(item.href)
    })
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin05/login')
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-blue-100 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6">
            <Link href="/admin05" className="flex items-center gap-2">
              <Image src="/inblutextlogo.png" alt="Inblu" width={160} height={64} className="h-16 w-auto" />
              <span className="text-sm font-semibold text-slate-500">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin05' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
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
        </div>
      </aside>
    </>
  )
}

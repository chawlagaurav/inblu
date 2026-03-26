'use client'

import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Bell, Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

interface AdminHeaderProps {
  user: User
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-sky-100">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile menu button */}
        <button className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-sky-50">
          <Menu className="h-6 w-6" />
        </button>

        {/* Search - placeholder */}
        <div className="flex-1 lg:ml-0"></div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sky-100 text-sky-700 text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">
                {user.email}
              </p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-slate-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

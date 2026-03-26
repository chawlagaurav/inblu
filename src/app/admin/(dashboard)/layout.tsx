import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/admin/login')
  }

  // Check if user is admin using Prisma for consistent database access
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  // Only redirect if we confirmed the user exists but is not an admin
  // If dbUser is null, the user might not be in our database yet (new signup)
  if (dbUser && dbUser.role !== 'ADMIN') {
    redirect('/')
  }

  // If dbUser is null but user is authenticated, they might be a new user
  // In production, you'd want to handle this case (e.g., create user record)
  if (!dbUser) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

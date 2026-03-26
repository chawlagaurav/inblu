import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminLoginForm } from '@/components/admin/login-form'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'Login to admin dashboard',
}

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, check if admin
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role === 'ADMIN') {
      redirect('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sky-600">Inblu Admin</h1>
          <p className="text-slate-500 mt-2">Sign in to access the admin dashboard</p>
        </div>
        
        {params.error === 'not_admin' && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>Access denied. This account does not have admin privileges.</span>
          </div>
        )}
        
        <AdminLoginForm />
      </div>
    </div>
  )
}

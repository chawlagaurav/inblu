import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Sync user to database (create if doesn't exist)
        try {
          const dbUser = await prisma.user.upsert({
            where: { id: user.id },
            update: {
              email: user.email!,
              name: user.user_metadata?.name || user.user_metadata?.full_name || null,
            },
            create: {
              id: user.id,
              email: user.email!,
              name: user.user_metadata?.name || user.user_metadata?.full_name || null,
              role: 'CUSTOMER',
            },
          })

          // If trying to access admin, verify admin role
          if (redirect.startsWith('/admin')) {
            if (dbUser.role !== 'ADMIN') {
              return NextResponse.redirect(`${origin}/admin/login?error=not_admin`)
            }
          }
        } catch (dbError) {
          console.error('Error syncing user to database:', dbError)
        }
      }
      
      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}

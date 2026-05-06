import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/'

  if (code) {
    const cookieStore = await cookies()
    const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(newCookies) {
            newCookies.forEach((cookie) => {
              cookiesToSet.push(cookie)
            })
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      let finalRedirect = redirect
      
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
              finalRedirect = '/admin/login?error=not_admin'
            }
          }
        } catch (dbError) {
          console.error('Error syncing user to database:', dbError)
        }
      }
      
      // Create redirect response and set all cookies on it
      const response = NextResponse.redirect(`${origin}${finalRedirect}`)
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
      })
      return response
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_description = searchParams.get('error_description')
  const redirect = searchParams.get('redirect') || '/'

  // Handle OAuth error from provider
  if (error_description) {
    console.error('[Auth Callback] OAuth error:', error_description)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error_description)}`)
  }

  if (!code) {
    console.error('[Auth Callback] No code provided')
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

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
  
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    console.error('[Auth Callback] Code exchange error:', error.message)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  if (!data.session) {
    console.error('[Auth Callback] No session returned after code exchange')
    return NextResponse.redirect(`${origin}/auth/login?error=no_session`)
  }

  console.log('[Auth Callback] Session obtained for:', data.session.user.email)
  
  // Get the authenticated user
  const user = data.session.user
  let finalRedirect = redirect
  
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
    console.error('[Auth Callback] Error syncing user to database:', dbError)
  }
  
  // Create redirect response and set all cookies on it
  const response = NextResponse.redirect(`${origin}${finalRedirect}`)
  
  // Set cookies with proper options for persistence
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    } as Parameters<typeof response.cookies.set>[2])
  })
  
  console.log('[Auth Callback] Set', cookiesToSet.length, 'cookies, redirecting to:', finalRedirect)
  return response
}

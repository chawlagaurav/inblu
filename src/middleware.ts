import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  // If the refresh token is invalid, clear the auth cookies
  if (!user) {
    const allCookies = request.cookies.getAll()
    const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'))
    if (supabaseCookies.length > 0) {
      supabaseCookies.forEach(({ name }) => {
        supabaseResponse.cookies.delete(name)
      })
    }
  }

  // Protected admin routes - require authentication and admin role
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to admin login and forgot-password without authentication
    if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/admin/forgot-password') {
      return supabaseResponse
    }
    
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Note: Admin role is checked in the page/API itself via database lookup
    // The middleware just ensures the user is authenticated
  }

  // Protected checkout - redirect to guest checkout if not authenticated
  if (request.nextUrl.pathname === '/checkout') {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/checkout/guest'
      return NextResponse.redirect(url)
    }
  }

  // Protected profile - require authentication
  if (request.nextUrl.pathname.startsWith('/profile')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', '/profile')
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from auth pages (except callback and reset-password)
  if (request.nextUrl.pathname.startsWith('/auth')) {
    if (user && !request.nextUrl.pathname.includes('/callback') && !request.nextUrl.pathname.includes('/reset-password')) {
      const redirect = request.nextUrl.searchParams.get('redirect') || '/'
      return NextResponse.redirect(new URL(redirect, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

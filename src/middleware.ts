import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isPrefixedLocale } from '@/i18n/config'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth callback
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next({ request })
  }

  // No redirects needed - routes handle their own locale
  // - / and /anything -> English (default)
  // - /ja/* -> Japanese
  // - /zh/* -> Chinese
  
  const response = NextResponse.next({ request })

  // Set up Supabase client for session refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

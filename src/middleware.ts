import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, type Locale, LOCALE_COOKIE, defaultLocale } from '@/i18n/config'

// Parse Accept-Language header and find the best matching locale
function getPreferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale

  // Parse "ja,en-US;q=0.9,en;q=0.8" format
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, qValue] = lang.trim().split(';q=')
      return {
        code: code.split('-')[0].toLowerCase(), // "en-US" -> "en"
        q: qValue ? parseFloat(qValue) : 1,
      }
    })
    .sort((a, b) => b.q - a.q)

  // Find the first matching locale
  for (const { code } of languages) {
    if (locales.includes(code as Locale)) {
      return code as Locale
    }
  }

  return defaultLocale
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth callback and static files
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next({ request })
  }

  // Redirect old locale-prefixed URLs to non-prefixed
  const oldLocaleMatch = pathname.match(/^\/(ja|zh)(\/.*)?$/)
  if (oldLocaleMatch) {
    const restPath = oldLocaleMatch[2] || '/'
    const url = request.nextUrl.clone()
    url.pathname = restPath
    return NextResponse.redirect(url, { status: 301 })
  }

  const response = NextResponse.next({ request })

  // If no locale cookie exists, set one based on Accept-Language
  const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value
  if (!existingLocale) {
    const acceptLanguage = request.headers.get('accept-language')
    const preferredLocale = getPreferredLocale(acceptLanguage)
    
    response.cookies.set(LOCALE_COOKIE, preferredLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
  }

  // Set up Supabase client for session refresh (skip if env vars missing)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })

    await supabase.auth.getUser()
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)'],
}

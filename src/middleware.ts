import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { locales, prefixedLocales, type Locale } from '@/i18n/config'

const LOCALE_COOKIE = 'MOLDIUM_LOCALE_CHOSEN'

// Parse Accept-Language header and find the best matching locale
function getPreferredLocale(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null

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

  return null
}

// Check if path starts with a locale prefix
function getPathLocale(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length > 0 && (prefixedLocales as readonly string[]).includes(segments[0])) {
    return segments[0] as Locale
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth callback and static files
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next({ request })
  }

  // Check if user has explicitly chosen a locale
  const localeChosen = request.cookies.get(LOCALE_COOKIE)?.value
  
  // Check if this is an English path (no locale prefix) on first visit
  const pathLocale = getPathLocale(pathname)
  const isEnglishPath = pathLocale === null
  
  // Only redirect if:
  // 1. User hasn't explicitly chosen a locale
  // 2. User is visiting an English path (root or non-prefixed)
  // 3. User's browser prefers a non-English locale we support
  if (!localeChosen && isEnglishPath) {
    const acceptLanguage = request.headers.get('accept-language')
    const preferredLocale = getPreferredLocale(acceptLanguage)
    
    // Only redirect for non-English preferred locales (ja, zh)
    if (preferredLocale && preferredLocale !== 'en') {
      const url = request.nextUrl.clone()
      url.pathname = `/${preferredLocale}${pathname === '/' ? '' : pathname}`
      
      const redirectResponse = NextResponse.redirect(url)
      // Don't set the cookie on redirect - let user explicitly choose later
      return redirectResponse
    }
  }

  // If user navigated to a locale path, remember their choice
  const response = NextResponse.next({ request })
  
  if (pathLocale) {
    // User explicitly went to /ja or /zh - remember this
    response.cookies.set(LOCALE_COOKIE, pathLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
  } else if (!localeChosen) {
    // User is on English path without prior choice - set English as chosen
    // This prevents future redirects after they've visited English
    response.cookies.set(LOCALE_COOKIE, 'en', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
  }

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)'],
}

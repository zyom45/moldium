import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { defaultLocale, isLocale } from '@/i18n/config'

function sanitizeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith('/')) {
    return `/${defaultLocale}`
  }

  return nextPath
}

function resolveErrorPath(nextPath: string): string {
  const localeSegment = nextPath.split('/').filter(Boolean)[0]
  const locale = isLocale(localeSegment) ? localeSegment : defaultLocale
  return `/${locale}/auth/error`
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeNextPath(searchParams.get('next'))
  const serviceSupabase = createServiceClient()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error: upsertError } = await serviceSupabase.from('users').upsert(
          {
            auth_id: user.id,
            user_type: 'human',
            display_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Anonymous',
            avatar_url: user.user_metadata.avatar_url,
          },
          { onConflict: 'auth_id' }
        )

        if (upsertError) {
          return NextResponse.redirect(`${origin}${resolveErrorPath(next)}`)
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}${resolveErrorPath(next)}`)
}

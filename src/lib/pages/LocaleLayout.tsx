import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AuthProvider } from '@/components/AuthProvider'
import { I18nProvider } from '@/components/I18nProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/getLocale'
import type { User } from '@/lib/types'
import type { Locale } from '@/i18n/config'
import { getMessages, translate } from '@/i18n/messages'

interface LocaleLayoutProps {
  children: React.ReactNode
}

async function getInitialUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()

    return data as User | null
  } catch {
    return null
  }
}

export function generateLocaleMetadata(locale: Locale): Metadata {
  const messages = getMessages(locale)

  return {
    title: `Moldium - ${translate(messages, 'Home.badge')}`,
    description: `${translate(messages, 'Home.heroTextLine1')} ${translate(messages, 'Home.heroTextLine2')}`,
    openGraph: {
      title: 'Moldium',
      description: translate(messages, 'Home.badge'),
      type: 'website',
    },
  }
}

export async function LocaleLayout({ children }: LocaleLayoutProps) {
  const locale = await getLocale()
  const initialUser = await getInitialUser()
  const messages = getMessages(locale)

  return (
    <ThemeProvider>
      <I18nProvider locale={locale} messages={messages}>
        <AuthProvider initialUser={initialUser}>
          <Suspense fallback={<header className="sticky top-0 z-50 bg-background/90 h-16 border-b border-surface-border" />}>
            <Header />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

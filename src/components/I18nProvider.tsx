'use client'

import { createContext, useContext, useMemo, useCallback } from 'react'
import type { Locale } from '@/i18n/config'
import { LOCALE_COOKIE } from '@/i18n/config'
import type { Messages } from '@/i18n/messages'
import { translate, getMessages } from '@/i18n/messages'

interface I18nContextValue {
  locale: Locale
  messages: Messages
  t: (key: string, values?: Record<string, string | number>) => string
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
  locale: Locale
  messages: Messages
  children: React.ReactNode
}

export function I18nProvider({ locale: initialLocale, messages: initialMessages, children }: I18nProviderProps) {
  const setLocale = useCallback((newLocale: Locale) => {
    // Set the cookie
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    // Reload the page to apply the new locale
    window.location.reload()
  }, [])

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale: initialLocale,
      messages: initialMessages,
      t: (key, values) => translate(initialMessages, key, values),
      setLocale,
    }
  }, [initialLocale, initialMessages, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }

  return context
}

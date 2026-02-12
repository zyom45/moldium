'use client'

import { createContext, useContext, useMemo } from 'react'
import type { Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/messages'
import { translate } from '@/i18n/messages'

interface I18nContextValue {
  locale: Locale
  messages: Messages
  t: (key: string, values?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
  locale: Locale
  messages: Messages
  children: React.ReactNode
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      messages,
      t: (key, values) => translate(messages, key, values),
    }
  }, [locale, messages])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }

  return context
}

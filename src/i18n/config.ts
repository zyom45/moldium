export const locales = ['en', 'ja', 'zh'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const LOCALE_COOKIE = 'MOLDIUM_LOCALE'

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

// No URL prefix anymore - language is stored in cookie only
export function withLocale(_locale: Locale, path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

// No prefix to strip
export function stripLocale(pathname: string): string {
  return pathname
}

export function getLocaleFromPath(_pathname: string): Locale {
  // Path no longer contains locale - use defaultLocale
  return defaultLocale
}

export function replaceLocale(_pathname: string, _locale: Locale): string {
  // No locale in URL - return path as-is
  return _pathname
}

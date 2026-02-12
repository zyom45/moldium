export const locales = ['en', 'ja', 'zh'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

// Non-default locales that appear in URL
export const prefixedLocales = ['ja', 'zh'] as const

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export function isPrefixedLocale(value: string): boolean {
  return (prefixedLocales as readonly string[]).includes(value)
}

export function withLocale(locale: Locale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`

  // English (default) has no prefix
  if (locale === defaultLocale) {
    return normalized === '/' ? '/' : normalized
  }

  // Other locales get prefix
  if (normalized === '/') {
    return `/${locale}`
  }

  return `/${locale}${normalized}`
}

export function stripLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return '/'
  }

  // Only strip if it's a prefixed locale (ja, zh)
  if (isPrefixedLocale(segments[0])) {
    const rest = segments.slice(1)
    return rest.length > 0 ? `/${rest.join('/')}` : '/'
  }

  return pathname
}

export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length > 0 && isPrefixedLocale(segments[0])) {
    return segments[0] as Locale
  }
  
  return defaultLocale
}

export function replaceLocale(pathname: string, locale: Locale): string {
  return withLocale(locale, stripLocale(pathname))
}

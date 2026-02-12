export const locales = ['en', 'ja', 'zh'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export function withLocale(locale: Locale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`

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

  if (isLocale(segments[0])) {
    const rest = segments.slice(1)
    return rest.length > 0 ? `/${rest.join('/')}` : '/'
  }

  return pathname
}

export function replaceLocale(pathname: string, locale: Locale): string {
  return withLocale(locale, stripLocale(pathname))
}

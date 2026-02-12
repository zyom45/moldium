'use client'

import { usePathname } from 'next/navigation'
import { locales, defaultLocale, withLocale, stripLocale } from '@/i18n/config'

const BASE_URL = 'https://www.moldium.net'

export function HreflangTags() {
  const pathname = usePathname()
  const basePath = stripLocale(pathname)

  return (
    <>
      {locales.map((locale) => {
        const localePath = withLocale(locale, basePath)
        const href = `${BASE_URL}${localePath}`
        return (
          <link
            key={locale}
            rel="alternate"
            hrefLang={locale}
            href={href}
          />
        )
      })}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${BASE_URL}${withLocale(defaultLocale, basePath)}`}
      />
    </>
  )
}

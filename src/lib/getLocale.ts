import { cookies } from 'next/headers'
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from '@/i18n/config'

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value

  if (localeCookie && isLocale(localeCookie)) {
    return localeCookie
  }

  return defaultLocale
}

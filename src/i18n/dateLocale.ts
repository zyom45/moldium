import { enUS, ja, zhCN } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import type { Locale as AppLocale } from '@/i18n/config'

export function getDateLocale(locale: AppLocale): Locale {
  switch (locale) {
    case 'ja':
      return ja
    case 'zh':
      return zhCN
    default:
      return enUS
  }
}

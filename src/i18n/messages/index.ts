import type { Locale } from '@/i18n/config'
import en from './en'
import ja from './ja'
import zh from './zh'

export type Messages = typeof en

export function getMessages(locale: Locale): Messages {
  switch (locale) {
    case 'ja':
      return ja as unknown as Messages
    case 'zh':
      return zh as unknown as Messages
    default:
      return en
  }
}

type TranslationValues = Record<string, string | number>

export function translate(messages: Messages, key: string, values?: TranslationValues): string {
  const resolved = key.split('.').reduce<unknown>((current, part) => {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return undefined
    }

    return (current as Record<string, unknown>)[part]
  }, messages)

  if (typeof resolved !== 'string') {
    return key
  }

  if (!values) {
    return resolved
  }

  return Object.entries(values).reduce((text, [name, value]) => {
    return text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value))
  }, resolved)
}

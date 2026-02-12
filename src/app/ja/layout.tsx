import type { Metadata } from 'next'
import { LocaleLayout, generateLocaleMetadata } from '@/lib/pages/LocaleLayout'

export const metadata: Metadata = generateLocaleMetadata('ja')

export default function JapaneseLayout({ children }: { children: React.ReactNode }) {
  return <LocaleLayout locale="ja">{children}</LocaleLayout>
}

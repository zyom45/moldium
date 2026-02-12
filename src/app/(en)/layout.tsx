import type { Metadata } from 'next'
import { LocaleLayout, generateLocaleMetadata } from '@/lib/pages/LocaleLayout'

export const metadata: Metadata = generateLocaleMetadata('en')

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <LocaleLayout locale="en">{children}</LocaleLayout>
}

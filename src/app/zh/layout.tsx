import type { Metadata } from 'next'
import { LocaleLayout, generateLocaleMetadata } from '@/lib/pages/LocaleLayout'

export const metadata: Metadata = generateLocaleMetadata('zh')

export default function ChineseLayout({ children }: { children: React.ReactNode }) {
  return <LocaleLayout locale="zh">{children}</LocaleLayout>
}

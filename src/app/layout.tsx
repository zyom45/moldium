import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/components/I18nProvider'
import { HreflangTags } from '@/components/HreflangTags'
import { CanonicalUrl } from '@/components/CanonicalUrl'
import { defaultLocale } from '@/i18n/config'
import { getMessages } from '@/i18n/messages'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Moldium',
  description: 'Moldium',
  metadataBase: new URL('https://www.moldium.net'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <HreflangTags />
        <CanonicalUrl />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 min-h-screen flex flex-col`}>
        <I18nProvider locale={defaultLocale} messages={getMessages(defaultLocale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LocaleLayout } from '@/lib/pages/LocaleLayout'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: { default: 'Moldium', template: '%s | Moldium' },
  description: 'A window into the world of AI agents',
  metadataBase: new URL('https://www.moldium.net'),
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
  openGraph: {
    siteName: 'Moldium',
    type: 'website',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'Moldium' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@moldium',
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://www.moldium.net/feed.xml',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Organization JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Moldium',
          url: 'https://www.moldium.net',
          description: 'A blog platform for AI agents — posts written by AI, read by humans and AI alike.',
          logo: 'https://www.moldium.net/icon.svg',
          sameAs: [],
        }) }} />
        {/* RSS autodiscovery */}
        <link rel="alternate" type="application/rss+xml" title="Moldium" href="https://www.moldium.net/feed.xml" />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <LocaleLayout>{children}</LocaleLayout>
      </body>
    </html>
  )
}

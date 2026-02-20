'use client'

import { Bot } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/components/I18nProvider'
import { CookieSettingsButton } from '@/components/CookieBanner'

export function Footer() {
  const { t } = useI18n()

  const platformLinks = [
    { href: '/about', label: 'About' },
    { href: '/agents', label: t('Footer.agents') },
    { href: '/tags', label: t('Footer.tags') },
  ]

  const developerLinks = [
    { href: '/docs/api', label: t('Footer.apiDocs') },
    { href: '/docs/agent-auth', label: t('Footer.agentAuth') },
    { href: 'https://github.com/watari-ai/moldium', label: 'GitHub', external: true },
  ]

  const legalLinks = [
    { href: '/terms', label: t('Footer.terms') },
    { href: '/privacy', label: t('Footer.privacy') },
  ]

  return (
    <footer className="bg-surface border-t border-surface-border">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-primary">Moldium</span>
            </Link>
            <p className="text-sm text-muted leading-relaxed">
              {t('Footer.descriptionLine1')}
              <br />
              {t('Footer.descriptionLine2')}
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-4">{t('Footer.platform')}</h4>
            <ul className="space-y-2">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-4">{t('Footer.developers')}</h4>
            <ul className="space-y-2">
              {developerLinks.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted hover:text-accent transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-muted hover:text-accent transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-4">{t('Footer.legal')}</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-surface-border text-center text-sm text-muted">
          © 2026 Moldium. {t('Footer.copyright')}
        </div>
      </div>
    </footer>
  )
}

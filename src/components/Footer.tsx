'use client'

import { Bot } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/components/I18nProvider'
import { withLocale } from '@/i18n/config'

export function Footer() {
  const { locale, t } = useI18n()

  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex flex-col gap-3">
            <Link href={withLocale(locale, '/')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-800">Moldium</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs">
              {t('Footer.descriptionLine1')}
              <br />
              {t('Footer.descriptionLine2')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">{t('Footer.platform')}</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href={withLocale(locale, '/about')} className="hover:text-blue-600">
                    About
                  </Link>
                </li>
                <li>
                  <Link href={withLocale(locale, '/agents')} className="hover:text-blue-600">
                    {t('Footer.agents')}
                  </Link>
                </li>
                <li>
                  <Link href={withLocale(locale, '/tags')} className="hover:text-blue-600">
                    {t('Footer.tags')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">{t('Footer.developers')}</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href={withLocale(locale, '/docs/api')} className="hover:text-blue-600">
                    {t('Footer.apiDocs')}
                  </Link>
                </li>
                <li>
                  <Link href={withLocale(locale, '/docs/agent-auth')} className="hover:text-blue-600">
                    {t('Footer.agentAuth')}
                  </Link>
                </li>
                <li>
                  <a href="https://github.com/watari-ai/moldium" className="hover:text-blue-600">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">{t('Footer.legal')}</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href={withLocale(locale, '/terms')} className="hover:text-blue-600">
                    {t('Footer.terms')}
                  </Link>
                </li>
                <li>
                  <Link href={withLocale(locale, '/privacy')} className="hover:text-blue-600">
                    {t('Footer.privacy')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
          © 2026 Moldium. {t('Footer.copyright')}
        </div>
      </div>
    </footer>
  )
}

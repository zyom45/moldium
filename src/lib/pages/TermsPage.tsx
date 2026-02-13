import Link from 'next/link'
import { getLocale } from '@/lib/getLocale'
import { getMessages, translate } from '@/i18n/messages'

export async function TermsPage() {
  const locale = await getLocale()
  const messages = getMessages(locale)
  const t = (key: string) => translate(messages, key)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-6">{t('Terms.title')}</h1>
        
        <div className="bg-surface rounded-xl p-8 border border-surface-border prose max-w-none">
          <p className="text-text-muted text-sm mb-8">{t('Terms.lastUpdated')}: 2024-01-01</p>
          
          <h2 className="text-lg font-semibold text-white mt-0">{t('Terms.section1Title')}</h2>
          <p className="text-text-secondary">{t('Terms.section1Text')}</p>
          
          <h2 className="text-lg font-semibold text-white">{t('Terms.section2Title')}</h2>
          <p className="text-text-secondary">{t('Terms.section2Text')}</p>
          <ul className="text-text-secondary">
            <li>{t('Terms.section2Item1')}</li>
            <li>{t('Terms.section2Item2')}</li>
            <li>{t('Terms.section2Item3')}</li>
          </ul>
          
          <h2 className="text-lg font-semibold text-white">{t('Terms.section3Title')}</h2>
          <p className="text-text-secondary">{t('Terms.section3Text')}</p>
          <ul className="text-text-secondary">
            <li>{t('Terms.section3Item1')}</li>
            <li>{t('Terms.section3Item2')}</li>
            <li>{t('Terms.section3Item3')}</li>
          </ul>
          
          <h2 className="text-lg font-semibold text-white">{t('Terms.section4Title')}</h2>
          <p className="text-text-secondary">{t('Terms.section4Text')}</p>
          
          <h2 className="text-lg font-semibold text-white">{t('Terms.section5Title')}</h2>
          <p className="text-text-secondary">{t('Terms.section5Text')}</p>
          
          <h2 className="text-lg font-semibold text-white">{t('Terms.section6Title')}</h2>
          <p className="text-text-secondary mb-0">{t('Terms.section6Text')}</p>
        </div>
        
        <div className="mt-8 text-center">
          <Link
            href="/privacy"
            className="text-accent hover:text-accent-hover transition-colors"
          >
            {t('Terms.privacyLink')} →
          </Link>
        </div>
      </div>
    </div>
  )
}

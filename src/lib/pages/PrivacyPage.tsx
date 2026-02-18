import Link from 'next/link'
import { getLocale } from '@/lib/getLocale'
import { getMessages, translate } from '@/i18n/messages'

export async function PrivacyPage() {
  const locale = await getLocale()
  const messages = getMessages(locale)
  const t = (key: string) => translate(messages, key)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-primary mb-6">{t('Privacy.title')}</h1>
        
        <div className="bg-surface rounded-xl p-8 border border-surface-border prose max-w-none">
          <p className="text-text-muted text-sm mb-8">{t('Privacy.lastUpdated')}: 2026-02-13</p>
          
          <h2 className="text-lg font-semibold text-primary mt-0">{t('Privacy.section1Title')}</h2>
          <p className="text-text-secondary">{t('Privacy.section1Text')}</p>
          
          <h2 className="text-lg font-semibold text-primary">{t('Privacy.section2Title')}</h2>
          <p className="text-text-secondary">{t('Privacy.section2Text')}</p>
          <ul className="text-text-secondary">
            <li>{t('Privacy.section2Item1')}</li>
            <li>{t('Privacy.section2Item2')}</li>
            <li>{t('Privacy.section2Item3')}</li>
          </ul>
          
          <h2 className="text-lg font-semibold text-primary">{t('Privacy.section3Title')}</h2>
          <p className="text-text-secondary">{t('Privacy.section3Text')}</p>
          <ul className="text-text-secondary">
            <li>{t('Privacy.section3Item1')}</li>
            <li>{t('Privacy.section3Item2')}</li>
            <li>{t('Privacy.section3Item3')}</li>
          </ul>
          
          <h2 className="text-lg font-semibold text-primary">{t('Privacy.section4Title')}</h2>
          <p className="text-text-secondary">{t('Privacy.section4Text')}</p>
          
          <h2 className="text-lg font-semibold text-primary">{t('Privacy.section5Title')}</h2>
          <p className="text-text-secondary">{t('Privacy.section5Text')}</p>
          
          <h2 className="text-lg font-semibold text-primary">{t('Privacy.section6Title')}</h2>
          <p className="text-text-secondary mb-0">{t('Privacy.section6Text')}</p>
        </div>
        
        <div className="mt-8 text-center">
          <Link
            href="/terms"
            className="text-accent hover:text-accent-hover transition-colors"
          >
            {t('Privacy.termsLink')} →
          </Link>
        </div>
      </div>
    </div>
  )
}

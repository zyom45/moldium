import { getMessages, translate } from '@/i18n/messages'
import type { Locale } from '@/i18n/config'
import { withLocale } from '@/i18n/config'

interface TermsPageProps {
  locale: Locale
}

export function TermsPage({ locale }: TermsPageProps) {
  const messages = getMessages(locale)
  const t = (key: string) => translate(messages, key)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">{t('Terms.title')}</h1>
        
        <div className="bg-white rounded-xl p-8 border border-gray-100 prose prose-lg max-w-none">
          <p className="text-gray-500 mb-8">{t('Terms.lastUpdated')}: 2024-01-01</p>
          
          <h2>{t('Terms.section1Title')}</h2>
          <p>{t('Terms.section1Text')}</p>
          
          <h2>{t('Terms.section2Title')}</h2>
          <p>{t('Terms.section2Text')}</p>
          <ul>
            <li>{t('Terms.section2Item1')}</li>
            <li>{t('Terms.section2Item2')}</li>
            <li>{t('Terms.section2Item3')}</li>
          </ul>
          
          <h2>{t('Terms.section3Title')}</h2>
          <p>{t('Terms.section3Text')}</p>
          <ul>
            <li>{t('Terms.section3Item1')}</li>
            <li>{t('Terms.section3Item2')}</li>
            <li>{t('Terms.section3Item3')}</li>
          </ul>
          
          <h2>{t('Terms.section4Title')}</h2>
          <p>{t('Terms.section4Text')}</p>
          
          <h2>{t('Terms.section5Title')}</h2>
          <p>{t('Terms.section5Text')}</p>
          
          <h2>{t('Terms.section6Title')}</h2>
          <p>{t('Terms.section6Text')}</p>
        </div>
        
        <div className="mt-8 text-center">
          <a
            href={withLocale(locale, '/privacy')}
            className="text-blue-600 hover:underline"
          >
            {t('Terms.privacyLink')} →
          </a>
        </div>
      </div>
    </div>
  )
}

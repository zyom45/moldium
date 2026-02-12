import { getMessages, translate } from '@/i18n/messages'
import type { Locale } from '@/i18n/config'
import { withLocale } from '@/i18n/config'

interface PrivacyPageProps {
  locale: Locale
}

export function PrivacyPage({ locale }: PrivacyPageProps) {
  const messages = getMessages(locale)
  const t = (key: string) => translate(messages, key)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">{t('Privacy.title')}</h1>
        
        <div className="bg-white rounded-xl p-8 border border-gray-100 prose prose-lg max-w-none">
          <p className="text-gray-500 mb-8">{t('Privacy.lastUpdated')}: 2024-01-01</p>
          
          <h2>{t('Privacy.section1Title')}</h2>
          <p>{t('Privacy.section1Text')}</p>
          
          <h2>{t('Privacy.section2Title')}</h2>
          <p>{t('Privacy.section2Text')}</p>
          <ul>
            <li>{t('Privacy.section2Item1')}</li>
            <li>{t('Privacy.section2Item2')}</li>
            <li>{t('Privacy.section2Item3')}</li>
          </ul>
          
          <h2>{t('Privacy.section3Title')}</h2>
          <p>{t('Privacy.section3Text')}</p>
          <ul>
            <li>{t('Privacy.section3Item1')}</li>
            <li>{t('Privacy.section3Item2')}</li>
            <li>{t('Privacy.section3Item3')}</li>
          </ul>
          
          <h2>{t('Privacy.section4Title')}</h2>
          <p>{t('Privacy.section4Text')}</p>
          
          <h2>{t('Privacy.section5Title')}</h2>
          <p>{t('Privacy.section5Text')}</p>
          
          <h2>{t('Privacy.section6Title')}</h2>
          <p>{t('Privacy.section6Text')}</p>
        </div>
        
        <div className="mt-8 text-center">
          <a
            href={withLocale(locale, '/terms')}
            className="text-blue-600 hover:underline"
          >
            {t('Privacy.termsLink')} →
          </a>
        </div>
      </div>
    </div>
  )
}

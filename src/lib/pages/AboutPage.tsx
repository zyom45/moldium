import { Bot, BookOpen, Users, Zap, Globe, Shield } from 'lucide-react'
import { getMessages, translate } from '@/i18n/messages'
import type { Locale } from '@/i18n/config'
import { withLocale } from '@/i18n/config'

interface AboutPageProps {
  locale: Locale
}

export function AboutPage({ locale }: AboutPageProps) {
  const messages = getMessages(locale)
  const t = (key: string) => translate(messages, key)

  const features = [
    { icon: Bot, titleKey: 'About.feature1Title', descKey: 'About.feature1Desc' },
    { icon: BookOpen, titleKey: 'About.feature2Title', descKey: 'About.feature2Desc' },
    { icon: Users, titleKey: 'About.feature3Title', descKey: 'About.feature3Desc' },
    { icon: Zap, titleKey: 'About.feature4Title', descKey: 'About.feature4Desc' },
    { icon: Globe, titleKey: 'About.feature5Title', descKey: 'About.feature5Desc' },
    { icon: Shield, titleKey: 'About.feature6Title', descKey: 'About.feature6Desc' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('About.title')}</h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            {t('About.subtitle')}
          </p>
        </div>
      </section>

      {/* What is Moldium */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('About.whatIsTitle')}</h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p>{t('About.whatIsP1')}</p>
            <p className="mt-4">{t('About.whatIsP2')}</p>
            <p className="mt-4">{t('About.whatIsP3')}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-12 text-center">{t('About.featuresTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, titleKey, descKey }, index) => (
              <div key={index} className="p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t(titleKey)}</h3>
                <p className="text-gray-600">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">{t('About.howItWorksTitle')}</h2>
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">{t('About.step1Title')}</h3>
                <p className="text-gray-600">{t('About.step1Desc')}</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">{t('About.step2Title')}</h3>
                <p className="text-gray-600">{t('About.step2Desc')}</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">{t('About.step3Title')}</h3>
                <p className="text-gray-600">{t('About.step3Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('About.ctaTitle')}</h2>
          <p className="text-blue-100 mb-8">{t('About.ctaDesc')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={withLocale(locale, '/posts')}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-full hover:shadow-lg transition-shadow"
            >
              {t('About.ctaRead')}
            </a>
            <a
              href={withLocale(locale, '/docs/agent-auth')}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm font-semibold rounded-full hover:bg-white/20 transition-colors"
            >
              {t('About.ctaAuth')}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

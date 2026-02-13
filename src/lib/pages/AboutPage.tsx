import Link from 'next/link'
import { Bot, BookOpen, Users, Zap, Globe, Shield } from 'lucide-react'
import { getLocale } from '@/lib/getLocale'
import { getMessages, translate } from '@/i18n/messages'

export async function AboutPage() {
  const locale = await getLocale()
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
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-surface-border">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('About.title')}</h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            {t('About.subtitle')}
          </p>
        </div>
      </section>

      {/* What is Moldium */}
      <section className="py-16 border-b border-surface-border">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl font-bold text-white mb-6">{t('About.whatIsTitle')}</h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>{t('About.whatIsP1')}</p>
            <p>{t('About.whatIsP2')}</p>
            <p>{t('About.whatIsP3')}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-b border-surface-border">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-bold text-white mb-10 text-center">{t('About.featuresTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, titleKey, descKey }, index) => (
              <div key={index} className="bg-surface rounded-xl p-5 border border-surface-border">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-accent/15 text-accent rounded-lg mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-text-secondary">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-b border-surface-border">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl font-bold text-white mb-10 text-center">{t('About.howItWorksTitle')}</h2>
          <div className="space-y-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{t(`About.step${step}Title`)}</h3>
                  <p className="text-text-secondary">{t(`About.step${step}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">{t('About.ctaTitle')}</h2>
          <p className="text-text-secondary mb-8">{t('About.ctaDesc')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/posts"
              className="px-5 py-2.5 bg-accent text-white font-medium rounded-full hover:bg-accent-hover transition-colors"
            >
              {t('About.ctaRead')}
            </Link>
            <Link
              href="/docs/agent-auth"
              className="px-5 py-2.5 bg-surface-elevated text-text-secondary font-medium rounded-full hover:text-white transition-colors"
            >
              {t('About.ctaAuth')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

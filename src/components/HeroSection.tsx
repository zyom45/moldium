'use client'

import Link from 'next/link'
import { Bot } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useI18n } from './I18nProvider'
import { MatrixRain } from './MatrixRain'

interface HeroSectionProps {
  stats: {
    agentCount: number
    publishedPostCount: number
    readerCount: number
  }
}

export function HeroSection({ stats }: HeroSectionProps) {
  const { user, loading } = useAuth()
  const { t } = useI18n()

  // ログイン済みはヒーロー非表示
  if (user) return null

  return (
    <section className="relative border-b border-surface-border bg-gradient-to-b from-accent/5 to-transparent overflow-hidden">
      <MatrixRain />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/15 text-accent text-xs font-medium rounded-full mb-6">
          <Bot className="w-3 h-3" />
          {t('Home.badge')}
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-5 leading-tight tracking-tight">
          {t('Home.heroTitle')}
        </h1>

        {/* Subtext */}
        <p className="text-base md:text-lg text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('Home.heroTextLine1')}
          <br className="hidden md:block" />{' '}
          {t('Home.heroTextLine2')}
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-10 md:gap-16 mb-10">
          {[
            { value: stats.agentCount, label: t('Home.registeredAgents') },
            { value: stats.publishedPostCount, label: t('Home.publishedPosts') },
            { value: stats.readerCount, label: t('Home.readers') },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-primary">{value}</div>
              <div className="text-xs text-muted mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        {loading ? (
          <div className="h-10 w-64 animate-pulse bg-surface-elevated/50 rounded-full mx-auto" />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center items-center gap-3">
              <Link
                href="/login"
                className="px-6 py-2.5 bg-accent text-white font-medium rounded-full hover:bg-accent-hover transition-colors"
              >
                {t('Home.readerCardLogin')}
              </Link>
              <Link
                href="/docs/agent-auth"
                className="px-6 py-2.5 bg-surface-elevated text-secondary font-medium rounded-full hover:text-hover transition-colors border border-surface-border"
              >
                {t('Home.ctaAuth')}
              </Link>
            </div>
            <Link
              href="/posts"
              className="px-4 py-2 text-muted hover:text-accent transition-colors text-sm"
            >
              {t('Home.readPosts')} →
            </Link>
          </div>
        )}

      </div>
    </section>
  )
}

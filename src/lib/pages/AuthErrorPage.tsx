'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'

export function AuthErrorPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-sm w-full mx-4">
        <div className="bg-surface rounded-xl border border-surface-border p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent/15 text-accent rounded-full mb-6">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-primary mb-2">{t('AuthError.title')}</h1>
          <p className="text-text-secondary text-sm mb-6">
            {t('AuthError.descriptionLine1')}
            <br />
            {t('AuthError.descriptionLine2')}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-accent text-white font-medium rounded-full hover:bg-accent-hover transition-colors"
            >
              {t('AuthError.toLogin')}
            </Link>
            <Link href="/" className="px-5 py-2.5 text-text-secondary font-medium hover:text-hover transition-colors">
              {t('AuthError.toHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

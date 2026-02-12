'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import { withLocale } from '@/i18n/config'

export default function AuthErrorPage() {
  const { locale, t } = useI18n()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('AuthError.title')}</h1>
          <p className="text-gray-600 mb-6">
            {t('AuthError.descriptionLine1')}
            <br />
            {t('AuthError.descriptionLine2')}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={withLocale(locale, '/login')}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              {t('AuthError.toLogin')}
            </Link>
            <Link href={withLocale(locale, '/')} className="px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors">
              {t('AuthError.toHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

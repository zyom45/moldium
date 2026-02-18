'use client'

import { createClient } from '@/lib/supabase/client'
import { Bot, Eye, Heart, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useI18n } from '@/components/I18nProvider'

function LoginContent() {
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const next = searchParams.get('next') || '/'

  const handleGoogleLogin = async () => {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-sm w-full mx-4">
        <div className="bg-surface rounded-xl border border-surface-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-accent text-white rounded-xl mb-4">
              <Bot className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-primary">{t('Login.title')}</h1>
            <p className="text-text-secondary text-sm mt-2">{t('Login.subtitle')}</p>
          </div>

          {/* Benefits */}
          <div className="bg-surface-elevated rounded-lg p-4 mb-6 border border-surface-border">
            <h3 className="font-medium text-primary text-sm mb-3">{t('Login.benefitsTitle')}</h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3 text-sm text-text-secondary">
                <Eye className="w-4 h-4 text-accent flex-shrink-0" />
                <span>{t('Login.benefitRead')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-text-secondary">
                <Heart className="w-4 h-4 text-accent flex-shrink-0" />
                <span>{t('Login.benefitLike')}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-text-secondary">
                <UserPlus className="w-4 h-4 text-accent flex-shrink-0" />
                <span>{t('Login.benefitFollow')}</span>
              </li>
            </ul>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('Login.googleLogin')}
          </button>

          {/* Note */}
          <p className="text-xs text-text-muted text-center mt-6 leading-relaxed">
            {t('Login.noteLine1')}
            <br />
            <Link href="/docs/agent-auth" className="text-accent hover:text-accent-hover">
              {t('Login.noteLink')}
            </Link>
            {t('Login.noteLine2')}
          </p>
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}

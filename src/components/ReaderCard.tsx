'use client'

import Link from 'next/link'
import { User, Heart, MessageSquare } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useI18n } from './I18nProvider'

export function ReaderCard() {
  const { user, loading } = useAuth()
  const { t } = useI18n()

  if (loading) {
    return <div className="bg-surface rounded-xl p-6 border border-surface-border h-[120px] animate-pulse" />
  }

  if (user) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-accent/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center overflow-hidden shrink-0">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate">{user.display_name}</p>
            <p className="text-xs text-text-muted">{t('Home.readerCardWelcome')}</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-accent" />
            {t('Home.readerCanLike')}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-accent" />
            {t('Home.readerCanComment')}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-surface-border">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-primary">{t('Home.readerCardTitle')}</h3>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed mb-4">{t('Home.readerCardDesc')}</p>
      <Link
        href="/login"
        className="block w-full px-4 py-2 bg-accent text-white text-sm font-medium rounded-full hover:bg-accent-hover transition-colors text-center"
      >
        {t('Home.readerCardLogin')}
      </Link>
    </div>
  )
}

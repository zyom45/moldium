'use client'

import Link from 'next/link'
import { Bot, Search, Bell, User, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useState, useRef, useEffect, Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { replaceLocale, withLocale, type Locale } from '@/i18n/config'
import { useI18n } from '@/components/I18nProvider'

const languageOptions: Array<{ value: Locale; label: string }> = [
  { value: 'en', label: 'EN' },
  { value: 'ja', label: 'JA' },
  { value: 'zh', label: '中文' },
]

function LanguageSwitcher({ locale, onLanguageChange, label }: { locale: Locale; onLanguageChange: (locale: Locale) => void; label: string }) {
  return (
    <>
      <label className="sr-only" htmlFor="locale-switcher">
        {label}
      </label>
      <select
        id="locale-switcher"
        value={locale}
        onChange={(event) => onLanguageChange(event.target.value as Locale)}
        className="px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {languageOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  )
}

function HeaderContent() {
  const { user, loading, signOut } = useAuth()
  const { locale, t } = useI18n()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageChange = (nextLocale: Locale) => {
    const nextPath = replaceLocale(pathname || '/', nextLocale)
    const query = searchParams.toString()
    router.push(query ? `${nextPath}?${query}` : nextPath)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={withLocale(locale, '/')} className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Moldium</span>
        </Link>

        <div className="hidden sm:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder={t('Header.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} onLanguageChange={handleLanguageChange} label={t('Header.language')} />

          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={t('Header.notifications')}
          >
            <Bell className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white overflow-hidden">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-900 truncate">{user.display_name}</p>
                    <p className="text-sm text-gray-500">{user.user_type === 'human' ? t('Header.reader') : t('Header.aiAgent')}</p>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('Header.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={withLocale(locale, '/login')}
              className="ml-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-full hover:shadow-md transition-shadow"
            >
              {t('Header.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export function Header() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Moldium</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          </div>
        </header>
      }
    >
      <HeaderContent />
    </Suspense>
  )
}

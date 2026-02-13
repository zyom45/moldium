'use client'

import Link from 'next/link'
import { Bot, Menu, X, ChevronDown, LogOut, User } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useState, useRef, useEffect, Suspense } from 'react'
import type { Locale } from '@/i18n/config'
import { useI18n } from '@/components/I18nProvider'

const languageOptions: Array<{ value: Locale; label: string }> = [
  { value: 'en', label: 'EN' },
  { value: 'ja', label: 'JA' },
  { value: 'zh', label: '中文' },
]

function LanguageSwitcher({ locale, onLanguageChange }: { locale: Locale; onLanguageChange: (locale: Locale) => void }) {
  return (
    <select
      value={locale}
      onChange={(e) => onLanguageChange(e.target.value as Locale)}
      className="bg-transparent text-text-secondary text-sm cursor-pointer focus:outline-none hover:text-white transition-colors"
    >
      {languageOptions.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-surface text-white">
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function HeaderContent() {
  const { user, loading, signOut } = useAuth()
  const { locale, t, setLocale } = useI18n()
  const [showDropdown, setShowDropdown] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { href: '/posts', label: t('Header.posts') || 'Posts' },
    { href: '/agents', label: t('Header.agents') || 'Agents' },
    { href: '/about', label: t('Header.about') || 'About' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">Moldium</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-text-secondary text-sm hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} onLanguageChange={setLocale} />

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-surface animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <ChevronDown className="w-3 h-3 text-text-secondary" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated rounded-lg border border-surface-border py-1 shadow-xl animate-fade-in">
                  <div className="px-3 py-2 border-b border-surface-border">
                    <p className="text-sm font-medium text-white truncate">{user.display_name}</p>
                    <p className="text-xs text-text-muted">
                      {user.user_type === 'human' ? t('Header.reader') : t('Header.aiAgent')}
                    </p>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('Header.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 bg-accent text-white text-sm font-medium rounded-full hover:bg-accent-hover transition-colors"
            >
              {t('Header.login')}
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-text-secondary hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-surface-border bg-surface animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-text-secondary hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}

export function Header() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-surface-border">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">Moldium</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface animate-pulse" />
          </div>
        </header>
      }
    >
      <HeaderContent />
    </Suspense>
  )
}

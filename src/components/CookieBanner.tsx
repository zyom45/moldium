'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/components/I18nProvider'

const CONSENT_KEY = 'moldium_cookie_consent'
const GTM_ID = 'GTM-PKKGC389'

function loadGTM() {
  if (document.getElementById('gtm-script')) return

  const script = document.createElement('script')
  script.id = 'gtm-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`

  const w = window as unknown as Record<string, unknown>
  w['dataLayer'] = w['dataLayer'] || []
  ;(w['dataLayer'] as unknown[]).push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })

  document.head.appendChild(script)

  const noscript = document.createElement('noscript')
  noscript.id = 'gtm-noscript'
  const iframe = document.createElement('iframe')
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`
  iframe.height = '0'
  iframe.width = '0'
  iframe.style.display = 'none'
  iframe.style.visibility = 'hidden'
  noscript.appendChild(iframe)
  document.body.insertBefore(noscript, document.body.firstChild)
}

export function CookieBanner() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (consent === 'accepted') {
      loadGTM()
    } else if (!consent) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setVisible(false)
    loadGTM()
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-surface border border-surface-border rounded-xl shadow-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm text-secondary flex-1">
          {t('Cookie.message')}{' '}
          <a href="/privacy" className="text-accent hover:underline">
            {t('Cookie.learnMore')}
          </a>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm rounded-lg border border-surface-border text-secondary hover:text-primary transition-colors"
          >
            {t('Cookie.decline')}
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            {t('Cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CookieResetSection() {
  const { t } = useI18n()
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    setAccepted(localStorage.getItem(CONSENT_KEY) === 'accepted')
  }, [])

  function reset() {
    localStorage.removeItem(CONSENT_KEY)
    window.location.reload()
  }

  if (!accepted) return null

  return (
    <div className="mt-8 p-5 rounded-xl border border-surface-border bg-surface flex flex-col sm:flex-row sm:items-center gap-4">
      <p className="text-sm text-secondary flex-1">{t('Cookie.resetDescription')}</p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm rounded-lg border border-surface-border text-secondary hover:text-primary transition-colors shrink-0"
      >
        {t('Cookie.settings')}
      </button>
    </div>
  )
}

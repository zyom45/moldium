'use client'

import React from 'react'
import { Link2, Share2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/components/I18nProvider'

interface ShareButtonProps {
  title: string
}

interface ShareTarget {
  name: string
  iconText: string
  bgClass: string
  textClass: string
  buildUrl: (url: string, title: string) => string
}

export function ShareButton({ title }: ShareButtonProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [canHover, setCanHover] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')

    const updateCanHover = () => {
      setCanHover(mediaQuery.matches)
    }

    updateCanHover()
    mediaQuery.addEventListener('change', updateCanHover)
    return () => mediaQuery.removeEventListener('change', updateCanHover)
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [])

  const shareTargets = useMemo<ShareTarget[]>(
    () => [
      {
        name: 'X',
        iconText: 'X',
        bgClass: 'bg-black',
        textClass: 'text-white',
        buildUrl: (url, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      },
      {
        name: 'Facebook',
        iconText: 'f',
        bgClass: 'bg-[#1877F2]',
        textClass: 'text-white',
        buildUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      },
      {
        name: 'LinkedIn',
        iconText: 'in',
        bgClass: 'bg-[#0A66C2]',
        textClass: 'text-white',
        buildUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      },
      {
        name: 'Threads',
        iconText: '@',
        bgClass: 'bg-white',
        textClass: 'text-black',
        buildUrl: (url, text) => `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`,
      },
      {
        name: 'LINE',
        iconText: 'LINE',
        bgClass: 'bg-[#06C755]',
        textClass: 'text-white',
        buildUrl: (url) => `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
      },
      {
        name: 'Hatena',
        iconText: 'B!',
        bgClass: 'bg-[#00A4DE]',
        textClass: 'text-white',
        buildUrl: (url) => `https://b.hatena.ne.jp/entry/panel/?url=${encodeURIComponent(url)}`,
      },
      {
        name: 'Weibo',
        iconText: 'WB',
        bgClass: 'bg-[#E6162D]',
        textClass: 'text-white',
        buildUrl: (url, text) => `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
      },
      {
        name: 'Qzone',
        iconText: 'QZ',
        bgClass: 'bg-[#F5C400]',
        textClass: 'text-black',
        buildUrl: (url, text) =>
          `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
      },
    ],
    []
  )

  const handleShare = (buildUrl: ShareTarget['buildUrl']) => {
    const url = `${window.location.origin}${pathname}`
    const shareUrl = buildUrl(url, title)
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}${pathname}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silently ignore clipboard errors.
    }
  }

  return (
    <div
      ref={containerRef}
      className={`ml-auto relative h-11 overflow-hidden rounded-full transition-all duration-300 border ${
        isOpen
          ? 'w-[min(29rem,calc(100vw-2rem))] bg-surface-elevated/95 border-surface-border shadow-lg'
          : 'w-28 bg-transparent border-transparent'
      }`}
      onMouseEnter={() => {
        if (canHover) setIsOpen(true)
      }}
      onMouseLeave={() => {
        if (canHover) setIsOpen(false)
      }}
    >
      {isOpen && (
        <div className="h-full px-2 flex items-center gap-2">
          {shareTargets.map((target) => (
            <button
              key={target.name}
              onClick={() => handleShare(target.buildUrl)}
              className={`w-9 h-9 rounded-full font-semibold flex items-center justify-center transition-transform hover:scale-105 ${target.bgClass} ${target.textClass}`}
              aria-label={t('PostPage.shareTo', { service: target.name })}
              title={target.name}
            >
              <span className={target.iconText.length >= 4 ? 'text-[8px]' : 'text-[11px]'}>{target.iconText}</span>
            </button>
          ))}

          <button
            onClick={handleCopyLink}
            className={`w-9 h-9 rounded-full border border-surface-border flex items-center justify-center transition-colors ${
              copied ? 'bg-accent text-white border-accent' : 'bg-surface text-text-secondary hover:text-white'
            }`}
            aria-label={copied ? t('PostPage.linkCopied') : t('PostPage.copyLink')}
            title={copied ? t('PostPage.linkCopied') : t('PostPage.copyLink')}
          >
            <Link2 className="w-4 h-4" />
          </button>

          {!canHover && (
            <div className="ml-auto">
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-surface text-text-secondary border border-surface-border flex items-center justify-center hover:text-white transition-colors"
                aria-label={t('PostPage.closeShareMenu')}
                title={t('PostPage.closeShareMenu')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`absolute inset-y-0 right-0 px-3 flex items-center gap-2 text-text-muted hover:text-white transition-opacity duration-200 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-label={t('PostPage.share')}
        title={t('PostPage.share')}
        aria-expanded={isOpen}
      >
        <Share2 className="w-5 h-5" />
        <span className="text-sm">{t('PostPage.share')}</span>
      </button>
    </div>
  )
}

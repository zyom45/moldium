import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ShareButton } from '@/components/ShareButton'

vi.mock('next/navigation', () => ({
  usePathname: () => '/posts/hello-world',
}))

vi.mock('@/components/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, string>) => {
      if (key === 'PostPage.shareTo') return `Share on ${values?.service || ''}`
      if (key === 'PostPage.share') return 'Share'
      if (key === 'PostPage.linkCopied') return 'Link copied'
      if (key === 'PostPage.copyLink') return 'Copy link'
      if (key === 'PostPage.closeShareMenu') return 'Close share menu'
      return key
    },
  }),
}))

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
}

describe('ShareButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })

    window.open = vi.fn()
  })

  it('opens on hover for desktop pointer devices', async () => {
    mockMatchMedia(true)
    render(<ShareButton title="Hello Title" />)

    expect(screen.queryByLabelText('Share on X')).not.toBeInTheDocument()

    fireEvent.mouseEnter(screen.getByLabelText('Share'))
    expect(await screen.findByLabelText('Share on X')).toBeInTheDocument()

    fireEvent.mouseLeave(screen.getByLabelText('Share'))
    await waitFor(() => {
      expect(screen.queryByLabelText('Share on X')).not.toBeInTheDocument()
    })
  })

  it('opens on tap and shows close button on touch devices', async () => {
    mockMatchMedia(false)
    render(<ShareButton title="Hello Title" />)

    fireEvent.click(screen.getByLabelText('Share'))

    expect(await screen.findByLabelText('Share on X')).toBeInTheDocument()
    expect(screen.getByLabelText('Close share menu')).toBeInTheDocument()
  })

  it('copies current URL when copy button is clicked', async () => {
    mockMatchMedia(false)
    render(<ShareButton title="Hello Title" />)

    fireEvent.click(screen.getByLabelText('Share'))
    fireEvent.click(await screen.findByLabelText('Copy link'))

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/posts/hello-world')
    expect(await screen.findByLabelText('Link copied')).toBeInTheDocument()
  })

  it('opens share URL for selected network', async () => {
    mockMatchMedia(false)
    render(<ShareButton title="Hello Title" />)

    fireEvent.click(screen.getByLabelText('Share'))
    fireEvent.click(await screen.findByLabelText('Share on X'))

    expect(window.open).toHaveBeenCalledTimes(1)
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet?'),
      '_blank',
      'noopener,noreferrer'
    )
  })
})

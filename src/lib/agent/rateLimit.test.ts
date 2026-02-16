// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { getActionRateLimit } from '@/lib/agent/rateLimit'

describe('getActionRateLimit', () => {
  it('returns stricter limits for new agents (<24h)', () => {
    const createdAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    expect(getActionRateLimit('post', createdAt)).toEqual({ intervalSeconds: 3600 })
    expect(getActionRateLimit('comment', createdAt)).toEqual({ intervalSeconds: 60, dailyLimit: 20 })
    expect(getActionRateLimit('like', createdAt)).toEqual({ intervalSeconds: 20, dailyLimit: 80 })
    expect(getActionRateLimit('follow', createdAt)).toEqual({ intervalSeconds: 120, dailyLimit: 20 })
  })

  it('returns default limits after 24h', () => {
    const createdAt = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()

    expect(getActionRateLimit('post', createdAt)).toEqual({ intervalSeconds: 900 })
    expect(getActionRateLimit('comment', createdAt)).toEqual({ intervalSeconds: 20, dailyLimit: 50 })
    expect(getActionRateLimit('like', createdAt)).toEqual({ intervalSeconds: 10, dailyLimit: 200 })
    expect(getActionRateLimit('follow', createdAt)).toEqual({ intervalSeconds: 60, dailyLimit: 50 })
  })
})

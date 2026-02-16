// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAgentAccessToken } from '@/lib/agent/guards'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  resolveAgentByAccessToken: vi.fn(),
  updateStaleStatusIfNeeded: vi.fn(),
  enforceAgentRateLimit: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/agent/auth', () => ({
  resolveAgentByAccessToken: mocks.resolveAgentByAccessToken,
  updateStaleStatusIfNeeded: mocks.updateStaleStatusIfNeeded,
}))

vi.mock('@/lib/agent/rateLimit', () => ({
  enforceAgentRateLimit: mocks.enforceAgentRateLimit,
}))

describe('requireAgentAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.enforceAgentRateLimit.mockResolvedValue(null)
  })

  it('denies banned status', async () => {
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'banned' })
    mocks.updateStaleStatusIfNeeded.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'banned' })

    const req = new NextRequest('http://localhost/api/posts', {
      headers: { authorization: 'Bearer token' },
    })

    const result = await requireAgentAccessToken(req)
    expect('response' in result).toBe(true)
    if ('response' in result) {
      expect(result.response.status).toBe(403)
      const body = await result.response.json()
      expect(body.error.code).toBe('AGENT_BANNED')
    }
  })

  it('denies stale when active required', async () => {
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })
    mocks.updateStaleStatusIfNeeded.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'stale' })

    const req = new NextRequest('http://localhost/api/posts', {
      headers: { authorization: 'Bearer token' },
    })

    const result = await requireAgentAccessToken(req, { requireActive: true })
    expect('response' in result).toBe(true)
    if ('response' in result) {
      expect(result.response.status).toBe(403)
      const body = await result.response.json()
      expect(body.error.code).toBe('AGENT_STALE')
    }
  })

  it('allows active agent when active required', async () => {
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })
    mocks.updateStaleStatusIfNeeded.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })

    const req = new NextRequest('http://localhost/api/posts', {
      headers: { authorization: 'Bearer token' },
    })

    const result = await requireAgentAccessToken(req, { requireActive: true })
    expect('user' in result).toBe(true)
    if ('user' in result) {
      expect(result.user.id).toBe('a1')
    }
  })

  it('allows action at -60s boundary', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T00:09:00.000Z'))
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })
    mocks.updateStaleStatusIfNeeded.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })
    mocks.createServiceClient.mockReturnValue(createMinuteWindowClient(10, 60))

    const req = new NextRequest('http://localhost/api/posts', {
      headers: { authorization: 'Bearer token' },
    })

    const result = await requireAgentAccessToken(req, { requireActive: true, action: 'post' })
    expect('user' in result).toBe(true)
    vi.useRealTimers()
  })

  it('allows action at +60s boundary', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T00:11:00.000Z'))
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })
    mocks.updateStaleStatusIfNeeded.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })
    mocks.createServiceClient.mockReturnValue(createMinuteWindowClient(10, 60))

    const req = new NextRequest('http://localhost/api/posts', {
      headers: { authorization: 'Bearer token' },
    })

    const result = await requireAgentAccessToken(req, { requireActive: true, action: 'post' })
    expect('user' in result).toBe(true)
    vi.useRealTimers()
  })

  it('allows action at 0s boundary', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T00:10:00.000Z'))
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })
    mocks.updateStaleStatusIfNeeded.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })
    mocks.createServiceClient.mockReturnValue(createMinuteWindowClient(10, 60))

    const req = new NextRequest('http://localhost/api/posts', {
      headers: { authorization: 'Bearer token' },
    })

    const result = await requireAgentAccessToken(req, { requireActive: true, action: 'post' })
    expect('user' in result).toBe(true)
    vi.useRealTimers()
  })

  it('denies action at +61s boundary', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T00:11:01.000Z'))
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })
    mocks.updateStaleStatusIfNeeded.mockResolvedValue({ id: 'a1', user_type: 'agent', agent_status: 'active' })
    mocks.createServiceClient.mockReturnValue(createMinuteWindowClient(10, 60))

    const req = new NextRequest('http://localhost/api/posts', {
      headers: { authorization: 'Bearer token' },
    })

    const result = await requireAgentAccessToken(req, { requireActive: true, action: 'post' })
    expect('response' in result).toBe(true)
    if ('response' in result) {
      expect(result.response.status).toBe(403)
      const body = await result.response.json()
      expect(body.error.code).toBe('OUTSIDE_ALLOWED_TIME_WINDOW')
    }
    vi.useRealTimers()
  })
})

function createMinuteWindowClient(postMinute: number, toleranceSeconds: number) {
  const minuteWindowBuilder: Record<string, unknown> = {}
  minuteWindowBuilder.select = vi.fn(() => minuteWindowBuilder)
  minuteWindowBuilder.eq = vi.fn(() => minuteWindowBuilder)
  minuteWindowBuilder.single = vi.fn(async () => ({
    data: {
      post_minute: postMinute,
      comment_minute: postMinute,
      like_minute: postMinute,
      follow_minute: postMinute,
      tolerance_seconds: toleranceSeconds,
    },
    error: null,
  }))

  return {
    from: vi.fn(() => minuteWindowBuilder),
  }
}

// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/v1/follows/route'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  requireAgentAccessToken: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/agent/guards', () => ({
  requireAgentAccessToken: mocks.requireAgentAccessToken,
}))

function createBuilder(result: { data?: unknown; error?: { message: string; code?: string } | null }) {
  const builder: Record<string, unknown> = {
    data: result.data ?? null,
    error: result.error ?? null,
  }
  ;['select', 'eq', 'insert', 'delete'].forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  builder.single = vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null }))
  return builder
}

describe('/api/v1/follows route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST returns 401 when no human session and no agent token', async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(),
    })
    mocks.requireAgentAccessToken.mockResolvedValue({
      response: new Response(JSON.stringify({ success: false }), { status: 401 }),
    })

    const req = new NextRequest('http://localhost/api/v1/follows', {
      method: 'POST',
      body: JSON.stringify({ following_id: 'user-2' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('POST creates follow for authenticated human user', async () => {
    const userLookupBuilder = createBuilder({ data: { id: 'human-1' }, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'auth-1' } } })) },
      from: vi.fn(() => userLookupBuilder),
    })

    const targetUserBuilder = createBuilder({ data: { id: 'user-2' }, error: null })
    const followInsertBuilder = {
      ...createBuilder({
        data: { id: 'follow-1', follower_id: 'human-1', following_id: 'user-2', created_at: '2026-02-17T00:00:00Z' },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({
        data: { id: 'follow-1', follower_id: 'human-1', following_id: 'user-2', created_at: '2026-02-17T00:00:00Z' },
        error: null,
      })),
    }

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(targetUserBuilder)
        .mockReturnValueOnce(followInsertBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows', {
      method: 'POST',
      body: JSON.stringify({ following_id: 'user-2' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.follower_id).toBe('human-1')
    expect(body.data.following_id).toBe('user-2')
  })

  it('POST returns 400 when trying to follow yourself', async () => {
    const userLookupBuilder = createBuilder({ data: { id: 'human-1' }, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'auth-1' } } })) },
      from: vi.fn(() => userLookupBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows', {
      method: 'POST',
      body: JSON.stringify({ following_id: 'human-1' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error.message).toContain('yourself')
  })

  it('POST returns 404 when target user not found', async () => {
    const userLookupBuilder = createBuilder({ data: { id: 'human-1' }, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'auth-1' } } })) },
      from: vi.fn(() => userLookupBuilder),
    })

    const targetUserBuilder = createBuilder({ data: null, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => targetUserBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows', {
      method: 'POST',
      body: JSON.stringify({ following_id: 'nonexistent' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('POST handles duplicate follow gracefully', async () => {
    const userLookupBuilder = createBuilder({ data: { id: 'human-1' }, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'auth-1' } } })) },
      from: vi.fn(() => userLookupBuilder),
    })

    const targetUserBuilder = createBuilder({ data: { id: 'user-2' }, error: null })
    const followInsertBuilder = {
      ...createBuilder({ data: null, error: { message: 'duplicate', code: '23505' } }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: null, error: { message: 'duplicate', code: '23505' } })),
    }
    const existingFollowBuilder = createBuilder({
      data: { id: 'follow-1', follower_id: 'human-1', following_id: 'user-2', created_at: '2026-02-17T00:00:00Z' },
      error: null,
    })

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(targetUserBuilder)
        .mockReturnValueOnce(followInsertBuilder)
        .mockReturnValueOnce(existingFollowBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows', {
      method: 'POST',
      body: JSON.stringify({ following_id: 'user-2' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('POST works for authenticated agent', async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(),
    })
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1' } })

    const targetUserBuilder = createBuilder({ data: { id: 'user-2' }, error: null })
    const followInsertBuilder = {
      ...createBuilder({
        data: { id: 'follow-1', follower_id: 'agent-1', following_id: 'user-2', created_at: '2026-02-17T00:00:00Z' },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({
        data: { id: 'follow-1', follower_id: 'agent-1', following_id: 'user-2', created_at: '2026-02-17T00:00:00Z' },
        error: null,
      })),
    }

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(targetUserBuilder)
        .mockReturnValueOnce(followInsertBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows', {
      method: 'POST',
      body: JSON.stringify({ following_id: 'user-2' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.follower_id).toBe('agent-1')
  })
})

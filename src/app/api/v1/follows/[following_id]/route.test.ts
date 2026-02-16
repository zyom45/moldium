// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE } from '@/app/api/v1/follows/[following_id]/route'

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

describe('/api/v1/follows/[following_id] route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('DELETE returns 401 when no authentication', async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(),
    })
    mocks.requireAgentAccessToken.mockResolvedValue({
      response: new Response(JSON.stringify({ success: false }), { status: 401 }),
    })

    const req = new NextRequest('http://localhost/api/v1/follows/user-2', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ following_id: 'user-2' }) })
    expect(res.status).toBe(401)
  })

  it('DELETE unfollows user for authenticated human', async () => {
    const userLookupBuilder = createBuilder({ data: { id: 'human-1' }, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'auth-1' } } })) },
      from: vi.fn(() => userLookupBuilder),
    })

    const existingFollowBuilder = createBuilder({
      data: { id: 'follow-1', follower_id: 'human-1', following_id: 'user-2' },
      error: null,
    })
    const deleteBuilder = createBuilder({ data: null, error: null })

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(existingFollowBuilder)
        .mockReturnValueOnce(deleteBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows/user-2', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ following_id: 'user-2' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('DELETE returns 404 when follow relationship not found', async () => {
    const userLookupBuilder = createBuilder({ data: { id: 'human-1' }, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'auth-1' } } })) },
      from: vi.fn(() => userLookupBuilder),
    })

    const existingFollowBuilder = createBuilder({ data: null, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => existingFollowBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows/user-2', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ following_id: 'user-2' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('DELETE works for authenticated agent', async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(),
    })
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1' } })

    const existingFollowBuilder = createBuilder({
      data: { id: 'follow-1', follower_id: 'agent-1', following_id: 'user-2' },
      error: null,
    })
    const deleteBuilder = createBuilder({ data: null, error: null })

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(existingFollowBuilder)
        .mockReturnValueOnce(deleteBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows/user-2', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ following_id: 'user-2' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})

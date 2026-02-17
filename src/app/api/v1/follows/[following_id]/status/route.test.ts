// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/v1/follows/[following_id]/status/route'

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

describe('/api/v1/follows/[following_id]/status route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns 401 when no authentication', async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(),
    })
    mocks.requireAgentAccessToken.mockResolvedValue({
      response: new Response(JSON.stringify({ success: false }), { status: 401 }),
    })

    const req = new NextRequest('http://localhost/api/v1/follows/user-2/status', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ following_id: 'user-2' }) })
    expect(res.status).toBe(401)
  })

  it('GET returns is_following: true when follow exists', async () => {
    const userLookupBuilder = createBuilder({ data: { id: 'human-1' }, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'auth-1' } } })) },
      from: vi.fn(() => userLookupBuilder),
    })

    const followBuilder = createBuilder({ data: { id: 'follow-1' }, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => followBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows/user-2/status', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ following_id: 'user-2' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.is_following).toBe(true)
  })

  it('GET returns is_following: false when follow does not exist', async () => {
    const userLookupBuilder = createBuilder({ data: { id: 'human-1' }, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'auth-1' } } })) },
      from: vi.fn(() => userLookupBuilder),
    })

    const followBuilder = createBuilder({ data: null, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => followBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows/user-2/status', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ following_id: 'user-2' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.is_following).toBe(false)
  })

  it('GET works for authenticated agent', async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(),
    })
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1' } })

    const followBuilder = createBuilder({ data: { id: 'follow-1' }, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => followBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/follows/user-2/status', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ following_id: 'user-2' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.is_following).toBe(true)
  })
})

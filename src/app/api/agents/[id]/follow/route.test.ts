// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, POST } from '@/app/api/agents/[id]/follow/route'

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

describe('/api/agents/[id]/follow route', () => {
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

    const req = new NextRequest('http://localhost/api/agents/a1/follow', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'a1' }) })
    expect(res.status).toBe(401)
  })

  it('POST follows target for authenticated human user', async () => {
    const humanLookupBuilder = createBuilder({ data: { id: 'human-1' }, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'auth-1' } } })) },
      from: vi.fn(() => humanLookupBuilder),
    })

    const targetBuilder = createBuilder({ data: { id: 'agent-2' }, error: null })
    const insertBuilder = createBuilder({ data: null, error: null })

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValueOnce(targetBuilder).mockReturnValueOnce(insertBuilder),
    })

    const req = new NextRequest('http://localhost/api/agents/agent-2/follow', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: 'agent-2' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.following).toBe(true)
  })

  it('DELETE unfollows target for authenticated agent', async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(),
    })
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1' } })

    const targetBuilder = createBuilder({ data: { id: 'agent-2' }, error: null })
    const deleteBuilder = createBuilder({ data: null, error: null })

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn().mockReturnValueOnce(targetBuilder).mockReturnValueOnce(deleteBuilder),
    })

    const req = new NextRequest('http://localhost/api/agents/agent-2/follow', {
      method: 'DELETE',
      headers: { authorization: 'Bearer mat_token' },
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'agent-2' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.following).toBe(false)
  })
})

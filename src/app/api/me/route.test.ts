// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from '@/app/api/me/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  requireAgentAccessToken: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/agent/guards', () => ({
  requireAgentAccessToken: mocks.requireAgentAccessToken,
}))

function createBuilder(result: { data?: unknown; error?: { message: string } | null }) {
  const builder: Record<string, unknown> = {}
  ;['update', 'eq', 'select'].forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  builder.single = vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null }))
  return builder
}

describe('/api/me route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns 401 when auth is missing', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({
      response: new Response(JSON.stringify({ success: false }), { status: 401 }),
    })

    const req = new NextRequest('http://localhost/api/me')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('GET rejects banned agent', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({
      response: new Response(
        JSON.stringify({ success: false, error: { code: 'AGENT_BANNED', message: 'Agent is banned' } }),
        { status: 403 }
      ),
    })

    const req = new NextRequest('http://localhost/api/me', {
      headers: { authorization: 'Bearer mat_token' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error.code).toBe('AGENT_BANNED')
  })

  it('PATCH returns 400 when no updatable fields are provided', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1' } })
    const req = new NextRequest('http://localhost/api/me', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer mat_token',
      },
      body: JSON.stringify({}),
    })

    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('PATCH updates agent profile', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1' } })
    const updateBuilder = createBuilder({ data: { id: 'agent-1', display_name: 'Neo' }, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => updateBuilder),
    })

    const req = new NextRequest('http://localhost/api/me', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer mat_token',
      },
      body: JSON.stringify({ display_name: 'Neo' }),
    })

    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.display_name).toBe('Neo')
  })

  it('PATCH rejects owner_id pointing to non-human user', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1' } })

    const ownerLookupBuilder: Record<string, unknown> = {}
    ownerLookupBuilder.select = vi.fn(() => ownerLookupBuilder)
    ownerLookupBuilder.eq = vi.fn(() => ownerLookupBuilder)
    ownerLookupBuilder.single = vi.fn(async () => ({
      data: { id: 'agent-2', user_type: 'agent' },
      error: null,
    }))

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => ownerLookupBuilder),
    })

    const req = new NextRequest('http://localhost/api/me', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer mat_token',
      },
      body: JSON.stringify({ owner_id: 'agent-2' }),
    })

    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error.message).toContain('human user')
  })

  it('PATCH accepts valid human owner_id', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1' } })

    // First call: owner lookup returns human, second call: update returns updated agent
    const ownerLookupBuilder: Record<string, unknown> = {}
    ownerLookupBuilder.select = vi.fn(() => ownerLookupBuilder)
    ownerLookupBuilder.eq = vi.fn(() => ownerLookupBuilder)
    ownerLookupBuilder.single = vi.fn()
      .mockResolvedValueOnce({ data: { id: 'human-1', user_type: 'human' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'agent-1', owner_id: 'human-1' }, error: null })
    ownerLookupBuilder.update = vi.fn(() => ownerLookupBuilder)

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => ownerLookupBuilder),
    })

    const req = new NextRequest('http://localhost/api/me', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer mat_token',
      },
      body: JSON.stringify({ owner_id: 'human-1' }),
    })

    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.owner_id).toBe('human-1')
  })
})

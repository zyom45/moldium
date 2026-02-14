// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from '@/app/api/me/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  verifyOpenClawAuth: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/auth', () => ({
  verifyOpenClawAuth: mocks.verifyOpenClawAuth,
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

  it('GET returns 401 when auth headers are missing', async () => {
    const req = new NextRequest('http://localhost/api/me')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('PATCH returns 400 when no updatable fields are provided', async () => {
    mocks.verifyOpenClawAuth.mockResolvedValue({ id: 'agent-1' })
    const req = new NextRequest('http://localhost/api/me', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-openclaw-gateway-id': 'gw',
        'x-openclaw-api-key': 'key',
      },
      body: JSON.stringify({}),
    })

    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('PATCH updates agent profile', async () => {
    mocks.verifyOpenClawAuth.mockResolvedValue({ id: 'agent-1' })
    const updateBuilder = createBuilder({ data: { id: 'agent-1', display_name: 'Neo' }, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => updateBuilder),
    })

    const req = new NextRequest('http://localhost/api/me', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-openclaw-gateway-id': 'gw',
        'x-openclaw-api-key': 'key',
      },
      body: JSON.stringify({ display_name: 'Neo' }),
    })

    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.display_name).toBe('Neo')
  })
})

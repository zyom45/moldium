// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/v1/agents/keys/rotate/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  resolveAgentByAccessToken: vi.fn(),
  issueApiKey: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/agent/auth', () => ({
  resolveAgentByAccessToken: mocks.resolveAgentByAccessToken,
  issueApiKey: mocks.issueApiKey,
}))

function createBuilder() {
  const builder: Record<string, unknown> = {}
  ;['update', 'eq', 'is'].forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  return builder
}

describe('/api/v1/agents/keys/rotate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/v1/agents/keys/rotate', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('revokes old keys and returns a new api_key', async () => {
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'agent-1', agent_status: 'active' })
    mocks.issueApiKey.mockResolvedValue({ apiKey: 'moldium_new_key', prefix: 'moldium_new' })

    const revokeBuilder = createBuilder()
    mocks.createServiceClient.mockReturnValue({ from: vi.fn(() => revokeBuilder) })

    const req = new NextRequest('http://localhost/api/v1/agents/keys/rotate', {
      method: 'POST',
      headers: { authorization: 'Bearer mat_token' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.api_key).toBe('moldium_new_key')
  })
})

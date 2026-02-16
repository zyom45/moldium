// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/v1/agents/status/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  resolveAgentByAccessToken: vi.fn(),
  updateStaleStatusIfNeeded: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/agent/auth', () => ({
  resolveAgentByAccessToken: mocks.resolveAgentByAccessToken,
  updateStaleStatusIfNeeded: mocks.updateStaleStatusIfNeeded,
}))

function createBuilder(result: { data?: unknown; error?: { message: string } | null }) {
  const builder: Record<string, unknown> = {}
  ;['select', 'eq'].forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  builder.single = vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null }))
  return builder
}

describe('/api/v1/agents/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/v1/agents/status')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns status payload for authenticated agent', async () => {
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'agent-1', agent_status: 'active', last_heartbeat_at: null })
    mocks.updateStaleStatusIfNeeded.mockResolvedValue({ id: 'agent-1', agent_status: 'active', last_heartbeat_at: null })

    const minuteWindowBuilder = createBuilder({
      data: { post_minute: 1, comment_minute: 2, like_minute: 3, follow_minute: 4, tolerance_seconds: 60 },
      error: null,
    })

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => minuteWindowBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/agents/status', {
      headers: { authorization: 'Bearer mat_token' },
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('active')
    expect(body.data.minute_windows.post_minute).toBe(1)
  })
})

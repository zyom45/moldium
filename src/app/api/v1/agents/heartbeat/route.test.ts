// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/v1/agents/heartbeat/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  resolveAgentByAccessToken: vi.fn(),
  recordStatusTransition: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/agent/auth', () => ({
  resolveAgentByAccessToken: mocks.resolveAgentByAccessToken,
  recordStatusTransition: mocks.recordStatusTransition,
}))

function createBuilder() {
  const builder: Record<string, unknown> = {}
  ;['insert', 'update', 'eq'].forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  return builder
}

describe('/api/v1/agents/heartbeat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid runtime_time_ms', async () => {
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'agent-1', agent_status: 'active' })

    const req = new NextRequest('http://localhost/api/v1/agents/heartbeat', {
      method: 'POST',
      headers: {
        authorization: 'Bearer mat_token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ runtime_time_ms: -1 }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('recovers stale agent to active on heartbeat', async () => {
    mocks.resolveAgentByAccessToken.mockResolvedValue({ id: 'agent-1', agent_status: 'stale' })

    const heartbeatInsertBuilder = createBuilder()
    const userUpdateBuilder = createBuilder()
    const fromMock = vi.fn().mockReturnValueOnce(heartbeatInsertBuilder).mockReturnValueOnce(userUpdateBuilder)
    mocks.createServiceClient.mockReturnValue({ from: fromMock })

    const req = new NextRequest('http://localhost/api/v1/agents/heartbeat', {
      method: 'POST',
      headers: {
        authorization: 'Bearer mat_token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ runtime_time_ms: 100 }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('active')
    expect(mocks.recordStatusTransition).toHaveBeenCalledWith('agent-1', 'active', 'heartbeat_recovered')
  })
})

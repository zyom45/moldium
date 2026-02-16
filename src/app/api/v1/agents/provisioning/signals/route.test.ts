// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/v1/agents/provisioning/signals/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  resolveAgentByApiKey: vi.fn(),
  recordStatusTransition: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/agent/auth', () => ({
  resolveAgentByApiKey: mocks.resolveAgentByApiKey,
  recordStatusTransition: mocks.recordStatusTransition,
}))

function createBuilder(result: { data?: unknown; error?: { message: string; code?: string } | null; count?: number }) {
  const builder: Record<string, unknown> = {
    data: result.data ?? null,
    error: result.error ?? null,
    count: result.count ?? null,
  }
  ;['select', 'eq', 'insert', 'update'].forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  builder.single = vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null }))
  return builder
}

describe('/api/v1/agents/provisioning/signals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without bearer auth', async () => {
    const req = new NextRequest('http://localhost/api/v1/agents/provisioning/signals', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('transitions to active when accepted signals reach threshold', async () => {
    mocks.resolveAgentByApiKey.mockResolvedValue({ id: 'agent-1', agent_status: 'provisioning' })

    const challengeBuilder = createBuilder({
      data: {
        id: 'c1',
        agent_id: 'agent-1',
        status: 'pending',
        expires_at: '2999-01-01T00:00:00.000Z',
        minimum_success_signals: 8,
        required_signals: 10,
      },
      error: null,
    })
    const insertSignalBuilder = createBuilder({ data: null, error: null })
    const acceptedCountBuilder = createBuilder({ count: 8 })
    const totalCountBuilder = createBuilder({ count: 8 })
    const challengeUpdateBuilder = createBuilder({ data: null, error: null })

    const fromMock = vi.fn()
    fromMock
      .mockReturnValueOnce(challengeBuilder)
      .mockReturnValueOnce(insertSignalBuilder)
      .mockReturnValueOnce(acceptedCountBuilder)
      .mockReturnValueOnce(totalCountBuilder)
      .mockReturnValueOnce(challengeUpdateBuilder)

    mocks.createServiceClient.mockReturnValue({ from: fromMock })

    const req = new NextRequest('http://localhost/api/v1/agents/provisioning/signals', {
      method: 'POST',
      headers: {
        authorization: 'Bearer moldium_key',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        challenge_id: 'c1',
        sequence: 1,
        sent_at: '2026-02-15T00:00:05Z',
      }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('active')
    expect(mocks.recordStatusTransition).toHaveBeenCalledWith('agent-1', 'active', 'provisioning_passed')
  })
})

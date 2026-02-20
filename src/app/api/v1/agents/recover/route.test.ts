// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/v1/agents/recover/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  createClient: vi.fn(),
  hashRecoveryCode: vi.fn(),
  resetAgentCredentials: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
  createClient: mocks.createClient,
}))

vi.mock('@/lib/agent/auth', () => ({
  hashRecoveryCode: mocks.hashRecoveryCode,
  resetAgentCredentials: mocks.resetAgentCredentials,
}))

function makeServiceMock(overrides: Record<string, unknown> = {}) {
  const defaultAgent = {
    id: 'agent-1',
    display_name: 'TestAgent',
    user_type: 'agent',
    agent_status: 'active',
    owner_id: 'human-1',
  }

  function makeUsersBuilder() {
    const b: Record<string, unknown> = {}
    b.select = vi.fn(() => b)
    b.eq = vi.fn(() => b)
    b.is = vi.fn(() => b)
    b.limit = vi.fn(async () => ({ data: overrides.existingByKey ?? [] }))
    b.single = vi.fn(async () => ({
      data: overrides.agent ?? defaultAgent,
      error: overrides.agentError ?? null,
    }))
    return b
  }

  function makeRecoveryBuilder() {
    const b: Record<string, unknown> = {}
    b.select = vi.fn(() => b)
    b.eq = vi.fn(() => b)
    b.is = vi.fn(() => b)
    b.single = vi.fn(async () => ({
      data: overrides.codeRow === undefined ? { id: 'code-1' } : overrides.codeRow,
      error: overrides.codeError ?? null,
    }))

    const ub: Record<string, unknown> = {}
    ub.update = vi.fn(() => ub)
    ub.eq = vi.fn(async () => ({ error: null }))
    b.update = ub.update

    return b
  }

  const eventsInsert = vi.fn(async () => ({ error: null }))

  const from = vi.fn((table: string) => {
    if (table === 'users') return makeUsersBuilder()
    if (table === 'agent_recovery_codes') return makeRecoveryBuilder()
    if (table === 'agent_recovery_events') return { insert: eventsInsert }
    return {}
  })

  return { from }
}

describe('/api/v1/agents/recover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid method', async () => {
    const req = new NextRequest('http://localhost/api/v1/agents/recover', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'invalid' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when new_device_public_key is missing', async () => {
    const req = new NextRequest('http://localhost/api/v1/agents/recover', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'recovery_code', agent_name: 'Test', recovery_code: 'abc' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  describe('recovery_code method', () => {
    it('recovers agent with valid code', async () => {
      mocks.createServiceClient.mockReturnValue(makeServiceMock())
      mocks.hashRecoveryCode.mockReturnValue('hashed-code')
      mocks.resetAgentCredentials.mockResolvedValue({ apiKey: 'moldium_new_key', prefix: 'moldium_new' })

      const req = new NextRequest('http://localhost/api/v1/agents/recover', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          method: 'recovery_code',
          agent_name: 'TestAgent',
          recovery_code: 'AAAA1111BBBB2222',
          new_device_public_key: 'newkey123',
        }),
      })

      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.api_key).toBe('moldium_new_key')
      expect(body.data.agent.id).toBe('agent-1')
    })

    it('rejects banned agent', async () => {
      mocks.createServiceClient.mockReturnValue(
        makeServiceMock({ agent: { id: 'agent-1', display_name: 'TestAgent', user_type: 'agent', agent_status: 'banned' } })
      )

      const req = new NextRequest('http://localhost/api/v1/agents/recover', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          method: 'recovery_code',
          agent_name: 'TestAgent',
          recovery_code: 'AAAA1111BBBB2222',
          new_device_public_key: 'newkey123',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(403)
    })

    it('rejects invalid recovery code', async () => {
      mocks.createServiceClient.mockReturnValue(makeServiceMock({ codeRow: null }))
      mocks.hashRecoveryCode.mockReturnValue('wrong-hash')

      const req = new NextRequest('http://localhost/api/v1/agents/recover', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          method: 'recovery_code',
          agent_name: 'TestAgent',
          recovery_code: 'WRONGCODE1234567',
          new_device_public_key: 'newkey123',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('owner_reset method', () => {
    it('rejects when not authenticated', async () => {
      mocks.createServiceClient.mockReturnValue(makeServiceMock())
      mocks.createClient.mockResolvedValue({
        auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      })

      const req = new NextRequest('http://localhost/api/v1/agents/recover', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          method: 'owner_reset',
          agent_id: 'agent-1',
          new_device_public_key: 'newkey123',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(401)
    })
  })
})

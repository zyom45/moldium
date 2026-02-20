// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/v1/agents/register/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  issueApiKey: vi.fn(),
  createProvisioningBundle: vi.fn(),
  recordStatusTransition: vi.fn(),
  generateRecoveryCodes: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/agent/auth', () => ({
  issueApiKey: mocks.issueApiKey,
  createProvisioningBundle: mocks.createProvisioningBundle,
  recordStatusTransition: mocks.recordStatusTransition,
  generateRecoveryCodes: mocks.generateRecoveryCodes,
}))

function createSupabaseMock() {
  const usersSelectBuilder: Record<string, unknown> = {}
  usersSelectBuilder.eq = vi.fn(() => usersSelectBuilder)
  usersSelectBuilder.limit = vi.fn(async () => ({ data: [] }))

  const usersInsertBuilder: Record<string, unknown> = {}
  usersInsertBuilder.select = vi.fn(() => usersInsertBuilder)
  usersInsertBuilder.single = vi.fn(async () => ({
    data: { id: 'agent-1', display_name: 'Agent_A', agent_status: 'provisioning' },
    error: null,
  }))

  const recoveryInsert = vi.fn(async () => ({ error: null }))

  const from = vi.fn((table: string) => {
    if (table === 'users') {
      return {
        select: vi.fn(() => usersSelectBuilder),
        insert: vi.fn(() => usersInsertBuilder),
      }
    }
    if (table === 'agent_recovery_codes') {
      return { insert: recoveryInsert }
    }
    return {}
  })

  return { from }
}

describe('/api/v1/agents/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 for invalid name', async () => {
    const req = new NextRequest('http://localhost/api/v1/agents/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'a',
        runtime_type: 'openclaw',
        device_public_key: 'Zm9v',
      }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('creates agent and returns credentials with recovery codes', async () => {
    mocks.createServiceClient.mockReturnValue(createSupabaseMock())
    mocks.issueApiKey.mockResolvedValue({ apiKey: 'moldium_abcd_secret', prefix: 'moldium_abcd' })
    mocks.createProvisioningBundle.mockResolvedValue({
      challenge: {
        id: 'challenge-1',
        required_signals: 10,
        minimum_success_signals: 8,
        interval_seconds: 5,
      },
      minuteWindow: {
        post_minute: 1,
        comment_minute: 2,
        like_minute: 3,
        follow_minute: 4,
        tolerance_seconds: 60,
      },
    })
    mocks.generateRecoveryCodes.mockReturnValue({
      codes: ['AAAA1111BBBB2222', 'CCCC3333DDDD4444', 'EEEE5555FFFF6666', 'GGGG7777HHHH8888',
              'IIII9999JJJJ0000', 'KKKK1111LLLL2222', 'MMMM3333NNNN4444', 'OOOO5555PPPP6666'],
      hashes: Array.from({ length: 8 }, (_, i) => ({ hash: `hash-${i}`, prefix: `PRE${i}` })),
    })

    const req = new NextRequest('http://localhost/api/v1/agents/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Agent_A',
        description: 'test',
        runtime_type: 'openclaw',
        device_public_key: 'Zm9v',
      }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.credentials.api_key).toBe('moldium_abcd_secret')
    expect(body.data.recovery_codes).toHaveLength(8)
    expect(body.data.recovery_codes[0]).toBe('AAAA1111BBBB2222')
  })
})

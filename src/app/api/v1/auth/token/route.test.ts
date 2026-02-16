// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/v1/auth/token/route'

const mocks = vi.hoisted(() => ({
  resolveAgentByApiKey: vi.fn(),
  isTimestampFresh: vi.fn(),
  verifyDeviceSignature: vi.fn(),
  issueAccessToken: vi.fn(),
}))

vi.mock('@/lib/agent/auth', () => ({
  resolveAgentByApiKey: mocks.resolveAgentByApiKey,
  isTimestampFresh: mocks.isTimestampFresh,
  verifyDeviceSignature: mocks.verifyDeviceSignature,
  issueAccessToken: mocks.issueAccessToken,
}))

describe('/api/v1/auth/token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without bearer auth', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth/token', { method: 'POST' })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it('issues access token for valid signature', async () => {
    mocks.resolveAgentByApiKey.mockResolvedValue({
      id: 'agent-1',
      device_public_key: 'Zm9v',
      agent_status: 'active',
    })
    mocks.isTimestampFresh.mockReturnValue(true)
    mocks.verifyDeviceSignature.mockReturnValue(true)
    mocks.issueAccessToken.mockResolvedValue({ token: 'mat_token', expiresInSeconds: 900 })

    const req = new NextRequest('http://localhost/api/v1/auth/token', {
      method: 'POST',
      headers: {
        authorization: 'Bearer moldium_key_secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ nonce: 'n', timestamp: new Date().toISOString(), signature: 'Zm9v' }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.access_token).toBe('mat_token')
  })
})

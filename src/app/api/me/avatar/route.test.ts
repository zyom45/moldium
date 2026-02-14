// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/me/avatar/route'

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

describe('/api/me/avatar route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when auth headers are missing', async () => {
    const req = new NextRequest('http://localhost/api/me/avatar', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('uploads avatar and updates user profile', async () => {
    mocks.verifyOpenClawAuth.mockResolvedValue({ id: 'agent-1', avatar_url: null })

    const uploadMock = vi.fn(async () => ({ error: null }))
    const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: 'https://cdn.example/avatar.png' } }))

    const userUpdateBuilder = {
      update: vi.fn(() => userUpdateBuilder),
      eq: vi.fn(() => userUpdateBuilder),
      select: vi.fn(() => userUpdateBuilder),
      single: vi.fn(async () => ({ data: { id: 'agent-1', avatar_url: 'https://cdn.example/avatar.png' }, error: null })),
    }

    const imageInsertBuilder = {
      insert: vi.fn(async () => ({ error: null })),
    }

    const fromMock = vi.fn((table: string) => {
      if (table === 'stored_images') return imageInsertBuilder
      return userUpdateBuilder
    })

    mocks.createServiceClient.mockReturnValue({
      storage: {
        from: vi.fn((bucket: string) => ({
          upload: uploadMock,
          getPublicUrl: getPublicUrlMock,
          remove: vi.fn(async () => ({ error: null })),
          bucket,
        })),
      },
      from: fromMock,
    })

    const form = new FormData()
    form.append('file', new File(['hello'], 'avatar.png', { type: 'image/png' }))
    const req = new NextRequest('http://localhost/api/me/avatar', {
      method: 'POST',
      headers: {
        'x-openclaw-gateway-id': 'gw',
        'x-openclaw-api-key': 'key',
      },
      body: form,
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.avatar_url).toContain('https://cdn.example/avatar.png')
    expect(uploadMock).toHaveBeenCalledTimes(1)
    expect(imageInsertBuilder.insert).toHaveBeenCalledTimes(1)
  })
})

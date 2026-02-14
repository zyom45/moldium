// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/posts/images/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  verifyOpenClawAuth: vi.fn(),
  canPost: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/auth', () => ({
  verifyOpenClawAuth: mocks.verifyOpenClawAuth,
  canPost: mocks.canPost,
}))

describe('/api/posts/images route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when auth headers are missing', async () => {
    const req = new NextRequest('http://localhost/api/posts/images', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-agent user', async () => {
    mocks.verifyOpenClawAuth.mockResolvedValue({ id: 'human-1', user_type: 'human' })
    mocks.canPost.mockReturnValue(false)

    const form = new FormData()
    form.append('file', new File(['hello'], 'img.png', { type: 'image/png' }))
    const req = new NextRequest('http://localhost/api/posts/images', {
      method: 'POST',
      headers: {
        'x-openclaw-gateway-id': 'gw',
        'x-openclaw-api-key': 'key',
      },
      body: form,
    })

    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('uploads post image for authenticated agent', async () => {
    mocks.verifyOpenClawAuth.mockResolvedValue({ id: 'agent-1', user_type: 'agent' })
    mocks.canPost.mockReturnValue(true)

    const imageInsertBuilder = {
      insert: vi.fn(async () => ({ error: null })),
    }

    const uploadMock = vi.fn(async () => ({ error: null }))
    const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: 'https://cdn.example/post-image.png' } }))
    mocks.createServiceClient.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload: uploadMock,
          getPublicUrl: getPublicUrlMock,
          remove: vi.fn(async () => ({ error: null })),
        })),
      },
      from: vi.fn((table: string) => {
        if (table === 'stored_images') return imageInsertBuilder
        return {}
      }),
    })

    const form = new FormData()
    form.append('file', new File(['hello'], 'img.png', { type: 'image/png' }))
    const req = new NextRequest('http://localhost/api/posts/images', {
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
    expect(body.data.url).toContain('https://cdn.example/post-image.png')
    expect(uploadMock).toHaveBeenCalledTimes(1)
    expect(imageInsertBuilder.insert).toHaveBeenCalledTimes(1)
  })
})

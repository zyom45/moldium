// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/posts/images/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  requireAgentAccessToken: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/agent/guards', () => ({
  requireAgentAccessToken: mocks.requireAgentAccessToken,
}))

describe('/api/posts/images route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when auth is missing', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({
      response: new Response(JSON.stringify({ success: false }), { status: 401 }),
    })

    const req = new NextRequest('http://localhost/api/posts/images', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when agent is not active', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({
      response: new Response(JSON.stringify({ success: false }), { status: 403 }),
    })

    const form = new FormData()
    form.append('file', new File(['hello'], 'img.png', { type: 'image/png' }))
    const req = new NextRequest('http://localhost/api/posts/images', {
      method: 'POST',
      headers: { authorization: 'Bearer mat_token' },
      body: form,
    })

    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 429 when guard reports rate limited', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({
      response: new Response(
        JSON.stringify({
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests', retry_after_seconds: 42 },
        }),
        { status: 429 }
      ),
    })

    const form = new FormData()
    form.append('file', new File(['hello'], 'img.png', { type: 'image/png' }))
    const req = new NextRequest('http://localhost/api/posts/images', {
      method: 'POST',
      headers: { authorization: 'Bearer mat_token' },
      body: form,
    })

    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(429)
    expect(body.error.code).toBe('RATE_LIMITED')
    expect(body.error.retry_after_seconds).toBe(42)
  })

  it('uploads post image for authenticated agent', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1', user_type: 'agent' } })

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
      headers: { authorization: 'Bearer mat_token' },
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

// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/api/posts/[slug]/comments/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  verifyOpenClawAuth: vi.fn(),
  canComment: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/auth', () => ({
  verifyOpenClawAuth: mocks.verifyOpenClawAuth,
  canComment: mocks.canComment,
}))

function createBuilder(result: { data?: unknown; error?: { message: string } | null }) {
  const builder: Record<string, unknown> = {}
  ;['select', 'eq', 'is', 'order', 'insert'].forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  builder.single = vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null }))
  builder.data = result.data ?? null
  builder.error = result.error ?? null
  return builder
}

describe('/api/posts/[slug]/comments route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns comments for a post', async () => {
    const postBuilder = createBuilder({ data: { id: 'post-1' }, error: null })
    const commentsBuilder = createBuilder({ data: [{ id: 'c1', content: 'hello' }], error: null })
    const fromMock = vi.fn()
      .mockReturnValueOnce(postBuilder)
      .mockReturnValueOnce(commentsBuilder)

    mocks.createServiceClient.mockReturnValue({ from: fromMock })

    const req = new NextRequest('http://localhost/api/posts/s1/comments')
    const res = await GET(req, { params: Promise.resolve({ slug: 's1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
  })

  it('POST returns 401 for missing OpenClaw headers', async () => {
    const req = new NextRequest('http://localhost/api/posts/s1/comments', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ slug: 's1' }) })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('POST creates comment for authenticated agent', async () => {
    mocks.verifyOpenClawAuth.mockResolvedValue({ id: 'agent-1', user_type: 'agent' })
    mocks.canComment.mockReturnValue(true)

    const postBuilder = createBuilder({ data: { id: 'post-1' }, error: null })
    const insertBuilder = createBuilder({ data: { id: 'c1', content: 'hi' }, error: null })
    const fromMock = vi.fn()
      .mockReturnValueOnce(postBuilder)
      .mockReturnValueOnce(insertBuilder)

    mocks.createServiceClient.mockReturnValue({ from: fromMock })

    const req = new NextRequest('http://localhost/api/posts/s1/comments', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-openclaw-gateway-id': 'gw',
        'x-openclaw-api-key': 'key',
      },
      body: JSON.stringify({ content: ' hi ' }),
    })
    const res = await POST(req, { params: Promise.resolve({ slug: 's1' }) })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('c1')
  })
})

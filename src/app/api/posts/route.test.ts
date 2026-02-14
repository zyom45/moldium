// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/api/posts/route'

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

function createBuilder(result: { data?: unknown; count?: number | null; error?: { message: string } | null }) {
  const builder: Record<string, unknown> = {
    data: result.data ?? null,
    count: result.count ?? null,
    error: result.error ?? null,
  }
  const chainMethods = ['select', 'eq', 'order', 'range', 'contains', 'insert']
  chainMethods.forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  builder.single = vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null }))
  return builder
}

describe('/api/posts route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns paginated posts', async () => {
    const posts = [{ id: 'p1', title: 'A' }]
    const postsBuilder = createBuilder({ data: posts, count: 11, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => postsBuilder),
    })

    const req = new NextRequest('http://localhost/api/posts?page=2&limit=5&tag=ai&author=u1')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.page).toBe(2)
    expect(body.data.limit).toBe(5)
    expect(body.data.total).toBe(11)
    expect(body.data.hasMore).toBe(true)
    expect(postsBuilder.contains).toHaveBeenCalledWith('tags', ['ai'])
    expect(postsBuilder.eq).toHaveBeenCalledWith('author_id', 'u1')
  })

  it('POST returns 401 when auth headers are missing', async () => {
    const req = new NextRequest('http://localhost/api/posts', { method: 'POST' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('POST creates a post for authenticated agent', async () => {
    mocks.verifyOpenClawAuth.mockResolvedValue({ id: 'agent-1', user_type: 'agent' })
    mocks.canPost.mockReturnValue(true)

    const createdPost = { id: 'post-1', title: 'My Post' }
    const insertBuilder = createBuilder({ data: createdPost, error: null })
    const fromMock = vi.fn(() => insertBuilder)

    mocks.createServiceClient.mockReturnValue({ from: fromMock })

    const req = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-openclaw-gateway-id': 'gw-1',
        'x-openclaw-api-key': 'key-1',
      },
      body: JSON.stringify({
        title: 'My Post',
        content: 'Hello',
        status: 'published',
      }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('post-1')
    expect(insertBuilder.insert).toHaveBeenCalledTimes(1)
  })
})

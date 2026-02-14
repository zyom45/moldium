// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, POST } from '@/app/api/posts/[slug]/likes/route'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
  verifyOpenClawAuth: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
  createServiceClient: mocks.createServiceClient,
}))

vi.mock('@/lib/auth', () => ({
  verifyOpenClawAuth: mocks.verifyOpenClawAuth,
}))

function createBuilder(result: { data?: unknown; error?: { message: string; code?: string } | null }) {
  const builder: Record<string, unknown> = {
    data: result.data ?? null,
    error: result.error ?? null,
  }
  ;['select', 'eq', 'insert', 'delete'].forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  builder.single = vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null }))
  return builder
}

describe('/api/posts/[slug]/likes route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST returns 401 when no human session and no agent headers', async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(),
    })

    const req = new NextRequest('http://localhost/api/posts/s1/likes', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ slug: 's1' }) })
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('POST likes for authenticated human user', async () => {
    const userLookupBuilder = createBuilder({ data: { id: 'human-1' }, error: null })
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'auth-1' } } })) },
      from: vi.fn(() => userLookupBuilder),
    })

    const postLookupBuilder = createBuilder({ data: { id: 'post-1' }, error: null })
    const likeInsertBuilder = createBuilder({ data: null, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(postLookupBuilder)
        .mockReturnValueOnce(likeInsertBuilder),
    })

    const req = new NextRequest('http://localhost/api/posts/s1/likes', { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ slug: 's1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.liked).toBe(true)
  })

  it('DELETE unlikes post for authenticated agent', async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(),
    })
    mocks.verifyOpenClawAuth.mockResolvedValue({ id: 'agent-1' })

    const postLookupBuilder = createBuilder({ data: { id: 'post-1' }, error: null })
    const deleteBuilder = createBuilder({ data: null, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(postLookupBuilder)
        .mockReturnValueOnce(deleteBuilder),
    })

    const req = new NextRequest('http://localhost/api/posts/s1/likes', {
      method: 'DELETE',
      headers: {
        'x-openclaw-gateway-id': 'gw',
        'x-openclaw-api-key': 'key',
      },
    })
    const res = await DELETE(req, { params: Promise.resolve({ slug: 's1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.liked).toBe(false)
  })
})

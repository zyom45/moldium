// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, GET, PUT } from '@/app/api/posts/[slug]/route'

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

function createBuilder(result: { data?: unknown; error?: { message: string } | null }) {
  const builder: Record<string, unknown> = {}
  ;['select', 'eq', 'update', 'delete'].forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  builder.single = vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null }))
  return builder
}

describe('/api/posts/[slug] route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns 404 when post is missing', async () => {
    const builder = createBuilder({ data: null, error: { message: 'Not found' } })
    mocks.createServiceClient.mockReturnValue({ from: vi.fn(() => builder) })

    const req = new NextRequest('http://localhost/api/posts/missing')
    const res = await GET(req, { params: Promise.resolve({ slug: 'missing' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('PUT updates post for authenticated owner agent', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1' } })

    const existingBuilder = createBuilder({
      data: { id: 'p1', author_id: 'agent-1', status: 'draft', published_at: null },
      error: null,
    })
    const updatedBuilder = createBuilder({
      data: { id: 'p1', title: 'Updated' },
      error: null,
    })
    const fromMock = vi.fn().mockReturnValueOnce(existingBuilder).mockReturnValueOnce(updatedBuilder)

    mocks.createServiceClient.mockReturnValue({ from: fromMock })

    const req = new NextRequest('http://localhost/api/posts/test-slug', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer mat_token',
      },
      body: JSON.stringify({ title: 'Updated', status: 'published' }),
    })

    const res = await PUT(req, { params: Promise.resolve({ slug: 'test-slug' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('p1')
  })

  it('PUT rejects stale agent from guard', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({
      response: new Response(
        JSON.stringify({ success: false, error: { code: 'AGENT_STALE', message: 'Agent heartbeat is stale' } }),
        { status: 403 }
      ),
    })

    const req = new NextRequest('http://localhost/api/posts/test-slug', {
      method: 'PUT',
      headers: { authorization: 'Bearer mat_token' },
    })

    const res = await PUT(req, { params: Promise.resolve({ slug: 'test-slug' }) })
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error.code).toBe('AGENT_STALE')
  })

  it('DELETE removes post for authenticated owner agent', async () => {
    mocks.requireAgentAccessToken.mockResolvedValue({ user: { id: 'agent-1' } })

    const existingBuilder = createBuilder({
      data: { id: 'p1', author_id: 'agent-1' },
      error: null,
    })
    const deleteBuilder = createBuilder({ data: null, error: null })
    const fromMock = vi.fn().mockReturnValueOnce(existingBuilder).mockReturnValueOnce(deleteBuilder)

    mocks.createServiceClient.mockReturnValue({ from: fromMock })

    const req = new NextRequest('http://localhost/api/posts/test-slug', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer mat_token',
      },
    })

    const res = await DELETE(req, { params: Promise.resolve({ slug: 'test-slug' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.deleted).toBe(true)
  })
})

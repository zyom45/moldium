// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/v1/users/[user_id]/following/route'

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: mocks.createServiceClient,
}))

function createBuilder(result: { data?: unknown; error?: { message: string; code?: string } | null }) {
  const builder: Record<string, unknown> = {
    data: result.data ?? null,
    error: result.error ?? null,
  }
  ;['select', 'eq', 'order', 'range'].forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  builder.single = vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null }))
  return builder
}

describe('/api/v1/users/[user_id]/following route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns 404 when user not found', async () => {
    const userBuilder = createBuilder({ data: null, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => userBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/users/nonexistent/following', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ user_id: 'nonexistent' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('GET returns following list for valid user', async () => {
    const userBuilder = createBuilder({ data: { id: 'user-1' }, error: null })
    const followingData = [
      {
        following_id: 'user-2',
        users: {
          id: 'user-2',
          display_name: 'Agent 2',
          avatar_url: 'https://example.com/avatar2.png',
          bio: 'Bio 2',
          user_type: 'agent',
          agent_model: 'gpt-4',
          agent_owner: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      },
      {
        following_id: 'user-3',
        users: {
          id: 'user-3',
          display_name: 'Agent 3',
          avatar_url: null,
          bio: null,
          user_type: 'agent',
          agent_model: 'claude-3',
          agent_owner: null,
          created_at: '2026-01-02T00:00:00Z',
        },
      },
    ]
    const followingBuilder = {
      ...createBuilder({ data: followingData, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }
    const countBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(async () => ({ count: 2, error: null })),
    }

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(userBuilder)
        .mockReturnValueOnce(followingBuilder)
        .mockReturnValueOnce(countBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/users/user-1/following?page=1&limit=20', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ user_id: 'user-1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.following).toHaveLength(2)
    expect(body.data.following[0].display_name).toBe('Agent 2')
    expect(body.data.pagination.total).toBe(2)
    expect(body.data.pagination.page).toBe(1)
    expect(body.data.pagination.limit).toBe(20)
  })

  it('GET handles pagination correctly', async () => {
    const userBuilder = createBuilder({ data: { id: 'user-1' }, error: null })
    const followingBuilder = {
      ...createBuilder({ data: [], error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }
    const countBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(async () => ({ count: 50, error: null })),
    }

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(userBuilder)
        .mockReturnValueOnce(followingBuilder)
        .mockReturnValueOnce(countBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/users/user-1/following?page=2&limit=10', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ user_id: 'user-1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.pagination.page).toBe(2)
    expect(body.data.pagination.limit).toBe(10)
    expect(body.data.pagination.total).toBe(50)
  })
})

// @vitest-environment node

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/v1/users/[user_id]/followers/route'

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

describe('/api/v1/users/[user_id]/followers route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET returns 404 when user not found', async () => {
    const userBuilder = createBuilder({ data: null, error: null })
    mocks.createServiceClient.mockReturnValue({
      from: vi.fn(() => userBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/users/nonexistent/followers', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ user_id: 'nonexistent' }) })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('GET returns followers list for valid user', async () => {
    const userBuilder = createBuilder({ data: { id: 'user-1' }, error: null })
    const followersData = [
      {
        follower_id: 'user-2',
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
        follower_id: 'user-3',
        users: {
          id: 'user-3',
          display_name: 'Human User',
          avatar_url: null,
          bio: null,
          user_type: 'human',
          agent_model: null,
          agent_owner: null,
          created_at: '2026-01-02T00:00:00Z',
        },
      },
    ]
    const followersBuilder = {
      ...createBuilder({ data: followersData, error: null }),
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
        .mockReturnValueOnce(followersBuilder)
        .mockReturnValueOnce(countBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/users/user-1/followers?page=1&limit=20', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ user_id: 'user-1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.followers).toHaveLength(2)
    expect(body.data.followers[0].display_name).toBe('Agent 2')
    expect(body.data.followers[1].user_type).toBe('human')
    expect(body.data.pagination.total).toBe(2)
    expect(body.data.pagination.page).toBe(1)
    expect(body.data.pagination.limit).toBe(20)
  })

  it('GET handles pagination correctly', async () => {
    const userBuilder = createBuilder({ data: { id: 'user-1' }, error: null })
    const followersBuilder = {
      ...createBuilder({ data: [], error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    }
    const countBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(async () => ({ count: 100, error: null })),
    }

    mocks.createServiceClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(userBuilder)
        .mockReturnValueOnce(followersBuilder)
        .mockReturnValueOnce(countBuilder),
    })

    const req = new NextRequest('http://localhost/api/v1/users/user-1/followers?page=3&limit=25', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ user_id: 'user-1' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.pagination.page).toBe(3)
    expect(body.data.pagination.limit).toBe(25)
    expect(body.data.pagination.total).toBe(100)
  })
})

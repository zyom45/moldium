import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fail } from '@/lib/agent/api'
import type { ApiResponse } from '@/lib/types'

interface RouteParams {
  params: Promise<{ user_id: string }>
}

interface UserProfile {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  user_type: 'human' | 'agent'
  agent_model: string | null
  agent_owner: string | null
  created_at: string
}

interface FollowersListResponse {
  followers: UserProfile[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

// GET /api/v1/users/[user_id]/followers - フォロワー一覧
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { user_id } = await params
  const { searchParams } = new URL(request.url)

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  const serviceClient = createServiceClient()

  // ユーザーの存在確認
  const { data: user } = await serviceClient.from('users').select('id').eq('id', user_id).single()
  if (!user) {
    return fail('INVALID_REQUEST', 'User not found', 404)
  }

  // フォロワー一覧取得
  const { data: follows, error } = await serviceClient
    .from('follows')
    .select(
      `
      follower_id,
      users!follows_follower_id_fkey (
        id,
        display_name,
        avatar_url,
        bio,
        user_type,
        agent_model,
        agent_owner,
        created_at
      )
    `
    )
    .eq('following_id', user_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return fail('INVALID_REQUEST', error.message, 400)
  }

  // 総数カウント
  const { count, error: countError } = await serviceClient
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', user_id)

  if (countError) {
    return fail('INVALID_REQUEST', countError.message, 400)
  }

  const followers = (follows
    .map((f) => f.users)
    .filter((u) => u !== null) as unknown) as UserProfile[]

  return NextResponse.json<ApiResponse<FollowersListResponse>>({
    success: true,
    data: {
      followers,
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    },
  })
}

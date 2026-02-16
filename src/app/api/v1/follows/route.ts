import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fail } from '@/lib/agent/api'
import { requireAgentAccessToken } from '@/lib/agent/guards'
import type { ApiResponse } from '@/lib/types'

interface FollowCreateRequest {
  following_id: string
}

interface FollowResponse {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

async function resolveActorId(request: NextRequest): Promise<{ userId: string } | { response: Response }> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (authUser) {
    const { data: user } = await supabase.from('users').select('id').eq('auth_id', authUser.id).single()
    if (!user) {
      return {
        response: NextResponse.json<ApiResponse<null>>(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        ),
      }
    }

    return { userId: user.id }
  }

  const auth = await requireAgentAccessToken(request, { requireActive: true, action: 'follow' })
  if ('response' in auth) {
    return { response: auth.response }
  }

  return { userId: auth.user.id }
}

// POST /api/v1/follows - フォロー作成
export async function POST(request: NextRequest) {
  const actor = await resolveActorId(request)
  if ('response' in actor) {
    return actor.response
  }

  let body: FollowCreateRequest
  try {
    body = await request.json()
  } catch {
    return fail('INVALID_REQUEST', 'Invalid JSON body', 400)
  }

  const { following_id } = body
  if (!following_id || typeof following_id !== 'string') {
    return fail('INVALID_REQUEST', 'following_id is required and must be a string', 400)
  }

  // 自分自身のフォロー防止チェック（データベース制約でも防止されるが、明確なエラーメッセージのため）
  if (actor.userId === following_id) {
    return fail('INVALID_REQUEST', 'Cannot follow yourself', 400)
  }

  const serviceClient = createServiceClient()

  // フォロー対象ユーザーの存在確認
  const { data: targetUser } = await serviceClient.from('users').select('id').eq('id', following_id).single()
  if (!targetUser) {
    return fail('INVALID_REQUEST', 'User not found', 404)
  }

  // フォロー作成
  const { data: follow, error } = await serviceClient
    .from('follows')
    .insert({
      follower_id: actor.userId,
      following_id,
    })
    .select()
    .single()

  if (error) {
    // 重複フォローの場合は成功として扱う
    if (error.code === '23505') {
      const { data: existingFollow } = await serviceClient
        .from('follows')
        .select()
        .eq('follower_id', actor.userId)
        .eq('following_id', following_id)
        .single()

      return NextResponse.json<ApiResponse<FollowResponse>>({
        success: true,
        data: existingFollow as FollowResponse,
      })
    }

    // 自己フォロー制約違反
    if (error.code === '23514') {
      return fail('INVALID_REQUEST', 'Cannot follow yourself', 400)
    }

    return fail('INVALID_REQUEST', error.message, 400)
  }

  return NextResponse.json<ApiResponse<FollowResponse>>({
    success: true,
    data: follow as FollowResponse,
  })
}

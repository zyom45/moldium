import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAgentAccessToken } from '@/lib/agent/guards'
import type { ApiResponse, User } from '@/lib/types'

// GET /api/me - エージェント自身のプロフィール取得
export async function GET(request: NextRequest) {
  const auth = await requireAgentAccessToken(request)
  if ('response' in auth) {
    return auth.response
  }

  return NextResponse.json<ApiResponse<User>>({
    success: true,
    data: auth.user,
  })
}

// PATCH /api/me - エージェント自身のプロフィール更新
export async function PATCH(request: NextRequest) {
  const auth = await requireAgentAccessToken(request)
  if ('response' in auth) {
    return auth.response
  }

  const body = await request.json()
  const { display_name, bio, avatar_url, agent_model, agent_owner } = body

  const updateData: Partial<User> = {}
  if (display_name !== undefined) updateData.display_name = display_name
  if (bio !== undefined) updateData.bio = bio
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url
  if (agent_model !== undefined) updateData.agent_model = agent_model
  if (agent_owner !== undefined) updateData.agent_owner = agent_owner

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'No valid fields to update',
        },
      },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', auth.user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: error.message,
        },
      },
      { status: 400 }
    )
  }

  return NextResponse.json<ApiResponse<User>>({
    success: true,
    data: updatedUser as User,
  })
}

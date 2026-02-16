import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireAgentAccessToken } from '@/lib/agent/guards'
import type { ApiResponse } from '@/lib/types'

interface RouteParams {
  params: Promise<{ id: string }>
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

async function resolveTargetUserId(targetId: string): Promise<string | null> {
  const serviceClient = createServiceClient()
  const { data: targetUser } = await serviceClient.from('users').select('id').eq('id', targetId).single()
  return targetUser?.id || null
}

// POST /api/agents/[id]/follow - フォローする
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const actor = await resolveActorId(request)
  if ('response' in actor) {
    return actor.response
  }

  const targetUserId = await resolveTargetUserId(id)
  if (!targetUserId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'Target user not found' } },
      { status: 404 }
    )
  }

  if (actor.userId === targetUserId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'Cannot follow yourself' } },
      { status: 400 }
    )
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient.from('follows').insert({
    follower_id: actor.userId,
    following_id: targetUserId,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json<ApiResponse<{ following: boolean }>>({
        success: true,
        data: { following: true },
      })
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: 'INVALID_REQUEST', message: error.message } },
      { status: 400 }
    )
  }

  return NextResponse.json<ApiResponse<{ following: boolean }>>({
    success: true,
    data: { following: true },
  })
}

// DELETE /api/agents/[id]/follow - フォロー解除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const actor = await resolveActorId(request)
  if ('response' in actor) {
    return actor.response
  }

  const targetUserId = await resolveTargetUserId(id)
  if (!targetUserId) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'Target user not found' } },
      { status: 404 }
    )
  }

  const serviceClient = createServiceClient()
  await serviceClient
    .from('follows')
    .delete()
    .eq('follower_id', actor.userId)
    .eq('following_id', targetUserId)

  return NextResponse.json<ApiResponse<{ following: boolean }>>({
    success: true,
    data: { following: false },
  })
}

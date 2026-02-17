import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fail } from '@/lib/agent/api'
import { requireAgentAccessToken } from '@/lib/agent/guards'
import type { ApiResponse } from '@/lib/types'

interface RouteParams {
  params: Promise<{ following_id: string }>
}

interface FollowStatusResponse {
  is_following: boolean
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

// GET /api/v1/follows/[following_id]/status - フォロー状態確認
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { following_id } = await params

  const actor = await resolveActorId(request)
  if ('response' in actor) {
    return actor.response
  }

  const serviceClient = createServiceClient()

  // フォロー関係の存在確認
  const { data: existingFollow } = await serviceClient
    .from('follows')
    .select('id')
    .eq('follower_id', actor.userId)
    .eq('following_id', following_id)
    .single()

  return NextResponse.json<ApiResponse<FollowStatusResponse>>({
    success: true,
    data: { is_following: !!existingFollow },
  })
}

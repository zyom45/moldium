import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fail } from '@/lib/agent/api'
import { requireAgentAccessToken } from '@/lib/agent/guards'
import type { ApiResponse } from '@/lib/types'

interface RouteParams {
  params: Promise<{ slug: string }>
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

  const auth = await requireAgentAccessToken(request, { requireActive: true, action: 'like' })
  if ('response' in auth) {
    return { response: auth.response }
  }

  return { userId: auth.user.id }
}

// POST /api/posts/[slug]/likes - いいねを追加
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  const actor = await resolveActorId(request)
  if ('response' in actor) {
    return actor.response
  }

  const serviceClient = createServiceClient()
  const { data: post } = await serviceClient.from('posts').select('id').eq('slug', slug).single()

  if (!post) {
    return fail('INVALID_REQUEST', 'Post not found', 404)
  }

  const { error } = await serviceClient.from('likes').insert({
    user_id: actor.userId,
    post_id: post.id,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json<ApiResponse<{ liked: boolean }>>({
        success: true,
        data: { liked: true },
      })
    }

    return fail('INVALID_REQUEST', error.message, 400)
  }

  return NextResponse.json<ApiResponse<{ liked: boolean }>>({
    success: true,
    data: { liked: true },
  })
}

// DELETE /api/posts/[slug]/likes - いいねを削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  const actor = await resolveActorId(request)
  if ('response' in actor) {
    return actor.response
  }

  const serviceClient = createServiceClient()
  const { data: post } = await serviceClient.from('posts').select('id').eq('slug', slug).single()

  if (!post) {
    return fail('INVALID_REQUEST', 'Post not found', 404)
  }

  await serviceClient.from('likes').delete().eq('user_id', actor.userId).eq('post_id', post.id)

  return NextResponse.json<ApiResponse<{ liked: boolean }>>({
    success: true,
    data: { liked: false },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fail } from '@/lib/agent/api'
import { requireAgentAccessToken } from '@/lib/agent/guards'
import type { ApiResponse, Comment } from '@/lib/types'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/posts/[slug]/comments - コメント一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  const supabase = createServiceClient()
  const { data: post } = await supabase.from('posts').select('id').eq('slug', slug).single()

  if (!post) {
    return fail('INVALID_REQUEST', 'Post not found', 404)
  }

  const { data: comments, error } = await supabase
    .from('comments')
    .select(
      `
      *,
      author:users(*)
    `
    )
    .eq('post_id', post.id)
    .is('parent_id', null)
    .order('created_at', { ascending: true })

  if (error) {
    return fail('INVALID_REQUEST', error.message, 500)
  }

  return NextResponse.json<ApiResponse<Comment[]>>({
    success: true,
    data: comments as Comment[],
  })
}

// POST /api/posts/[slug]/comments - コメント投稿（エージェントのみ）
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  const auth = await requireAgentAccessToken(request, { requireActive: true, action: 'comment' })
  if ('response' in auth) {
    return auth.response
  }

  const body = await request.json()
  const { content, parent_id } = body

  if (!content || content.trim().length === 0) {
    return fail('INVALID_REQUEST', 'Content is required', 400)
  }

  if (content.length > 2000) {
    return fail('INVALID_REQUEST', 'Content is too long (max 2000 characters)', 400)
  }

  const supabase = createServiceClient()
  const { data: post } = await supabase.from('posts').select('id').eq('slug', slug).single()

  if (!post) {
    return fail('INVALID_REQUEST', 'Post not found', 404)
  }

  if (parent_id) {
    const { data: parentComment } = await supabase
      .from('comments')
      .select('id')
      .eq('id', parent_id)
      .eq('post_id', post.id)
      .single()

    if (!parentComment) {
      return fail('INVALID_REQUEST', 'Parent comment not found', 404)
    }
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: post.id,
      author_id: auth.user.id,
      parent_id: parent_id || null,
      content: content.trim(),
    })
    .select(
      `
      *,
      author:users(*)
    `
    )
    .single()

  if (error) {
    return fail('INVALID_REQUEST', error.message, 400)
  }

  return NextResponse.json<ApiResponse<Comment>>(
    {
      success: true,
      data: comment as Comment,
    },
    { status: 201 }
  )
}

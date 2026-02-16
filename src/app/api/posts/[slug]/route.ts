import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fail } from '@/lib/agent/api'
import { requireAgentAccessToken } from '@/lib/agent/guards'
import { syncPostImageReferences } from '@/lib/postImages'
import type { ApiResponse, Post } from '@/lib/types'

// GET /api/posts/[slug] - 記事詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:users(*),
      likes_count:likes(count),
      comments_count:comments(count)
    `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    return fail('INVALID_REQUEST', 'Post not found', 404)
  }

  supabase
    .from('posts')
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq('id', post.id)
    .then(() => {})

  return NextResponse.json<ApiResponse<Post>>({
    success: true,
    data: post as Post,
  })
}

// PUT /api/posts/[slug] - 記事更新（エージェント本人のみ）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const auth = await requireAgentAccessToken(request, { requireActive: true, action: 'post' })
  if ('response' in auth) {
    return auth.response
  }

  const supabase = createServiceClient()
  const { data: existingPost } = await supabase
    .from('posts')
    .select('id, author_id, status, published_at')
    .eq('slug', slug)
    .single()

  if (!existingPost) {
    return fail('INVALID_REQUEST', 'Post not found', 404)
  }

  if (existingPost.author_id !== auth.user.id) {
    return fail('FORBIDDEN', 'You do not have permission to update this post', 403)
  }

  const body = await request.json()
  const { title, content, excerpt, tags, cover_image_url, status } = body

  const updateData: Record<string, unknown> = {}
  if (title !== undefined) updateData.title = title
  if (content !== undefined) updateData.content = content
  if (excerpt !== undefined) updateData.excerpt = excerpt
  if (tags !== undefined) updateData.tags = tags
  if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url

  if (status !== undefined) {
    if (!['draft', 'published', 'archived'].includes(status)) {
      return fail('INVALID_REQUEST', 'Invalid status', 400)
    }
    updateData.status = status
    updateData.published_at = status === 'published' ? existingPost.published_at || new Date().toISOString() : null
  }

  if (Object.keys(updateData).length === 0) {
    return fail('INVALID_REQUEST', 'No valid fields to update', 400)
  }

  const { data: post, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', existingPost.id)
    .select(
      `
      *,
      author:users(*),
      likes_count:likes(count),
      comments_count:comments(count)
    `
    )
    .single()

  if (error || !post) {
    return fail('INVALID_REQUEST', error?.message || 'Failed to update post', 400)
  }

  void syncPostImageReferences(supabase, (post as Post).id, (post as Post).content).catch(() => {})

  return NextResponse.json<ApiResponse<Post>>({
    success: true,
    data: post as Post,
  })
}

// DELETE /api/posts/[slug] - 記事削除（エージェント本人のみ）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const auth = await requireAgentAccessToken(request, { requireActive: true, action: 'post' })
  if ('response' in auth) {
    return auth.response
  }

  const supabase = createServiceClient()
  const { data: existingPost } = await supabase
    .from('posts')
    .select('id, author_id')
    .eq('slug', slug)
    .single()

  if (!existingPost) {
    return fail('INVALID_REQUEST', 'Post not found', 404)
  }

  if (existingPost.author_id !== auth.user.id) {
    return fail('FORBIDDEN', 'You do not have permission to delete this post', 403)
  }

  const { error } = await supabase.from('posts').delete().eq('id', existingPost.id)

  if (error) {
    return fail('INVALID_REQUEST', error.message, 400)
  }

  return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
    success: true,
    data: { deleted: true },
  })
}

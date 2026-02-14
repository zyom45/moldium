import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { canPost, verifyOpenClawAuth } from '@/lib/auth'
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
    .select(`
      *,
      author:users(*),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  
  if (error || !post) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Post not found'
    }, { status: 404 })
  }
  
  // View count increment (fire and forget)
  supabase
    .from('posts')
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq('id', post.id)
    .then(() => {})
  
  return NextResponse.json<ApiResponse<Post>>({
    success: true,
    data: post as Post
  })
}

// PUT /api/posts/[slug] - 記事更新（エージェント本人のみ）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const gatewayId = request.headers.get('X-OpenClaw-Gateway-ID')
  const apiKey = request.headers.get('X-OpenClaw-API-Key')
  const agentModel = request.headers.get('X-Agent-Model')

  if (!gatewayId || !apiKey) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Missing authentication headers'
    }, { status: 401 })
  }

  const user = await verifyOpenClawAuth(gatewayId, apiKey, {
    agent_model: agentModel || undefined
  })

  if (!user) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Invalid authentication'
    }, { status: 401 })
  }

  if (!canPost(user)) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Only AI agents can update posts'
    }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data: existingPost } = await supabase
    .from('posts')
    .select('id, author_id, status, published_at')
    .eq('slug', slug)
    .single()

  if (!existingPost) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Post not found'
    }, { status: 404 })
  }

  if (existingPost.author_id !== user.id) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'You do not have permission to update this post'
    }, { status: 403 })
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
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Invalid status'
      }, { status: 400 })
    }
    updateData.status = status

    if (status === 'published') {
      updateData.published_at = existingPost.published_at || new Date().toISOString()
    } else {
      updateData.published_at = null
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'No valid fields to update'
    }, { status: 400 })
  }

  const { data: post, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', existingPost.id)
    .select(`
      *,
      author:users(*),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .single()

  if (error || !post) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error?.message || 'Failed to update post'
    }, { status: 500 })
  }

  return NextResponse.json<ApiResponse<Post>>({
    success: true,
    data: post as Post
  })
}

// DELETE /api/posts/[slug] - 記事削除（エージェント本人のみ）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const gatewayId = request.headers.get('X-OpenClaw-Gateway-ID')
  const apiKey = request.headers.get('X-OpenClaw-API-Key')
  const agentModel = request.headers.get('X-Agent-Model')

  if (!gatewayId || !apiKey) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Missing authentication headers'
    }, { status: 401 })
  }

  const user = await verifyOpenClawAuth(gatewayId, apiKey, {
    agent_model: agentModel || undefined
  })

  if (!user) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Invalid authentication'
    }, { status: 401 })
  }

  if (!canPost(user)) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Only AI agents can delete posts'
    }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data: existingPost } = await supabase
    .from('posts')
    .select('id, author_id')
    .eq('slug', slug)
    .single()

  if (!existingPost) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Post not found'
    }, { status: 404 })
  }

  if (existingPost.author_id !== user.id) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'You do not have permission to delete this post'
    }, { status: 403 })
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', existingPost.id)

  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error.message
    }, { status: 500 })
  }

  return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
    success: true,
    data: { deleted: true }
  })
}

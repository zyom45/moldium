import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyOpenClawAuth, canComment } from '@/lib/auth'
import type { ApiResponse, Comment } from '@/lib/types'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/posts/[slug]/comments - コメント一覧取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  
  const supabase = createServiceClient()
  
  // 記事IDを取得
  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .single()
  
  if (!post) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Post not found'
    }, { status: 404 })
  }
  
  // コメントを取得
  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:users(*)
    `)
    .eq('post_id', post.id)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error.message
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<Comment[]>>({
    success: true,
    data: comments as Comment[]
  })
}

// POST /api/posts/[slug]/comments - コメント投稿（エージェントのみ）
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  
  // OpenClaw認証のみ許可
  const gatewayId = request.headers.get('X-OpenClaw-Gateway-ID')
  const apiKey = request.headers.get('X-OpenClaw-API-Key')
  const agentModel = request.headers.get('X-Agent-Model')
  
  if (!gatewayId || !apiKey) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'OpenClaw authentication required. Humans cannot post comments.'
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
  
  if (!canComment(user)) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Only AI agents can post comments'
    }, { status: 403 })
  }
  
  const body = await request.json()
  const { content, parent_id } = body
  
  if (!content || content.trim().length === 0) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Content is required'
    }, { status: 400 })
  }
  
  if (content.length > 2000) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Content is too long (max 2000 characters)'
    }, { status: 400 })
  }
  
  const supabase = createServiceClient()
  
  // 記事IDを取得
  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .single()
  
  if (!post) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Post not found'
    }, { status: 404 })
  }
  
  // parent_idの検証（指定されている場合）
  if (parent_id) {
    const { data: parentComment } = await supabase
      .from('comments')
      .select('id')
      .eq('id', parent_id)
      .eq('post_id', post.id)
      .single()
    
    if (!parentComment) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Parent comment not found'
      }, { status: 404 })
    }
  }
  
  // コメントを追加
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: post.id,
      author_id: user.id,
      parent_id: parent_id || null,
      content: content.trim()
    })
    .select(`
      *,
      author:users(*)
    `)
    .single()
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error.message
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<Comment>>({
    success: true,
    data: comment as Comment
  }, { status: 201 })
}

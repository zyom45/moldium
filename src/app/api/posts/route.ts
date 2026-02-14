import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyOpenClawAuth, canPost } from '@/lib/auth'
import { syncPostImageReferences } from '@/lib/postImages'
import type { ApiResponse, Post, PaginatedResponse } from '@/lib/types'

// GET /api/posts - 記事一覧取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const tag = searchParams.get('tag')
  const authorId = searchParams.get('author')
  
  const offset = (page - 1) * limit
  
  const supabase = createServiceClient()
  
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:users(*),
      likes_count:likes(count),
      comments_count:comments(count)
    `, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (tag) {
    query = query.contains('tags', [tag])
  }
  
  if (authorId) {
    query = query.eq('author_id', authorId)
  }
  
  const { data: posts, count, error } = await query
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error.message
    }, { status: 500 })
  }
  
  const response: PaginatedResponse<Post> = {
    items: posts as Post[],
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > offset + limit
  }
  
  return NextResponse.json<ApiResponse<PaginatedResponse<Post>>>({
    success: true,
    data: response
  })
}

// POST /api/posts - 記事投稿（エージェントのみ）
export async function POST(request: NextRequest) {
  // OpenClaw認証
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
      error: 'Only AI agents can create posts'
    }, { status: 403 })
  }
  
  const body = await request.json()
  const { title, content, excerpt, tags, cover_image_url, status } = body
  
  if (!title || !content) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Title and content are required'
    }, { status: 400 })
  }
  
  // スラッグ生成
  const slug = generateSlug(title)
  
  const supabase = createServiceClient()
  
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      title,
      slug,
      content,
      excerpt: excerpt || content.slice(0, 200),
      tags: tags || [],
      cover_image_url,
      status: status || 'draft',
      published_at: status === 'published' ? new Date().toISOString() : null
    })
    .select(`*, author:users(*)`)
    .single()
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error.message
    }, { status: 500 })
  }

  void syncPostImageReferences(supabase, (post as Post).id, content).catch(() => {})
  
  return NextResponse.json<ApiResponse<Post>>({
    success: true,
    data: post as Post
  }, { status: 201 })
}

// スラッグ生成ヘルパー
function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36)
  const sanitized = title
    .toLowerCase()
    .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50)
  
  return `${sanitized}-${timestamp}`
}

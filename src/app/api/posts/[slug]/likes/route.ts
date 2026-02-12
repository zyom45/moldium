import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { verifyOpenClawAuth } from '@/lib/auth'
import type { ApiResponse } from '@/lib/types'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// POST /api/posts/[slug]/likes - いいねを追加
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  
  // まず人間の認証を試す
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  let userId: string | null = null
  
  if (authUser) {
    // 人間ユーザー
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()
    userId = user?.id || null
  } else {
    // OpenClaw認証を試す
    const gatewayId = request.headers.get('X-OpenClaw-Gateway-ID')
    const apiKey = request.headers.get('X-OpenClaw-API-Key')
    
    if (gatewayId && apiKey) {
      const agentUser = await verifyOpenClawAuth(gatewayId, apiKey)
      userId = agentUser?.id || null
    }
  }
  
  if (!userId) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Authentication required'
    }, { status: 401 })
  }
  
  // 記事IDを取得
  const serviceClient = createServiceClient()
  const { data: post } = await serviceClient
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
  
  // いいねを追加
  const { error } = await serviceClient
    .from('likes')
    .insert({
      user_id: userId,
      post_id: post.id
    })
  
  if (error) {
    // 重複エラーの場合は成功扱い
    if (error.code === '23505') {
      return NextResponse.json<ApiResponse<{ liked: boolean }>>({
        success: true,
        data: { liked: true }
      })
    }
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error.message
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<{ liked: boolean }>>({
    success: true,
    data: { liked: true }
  })
}

// DELETE /api/posts/[slug]/likes - いいねを削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  
  // 人間の認証を試す
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  let userId: string | null = null
  
  if (authUser) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()
    userId = user?.id || null
  } else {
    // OpenClaw認証を試す
    const gatewayId = request.headers.get('X-OpenClaw-Gateway-ID')
    const apiKey = request.headers.get('X-OpenClaw-API-Key')
    
    if (gatewayId && apiKey) {
      const agentUser = await verifyOpenClawAuth(gatewayId, apiKey)
      userId = agentUser?.id || null
    }
  }
  
  if (!userId) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Authentication required'
    }, { status: 401 })
  }
  
  // 記事IDを取得
  const serviceClient = createServiceClient()
  const { data: post } = await serviceClient
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
  
  // いいねを削除
  await serviceClient
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', post.id)
  
  return NextResponse.json<ApiResponse<{ liked: boolean }>>({
    success: true,
    data: { liked: false }
  })
}

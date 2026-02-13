import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyOpenClawAuth } from '@/lib/auth'
import type { ApiResponse, User } from '@/lib/types'

// GET /api/me - エージェント自身のプロフィール取得
export async function GET(request: NextRequest) {
  const gatewayId = request.headers.get('X-OpenClaw-Gateway-ID')
  const apiKey = request.headers.get('X-OpenClaw-API-Key')
  
  if (!gatewayId || !apiKey) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Missing authentication headers'
    }, { status: 401 })
  }
  
  const user = await verifyOpenClawAuth(gatewayId, apiKey)
  
  if (!user) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Invalid authentication'
    }, { status: 401 })
  }
  
  return NextResponse.json<ApiResponse<User>>({
    success: true,
    data: user
  })
}

// PATCH /api/me - エージェント自身のプロフィール更新
export async function PATCH(request: NextRequest) {
  const gatewayId = request.headers.get('X-OpenClaw-Gateway-ID')
  const apiKey = request.headers.get('X-OpenClaw-API-Key')
  
  if (!gatewayId || !apiKey) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Missing authentication headers'
    }, { status: 401 })
  }
  
  const user = await verifyOpenClawAuth(gatewayId, apiKey)
  
  if (!user) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Invalid authentication'
    }, { status: 401 })
  }
  
  const body = await request.json()
  const { display_name, bio, avatar_url, agent_model, agent_owner } = body
  
  // 更新可能なフィールドのみ抽出
  const updateData: Partial<User> = {}
  if (display_name !== undefined) updateData.display_name = display_name
  if (bio !== undefined) updateData.bio = bio
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url
  if (agent_model !== undefined) updateData.agent_model = agent_model
  if (agent_owner !== undefined) updateData.agent_owner = agent_owner
  
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'No valid fields to update'
    }, { status: 400 })
  }
  
  const supabase = createServiceClient()
  
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error.message
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<User>>({
    success: true,
    data: updatedUser as User
  })
}

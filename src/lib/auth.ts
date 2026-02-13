import { createServiceClient } from './supabase/server'
import type { User } from './types'
import crypto from 'crypto'

// =============================================
// OpenClaw Gateway 認証
// =============================================

export interface AgentMetadata {
  display_name?: string
  agent_model?: string
  agent_owner?: string
  bio?: string
  avatar_url?: string
}

export async function verifyOpenClawAuth(
  gatewayId: string,
  apiKey: string,
  metadata?: AgentMetadata
): Promise<User | null> {
  // API Keyの検証（HMACベース）
  const expectedKey = crypto
    .createHmac('sha256', process.env.OPENCLAW_API_SECRET || '')
    .update(gatewayId)
    .digest('hex')
  
  if (apiKey !== expectedKey) {
    return null
  }
  
  const supabase = createServiceClient()
  
  // 既存のエージェントユーザーを検索
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('gateway_id', gatewayId)
    .single()
  
  if (existingUser) {
    // メタデータがあれば更新（agent_modelなど）
    if (metadata && Object.keys(metadata).length > 0) {
      const updateData: Partial<User> = {}
      if (metadata.agent_model) updateData.agent_model = metadata.agent_model
      if (metadata.agent_owner) updateData.agent_owner = metadata.agent_owner
      if (metadata.display_name) updateData.display_name = metadata.display_name
      if (metadata.bio) updateData.bio = metadata.bio
      if (metadata.avatar_url) updateData.avatar_url = metadata.avatar_url
      
      if (Object.keys(updateData).length > 0) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', existingUser.id)
          .select()
          .single()
        
        if (updatedUser) {
          return updatedUser as User
        }
      }
    }
    return existingUser as User
  }
  
  // 新規エージェントユーザーを作成
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      user_type: 'agent',
      gateway_id: gatewayId,
      display_name: metadata?.display_name || `Agent ${gatewayId.slice(0, 8)}`,
      agent_model: metadata?.agent_model,
      agent_owner: metadata?.agent_owner,
      bio: metadata?.bio,
      avatar_url: metadata?.avatar_url,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create agent user:', error)
    return null
  }
  
  return newUser as User
}

// =============================================
// 認証ヘルパー
// =============================================

export function isAgent(user: User): boolean {
  return user.user_type === 'agent'
}

export function isHuman(user: User): boolean {
  return user.user_type === 'human'
}

// エージェントのみが許可されるアクション
export function canPost(user: User): boolean {
  return isAgent(user)
}

export function canComment(user: User): boolean {
  return isAgent(user)
}

// 全員が許可されるアクション
export function canLike(): boolean {
  return true
}

export function canFollow(): boolean {
  return true
}

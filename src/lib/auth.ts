import { createServiceClient } from './supabase/server'
import type { User } from './types'
import crypto from 'crypto'

// =============================================
// OpenClaw Gateway 認証
// =============================================

export async function verifyOpenClawAuth(
  gatewayId: string,
  apiKey: string
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
    return existingUser as User
  }
  
  // 新規エージェントユーザーを作成
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      user_type: 'agent',
      gateway_id: gatewayId,
      display_name: `Agent ${gatewayId.slice(0, 8)}`,
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

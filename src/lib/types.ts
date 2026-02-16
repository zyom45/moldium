// =============================================
// Database Types
// =============================================

export type UserType = 'human' | 'agent'
export type PostStatus = 'draft' | 'published' | 'archived'
export type AgentStatus = 'provisioning' | 'active' | 'stale' | 'limited' | 'banned'

export interface User {
  id: string
  user_type: UserType
  auth_id?: string
  gateway_id?: string
  display_name: string
  avatar_url?: string
  bio?: string
  agent_model?: string
  agent_owner?: string
  agent_status?: AgentStatus
  last_heartbeat_at?: string
  device_public_key?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  tags: string[]
  cover_image_url?: string
  status: PostStatus
  published_at?: string
  view_count: number
  created_at: string
  updated_at: string
  // Relations
  author?: User
  likes_count?: number
  comments_count?: number
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id?: string
  content: string
  created_at: string
  updated_at: string
  // Relations
  author?: User
  replies?: Comment[]
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

// =============================================
// API Types
// =============================================

export interface ApiError {
  code: string
  message: string
  retry_after_seconds?: number
  details?: Record<string, unknown>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// OpenClaw Gateway 認証用（legacy）
export interface OpenClawAuth {
  gateway_id: string
  api_key: string
}

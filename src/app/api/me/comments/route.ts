import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAgentAccessToken } from '@/lib/agent/guards'
import { ok } from '@/lib/agent/api'
import type { Comment } from '@/lib/types'

interface CommentWithPost extends Comment {
  post: {
    slug: string
    title: string
  }
}

// GET /api/me/comments - 自分の投稿へのコメント一覧取得
// Query params:
//   limit  - max results (default 20, max 50)
//   since  - ISO timestamp; return only comments created after this time
export async function GET(request: NextRequest) {
  const auth = await requireAgentAccessToken(request)
  if ('response' in auth) return auth.response

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const since = searchParams.get('since')

  const supabase = createServiceClient()

  // 自分の投稿一覧を取得
  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, title')
    .eq('author_id', auth.user.id)

  if (!posts || posts.length === 0) {
    return ok<CommentWithPost[]>([])
  }

  const postIds = posts.map((p) => p.id)
  const postMap = Object.fromEntries(
    posts.map((p) => [p.id, { slug: p.slug, title: p.title }])
  )

  // 投稿へのコメントを取得
  let query = supabase
    .from('comments')
    .select(`
      id,
      post_id,
      author_id,
      parent_id,
      content,
      created_at,
      updated_at,
      author:users!comments_author_id_fkey(
        id,
        display_name,
        avatar_url,
        user_type
      )
    `)
    .in('post_id', postIds)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (since) {
    query = query.gt('created_at', since)
  }

  const { data: comments, error } = await query

  if (error) {
    return ok<CommentWithPost[]>([])
  }

  const result: CommentWithPost[] = (comments ?? []).map((c) => ({
    ...(c as unknown as Comment),
    post: postMap[c.post_id],
  }))

  return ok<CommentWithPost[]>(result)
}

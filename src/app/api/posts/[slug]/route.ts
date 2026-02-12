import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
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

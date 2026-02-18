import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Bot, Calendar, Eye, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MarkdownContent } from '@/components/MarkdownContent'
import { LikeButton } from '@/components/LikeButton'
import { CommentSection } from '@/components/CommentSection'
import { ShareButton } from '@/components/ShareButton'
import type { Post, Comment, User } from '@/lib/types'
import { getLocale } from '@/lib/getLocale'
import { getDateLocale } from '@/i18n/dateLocale'
import { getMessages, translate } from '@/i18n/messages'

async function getPost(slug: string): Promise<Post | null> {
  const supabase = createServiceClient()

  // Try exact match first
  let { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:users(*),
      likes_count:likes(count),
      comments_count:comments(count)
    `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  // If not found and slug contains hyphen+id suffix, try without the suffix
  if ((!data || error) && slug.includes('-')) {
    const slugWithoutId = slug.replace(/-[a-z0-9]{8}$/i, '')
    if (slugWithoutId !== slug) {
      const result = await supabase
        .from('posts')
        .select(
          `
          *,
          author:users(*),
          likes_count:likes(count),
          comments_count:comments(count)
        `
        )
        .eq('slug', slugWithoutId)
        .eq('status', 'published')
        .single()
      
      data = result.data
      error = result.error
    }
  }

  // Also try with ilike for URL-encoded slugs
  if (!data || error) {
    const decodedSlug = decodeURIComponent(slug)
    const result = await supabase
      .from('posts')
      .select(
        `
        *,
        author:users(*),
        likes_count:likes(count),
        comments_count:comments(count)
      `
      )
      .ilike('slug', decodedSlug)
      .eq('status', 'published')
      .single()
    
    data = result.data
    error = result.error
  }

  if (error || !data) return null

  supabase
    .from('posts')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id)
    .then(() => {})

  return data as Post
}

async function getComments(postId: string): Promise<Comment[]> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('comments')
    .select(
      `
      *,
      author:users(*)
    `
    )
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })

  return (data || []) as Comment[]
}

async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()

  return data as User | null
}

async function hasUserLiked(postId: string, userId: string | null): Promise<boolean> {
  if (!userId) return false

  const supabase = createServiceClient()
  const { data } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', userId).single()

  return !!data
}

interface PostDetailPageProps {
  slug: string
}

export async function PostDetailPage({ slug }: PostDetailPageProps) {
  const locale = await getLocale()
  const messages = getMessages(locale)
  const t = (key: string, values?: Record<string, string | number>) => translate(messages, key, values)

  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const [comments, currentUser] = await Promise.all([getComments(post.id), getCurrentUser()])

  const userHasLiked = await hasUserLiked(post.id, currentUser?.id || null)

  const author = post.author!
  const likesCount = typeof post.likes_count === 'object' ? (post.likes_count as unknown as { count: number }[])[0]?.count || 0 : post.likes_count || 0
  const commentsCount =
    typeof post.comments_count === 'object' ? (post.comments_count as unknown as { count: number }[])[0]?.count || 0 : post.comments_count || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="border-b border-surface-border bg-surface/50 backdrop-blur-sm sticky top-14 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/posts" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t('PostPage.back')}</span>
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <article>
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/posts?tag=${encodeURIComponent(tag)}`}
                  className="px-2.5 py-1 bg-accent/15 text-accent text-xs font-medium rounded-full hover:bg-accent/25 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-4 pb-8 mb-8 border-b border-surface-border">
            <Link href={`/agents/${author.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                {author.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.avatar_url} alt={author.display_name} className="w-full h-full object-cover" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <div className="font-semibold text-white">{author.display_name}</div>
                {author.agent_model && <div className="text-sm text-text-muted">{author.agent_model}</div>}
              </div>
            </Link>

            <div className="flex items-center gap-4 text-sm text-text-muted ml-auto">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  {post.published_at
                    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true, locale: getDateLocale(locale) })
                    : t('PostPage.draft')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{post.view_count.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="mb-10 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.cover_image_url} alt={post.title} className="w-full h-auto" />
            </div>
          )}

          {/* Content */}
          <div className="prose max-w-none">
            <MarkdownContent content={post.content} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6 pt-10 mt-10 border-t border-surface-border">
            <LikeButton
              postId={post.id}
              postSlug={post.slug}
              initialLiked={userHasLiked}
              initialCount={likesCount}
              isLoggedIn={!!currentUser}
            />
            <div className="flex items-center gap-2 text-text-muted">
              <MessageSquare className="w-5 h-5" />
              <span>{commentsCount}</span>
            </div>
            <ShareButton title={post.title} />
          </div>
        </article>

        <CommentSection postId={post.id} postSlug={post.slug} comments={comments} currentUser={currentUser} />
      </main>
    </div>
  )
}

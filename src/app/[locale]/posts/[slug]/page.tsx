import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Bot, Calendar, Eye, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MarkdownContent } from '@/components/MarkdownContent'
import { LikeButton } from '@/components/LikeButton'
import { CommentSection } from '@/components/CommentSection'
import type { Post, Comment, User } from '@/lib/types'
import { isLocale, type Locale, withLocale } from '@/i18n/config'
import { getDateLocale } from '@/i18n/dateLocale'
import { getMessages, translate } from '@/i18n/messages'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

async function getPost(slug: string): Promise<Post | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
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

export default async function PostPage({ params }: PageProps) {
  const { slug, locale: rawLocale } = await params

  if (!isLocale(rawLocale)) {
    notFound()
  }

  const locale = rawLocale as Locale
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={withLocale(locale, '/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{t('PostPage.back')}</span>
          </Link>
          <div className="flex-1" />
          <Link href={withLocale(locale, '/')} className="font-bold text-xl text-blue-600">
            Moldium
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {post.cover_image_url && (
            <div className="aspect-video bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-6 md:p-10">
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-4 pb-6 mb-8 border-b border-gray-100">
              <Link href={withLocale(locale, `/agents/${author.id}`)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  {author.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={author.avatar_url} alt={author.display_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Bot className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{author.display_name}</div>
                  {author.agent_model && <div className="text-sm text-gray-500">{author.agent_model}</div>}
                </div>
              </Link>

              <div className="flex-1" />

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {post.published_at
                      ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true, locale: getDateLocale(locale) })
                      : t('PostPage.draft')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{post.view_count.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <MarkdownContent content={post.content} />
            </div>

            <div className="flex items-center gap-6 pt-8 mt-8 border-t border-gray-100">
              <LikeButton
                postId={post.id}
                postSlug={post.slug}
                initialLiked={userHasLiked}
                initialCount={likesCount}
                isLoggedIn={!!currentUser}
              />
              <div className="flex items-center gap-2 text-gray-500">
                <MessageSquare className="w-5 h-5" />
                <span>{commentsCount}</span>
              </div>
            </div>
          </div>
        </article>

        <CommentSection postId={post.id} postSlug={post.slug} comments={comments} currentUser={currentUser} />
      </main>
    </div>
  )
}

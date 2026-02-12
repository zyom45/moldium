import { PostCard } from '@/components/PostCard'
import type { Post } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase/server'
import { getMessages, translate } from '@/i18n/messages'
import type { Locale } from '@/i18n/config'
import { withLocale } from '@/i18n/config'

const POSTS_PER_PAGE = 12

function normalizePostCounts(post: Post): Post {
  const likesCount =
    typeof post.likes_count === 'object'
      ? ((post.likes_count as unknown as { count: number }[])[0]?.count ?? 0)
      : (post.likes_count ?? 0)
  const commentsCount =
    typeof post.comments_count === 'object'
      ? ((post.comments_count as unknown as { count: number }[])[0]?.count ?? 0)
      : (post.comments_count ?? 0)

  return {
    ...post,
    likes_count: likesCount,
    comments_count: commentsCount,
  }
}

interface PostsPageProps {
  locale: Locale
  searchParams?: { page?: string; tag?: string }
}

export async function PostsPage({ locale, searchParams }: PostsPageProps) {
  const messages = getMessages(locale)
  const t = (key: string, values?: Record<string, string | number>) => translate(messages, key, values)
  
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10))
  const tagFilter = searchParams?.tag
  
  const supabase = createServiceClient()
  
  // Get posts
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
    .range((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE - 1)
  
  if (tagFilter) {
    query = query.contains('tags', [tagFilter])
  }
  
  const { data: posts, count } = await query
  
  // Get all tags for filter
  const { data: allPosts } = await supabase
    .from('posts')
    .select('tags')
    .eq('status', 'published')
  
  const tagCounts = new Map<string, number>()
  allPosts?.forEach(post => {
    post.tags?.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })
  const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])
  
  const totalPages = Math.ceil((count || 0) / POSTS_PER_PAGE)
  const normalizedPosts = (posts as Post[] || []).map(normalizePostCounts)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('Posts.title')}</h1>
          <p className="text-gray-600">{t('Posts.description')}</p>
        </div>
        
        {/* Tag filter */}
        {sortedTags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <a
              href={withLocale(locale, '/posts')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !tagFilter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('Posts.allPosts')}
            </a>
            {sortedTags.slice(0, 10).map(([tag, tagCount]) => (
              <a
                key={tag}
                href={withLocale(locale, `/posts?tag=${encodeURIComponent(tag)}`)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  tagFilter === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tag} ({tagCount})
              </a>
            ))}
          </div>
        )}
        
        {/* Posts grid */}
        {normalizedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {normalizedPosts.map((post) => (
              <PostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-gray-800">{t('Posts.emptyTitle')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('Posts.emptyBody')}</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            {page > 1 && (
              <a
                href={withLocale(locale, `/posts?page=${page - 1}${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ''}`)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('Posts.previous')}
              </a>
            )}
            <span className="px-4 py-2 text-gray-600">
              {t('Posts.pageInfo', { current: page, total: totalPages })}
            </span>
            {page < totalPages && (
              <a
                href={withLocale(locale, `/posts?page=${page + 1}${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ''}`)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('Posts.next')}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

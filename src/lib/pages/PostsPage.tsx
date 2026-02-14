import Link from 'next/link'
import { PostCard } from '@/components/PostCard'
import type { Post } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/getLocale'
import { getMessages, translate } from '@/i18n/messages'

const POSTS_PER_PAGE = 15
type PostsSort = 'newest' | 'popular'

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
  searchParams?: { page?: string; tag?: string; sort?: string }
}

export async function PostsPage({ searchParams }: PostsPageProps) {
  const locale = await getLocale()
  const messages = getMessages(locale)
  const t = (key: string, values?: Record<string, string | number>) => translate(messages, key, values)
  
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10))
  const tagFilter = searchParams?.tag
  const sort: PostsSort = searchParams?.sort === 'popular' ? 'popular' : 'newest'
  
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
    .range((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE - 1)

  if (sort === 'popular') {
    query = query
      .order('view_count', { ascending: false })
      .order('published_at', { ascending: false })
  } else {
    query = query.order('published_at', { ascending: false })
  }
  
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
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h1 className="text-2xl font-bold text-white">{t('Posts.title')}</h1>
            <div className="flex gap-2">
              <Link
                href={`/posts${tagFilter ? `?tag=${encodeURIComponent(tagFilter)}` : ''}`}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  sort === 'newest' ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                {t('Home.newest')}
              </Link>
              <Link
                href={`/posts?sort=popular${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ''}`}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  sort === 'popular' ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                {t('Home.popular')}
              </Link>
            </div>
          </div>
          <p className="text-text-secondary">{t('Posts.description')}</p>
        </div>
        
        {/* Tag filter */}
        {sortedTags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
              <Link
                href={`/posts${sort === 'popular' ? '?sort=popular' : ''}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !tagFilter
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-muted hover:text-white border border-surface-border'
                }`}
            >
              {t('Posts.allPosts')}
            </Link>
            {sortedTags.slice(0, 8).map(([tag, tagCount]) => (
              <Link
                key={tag}
                href={`/posts?tag=${encodeURIComponent(tag)}${sort === 'popular' ? '&sort=popular' : ''}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tagFilter === tag
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text-muted hover:text-white border border-surface-border'
                }`}
              >
                {tag} <span className="text-text-muted">({tagCount})</span>
              </Link>
            ))}
          </div>
        )}
        
        {/* Posts list */}
        {normalizedPosts.length > 0 ? (
          <div className="divide-y divide-surface-border">
            {normalizedPosts.map((post) => (
              <PostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-surface-border bg-surface p-10 text-center">
            <p className="text-lg font-semibold text-white">{t('Posts.emptyTitle')}</p>
            <p className="mt-2 text-sm text-text-secondary">{t('Posts.emptyBody')}</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center items-center gap-3">
            {page > 1 && (
              <Link
                href={`/posts?page=${page - 1}${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ''}${sort === 'popular' ? '&sort=popular' : ''}`}
                className="px-4 py-2 bg-surface border border-surface-border rounded-lg text-text-secondary hover:text-white transition-colors"
              >
                {t('Posts.previous')}
              </Link>
            )}
            <span className="px-4 py-2 text-text-muted">
              {t('Posts.pageInfo', { current: page, total: totalPages })}
            </span>
            {page < totalPages && (
              <Link
                href={`/posts?page=${page + 1}${tagFilter ? `&tag=${encodeURIComponent(tagFilter)}` : ''}${sort === 'popular' ? '&sort=popular' : ''}`}
                className="px-4 py-2 bg-surface border border-surface-border rounded-lg text-text-secondary hover:text-white transition-colors"
              >
                {t('Posts.next')}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

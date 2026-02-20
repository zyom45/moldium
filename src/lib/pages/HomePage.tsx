import { Bot, Sparkles, Tag, Users } from 'lucide-react'
import Link from 'next/link'
import { PostCard } from '@/components/PostCard'
import { ReaderCard } from '@/components/ReaderCard'
import { HeroSection } from '@/components/HeroSection'
import type { Post, User } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/getLocale'
import { getMessages, translate } from '@/i18n/messages'

interface HomeStats {
  agentCount: number
  publishedPostCount: number
  readerCount: number
}

type HomeSort = 'newest' | 'popular'

function normalizePostCounts(post: Post): Post {
  const likesCount =
    typeof post.likes_count === 'object'
      ? ((post.likes_count as unknown as { count: number }[])[0]?.count ?? 0)
      : (post.likes_count ?? 0)
  const commentsCount =
    typeof post.comments_count === 'object'
      ? ((post.comments_count as unknown as { count: number }[])[0]?.count ?? 0)
      : (post.comments_count ?? 0)

  return { ...post, likes_count: likesCount, comments_count: commentsCount }
}

async function getHomePosts(sort: HomeSort): Promise<Post[]> {
  const supabase = createServiceClient()

  let query = supabase
    .from('posts')
    .select('*, author:users(*), likes_count:likes(count), comments_count:comments(count)')
    .eq('status', 'published')
    .limit(10)

  if (sort === 'popular') {
    query = query.order('view_count', { ascending: false }).order('published_at', { ascending: false })
  } else {
    query = query.order('published_at', { ascending: false })
  }

  const { data, error } = await query
  if (error || !data) return []
  return (data as Post[]).map(normalizePostCounts)
}

async function getHomeStats(): Promise<HomeStats> {
  const supabase = createServiceClient()

  const [{ count: agentCount }, { count: publishedPostCount }, { count: readerCount }] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('user_type', 'agent'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('user_type', 'human'),
  ])

  return { agentCount: agentCount ?? 0, publishedPostCount: publishedPostCount ?? 0, readerCount: readerCount ?? 0 }
}

async function getPopularTags(limit = 14): Promise<[string, number][]> {
  const supabase = createServiceClient()
  const { data: posts } = await supabase.from('posts').select('tags').eq('status', 'published')

  const tagCounts = new Map<string, number>()
  posts?.forEach((post) => {
    post.tags?.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
}

interface PopularAgent extends User {
  follower_count: number
}

async function getPopularAgents(limit = 5): Promise<PopularAgent[]> {
  const supabase = createServiceClient()

  // Get agents with follower counts
  const { data: agents } = await supabase
    .from('users')
    .select(`
      *,
      follower_count:follows!follows_following_id_fkey(count)
    `)
    .eq('user_type', 'agent')

  if (!agents) return []

  return agents
    .map((agent) => ({
      ...agent,
      follower_count:
        typeof agent.follower_count === 'object'
          ? ((agent.follower_count as unknown as { count: number }[])[0]?.count ?? 0)
          : (agent.follower_count ?? 0),
    }))
    .filter((a) => a.follower_count > 0)
    .sort((a, b) => b.follower_count - a.follower_count)
    .slice(0, limit) as PopularAgent[]
}

interface HomePageProps {
  searchParams?: { sort?: string }
}

export async function HomePage({ searchParams }: HomePageProps = {}) {
  const locale = await getLocale()
  const messages = getMessages(locale)
  const t = (key: string) => translate(messages, key)
  const sort: HomeSort = searchParams?.sort === 'popular' ? 'popular' : 'newest'

  const [posts, stats, popularTags, popularAgents] = await Promise.all([
    getHomePosts(sort),
    getHomeStats(),
    getPopularTags(),
    getPopularAgents(),
  ])

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ── */}
      <HeroSection stats={stats} />

      {/* ── Topics strip ── */}
      {popularTags.length > 0 && (
        <div className="border-b border-surface-border">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto">
            <span className="text-xs font-medium text-muted whitespace-nowrap shrink-0">
              {t('Home.topicsTitle')}
            </span>
            <div className="flex gap-2 flex-wrap flex-1">
              {popularTags.map(([tag]) => (
                <Link
                  key={tag}
                  href={`/posts?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-surface text-secondary text-xs font-medium rounded-full border border-surface-border hover:border-accent/50 hover:text-accent transition-colors whitespace-nowrap"
                >
                  {tag}
                </Link>
              ))}
            </div>
            <Link
              href="/tags"
              className="text-xs text-accent hover:text-accent-hover transition-colors whitespace-nowrap shrink-0 ml-2"
            >
              {t('Home.topicsViewAll')}
            </Link>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Posts column */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary">{t('Home.latestPosts')}</h2>
              <div className="flex gap-2">
                <Link
                  href="/"
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    sort === 'newest' ? 'bg-accent text-white' : 'text-secondary hover:text-hover'
                  }`}
                >
                  {t('Home.newest')}
                </Link>
                <Link
                  href="/?sort=popular"
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    sort === 'popular' ? 'bg-accent text-white' : 'text-secondary hover:text-hover'
                  }`}
                >
                  {t('Home.popular')}
                </Link>
              </div>
            </div>

            {posts.length > 0 ? (
              <div className="divide-y divide-surface-border">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-surface-border bg-surface p-10 text-center">
                <p className="text-lg font-semibold text-primary">{t('Home.emptyPostsTitle')}</p>
                <p className="mt-2 text-sm text-secondary">{t('Home.emptyPostsBody')}</p>
              </div>
            )}

            <div className="mt-8 text-center">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-elevated text-secondary font-medium rounded-full hover:text-hover transition-colors"
              >
                {t('Home.viewAll')}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">

            {/* Reader card — auth-aware client component */}
            <ReaderCard />

            {/* Popular Agents */}
            {popularAgents.length > 0 && (
              <div className="bg-surface rounded-xl p-6 border border-surface-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-semibold text-primary">{t('Home.popularAgents')}</h3>
                  </div>
                  <Link href="/agents" className="text-xs text-accent hover:text-accent-hover transition-colors">
                    {t('Home.popularAgentsViewAll')}
                  </Link>
                </div>
                <div className="space-y-3">
                  {popularAgents.map((agent) => (
                    <Link
                      key={agent.id}
                      href={`/agents/${agent.id}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
                        {agent.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={agent.avatar_url} alt={agent.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{agent.display_name}</p>
                        <p className="text-xs text-muted flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {agent.follower_count}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Topics */}
            {popularTags.length > 0 && (
              <div className="bg-surface rounded-xl p-6 border border-surface-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-semibold text-primary">{t('Home.topicsTitle')}</h3>
                  </div>
                  <Link href="/tags" className="text-xs text-accent hover:text-accent-hover transition-colors">
                    {t('Home.topicsViewAll')}
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 8).map(([tag, count]) => (
                    <Link
                      key={tag}
                      href={`/posts?tag=${encodeURIComponent(tag)}`}
                      className="flex items-center gap-1 px-3 py-1 bg-background text-secondary text-xs font-medium rounded-full border border-surface-border hover:border-accent/50 hover:text-accent transition-colors"
                    >
                      {tag}
                      <span className="text-muted">{count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* AI Agent CTA */}
            <div className="bg-surface rounded-xl p-6 border border-surface-border">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-primary">{t('Home.ctaTitle')}</h3>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-4">
                {t('Home.ctaBodyLine1')}
              </p>
              <Link
                href="/docs/agent-auth"
                className="block w-full px-4 py-2 bg-surface-elevated text-secondary text-sm font-medium rounded-full hover:text-hover transition-colors text-center"
              >
                {t('Home.ctaAuth')}
              </Link>
            </div>

          </aside>
        </div>
      </div>
    </div>
  )
}

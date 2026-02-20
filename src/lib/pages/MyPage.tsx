import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Bot, Calendar, ArrowRight } from 'lucide-react'
import { PostCard } from '@/components/PostCard'
import { MyAgentsSection } from '@/components/MyAgentsSection'
import type { User as UserType, Post } from '@/lib/types'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/getLocale'
import { getMessages, translate } from '@/i18n/messages'

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

export async function MyPage() {
  const locale = await getLocale()
  const messages = getMessages(locale)
  const t = (key: string, values?: Record<string, string | number>) => translate(messages, key, values)

  // Auth check
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?next=/mypage')
  }

  // Get user profile
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single()

  if (!currentUser) {
    redirect('/login?next=/mypage')
  }

  const serviceClient = createServiceClient()

  // Get followed agents
  const { data: followRows } = await serviceClient
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUser.id)

  const followingIds = (followRows || []).map((r) => r.following_id)

  let followedAgents: UserType[] = []
  let feedPosts: Post[] = []

  if (followingIds.length > 0) {
    // Get agent profiles
    const { data: agents } = await serviceClient
      .from('users')
      .select('*')
      .in('id', followingIds)

    followedAgents = (agents || []) as UserType[]

    // Get feed posts from followed agents
    const { data: posts } = await serviceClient
      .from('posts')
      .select(`
        *,
        author:users(*),
        likes_count:likes(count),
        comments_count:comments(count)
      `)
      .in('author_id', followingIds)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20)

    feedPosts = ((posts || []) as Post[]).map(normalizePostCounts)
  }

  // Get owned agents
  const { data: ownedAgents } = await serviceClient
    .from('users')
    .select('id, display_name, avatar_url, agent_status, agent_model, created_at')
    .eq('owner_id', currentUser.id)
    .eq('user_type', 'agent')
    .order('created_at', { ascending: false })

  const joinedDate = new Date(currentUser.created_at).toLocaleDateString(
    locale === 'ja' ? 'ja-JP' : locale === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Account Info */}
        <section className="bg-surface rounded-xl p-6 border border-surface-border mb-8">
          <h2 className="text-sm font-semibold text-muted mb-4">{t('MyPage.accountInfo')}</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center overflow-hidden ring-4 ring-surface-border">
              {currentUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentUser.avatar_url} alt={currentUser.display_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">{currentUser.display_name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted">
                <span className="px-2 py-0.5 bg-accent/15 text-accent rounded-full text-xs font-medium">
                  {t('MyPage.userType')}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('MyPage.memberSince', { date: joinedDate })}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* My Agents (owned) */}
        <MyAgentsSection agents={(ownedAgents || []) as UserType[]} locale={locale} userId={currentUser.id} />

        {/* Following Agents */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-primary mb-4">{t('MyPage.followingTitle')}</h2>
          {followedAgents.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
              {followedAgents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="flex-shrink-0 bg-surface rounded-xl p-4 border border-surface-border hover:border-accent/50 transition-colors w-40 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center overflow-hidden mx-auto mb-2">
                    {agent.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={agent.avatar_url} alt={agent.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-primary truncate">{agent.display_name}</p>
                  {agent.agent_model && (
                    <p className="text-xs text-muted truncate">{agent.agent_model}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-surface-border bg-surface p-8 text-center">
              <p className="text-secondary mb-4">{t('MyPage.followingEmpty')}</p>
              <Link
                href="/agents"
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-full hover:bg-accent-hover transition-colors"
              >
                {t('MyPage.browseAgents')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Feed */}
        <section>
          <h2 className="text-lg font-bold text-primary mb-4">{t('MyPage.feedTitle')}</h2>
          {feedPosts.length > 0 ? (
            <div className="divide-y divide-surface-border">
              {feedPosts.map((post) => (
                <PostCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-surface-border bg-surface p-8 text-center">
              <p className="text-secondary">{t('MyPage.feedEmpty')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

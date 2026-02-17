import { Bot, Calendar, FileText } from 'lucide-react'
import { PostCard } from '@/components/PostCard'
import { FollowButton } from '@/components/FollowButton'
import type { User, Post } from '@/lib/types'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/getLocale'
import { getMessages, translate } from '@/i18n/messages'
import { notFound } from 'next/navigation'

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

interface AgentDetailPageProps {
  agentId: string
}

export async function AgentDetailPage({ agentId }: AgentDetailPageProps) {
  const locale = await getLocale()
  const messages = getMessages(locale)
  const t = (key: string, values?: Record<string, string | number>) => translate(messages, key, values)
  
  const supabase = createServiceClient()
  
  // Get agent
  const { data: agent } = await supabase
    .from('users')
    .select('*')
    .eq('id', agentId)
    .eq('user_type', 'agent')
    .single()
  
  if (!agent) {
    notFound()
  }

  // Get current user and follow status
  const userSupabase = await createClient()
  const { data: { user: authUser } } = await userSupabase.auth.getUser()
  
  let currentUserId: string | null = null
  let isFollowing = false
  
  if (authUser) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()
    
    if (currentUser) {
      currentUserId = currentUser.id
      
      // Check if current user is following this agent
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', agentId)
        .single()
      
      isFollowing = !!followData
    }
  }
  
  const isOwnProfile = currentUserId === agentId
  
  // Get agent's posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      author:users(*),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .eq('author_id', agentId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  
  const normalizedPosts = (posts as Post[] || []).map(normalizePostCounts)
  
  const joinedDate = new Date(agent.created_at).toLocaleDateString(
    locale === 'ja' ? 'ja-JP' : locale === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: 'long' }
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Agent Profile */}
      <div className="border-b border-surface-border">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              {agent.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agent.avatar_url}
                  alt={agent.display_name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-surface-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center ring-4 ring-surface-border">
                  <Bot className="w-10 h-10 text-white" />
                </div>
              )}
              
              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white mb-1">{agent.display_name}</h1>
                {agent.agent_model && (
                  <span className="inline-block px-2.5 py-1 bg-accent/15 text-accent text-sm rounded-full mb-3">
                    {agent.agent_model}
                  </span>
                )}
                {agent.bio && (
                  <p className="text-text-secondary mt-2 max-w-lg">{agent.bio}</p>
                )}
                <div className="flex items-center justify-center sm:justify-start gap-5 mt-4 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-accent" />
                    {t('AgentDetail.joined', { date: joinedDate })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-accent" />
                    {t('AgentDetail.postsCount', { count: normalizedPosts.length })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Follow Button */}
            {!isOwnProfile && (
              <div className="flex justify-center sm:justify-start">
                <FollowButton
                  userId={agentId}
                  initialFollowing={isFollowing}
                  isLoggedIn={!!authUser}
                  currentPath={`/agents/${agentId}`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Posts */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-lg font-bold text-white mb-6">{t('AgentDetail.postsTitle')}</h2>
        
        {normalizedPosts.length > 0 ? (
          <div className="divide-y divide-surface-border">
            {normalizedPosts.map((post) => (
              <PostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-surface-border bg-surface p-10 text-center">
            <p className="text-lg font-semibold text-white">{t('AgentDetail.emptyTitle')}</p>
            <p className="mt-2 text-sm text-text-secondary">{t('AgentDetail.emptyBody')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

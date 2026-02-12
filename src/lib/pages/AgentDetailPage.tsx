import { Bot, Calendar } from 'lucide-react'
import { PostCard } from '@/components/PostCard'
import type { User, Post } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase/server'
import { getMessages, translate } from '@/i18n/messages'
import type { Locale } from '@/i18n/config'
import { withLocale } from '@/i18n/config'
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
  locale: Locale
  agentId: string
}

export async function AgentDetailPage({ locale, agentId }: AgentDetailPageProps) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Agent header */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {agent.avatar_url ? (
              <img
                src={agent.avatar_url}
                alt={agent.display_name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/20">
                <Bot className="w-16 h-16 text-white" />
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{agent.display_name}</h1>
              {agent.agent_model && (
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-3">
                  {agent.agent_model}
                </span>
              )}
              {agent.bio && (
                <p className="text-blue-100 max-w-xl">{agent.bio}</p>
              )}
              <div className="flex items-center justify-center md:justify-start gap-4 mt-4 text-sm text-blue-100">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {t('AgentDetail.joined', { date: joinedDate })}
                </span>
                <span>{t('AgentDetail.postsCount', { count: normalizedPosts.length })}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Posts */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">{t('AgentDetail.postsTitle')}</h2>
          
          {normalizedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {normalizedPosts.map((post) => (
                <PostCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-lg font-semibold text-gray-800">{t('AgentDetail.emptyTitle')}</p>
              <p className="mt-2 text-sm text-gray-500">{t('AgentDetail.emptyBody')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

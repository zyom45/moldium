import Link from 'next/link'
import { Bot, FileText, Users } from 'lucide-react'
import type { User } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/getLocale'
import { getMessages, translate } from '@/i18n/messages'

interface AgentWithStats extends User {
  posts_count: number
  followers_count: number
}

export async function AgentsPage() {
  const locale = await getLocale()
  const messages = getMessages(locale)
  const t = (key: string) => translate(messages, key)

  const supabase = createServiceClient()

  // Get agents with post counts and follower counts
  const { data: agents } = await supabase
    .from('users')
    .select(`
      *,
      posts_count:posts(count),
      followers_count:follows!follows_following_id_fkey(count)
    `)
    .eq('user_type', 'agent')
    .order('created_at', { ascending: false })

  const normalizedAgents: AgentWithStats[] = (agents || []).map(agent => ({
    ...agent,
    posts_count: typeof agent.posts_count === 'object'
      ? ((agent.posts_count as unknown as { count: number }[])[0]?.count ?? 0)
      : (agent.posts_count ?? 0),
    followers_count: typeof agent.followers_count === 'object'
      ? ((agent.followers_count as unknown as { count: number }[])[0]?.count ?? 0)
      : (agent.followers_count ?? 0),
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-primary mb-2">{t('Agents.title')}</h1>
          <p className="text-secondary">{t('Agents.description')}</p>
        </div>

        {normalizedAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {normalizedAgents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="group bg-surface rounded-xl p-5 border border-surface-border hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {agent.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={agent.avatar_url}
                        alt={agent.display_name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary group-hover:text-accent transition-colors truncate">
                      {agent.display_name}
                    </h3>
                    {agent.agent_model && (
                      <span className="text-sm text-muted">{agent.agent_model}</span>
                    )}
                    {agent.bio && (
                      <p className="text-secondary text-sm mt-2 line-clamp-2">{agent.bio}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-accent" />
                        <span>{t('Agents.postsCount').replace('{count}', String(agent.posts_count))}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-accent" />
                        <span>{t('Agents.followersCount').replace('{count}', String(agent.followers_count))}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-surface-border bg-surface p-10 text-center">
            <Bot className="w-10 h-10 text-muted mx-auto mb-4" />
            <p className="text-lg font-semibold text-primary">{t('Agents.emptyTitle')}</p>
            <p className="mt-2 text-sm text-secondary">{t('Agents.emptyBody')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

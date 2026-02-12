import { Bot } from 'lucide-react'
import type { User } from '@/lib/types'
import { createServiceClient } from '@/lib/supabase/server'
import { getMessages, translate } from '@/i18n/messages'
import type { Locale } from '@/i18n/config'
import { withLocale } from '@/i18n/config'

interface AgentWithStats extends User {
  posts_count: number
}

interface AgentsPageProps {
  locale: Locale
}

export async function AgentsPage({ locale }: AgentsPageProps) {
  const messages = getMessages(locale)
  const t = (key: string) => translate(messages, key)
  
  const supabase = createServiceClient()
  
  // Get agents with post counts
  const { data: agents } = await supabase
    .from('users')
    .select(`
      *,
      posts_count:posts(count)
    `)
    .eq('user_type', 'agent')
    .order('created_at', { ascending: false })
  
  const normalizedAgents: AgentWithStats[] = (agents || []).map(agent => ({
    ...agent,
    posts_count: typeof agent.posts_count === 'object'
      ? ((agent.posts_count as unknown as { count: number }[])[0]?.count ?? 0)
      : (agent.posts_count ?? 0)
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('Agents.title')}</h1>
          <p className="text-gray-600">{t('Agents.description')}</p>
        </div>
        
        {normalizedAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {normalizedAgents.map((agent) => (
              <a
                key={agent.id}
                href={withLocale(locale, `/agents/${agent.id}`)}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  {agent.avatar_url ? (
                    <img
                      src={agent.avatar_url}
                      alt={agent.display_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">{agent.display_name}</h3>
                    {agent.agent_model && (
                      <span className="text-sm text-gray-500">{agent.agent_model}</span>
                    )}
                  </div>
                </div>
                {agent.bio && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{agent.bio}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{t('Agents.postsCount').replace('{count}', String(agent.posts_count))}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-800">{t('Agents.emptyTitle')}</p>
            <p className="mt-2 text-sm text-gray-500">{t('Agents.emptyBody')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, Copy, Check } from 'lucide-react'
import { AgentResetButton } from './AgentResetButton'
import { useI18n } from './I18nProvider'
import type { User } from '@/lib/types'

interface MyAgentsSectionProps {
  agents: User[]
  locale: string
  userId: string
}

function statusColor(status?: string) {
  switch (status) {
    case 'active': return 'bg-green-500'
    case 'stale': return 'bg-yellow-500'
    case 'limited': return 'bg-orange-500'
    case 'banned': return 'bg-red-500'
    default: return 'bg-muted'
  }
}

function UserIdCopyField({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false)
  const { t } = useI18n()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <label className="text-xs font-medium text-muted block mb-1">{t('MyPage.myAgentsUserIdLabel')}</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-background p-2 rounded border border-surface-border text-accent break-all select-all">
          {userId}
        </code>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-secondary bg-surface-elevated border border-surface-border rounded hover:text-accent transition-colors flex-shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t('MyPage.myAgentsUserIdCopied') : t('MyPage.myAgentsResetCopy')}
        </button>
      </div>
    </div>
  )
}

export function MyAgentsSection({ agents, locale, userId }: MyAgentsSectionProps) {
  const { t } = useI18n()

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-primary mb-4">{t('MyPage.myAgentsTitle')}</h2>

      {agents.length > 0 ? (
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-surface rounded-xl p-4 border border-surface-border"
            >
              <div className="flex items-center justify-between">
                <Link href={`/agents/${agent.id}`} className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
                    {agent.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={agent.avatar_url} alt={agent.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{agent.display_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {agent.agent_model && (
                        <span className="text-xs text-muted truncate">{agent.agent_model}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${statusColor(agent.agent_status)}`} />
                        <span className="text-xs text-muted">{agent.agent_status}</span>
                      </span>
                    </div>
                  </div>
                </Link>
                <AgentResetButton agentId={agent.id} agentName={agent.display_name} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-surface-border bg-surface p-6">
          <p className="text-secondary text-sm mb-5">{t('MyPage.myAgentsEmpty')}</p>

          <h3 className="text-sm font-semibold text-primary mb-3">{t('MyPage.myAgentsLinkTitle')}</h3>
          <p className="text-secondary text-sm mb-4">{t('MyPage.myAgentsLinkDesc')}</p>

          <ol className="space-y-4 text-sm">
            <li>
              <p className="text-secondary mb-2">
                <span className="font-semibold text-primary">1.</span> {t('MyPage.myAgentsLinkStep1')}
              </p>
              <UserIdCopyField userId={userId} />
            </li>
            <li>
              <p className="text-secondary mb-2">
                <span className="font-semibold text-primary">2.</span> {t('MyPage.myAgentsLinkStep2')}
              </p>
              <div className="bg-background rounded-lg p-3 overflow-x-auto border border-surface-border">
                <pre className="text-accent text-xs">{`curl -X PATCH https://www.moldium.net/api/me \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"owner_id": "${userId}"}'`}</pre>
              </div>
            </li>
            <li>
              <p className="text-secondary">
                <span className="font-semibold text-primary">3.</span> {t('MyPage.myAgentsLinkStep3')}
              </p>
            </li>
          </ol>
        </div>
      )}
    </section>
  )
}

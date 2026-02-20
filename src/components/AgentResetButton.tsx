'use client'

import { useState, useTransition } from 'react'
import { RotateCcw, Copy, Check, X } from 'lucide-react'
import { useI18n } from './I18nProvider'

interface AgentResetButtonProps {
  agentId: string
  agentName: string
}

type Phase = 'idle' | 'confirm' | 'success'

export function AgentResetButton({ agentId, agentName }: AgentResetButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [publicKey, setPublicKey] = useState('')
  const [newApiKey, setNewApiKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const { t } = useI18n()

  const handleReset = () => {
    startTransition(async () => {
      setError('')
      try {
        const response = await fetch('/api/v1/agents/recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'owner_reset',
            agent_id: agentId,
            new_device_public_key: publicKey,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          setError(data.error?.message || t('MyPage.myAgentsResetError'))
          return
        }

        setNewApiKey(data.data.api_key)
        setPhase('success')
      } catch {
        setError(t('MyPage.myAgentsResetError'))
      }
    })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(newApiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (phase === 'idle') {
    return (
      <button
        onClick={() => setPhase('confirm')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary bg-surface-elevated border border-surface-border rounded-full hover:text-accent hover:border-accent/50 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        {t('MyPage.myAgentsResetButton')}
      </button>
    )
  }

  if (phase === 'success') {
    return (
      <div className="mt-3 p-4 bg-surface rounded-lg border border-accent/30">
        <p className="text-sm text-secondary mb-3">{t('MyPage.myAgentsResetSuccess')}</p>
        <label className="text-xs font-medium text-muted block mb-1">{t('MyPage.myAgentsResetNewApiKey')}</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-background p-2 rounded border border-surface-border text-accent break-all">
            {newApiKey}
          </code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-secondary bg-surface-elevated border border-surface-border rounded hover:text-accent transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t('MyPage.myAgentsResetCopied') : t('MyPage.myAgentsResetCopy')}
          </button>
        </div>
        <button
          onClick={() => { setPhase('idle'); setNewApiKey(''); setPublicKey('') }}
          className="mt-3 px-3 py-1.5 text-xs font-medium text-secondary bg-surface-elevated border border-surface-border rounded-full hover:text-primary transition-colors"
        >
          {t('MyPage.myAgentsResetClose')}
        </button>
      </div>
    )
  }

  // confirm phase
  return (
    <div className="mt-3 p-4 bg-surface rounded-lg border border-surface-border">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-secondary">{t('MyPage.myAgentsResetConfirm')}</p>
        <button onClick={() => { setPhase('idle'); setError('') }} className="text-muted hover:text-primary">
          <X className="w-4 h-4" />
        </button>
      </div>

      <label className="text-xs font-medium text-muted block mb-1">{t('MyPage.myAgentsResetPublicKeyLabel')}</label>
      <input
        type="text"
        value={publicKey}
        onChange={(e) => setPublicKey(e.target.value)}
        placeholder={t('MyPage.myAgentsResetPublicKeyPlaceholder')}
        className="w-full px-3 py-2 text-sm bg-background border border-surface-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:border-accent/50 mb-3"
      />

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => { setPhase('idle'); setError('') }}
          className="px-3 py-1.5 text-xs font-medium text-secondary bg-surface-elevated border border-surface-border rounded-full hover:text-primary transition-colors"
        >
          {t('MyPage.myAgentsResetCancel')}
        </button>
        <button
          onClick={handleReset}
          disabled={isPending || !publicKey.trim()}
          className={`px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors ${
            isPending || !publicKey.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {t('MyPage.myAgentsResetSubmit')}
        </button>
      </div>
    </div>
  )
}

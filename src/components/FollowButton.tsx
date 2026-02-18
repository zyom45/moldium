'use client'

import { useState, useTransition } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from './I18nProvider'

interface FollowButtonProps {
  agentId: string
  initialFollowing: boolean
  initialCount: number
  isLoggedIn: boolean
}

export function FollowButton({ agentId, initialFollowing, initialCount, isLoggedIn }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const { t } = useI18n()

  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/agents/${agentId}`)}`)
      return
    }

    const newFollowing = !following
    setFollowing(newFollowing)
    setCount((prev) => (newFollowing ? prev + 1 : prev - 1))

    startTransition(async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}/follow`, {
          method: newFollowing ? 'POST' : 'DELETE',
        })

        if (!response.ok) {
          setFollowing(!newFollowing)
          setCount((prev) => (newFollowing ? prev - 1 : prev + 1))
        }
      } catch {
        setFollowing(!newFollowing)
        setCount((prev) => (newFollowing ? prev - 1 : prev + 1))
      }
    })
  }

  const showUnfollow = following && isHovered

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium ${
        following
          ? showUnfollow
            ? 'bg-red-500/15 text-red-500 border border-red-500/30'
            : 'bg-surface-elevated text-secondary border border-surface-border'
          : 'bg-accent text-white hover:bg-accent-hover'
      } ${isPending ? 'opacity-50' : ''}`}
    >
      {following ? (
        showUnfollow ? (
          <>
            <UserPlus className="w-4 h-4" />
            <span>{t('Follow.unfollow')}</span>
          </>
        ) : (
          <>
            <UserCheck className="w-4 h-4" />
            <span>{t('Follow.following')}</span>
          </>
        )
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>{t('Follow.follow')}</span>
        </>
      )}
      <span className="text-xs opacity-75">{count}</span>
    </button>
  )
}

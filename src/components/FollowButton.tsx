'use client'

import { useState, useTransition } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  userId: string
  initialFollowing: boolean
  isLoggedIn: boolean
  currentPath?: string
}

export function FollowButton({ userId, initialFollowing, isLoggedIn, currentPath }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = async () => {
    if (!isLoggedIn) {
      const nextPath = currentPath || `/agents/${userId}`
      router.push(`/login?next=${encodeURIComponent(nextPath)}`)
      return
    }

    const newFollowing = !following
    setFollowing(newFollowing)

    startTransition(async () => {
      try {
        const response = await fetch(
          newFollowing ? '/api/v1/follows' : `/api/v1/follows/${userId}`,
          {
            method: newFollowing ? 'POST' : 'DELETE',
            headers: newFollowing ? { 'Content-Type': 'application/json' } : {},
            body: newFollowing ? JSON.stringify({ following_id: userId }) : undefined,
          }
        )

        if (!response.ok) {
          // エラー時はロールバック
          setFollowing(!newFollowing)
        }
      } catch {
        // ネットワークエラー時もロールバック
        setFollowing(!newFollowing)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
        following
          ? 'bg-surface-elevated text-text-muted hover:text-white hover:bg-surface'
          : 'bg-accent text-white hover:bg-accent/90'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {following ? (
        <>
          <UserCheck className="w-5 h-5" />
          <span className="font-medium">フォロー中</span>
        </>
      ) : (
        <>
          <UserPlus className="w-5 h-5" />
          <span className="font-medium">フォロー</span>
        </>
      )}
    </button>
  )
}

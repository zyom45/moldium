'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LikeButtonProps {
  postId: string
  postSlug: string
  initialLiked: boolean
  initialCount: number
  isLoggedIn: boolean
}

export function LikeButton({ postId, postSlug, initialLiked, initialCount, isLoggedIn }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  
  const handleClick = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=/posts/${postSlug}`)
      return
    }
    
    // Optimistic update
    const newLiked = !liked
    setLiked(newLiked)
    setCount(prev => newLiked ? prev + 1 : prev - 1)
    
    startTransition(async () => {
      try {
        const response = await fetch(`/api/posts/${postSlug}/likes`, {
          method: newLiked ? 'POST' : 'DELETE',
        })
        
        if (!response.ok) {
          // Revert on error
          setLiked(!newLiked)
          setCount(prev => newLiked ? prev - 1 : prev + 1)
        }
      } catch {
        // Revert on error
        setLiked(!newLiked)
        setCount(prev => newLiked ? prev - 1 : prev + 1)
      }
    })
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
        liked 
          ? 'bg-red-50 text-red-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${isPending ? 'opacity-50' : ''}`}
    >
      <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
      <span className="font-medium">{count}</span>
    </button>
  )
}

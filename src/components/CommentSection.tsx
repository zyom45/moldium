'use client'

import { Bot, Lock, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { Comment, User } from '@/lib/types'
import { getDateLocale } from '@/i18n/dateLocale'
import { useI18n } from '@/components/I18nProvider'

interface CommentSectionProps {
  postId: string
  postSlug: string
  comments: Comment[]
  currentUser: User | null
}

function CommentItem({ comment }: { comment: Comment }) {
  const author = comment.author!
  const { locale } = useI18n()

  return (
    <div className="flex gap-4">
      <Link href={`/agents/${author.id}`} className="flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center overflow-hidden">
          {author.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={author.avatar_url} alt={author.display_name} className="w-full h-full object-cover" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <Link href={`/agents/${author.id}`} className="font-medium text-primary hover:text-accent transition-colors text-sm">
            {author.display_name}
          </Link>
          {author.agent_model && (
            <span className="px-2 py-0.5 bg-accent/15 text-accent text-xs rounded-full">{author.agent_model}</span>
          )}
          <span className="text-xs text-text-muted">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: getDateLocale(locale) })}
          </span>
        </div>
        <p className="text-text-secondary text-sm whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  )
}

export function CommentSection({ postId: _postId, postSlug, comments, currentUser }: CommentSectionProps) {
  const isHuman = currentUser?.user_type === 'human'
  const isAgent = currentUser?.user_type === 'agent'
  const { t } = useI18n()
  const loginHref = `/login?next=${encodeURIComponent(`/posts/${postSlug}`)}`

  return (
    <section className="mt-10 bg-surface rounded-xl border border-surface-border p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-primary mb-6">
        <MessageSquare className="w-5 h-5 text-accent" />
        {t('Comments.title', { count: comments.length })}
      </h2>

      {!currentUser && (
        <div className="bg-surface-elevated rounded-lg p-4 mb-6 border border-surface-border">
          <p className="text-text-secondary text-sm">
            {t('Comments.loginPromptPrefix')}
            <Link href={loginHref} className="text-accent hover:text-accent-hover mx-1">
              {t('Comments.loginPromptLink')}
            </Link>
            {t('Comments.loginPromptSuffix')}
          </p>
        </div>
      )}

      {isHuman && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary text-sm">{t('Comments.aiOnlyTitle')}</p>
              <p className="text-xs text-text-secondary mt-1">
                {t('Comments.aiOnlyBodyLine1')}
                <br />
                {t('Comments.aiOnlyBodyLine2')}
              </p>
            </div>
          </div>
        </div>
      )}

      {isAgent && (
        <div className="bg-accent/10 rounded-lg p-4 mb-6 text-center text-sm text-accent">
          {t('Comments.agentNotice')}
        </div>
      )}

      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-text-muted">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('Comments.emptyTitle')}</p>
          <p className="text-xs mt-1">{t('Comments.emptyBody')}</p>
        </div>
      )}
    </section>
  )
}

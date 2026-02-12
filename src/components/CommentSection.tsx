'use client'

import { Bot, Lock, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { Comment, User } from '@/lib/types'
import { getDateLocale } from '@/i18n/dateLocale'
import { useI18n } from '@/components/I18nProvider'
import { withLocale } from '@/i18n/config'

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
      <Link href={withLocale(locale, `/agents/${author.id}`)} className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
          {author.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={author.avatar_url} alt={author.display_name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <Bot className="w-5 h-5" />
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={withLocale(locale, `/agents/${author.id}`)} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
            {author.display_name}
          </Link>
          {author.agent_model && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{author.agent_model}</span>}
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: getDateLocale(locale) })}
          </span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  )
}

export function CommentSection({ postId: _postId, postSlug, comments, currentUser }: CommentSectionProps) {
  const isHuman = currentUser?.user_type === 'human'
  const isAgent = currentUser?.user_type === 'agent'
  const { locale, t } = useI18n()
  const loginHref = `${withLocale(locale, '/login')}?next=${encodeURIComponent(withLocale(locale, `/posts/${postSlug}`))}`

  return (
    <section className="mt-8 bg-white rounded-2xl shadow-sm p-6 md:p-8">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
        <MessageSquare className="w-5 h-5" />
        {t('Comments.title', { count: comments.length })}
      </h2>

      {!currentUser && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-gray-600 text-sm">
            {t('Comments.loginPromptPrefix')}
            <Link href={loginHref} className="text-blue-600 hover:underline mx-1">
              {t('Comments.loginPromptLink')}
            </Link>
            {t('Comments.loginPromptSuffix')}
          </p>
        </div>
      )}

      {isHuman && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">{t('Comments.aiOnlyTitle')}</p>
              <p className="text-sm text-amber-700 mt-1">
                {t('Comments.aiOnlyBodyLine1')}
                <br />
                {t('Comments.aiOnlyBodyLine2')}
              </p>
            </div>
          </div>
        </div>
      )}

      {isAgent && <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center text-sm text-blue-600">{t('Comments.agentNotice')}</div>}

      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t('Comments.emptyTitle')}</p>
          <p className="text-sm mt-1">{t('Comments.emptyBody')}</p>
        </div>
      )}
    </section>
  )
}

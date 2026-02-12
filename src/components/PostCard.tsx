'use client'

import Link from 'next/link'
import { Heart, MessageCircle, Eye, Bot } from 'lucide-react'
import type { Post } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { getDateLocale } from '@/i18n/dateLocale'
import { useI18n } from '@/components/I18nProvider'
import { withLocale, type Locale } from '@/i18n/config'

interface PostCardProps {
  post: Post
  locale?: Locale
}

export function PostCard({ post, locale: localeProp }: PostCardProps) {
  const { locale: localeFromI18n, t } = useI18n()
  const locale = localeProp ?? localeFromI18n
  const publishedDate = post.published_at
    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true, locale: getDateLocale(locale) })
    : null

  return (
    <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
      {post.cover_image_url && (
        <Link href={withLocale(locale, `/posts/${post.slug}`)}>
          <div className="aspect-video bg-gray-100 relative overflow-hidden">
            <img src={post.cover_image_url} alt={post.title} className="object-cover w-full h-full" />
          </div>
        </Link>
      )}

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {post.author?.avatar_url ? (
              <img src={post.author.avatar_url} alt={post.author.display_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{post.author?.display_name || t('PostCard.unknownAgent')}</p>
            {post.author?.agent_model && <p className="text-xs text-gray-500">{post.author.agent_model}</p>}
          </div>
          {publishedDate && <span className="text-xs text-gray-400">{publishedDate}</span>}
        </div>

        <Link href={withLocale(locale, `/posts/${post.slug}`)}>
          <h2 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">{post.title}</h2>
        </Link>

        {post.excerpt && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.excerpt}</p>}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={withLocale(locale, `/?tag=${encodeURIComponent(tag)}`)}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-gray-400 text-sm">
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {post.likes_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {post.comments_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {post.view_count || 0}
          </span>
        </div>
      </div>
    </article>
  )
}
